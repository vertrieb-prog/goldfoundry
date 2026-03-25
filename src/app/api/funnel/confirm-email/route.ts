// ═══════════════════════════════════════════════════════════════
// GET /api/funnel/confirm-email?token=xxx — Confirm email
// ALWAYS redirects to website, NEVER returns JSON
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://goldfoundry.de").trim().replace(/\/$/,"");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${BASE_URL}/?error=missing-token`);
    }

    // Find lead by plaintext token using service role client
    const { data: lead, error: findError } = await supabaseAdmin
      .from("funnel_leads")
      .select("id, email, email_confirmed")
      .eq("email_confirm_token", token)
      .single();

    if (findError || !lead) {
      return NextResponse.redirect(`${BASE_URL}/?error=invalid-token`);
    }

    if (lead.email_confirmed) {
      // Already confirmed — redirect to success
      return NextResponse.redirect(`${BASE_URL}/auth/verify-email?verified=1&email=${encodeURIComponent(lead.email)}`);
    }

    // Confirm email
    const { error: updateError } = await supabaseAdmin
      .from("funnel_leads")
      .update({
        email_confirmed: true,
        email_confirmed_at: new Date().toISOString(),
        status: "email_confirmed",
      })
      .eq("id", lead.id);

    if (updateError) throw updateError;

    // Always redirect
    return NextResponse.redirect(`${BASE_URL}/auth/verify-email?verified=1&email=${encodeURIComponent(lead.email)}`);
  } catch (err: any) {
    console.error("[FUNNEL] Confirm email error:", err.message);
    return NextResponse.redirect(`${BASE_URL}/?error=confirm-failed`);
  }
}
