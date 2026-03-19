import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { userId, channelId, channelName, settings } = await request.json();
    if (!userId || !channelId) {
      return NextResponse.json({ error: "userId und channelId erforderlich" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("telegram_active_channels")
      .select("id")
      .eq("user_id", userId)
      .eq("channel_id", channelId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Kanal bereits verbunden" }, { status: 409 });
    }

    const { count } = await supabaseAdmin
      .from("telegram_active_channels")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: "Maximal 10 Kanaele erlaubt" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("telegram_active_channels")
      .insert({
        user_id: userId,
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
