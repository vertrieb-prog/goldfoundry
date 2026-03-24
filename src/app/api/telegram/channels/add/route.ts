import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const { channelId, channelName, settings } = await request.json();
    if (!channelId) return NextResponse.json({ error: "channelId erforderlich" }, { status: 400 });

    // If channelId is a name (not numeric), resolve it via Telegram dialogs
    let resolvedId = channelId;
    let resolvedName = channelName || channelId;

    if (!/^-?\d+$/.test(channelId)) {
      // channelId is text — try to find it in user's Telegram dialogs
      const admin2 = createSupabaseAdmin();
      const { data: session } = await admin2
        .from("telegram_sessions")
        .select("session_string, status")
        .eq("user_id", user.id)
        .single();

      if (session?.session_string && session.status === "connected") {
        const apiId = Number(process.env.TELEGRAM_API_ID);
        const apiHash = process.env.TELEGRAM_API_HASH || "";

        if (apiId && apiHash) {
          try {
            const tg = await import("telegram" as any);
            const sessions = await import("telegram/sessions" as any);
            const client = new tg.TelegramClient(
              new sessions.StringSession(session.session_string),
              apiId, apiHash,
              { connectionRetries: 2, timeout: 15 }
            );
            await client.connect();
            const dialogs = await client.getDialogs({ limit: 200 });

            const search = channelId.toLowerCase().trim();
            for (const dialog of dialogs) {
              const e = dialog.entity;
              if (!e) continue;
              const isChannel = e.className === "Channel";
              const isGroup = e.className === "Chat";
              if (!isChannel && !isGroup) continue;

              const rawId = e.id?.value?.toString() || e.id?.toString() || "";
              const fullId = isChannel ? `-100${rawId}` : `-${rawId}`;
              const title = ((e as any).title || "").toLowerCase();

              if (title === search || title.includes(search) || search.includes(title)) {
                resolvedId = fullId;
                resolvedName = (e as any).title || channelName || channelId;
                break;
              }
            }
            await client.disconnect();
          } catch (e: any) {
            console.error("[TG-ADD] Dialog resolve error:", e.message);
          }
        }
      }
    }

    const admin = createSupabaseAdmin();

    const { data: existing } = await admin
      .from("telegram_active_channels")
      .select("id")
      .eq("user_id", user.id)
      .eq("channel_id", resolvedId)
      .single();

    if (existing) return NextResponse.json({ error: "Kanal bereits verbunden" }, { status: 409 });

    const { count } = await admin
      .from("telegram_active_channels")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= 10) return NextResponse.json({ error: "Maximal 10 Kanaele erlaubt" }, { status: 400 });

    const { data, error } = await admin
      .from("telegram_active_channels")
      .insert({
        user_id: user.id,
        channel_id: resolvedId,
        channel_name: resolvedName,
        status: "active",
        settings: settings || { autoExecute: true, riskPercent: 1 },
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, channel: data });
  } catch (err: any) {
    console.error("[TG-CHANNELS] Add error:", err.message);
    return NextResponse.json({ error: err.message || "Fehler" }, { status: 500 });
  }
}
