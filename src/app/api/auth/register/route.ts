export const dynamic = "force-dynamic";
// src/app/api/auth/register/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { trackConversion } from "@/lib/mlm/affiliate-engine";
import { createContact, trackUserEvent } from "@/lib/crm/crm-engine";
import { sendWelcomeEmail } from "@/lib/email/email-engine";
import { pushLeadToGHL } from "@/lib/crm/ghl-sync";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, referralCode: bodyRef } = await request.json();

    // DEV MODE: Skip Supabase only in development when not configured
    if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const response = NextResponse.json({ success: true, user: { id: 'dev-user', email }, devMode: true });
      return response;
    }

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

      // Push to GoHighLevel CRM
      try {
        await pushLeadToGHL({
          firstName: fullName?.split(" ")[0] || "",
          lastName: fullName?.split(" ").slice(1).join(" ") || "",
          email,
          tags: ["gold-foundry", "registered", "dashboard"],
          source: "Gold Foundry Dashboard",
        });
      } catch { /* CRM sync is optional */ }

      // Send Double Opt-In confirmation email via Resend
      try {
        const confirmUrl = `${new URL(request.url).origin}/auth/callback`;
        const { sendEmail } = await import("@/lib/email/email-engine");
        await sendEmail(email, "Best\u00e4tige deine Email \u2014 Gold Foundry", `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#09090b;font-family:Inter,Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:48px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:10px;letter-spacing:4px;color:#FAEF70;margin-bottom:8px;">GOLD FOUNDRY</div>
    <h1 style="color:#fafafa;font-size:24px;font-weight:800;margin:0 0 8px;">Willkommen${fullName ? `, ${fullName}` : ""}!</h1>
    <p style="color:#71717a;font-size:14px;margin:0;">Nur noch ein Klick \u2014 dann geht's los.</p>
  </div>
  <div style="text-align:center;margin:40px 0;">
    <a href="${confirmUrl}" style="display:inline-block;padding:16px 48px;background:#FAEF70;color:#09090b;font-weight:700;font-size:16px;text-decoration:none;border-radius:12px;">
      Email best\u00e4tigen \u2192
    </a>
  </div>
  <div style="text-align:center;margin:24px 0;">
    <p style="color:#52525b;font-size:12px;">Markiere diese Email als wichtig, damit du keine Updates verpasst!</p>
  </div>
  <div style="text-align:center;">
    <p style="color:#3f3f46;font-size:10px;word-break:break-all;">
      Link funktioniert nicht? Kopiere diese URL:<br/>
      <a href="${confirmUrl}" style="color:#FAEF70;">${confirmUrl}</a>
    </p>
  </div>
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0;"/>
  <p style="color:#27272a;font-size:9px;text-align:center;line-height:1.6;">
    Gold Foundry \u00b7 goldfoundry.de<br/>
    Risikohinweis: Trading birgt erhebliche Verlustrisiken.
  </p>
</div>
</body></html>`);
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
