import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();
    if (!phoneNumber || phoneNumber.length < 8) {
      return NextResponse.json({ error: "Ungueltige Telefonnummer" }, { status: 400 });
    }

    // Get user from session
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

    // Dynamic import to avoid build issues
    let TelegramClient: any, StringSession: any;
    try {
      const tg = await import("telegram" as any);
      const sessions = await import("telegram/sessions" as any);
      TelegramClient = tg.TelegramClient;
      StringSession = sessions.StringSession;
    } catch {
      return NextResponse.json({ error: "Telegram Modul nicht verfuegbar. Bitte kontaktiere den Support." }, { status: 500 });
    }

    const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 3 });
    await client.connect();

    const result = await client.sendCode({ apiId, apiHash }, phoneNumber);

    // Save to DB via admin client (bypasses RLS)
    const admin = createSupabaseAdmin();
    await admin.from("telegram_sessions").upsert(
      {
        user_id: user.id,
        phone_number: phoneNumber,
        phone_code_hash: result.phoneCodeHash,
        status: "code_sent",
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
