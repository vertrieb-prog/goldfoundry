import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(request: Request) {
  try {
    const { userId, channelId } = await request.json();
    if (!userId || !channelId) {
      return NextResponse.json({ error: "userId und channelId erforderlich" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("telegram_active_channels")
      .delete()
      .eq("user_id", userId)
      .eq("channel_id", channelId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[TG-CHANNELS] Remove error:", err.message);
    return NextResponse.json({ error: err.message || "Fehler" }, { status: 500 });
  }
}
