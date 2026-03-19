import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId erforderlich" }, { status: 400 });
    }

    // Delete session
    await supabaseAdmin.from("telegram_sessions").delete().eq("user_id", userId);

    // Delete all channels
    await supabaseAdmin.from("telegram_active_channels").delete().eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[TG-DISCONNECT] Error:", err.message);
    return NextResponse.json({ error: err.message || "Fehler" }, { status: 500 });
  }
}
