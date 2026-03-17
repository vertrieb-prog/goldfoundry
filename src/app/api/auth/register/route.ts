// src/app/api/auth/register/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { trackConversion } from "@/lib/mlm/affiliate-engine";
import { createContact, trackUserEvent } from "@/lib/crm/crm-engine";
import { sendWelcomeEmail } from "@/lib/email/email-engine";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, referralCode: bodyRef } = await request.json();
    const supabase = createSupabaseServer();
    const admin = createSupabaseAdmin();

    // Check for referral: body param OR cookie
    const cookieStore = cookies();
    const cookieRef = cookieStore.get("gf_ref")?.value;
    const referralCode = bodyRef || cookieRef;

    let referredBy = null;
    if (referralCode) {
      const { data: referrer } = await admin
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .single();
      referredBy = referrer?.id ?? null;
    }

    // Sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      // Update referral on profile
      if (referredBy) {
        await admin.from("profiles")
          .update({ referred_by: referredBy })
          .eq("id", data.user.id);
      }

      // Create CRM contact + link to referrer in CRM hierarchy
      try {
        const { data: crmContact } = await admin.from("crm_contacts").insert({
          email,
          full_name: fullName,
          source: referralCode ? "referral" : "organic",
          source_detail: referralCode ? `ref:${referralCode}` : undefined,
          profile_id: data.user.id,
          pipeline_stage: "new_lead",
          lead_score: referralCode ? 30 : 10, // Referrals start higher
        }).select("id").single();

        // Link referral hierarchy in CRM
        if (referredBy && crmContact) {
          const { data: referrerContact } = await admin.from("crm_contacts")
            .select("id").eq("profile_id", referredBy).single();
          if (referrerContact) {
            await admin.from("crm_contacts")
              .update({ referred_by_contact: referrerContact.id })
              .eq("id", crmContact.id);
          }
        }
      } catch { /* CRM is optional, don't block signup */ }

      // Track affiliate conversion (signup event) + NOTIFY AFFILIATE
      if (referredBy) {
        try {
          await trackConversion({
            referredUserId: data.user.id,
            eventType: "signup",
          });

          // INSTANT NOTIFICATION an den Affiliate
          const { notifyNewReferralSignup } = await import("@/lib/mlm/affiliate-notifications");
          const { data: referrerProfile } = await admin.from("profiles")
            .select("email, full_name, referral_code").eq("id", referredBy).single();
          const { count: totalRefs } = await admin.from("profiles")
            .select("*", { count: "exact", head: true }).eq("referred_by", referredBy);

          if (referrerProfile) {
            await notifyNewReferralSignup(
              referrerProfile.email,
              referrerProfile.full_name ?? "Partner",
              fullName ?? email.split("@")[0],
              email,
              (totalRefs ?? 0) + 1
            );

            // UPLINE PUSH: "RUF IHN AN!"
            const { pushNewSignup } = await import("@/lib/mlm/upline-push");
            await pushNewSignup(referredBy, {
              name: fullName ?? email.split("@")[0],
              email,
            });
          }
        } catch { /* Affiliate tracking is optional */ }
      }

      // Send welcome email
      try {
        await sendWelcomeEmail(email, fullName ?? email.split("@")[0]);
      } catch { /* Email is optional */ }
    }

    // Clear referral cookie after successful signup
    const response = NextResponse.json({ success: true, user: data.user });
    response.cookies.set("gf_ref", "", { maxAge: 0, path: "/" });
    return response;
  } catch (err) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
