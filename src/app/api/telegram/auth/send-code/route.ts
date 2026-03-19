import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Store pending auth in supabase telegram_sessions table instead of memory
export async function POST(request: Request) {
  try {
    const { phoneNumber, userId } = await request.json();
    if (!phoneNumber || phoneNumber.length < 8 || !userId) {
      return NextResponse.json({ error: "Ungueltige Daten" }, { status: 400 });
    }

    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH || "";
    if (!apiId || !apiHash) {
      return NextResponse.json({ error: "Telegram API nicht konfiguriert" }, { status: 500 });
    }

    // Dynamic import to avoid build issues
    let TelegramClient: any, StringSession: any;
    try {
      const tg = await import("telegram" as any);
      const sessions = await import("telegram/sessions" as any);
      TelegramClient = tg.TelegramClient;
      StringSession = sessions.StringSession;
    } catch {
      return NextResponse.json({ error: "Telegram Modul nicht verfuegbar" }, { status: 500 });
    }

    const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 3 });
    await client.connect();

    const result = await client.sendCode({ apiId, apiHash }, phoneNumber);

    // Save to DB
    await supabaseAdmin.from("telegram_sessions").upsert(
      {
        user_id: userId,
        phone_number: phoneNumber,
        phone_code_hash: result.phoneCodeHash,
        status: "code_sent",
      },
      { onConflict: "user_id" }
    );

    await client.disconnect();

    return NextResponse.json({ success: true, phoneNumber });
  } catch (err: any) {
    console.error("[TG-AUTH] Send code error:", err.message);
    return NextResponse.json({ error: err.message || "Fehler beim Senden" }, { status: 500 });
  }
}
