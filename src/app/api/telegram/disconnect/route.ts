import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const admin = createSupabaseAdmin();
    await admin.from("telegram_sessions").delete().eq("user_id", user.id);
    await admin.from("telegram_active_channels").delete().eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[TG-DISCONNECT] Error:", err.message);
    return NextResponse.json({ error: err.message || "Fehler" }, { status: 500 });
  }
}
