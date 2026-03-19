import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const { channelId, channelName, settings } = await request.json();
    if (!channelId) return NextResponse.json({ error: "channelId erforderlich" }, { status: 400 });

    const admin = createSupabaseAdmin();

    const { data: existing } = await admin
      .from("telegram_active_channels")
      .select("id")
      .eq("user_id", user.id)
      .eq("channel_id", channelId)
      .single();

    if (existing) return NextResponse.json({ error: "Kanal bereits verbunden" }, { status: 409 });

    const { count } = await admin
      .from("telegram_active_channels")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= 10) return NextResponse.json({ error: "Maximal 10 Kanaele erlaubt" }, { status: 400 });

    const { data, error } = await admin
      .from("telegram_active_channels")
      .insert({
        user_id: user.id,
        channel_id: channelId,
        channel_name: channelName || channelId,
        status: "active",
        settings: settings || { autoExecute: true, riskPercent: 1 },
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, channel: data });
  } catch (err: any) {
    console.error("[TG-CHANNELS] Add error:", err.message);
    return NextResponse.json({ error: err.message || "Fehler" }, { status: 500 });
  }
}
