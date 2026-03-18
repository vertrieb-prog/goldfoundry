export const dynamic = "force-dynamic";
// src/app/api/copier/telegram/route.ts — Telegram Channel Management
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { addChannel, removeChannel, isListenerRunning } from "@/lib/telegram-copier/listener";

// ── GET: Status + verbundene Channels ─────────────────────────
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createSupabaseAdmin();

    // Channels des Users laden
    const { data: channels } = await db
      .from("telegram_channels")
      .select("channel_id, channel_name, status, win_rate, profit_factor, total_signals, last_signal_at, fake_signals_detected")
      .eq("added_by", user.id)
      .order("created_at", { ascending: false });

    // Letzte Signale
    const channelIds = (channels ?? []).map((c) => c.channel_id);
    const { data: recentSignals } = channelIds.length > 0
      ? await db
          .from("telegram_signals")
          .select("channel_id, raw_message, parsed, status, created_at")
          .in("channel_id", channelIds)
          .order("created_at", { ascending: false })
          .limit(10)
      : { data: [] };

    return NextResponse.json({
      listenerActive: isListenerRunning(),
      channels: channels ?? [],
      recentSignals: recentSignals ?? [],
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// ── POST: Channel hinzufügen ──────────────────────────────────
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Subscription Check
    const db = createSupabaseAdmin();
    const { data: profile } = await db
      .from("profiles")
      .select("subscription_tier, subscription_active")
      .eq("id", user.id)
      .single();

    if (!profile?.subscription_active || !["copier", "pro", "provider", "enterprise"].includes(profile.subscription_tier)) {
      return NextResponse.json({ error: "Ein aktives Copier-Abo ist erforderlich." }, { status: 403 });
    }

    const { channelId, channelName } = await request.json();

    if (!channelId) {
      return NextResponse.json({ error: "Channel-ID ist erforderlich" }, { status: 400 });
    }

    // Channel in DB speichern mit User-Zuordnung
    const { error: dbError } = await db.from("telegram_channels").upsert(
      {
        channel_id: channelId,
        channel_name: channelName || `Channel ${channelId}`,
        status: "watching",
        added_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "channel_id" }
    );

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Channel zum Listener hinzufügen
    const success = await addChannel(channelId, channelName || channelId);

    return NextResponse.json({
      success,
      message: success
        ? `Channel "${channelName || channelId}" verbunden — Signale werden jetzt überwacht.`
        : "Channel konnte nicht hinzugefügt werden.",
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// ── DELETE: Channel entfernen ─────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId } = await request.json();
    if (!channelId) {
      return NextResponse.json({ error: "Channel-ID ist erforderlich" }, { status: 400 });
    }

    // Prüfe ob der User den Channel besitzt
    const db = createSupabaseAdmin();
    const { data: channel } = await db
      .from("telegram_channels")
      .select("added_by")
      .eq("channel_id", channelId)
      .single();

    if (!channel || channel.added_by !== user.id) {
      return NextResponse.json({ error: "Channel nicht gefunden oder keine Berechtigung" }, { status: 403 });
    }

    const success = await removeChannel(channelId);

    return NextResponse.json({
      success,
      message: success ? "Channel entfernt." : "Fehler beim Entfernen.",
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
