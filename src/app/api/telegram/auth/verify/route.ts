import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { code, phoneNumber } = await request.json();
    if (!code) {
      return NextResponse.json({ error: "Code erforderlich" }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const admin = createSupabaseAdmin();
    const { data: session } = await admin
      .from("telegram_sessions")
      .select("phone_code_hash, phone_number, session_string")
      .eq("user_id", user.id)
      .single();

    if (!session || !session.phone_code_hash) {
      return NextResponse.json({ error: "Keine ausstehende Verifizierung. Bitte Code erneut senden." }, { status: 400 });
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
      return NextResponse.json({ error: "Telegram Modul nicht verfuegbar" }, { status: 500 });
    }

    // IMPORTANT: Reuse the session from send-code step
    const client = new TelegramClient(
      new StringSession(session.session_string || ""),
      apiId, apiHash, { connectionRetries: 3 }
    );
    await client.connect();

    try {
      const Api = (await import("telegram/tl" as any)).Api;
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: session.phone_number || phoneNumber,
          phoneCodeHash: session.phone_code_hash,
          phoneCode: code,
        })
      );

      // Save updated session string (now authenticated)
      const newSessionString = (client.session as any).save();
      await admin
        .from("telegram_sessions")
        .update({
          session_string: newSessionString,
          status: "connected",
          connected_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      await client.disconnect();
      return NextResponse.json({ success: true, requires2FA: false });
    } catch (err: any) {
      if (err.message?.includes("SESSION_PASSWORD_NEEDED")) {
        // Save intermediate session for 2FA step
        const intermediateSession = (client.session as any).save();
        await admin
          .from("telegram_sessions")
          .update({ session_string: intermediateSession, status: "needs_2fa" })
          .eq("user_id", user.id);
        await client.disconnect();
        return NextResponse.json({ success: false, requires2FA: true });
      }
      await client.disconnect();
      throw err;
    }
  } catch (err: any) {
    console.error("[TG-AUTH] Verify error:", err.message);
    return NextResponse.json({ error: err.message || "Verifizierung fehlgeschlagen" }, { status: 500 });
  }
}
