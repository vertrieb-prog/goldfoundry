export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

// GET /api/telegram/messages?channelId=-100xxxxx&limit=20
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

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

    // Resolve channel entity
    let entity;
    try {
      entity = await client.getEntity(channelId);
    } catch {
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
