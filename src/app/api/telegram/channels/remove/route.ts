import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const { channelId } = await request.json();
    if (!channelId) return NextResponse.json({ error: "channelId erforderlich" }, { status: 400 });

    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from("telegram_active_channels")
      .delete()
      .eq("user_id", user.id)
      .eq("channel_id", channelId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[TG-CHANNELS] Remove error:", err.message);
    return NextResponse.json({ error: err.message || "Fehler" }, { status: 500 });
  }
}
