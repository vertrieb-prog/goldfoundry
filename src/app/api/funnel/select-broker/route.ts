// ═══════════════════════════════════════════════════════════════
// POST /api/funnel/select-broker — Save broker selection
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { email, broker, loginNumber } = await request.json();

    if (!email || !broker) {
      return NextResponse.json(
        { error: "E-Mail und Broker erforderlich" },
        { status: 400 }
      );
    }

    // Validate broker
    const validBrokers = ["tag", "tegas", "standard"];
    if (!validBrokers.includes(broker)) {
      return NextResponse.json(
        { error: "Ungueltiger Broker" },
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
        { error: "Lead nicht gefunden" },
        { status: 404 }
      );
    }

    // Update lead
    const { error } = await supabaseAdmin
      .from("funnel_leads")
      .update({
        selected_broker: broker,
        broker_login: loginNumber || null,
        status: "broker_selected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    if (error) throw error;

    return NextResponse.json({ success: true, broker });
  } catch (err: any) {
    console.error("[FUNNEL] Select broker error:", err.message);
    return NextResponse.json(
      { error: err.message || "Broker-Auswahl fehlgeschlagen" },
      { status: 500 }
    );
  }
}
