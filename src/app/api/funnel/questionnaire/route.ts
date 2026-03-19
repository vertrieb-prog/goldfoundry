// ═══════════════════════════════════════════════════════════════
// POST /api/funnel/questionnaire — Save questionnaire answers
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { email, answers } = await request.json();

    if (!email || !answers) {
      return NextResponse.json(
        { error: "E-Mail und Antworten erforderlich" },
        { status: 400 }
      );
    }

    // Find lead
    const { data: lead } = await supabaseAdmin
      .from("funnel_leads")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!lead) {
      return NextResponse.json(
        { error: "Lead nicht gefunden. Bitte zuerst registrieren." },
        { status: 404 }
      );
    }

    // Save answers as JSONB
    const { error } = await supabaseAdmin
      .from("funnel_leads")
      .update({
        questionnaire: answers,
        status: "questionnaire_completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[FUNNEL] Questionnaire error:", err.message);
    return NextResponse.json(
      { error: err.message || "Speichern fehlgeschlagen" },
      { status: 500 }
    );
  }
}
