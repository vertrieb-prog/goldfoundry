export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

// GET /api/telegram/messages?channelId=-100xxxxx&limit=20
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);

    if (!channelId) {
      return NextResponse.json({ error: "channelId erforderlich" }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const admin = createSupabaseAdmin();
    const { data: session } = await admin
      .from("telegram_sessions")
      .select("session_string, status")
      .eq("user_id", user.id)
      .single();

    if (!session?.session_string || session.status !== "connected") {
      return NextResponse.json({ error: "Telegram nicht verbunden" }, { status: 400 });
    }

    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH || "";

    let TelegramClient: any, StringSession: any;
    try {
      const tg = await import("telegram" as any);
      const sessions = await import("telegram/sessions" as any);
      TelegramClient = tg.TelegramClient;
      StringSession = sessions.StringSession;
    } catch {
      return NextResponse.json({ error: "Telegram Modul nicht verfügbar" }, { status: 500 });
    }

    const client = new TelegramClient(
      new StringSession(session.session_string),
      apiId, apiHash,
      { connectionRetries: 2, timeout: 15 }
    );
    await client.connect();

    const Api = (await import("telegram/tl" as any)).Api;
    const { BigInteger } = await import("big-integer" as any).then(m => m.default ? { BigInteger: m.default } : { BigInteger: m });

    // Resolve channel entity — handle -100xxx format properly
    let entity;
    try {
      // Try multiple resolution strategies
      // 1. Direct numeric ID (works for most channels)
      if (/^-?\d+$/.test(channelId)) {
        try {
          // For channels with -100 prefix: extract the real channel ID
          const numericId = channelId.startsWith("-100")
            ? channelId.slice(4) // remove -100 prefix
            : channelId.startsWith("-")
            ? channelId.slice(1) // remove - prefix for groups
            : channelId;

          // Try as InputPeerChannel first (most reliable for channels)
          if (channelId.startsWith("-100")) {
            const peerChannel = new Api.InputPeerChannel({
              channelId: BigInteger(numericId),
              accessHash: BigInteger(0),
            });
            // Get access hash from dialogs cache
            try {
              entity = await client.getEntity(peerChannel);
            } catch {
              // Fallback: try getEntity with the full numeric ID
              entity = await client.getEntity(BigInteger(channelId));
            }
          } else {
            entity = await client.getEntity(BigInteger(channelId));
          }
        } catch {
          // Last resort: iterate dialogs to find matching channel
          const dialogs = await client.getDialogs({ limit: 100 });
          for (const dialog of dialogs) {
            const e = dialog.entity;
            if (!e) continue;
            const isChannel = e.className === "Channel";
            const isGroup = e.className === "Chat";
            const eId = e.id?.toString() || "";
            const fullId = isChannel ? `-100${eId}` : `-${eId}`;
            if (fullId === channelId || eId === channelId) {
              entity = e;
              break;
            }
          }
          if (!entity) throw new Error("not found in dialogs");
        }
      } else {
        // Username-based: @channelname
        entity = await client.getEntity(channelId);
      }
    } catch (resolveErr: any) {
      console.error("[TG-MESSAGES] Entity resolve error:", resolveErr.message, "channelId:", channelId);
      await client.disconnect();
      return NextResponse.json({ error: "Channel nicht gefunden. Bist du dem Channel beigetreten?" }, { status: 404 });
    }

    // Get messages
    const messages = await client.getMessages(entity, { limit });

    const result = messages
      .filter((m: any) => m.message) // nur Text-Nachrichten
      .map((m: any) => ({
        id: m.id,
        text: m.message,
        date: m.date ? new Date(m.date * 1000).toISOString() : null,
        isSignal: detectSignal(m.message),
      }));

    await client.disconnect();

    return NextResponse.json({ messages: result, channelId });
  } catch (err: any) {
    console.error("[TG-MESSAGES] Error:", err.message);
    return NextResponse.json({ error: err.message || "Nachrichten konnten nicht geladen werden" }, { status: 500 });
  }
}

// Simple signal detection
function detectSignal(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const hasBuySell = /\b(buy|sell|long|short)\b/i.test(text);
  const hasPrice = /\d{3,5}\.\d{1,3}/.test(text);
  const hasSLTP = /\b(sl|tp|stop.?loss|take.?profit|entry)\b/i.test(text);
  return hasBuySell || (hasPrice && hasSLTP);
}
