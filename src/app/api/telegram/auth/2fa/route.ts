import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { password, userId } = await request.json();
    if (!password || !userId) {
      return NextResponse.json({ error: "Passwort und UserId erforderlich" }, { status: 400 });
    }

    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH || "";

    // Get stored session
    const { data: session } = await supabaseAdmin
      .from("telegram_sessions")
      .select("session_string, phone_number")
      .eq("user_id", userId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Keine ausstehende Verifizierung" }, { status: 400 });
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

    const client = new TelegramClient(
      new StringSession(session.session_string || ""),
      apiId,
      apiHash,
      { connectionRetries: 3 }
    );
    await client.connect();

    try {
      const { Api } = await import("telegram/tl" as any);
      const { computeCheck } = await import("telegram/Password" as any);

      const passwordInfo = await client.invoke(new Api.account.GetPassword());
      const srpResult = await computeCheck(passwordInfo, password);
      await client.invoke(new Api.auth.CheckPassword({ password: srpResult }));

      // Save updated session
      const sessionString = (client.session as any).save();
      await supabaseAdmin
        .from("telegram_sessions")
        .update({ session_string: sessionString, status: "connected", connected_at: new Date().toISOString() })
        .eq("user_id", userId);

      await client.disconnect();
      return NextResponse.json({ success: true });
    } catch (err: any) {
      await client.disconnect();
      if (err.message?.includes("PASSWORD_HASH_INVALID")) {
        return NextResponse.json({ error: "Falsches Passwort" }, { status: 400 });
      }
      throw err;
    }
  } catch (err: any) {
    console.error("[TG-AUTH] 2FA error:", err.message);
    return NextResponse.json({ error: err.message || "2FA fehlgeschlagen" }, { status: 500 });
  }
}
