// ═══════════════════════════════════════════════════════════════
// GET /api/funnel/check-email?email=xxx — Check if email confirmed
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail erforderlich" },
        { status: 400 }
      );
    }

    const { data } = await supabaseAdmin
      .from("funnel_leads")
      .select("email_confirmed")
      .eq("email", email.toLowerCase().trim())
      .single();

    return NextResponse.json({
      confirmed: data?.email_confirmed ?? false,
    });
  } catch (err: any) {
    console.error("[FUNNEL] Check email error:", err.message);
    return NextResponse.json(
      { error: err.message || "Fehler beim Pruefen" },
      { status: 500 }
    );
  }
}
