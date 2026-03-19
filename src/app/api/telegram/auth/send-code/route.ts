import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();
    if (!phoneNumber || phoneNumber.length < 8) {
      return NextResponse.json({ error: "Ungueltige Telefonnummer" }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH || "";
    if (!apiId || !apiHash) {
      return NextResponse.json({ error: "Telegram API nicht konfiguriert" }, { status: 500 });
    }

    let TelegramClient: any, StringSession: any;
    try {
      const tg = await import("telegram" as any);
      const sessions = await import("telegram/sessions" as any);
      TelegramClient = tg.TelegramClient;
      StringSession = sessions.StringSession;
    } catch {
      return NextResponse.json({ error: "Telegram Modul nicht verfuegbar" }, { status: 500 });
    }

    const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
      connectionRetries: 3,
      timeout: 15,
    });
    await client.connect();

    const result = await client.sendCode({ apiId, apiHash }, phoneNumber);

    if (!result || !result.phoneCodeHash) {
      await client.disconnect();
      return NextResponse.json({ error: "Telegram konnte keinen Code senden. Bitte versuche es nochmal." }, { status: 500 });
    }

    // Save session + code hash (status: "pending" is the DB default)
    const sessionString = (client.session as any).save();
    const admin = createSupabaseAdmin();
    await admin.from("telegram_sessions").upsert(
      {
        user_id: user.id,
        phone_number: phoneNumber,
        phone_code_hash: result.phoneCodeHash,
        session_string: sessionString,
        status: "pending",
        updated_at: new Date().toISOString(),
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
