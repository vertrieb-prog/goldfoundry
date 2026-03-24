export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

// GET /api/telegram/messages?channelId=-100xxxxx&limit=100
export async function GET(request: Request) {
  const debugLog: string[] = [];

  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);

    if (!channelId) {
      return NextResponse.json({ error: "channelId erforderlich" }, { status: 400 });
    }

    debugLog.push(`channelId: "${channelId}", limit: ${limit}`);

    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    debugLog.push(`user: ${user.id.slice(0, 8)}...`);

    const admin = createSupabaseAdmin();

    // Try both possible column names (session_string or session_data)
    let session: any = null;
    const { data: s1 } = await admin
      .from("telegram_sessions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (s1) {
      session = s1;
      debugLog.push(`session found, columns: ${Object.keys(s1).join(", ")}`);
    }

    // Get the session string from whatever column it's stored in
    const sessionString = session?.session_string || session?.session_data || null;
    const sessionStatus = session?.status || (sessionString ? "connected" : null);

    if (!sessionString) {
      debugLog.push(`No session string found. Session: ${JSON.stringify(session ? Object.keys(session) : "null")}`);
      return NextResponse.json({
        error: "Telegram nicht verbunden. Bitte verbinde dich zuerst.",
        debug: process.env.NODE_ENV === "development" ? debugLog : undefined,
      }, { status: 400 });
    }

    if (sessionStatus !== "connected") {
      debugLog.push(`Session status: "${sessionStatus}" (not connected)`);
      return NextResponse.json({
        error: `Telegram-Session Status: "${sessionStatus}". Bitte verbinde dich erneut.`,
        debug: process.env.NODE_ENV === "development" ? debugLog : undefined,
      }, { status: 400 });
    }

    debugLog.push(`session OK (${sessionString.length} chars)`);

    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH || "";

    if (!apiId || !apiHash) {
      debugLog.push(`TELEGRAM_API_ID: ${apiId || "MISSING"}, TELEGRAM_API_HASH: ${apiHash ? "set" : "MISSING"}`);
      return NextResponse.json({
        error: "Telegram API nicht konfiguriert. Kontaktiere den Support.",
        debug: process.env.NODE_ENV === "development" ? debugLog : undefined,
      }, { status: 500 });
    }

    debugLog.push(`API credentials OK (id: ${apiId})`);

    let TelegramClient: any, StringSession: any;
    try {
      const tg = await import("telegram" as any);
      const sessions = await import("telegram/sessions" as any);
      TelegramClient = tg.TelegramClient;
      StringSession = sessions.StringSession;
    } catch (importErr: any) {
      debugLog.push(`Import error: ${importErr.message}`);
      return NextResponse.json({
        error: "Telegram Modul nicht verfügbar",
        debug: process.env.NODE_ENV === "development" ? debugLog : undefined,
      }, { status: 500 });
    }

    debugLog.push("telegram module imported");

    const client = new TelegramClient(
      new StringSession(sessionString),
      apiId, apiHash,
      { connectionRetries: 3, timeout: 30 }
    );

    try {
      await client.connect();
    } catch (connErr: any) {
      debugLog.push(`Connection error: ${connErr.message}`);
      return NextResponse.json({
        error: `Telegram-Verbindung fehlgeschlagen: ${connErr.message}`,
        debug: process.env.NODE_ENV === "development" ? debugLog : undefined,
      }, { status: 500 });
    }

    debugLog.push("client connected");

    // === ENTITY RESOLUTION ===
    // Strategy: load all dialogs, match by ID/name, use the entity directly
    let entity: any = null;
    let matchMethod = "";

    try {
      const dialogs = await client.getDialogs({ limit: 300 });
      debugLog.push(`loaded ${dialogs.length} dialogs`);

      // Build a list of all channels/groups for debugging
      const channelList: string[] = [];

      for (const dialog of dialogs) {
        const e = dialog.entity;
        if (!e) continue;

        const isChannel = e.className === "Channel";
        const isGroup = e.className === "Chat";
        if (!isChannel && !isGroup) continue;

        const rawId = e.id?.value?.toString() || e.id?.toString() || "";
        const fullId = isChannel ? `-100${rawId}` : `-${rawId}`;
        const title = (e as any).title || "";

        channelList.push(`${fullId} | ${title} (${e.className})`);

        // Match strategies (most specific to least specific)
        if (!entity) {
          const searchLower = channelId.toLowerCase().trim();
          const titleLower = title.toLowerCase();

          if (fullId === channelId) {
            entity = e; matchMethod = "fullId exact";
          } else if (rawId === channelId) {
            entity = e; matchMethod = "rawId exact";
          } else if (rawId === channelId.replace(/^-100/, "").replace(/^-/, "")) {
            entity = e; matchMethod = "rawId stripped";
          } else if (titleLower === searchLower) {
            entity = e; matchMethod = "title exact";
          } else if (titleLower.includes(searchLower) || searchLower.includes(titleLower)) {
            entity = e; matchMethod = "title contains";
          }
        }
      }

      debugLog.push(`channels found: ${channelList.length}`);
      // Include channel list in debug for troubleshooting
      if (!entity) {
        debugLog.push(`available channels: ${channelList.slice(0, 20).join(" | ")}`);
      }
    } catch (dialogErr: any) {
      debugLog.push(`dialog error: ${dialogErr.message}`);
    }

    // Fallback: try getEntity with various formats
    if (!entity) {
      const attempts = [
        channelId,
        parseInt(channelId) || null,
        channelId.startsWith("-") ? channelId : `-100${channelId}`,
      ].filter(Boolean);

      for (const attempt of attempts) {
        try {
          entity = await client.getEntity(attempt);
          matchMethod = `getEntity("${attempt}")`;
          debugLog.push(`getEntity succeeded with: ${attempt}`);
          break;
        } catch {
          debugLog.push(`getEntity failed with: ${attempt}`);
        }
      }
    }

    if (!entity) {
      await client.disconnect();
      return NextResponse.json({
        error: `Channel "${channelId}" nicht gefunden. Tritt dem Channel zuerst in Telegram bei, dann versuche es nochmal.`,
        debug: process.env.NODE_ENV === "development" ? debugLog : undefined,
      }, { status: 404 });
    }

    debugLog.push(`entity resolved via: ${matchMethod} → ${(entity as any).title || entity.className}`);

    // === GET MESSAGES ===
    let messages: any[];
    try {
      messages = await client.getMessages(entity, { limit });
      debugLog.push(`fetched ${messages.length} raw messages`);
    } catch (msgErr: any) {
      debugLog.push(`getMessages error: ${msgErr.message}`);
      await client.disconnect();
      return NextResponse.json({
        error: `Nachrichten konnten nicht geladen werden: ${msgErr.message}`,
        debug: process.env.NODE_ENV === "development" ? debugLog : undefined,
      }, { status: 500 });
    }

    const result = messages
      .filter((m: any) => m.message)
      .map((m: any) => ({
        id: m.id,
        text: m.message,
        date: m.date ? new Date(m.date * 1000).toISOString() : null,
        isSignal: detectSignal(m.message),
      }));

    debugLog.push(`filtered to ${result.length} text messages`);

    await client.disconnect();

    return NextResponse.json({ messages: result, channelId, debug: debugLog });
  } catch (err: any) {
    console.error("[TG-MESSAGES] Error:", err.message, "debug:", debugLog);
    return NextResponse.json({
      error: err.message || "Nachrichten konnten nicht geladen werden",
      debug: process.env.NODE_ENV === "development" ? debugLog : undefined,
    }, { status: 500 });
  }
}

// Simple signal detection
function detectSignal(text: string): boolean {
  if (!text) return false;
  const hasBuySell = /\b(buy|sell|long|short)\b/i.test(text);
  const hasPrice = /\d{3,5}\.\d{1,3}/.test(text);
  const hasSLTP = /\b(sl|tp|stop.?loss|take.?profit|entry)\b/i.test(text);
  return hasBuySell || (hasPrice && hasSLTP);
}
