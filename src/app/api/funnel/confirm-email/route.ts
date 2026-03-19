// ═══════════════════════════════════════════════════════════════
// GET /api/funnel/confirm-email?token=xxx — Confirm email
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token erforderlich" },
        { status: 400 }
      );
    }

    // Find lead by token
    const { data: lead, error: findError } = await supabaseAdmin
      .from("funnel_leads")
      .select("id, email, email_confirmed")
      .eq("email_confirm_token", token)
      .single();

    if (findError || !lead) {
      return NextResponse.json(
        { error: "Ungueltiger oder abgelaufener Token" },
        { status: 404 }
      );
    }

    if (lead.email_confirmed) {
      return NextResponse.json({
        success: true,
        message: "E-Mail bereits bestaetigt",
        email: lead.email,
      });
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

    return NextResponse.json({
      success: true,
      message: "E-Mail erfolgreich bestaetigt",
      email: lead.email,
    });
  } catch (err: any) {
    console.error("[FUNNEL] Confirm email error:", err.message);
    return NextResponse.json(
      { error: err.message || "Bestaetigung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
