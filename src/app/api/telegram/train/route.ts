import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

// POST /api/telegram/train — Speichert Beispiel-Signale für einen Channel
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const { channelId, exampleSignal, exampleUpdate, channelName, linkedAccountId } = await request.json();

    if (!channelId) {
      return NextResponse.json({ error: "Channel-ID erforderlich" }, { status: 400 });
    }

    // If only linking account (no signal training)
    if (linkedAccountId && !exampleSignal) {
      const admin2 = createSupabaseAdmin();
      const { data: existing2 } = await admin2
        .from("telegram_active_channels")
        .select("settings")
        .eq("user_id", user.id)
        .eq("channel_id", channelId)
        .single();

      const existingSettings2 = (existing2?.settings as Record<string, unknown>) || {};
      await admin2
        .from("telegram_active_channels")
        .update({ settings: { ...existingSettings2, linkedAccountId } })
        .eq("user_id", user.id)
        .eq("channel_id", channelId);

      return NextResponse.json({ success: true, message: "Account verknüpft" });
    }

    if (!exampleSignal) {
      return NextResponse.json({ error: "Beispiel-Signal erforderlich" }, { status: 400 });
    }

    const admin = createSupabaseAdmin();

    // Read existing settings first, then merge
    const { data: existing } = await admin
      .from("telegram_active_channels")
      .select("settings")
      .eq("user_id", user.id)
      .eq("channel_id", channelId)
      .single();

    const existingSettings = (existing?.settings as Record<string, unknown>) || {};

    const { error } = await admin
      .from("telegram_active_channels")
      .update({
        settings: {
          ...existingSettings,
          exampleSignal,
          exampleUpdate: exampleUpdate || null,
          trainedAt: new Date().toISOString(),
        },
      })
      .eq("user_id", user.id)
      .eq("channel_id", channelId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Signal-Format für "${channelName || channelId}" gespeichert. Die KI wird dieses Format für zukünftige Signale verwenden.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Speichern fehlgeschlagen" }, { status: 500 });
  }
}
