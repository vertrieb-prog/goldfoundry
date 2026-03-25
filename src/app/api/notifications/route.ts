export const dynamic = "force-dynamic";
// ═══════════════════════════════════════════════════════════════
// GET /api/notifications — Recent trade execution notifications
// Returns the user's last 20 executed/failed signals with details
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
    }

    const db = createSupabaseAdmin();

    const { data: signals, error } = await db
      .from("telegram_signals")
      .select("id, channel_id, status, parsed, execution_result, created_at")
      .eq("user_id", user.id)
      .in("status", ["executed", "execution_failed"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to a clean notification format
    const notifications = (signals || []).map((s: any) => {
      const parsed = s.parsed || {};
      const exec = s.execution_result || {};
      return {
        id: s.id,
        status: s.status,
        action: parsed.action || "UNKNOWN",
        symbol: parsed.symbol || null,
        entryPrice: parsed.entryPrice || null,
        stopLoss: parsed.stopLoss || null,
        takeProfits: parsed.takeProfits || [],
        lots: exec.lots || null,
        orderIds: exec.orderIds || [],
        splits: exec.splits || null,
        success: exec.success ?? (s.status === "executed"),
        error: exec.error || null,
        accountName: exec.accountName || null,
        channelName: exec.channelName || s.channel_id,
        executedAt: exec.executedAt || s.created_at,
        createdAt: s.created_at,
      };
    });

    return NextResponse.json({ notifications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
