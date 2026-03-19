import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId erforderlich" }, { status: 400 });
    }

    // Check if connected
    const { data: session } = await supabaseAdmin
      .from("telegram_sessions")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (!session || session.status !== "connected") {
      return NextResponse.json({ connected: false, activeChannels: [] });
    }

    // Get active channels
    const { data: channels } = await supabaseAdmin
      .from("telegram_active_channels")
      .select("*")
      .eq("user_id", userId)
      .order("added_at" as any, { ascending: false });

    return NextResponse.json({
      connected: true,
      activeChannels: channels || [],
    });
  } catch (err: any) {
    console.error("[TG-CHANNELS] List error:", err.message);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}
