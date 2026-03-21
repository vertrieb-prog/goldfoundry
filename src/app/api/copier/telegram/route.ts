export const dynamic = "force-dynamic";
// src/app/api/copier/telegram/route.ts — Telegram Channel Management
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ── GET: Status + verbundene Channels ─────────────────────────
export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createSupabaseAdmin();

    // Active channels des Users laden
    const { data: channels } = await db
      .from("telegram_active_channels")
      .select("id, channel_id, channel_name, status, settings, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Connection status
    const { data: session } = await db
      .from("telegram_sessions")
      .select("status")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      connected: session?.status === "connected",
      channels: channels ?? [],
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

    const db = createSupabaseAdmin();

    const { channelId, channelName } = await request.json();
    if (!channelId) {
      return NextResponse.json({ error: "Channel-ID ist erforderlich" }, { status: 400 });
    }

    // Check max 10
    const { count } = await db
      .from("telegram_active_channels")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: "Maximal 10 Channels erlaubt" }, { status: 400 });
    }

    const { error: dbError } = await db.from("telegram_active_channels").upsert(
      {
        user_id: user.id,
        channel_id: channelId,
        channel_name: channelName || `Channel ${channelId}`,
        status: "active",
        settings: { autoExecute: true, riskPercent: 1 },
      },
      { onConflict: "user_id,channel_id" }
    );

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Channel "${channelName || channelId}" verbunden.`,
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

    const db = createSupabaseAdmin();
    const { error } = await db
      .from("telegram_active_channels")
      .delete()
      .eq("user_id", user.id)
      .eq("channel_id", channelId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
