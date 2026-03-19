// ═══════════════════════════════════════════════════════════════
// POST /api/funnel/register — Register a funnel lead
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, whatsapp } = await request.json();

    if (!firstName || !email) {
      return NextResponse.json(
        { error: "Vorname und E-Mail sind erforderlich" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ungueltige E-Mail-Adresse" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from("funnel_leads")
      .select("id, email_confirmed")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        emailConfirmed: existing.email_confirmed,
      });
    }

    // Generate confirmation token
    const emailConfirmToken = crypto.randomBytes(32).toString("hex");

    const { data, error } = await supabaseAdmin
      .from("funnel_leads")
      .insert({
        first_name: firstName.trim(),
        last_name: (lastName || "").trim(),
        email: email.toLowerCase().trim(),
        whatsapp: (whatsapp || "").trim(),
        email_confirm_token: emailConfirmToken,
        email_confirmed: false,
        status: "registered",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      leadId: data.id,
      emailConfirmToken,
    });
  } catch (err: any) {
    console.error("[FUNNEL] Register error:", err.message);
    return NextResponse.json(
      { error: err.message || "Registrierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
