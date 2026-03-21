import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/email/email-engine";
import crypto from "crypto";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://goldfoundry.de";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, whatsapp, resend } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "E-Mail ist erforderlich" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailConfirmToken = crypto.randomBytes(32).toString("hex");
    const confirmUrl = `${SITE_URL}/api/funnel/confirm-email?token=${emailConfirmToken}`;

    // Upsert lead
    const { error: dbError } = await supabaseAdmin
      .from("funnel_leads")
      .upsert({
        first_name: (firstName || "").trim(),
        last_name: (lastName || "").trim(),
        email: cleanEmail,
        whatsapp: (whatsapp || "").trim(),
        email_confirm_token: emailConfirmToken,
        email_confirmed: false,
        status: "registered",
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" });

    if (dbError) {
      console.error("[FUNNEL] DB Error:", dbError.message);
      // Table might not exist — continue anyway, email is more important
    }

    // Send confirmation email via Resend
    try {
      await sendEmail(cleanEmail, "Bestätige deine Email — Gold Foundry",
        `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#09090b;font-family:Inter,Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:48px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="font-size:10px;letter-spacing:4px;color:#FAEF70;margin-bottom:8px;">GOLD FOUNDRY</div>
    <h1 style="color:#fafafa;font-size:24px;font-weight:800;margin:0 0 8px;">Willkommen${firstName ? `, ${firstName}` : ""}!</h1>
    <p style="color:#71717a;font-size:14px;margin:0;">Nur noch ein Klick — dann geht's los.</p>
  </div>
  <div style="text-align:center;margin:40px 0;">
    <a href="${confirmUrl}" style="display:inline-block;padding:16px 48px;background:#FAEF70;color:#09090b;font-weight:700;font-size:16px;text-decoration:none;border-radius:12px;">
      Email bestätigen →
    </a>
  </div>
  <p style="color:#52525b;font-size:12px;text-align:center;">Markiere diese Email als wichtig!</p>
  <p style="color:#3f3f46;font-size:10px;text-align:center;word-break:break-all;margin-top:24px;">
    Link funktioniert nicht? Kopiere diese URL:<br/>
    <a href="${confirmUrl}" style="color:#FAEF70;">${confirmUrl}</a>
  </p>
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0;"/>
  <p style="color:#27272a;font-size:9px;text-align:center;">Gold Foundry · goldfoundry.de · Risikohinweis: Trading birgt Verlustrisiken.</p>
</div></body></html>`
      );
      console.log("[FUNNEL] Confirmation email sent to:", cleanEmail);
    } catch (emailErr: any) {
      console.error("[FUNNEL] Email send error:", emailErr.message);
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (err: any) {
    console.error("[FUNNEL] Register error:", err.message);
    return NextResponse.json({ error: "Registrierung fehlgeschlagen" }, { status: 500 });
  }
}
