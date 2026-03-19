export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

    const admin = createSupabaseAdmin();

    const { data: session } = await admin
      .from("telegram_sessions")
      .select("status")
      .eq("user_id", user.id)
      .single();

    if (!session || session.status !== "connected") {
      return NextResponse.json({ connected: false, activeChannels: [] });
    }

    const { data: channels } = await admin
      .from("telegram_active_channels")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ connected: true, activeChannels: channels || [] });
  } catch (err: any) {
    console.error("[TG-CHANNELS] List error:", err.message);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}
