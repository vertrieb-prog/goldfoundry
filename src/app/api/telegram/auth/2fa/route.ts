import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: "Passwort erforderlich" }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const apiId = Number(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH || "";
    const admin = createSupabaseAdmin();

    const { data: session } = await admin
      .from("telegram_sessions")
      .select("session_string, phone_number")
      .eq("user_id", user.id)
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
      apiId, apiHash, { connectionRetries: 3 }
    );
    await client.connect();

    try {
      const { Api } = await import("telegram/tl" as any);
      const { computeCheck } = await import("telegram/Password" as any);

      const passwordInfo = await client.invoke(new Api.account.GetPassword());
      const srpResult = await computeCheck(passwordInfo, password);
      await client.invoke(new Api.auth.CheckPassword({ password: srpResult }));

      const sessionString = (client.session as any).save();
      await admin
        .from("telegram_sessions")
        .update({ session_string: sessionString, status: "connected", connected_at: new Date().toISOString() })
        .eq("user_id", user.id);

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
