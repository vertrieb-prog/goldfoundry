export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const admin = createSupabaseAdmin();

    const { data: session } = await admin
      .from("telegram_sessions")
      .select("status, session_string")
      .eq("user_id", user.id)
      .single();

    if (!session || session.status !== "connected") {
      return NextResponse.json({ connected: false, activeChannels: [], availableChannels: [] });
    }

    // Get already added channels
    const { data: activeChannels } = await admin
      .from("telegram_active_channels")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Load all user's Telegram channels/groups via GramJS
    let availableChannels: { id: string; title: string; type: string }[] = [];

    if (session.session_string) {
      try {
        const apiId = Number(process.env.TELEGRAM_API_ID);
        const apiHash = process.env.TELEGRAM_API_HASH || "";

        const tg = await import("telegram" as any);
        const sessions = await import("telegram/sessions" as any);
        const TelegramClient = tg.TelegramClient;
        const StringSession = sessions.StringSession;

        const client = new TelegramClient(
          new StringSession(session.session_string),
          apiId, apiHash,
          { connectionRetries: 2, timeout: 10 }
        );
        await client.connect();

        const Api = (await import("telegram/tl" as any)).Api;
        const dialogs = await client.getDialogs({ limit: 100 });

        const activeIds = new Set((activeChannels || []).map((c: any) => c.channel_id));

        for (const dialog of dialogs) {
          const entity = dialog.entity;
          if (!entity) continue;

          // Only channels and megagroups (not private chats, not bots)
          const isChannel = entity.className === "Channel";
          const isGroup = entity.className === "Chat";
          const isMegagroup = isChannel && (entity as any).megagroup;

          if (isChannel || isGroup) {
            const id = entity.id?.toString() || "";
            const fullId = isChannel ? `-100${id}` : `-${id}`;
            availableChannels.push({
              id: fullId,
              title: (entity as any).title || "Unbekannt",
              type: isMegagroup ? "Gruppe" : isGroup ? "Gruppe" : "Channel",
            });
          }
        }

        await client.disconnect();
      } catch (e: any) {
        console.error("[TG-CHANNELS] Dialog fetch error:", e.message);
        // Don't fail — just return without available channels
      }
    }

    return NextResponse.json({
      connected: true,
      activeChannels: activeChannels || [],
      availableChannels,
    });
  } catch (err: any) {
    console.error("[TG-CHANNELS] List error:", err.message);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}
