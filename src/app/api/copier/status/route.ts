export const dynamic = "force-dynamic";
// src/app/api/copier/status/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createSupabaseAdmin();

    // Get user's slave accounts
    const { data: accounts } = await db
      .from("slave_accounts")
      .select("*")
      .eq("user_id", user.id);

    if (!accounts?.length) {
      return NextResponse.json({ accounts: [], summary: null });
    }

    const accountIds = accounts.map(a => a.id);

    // Get today's copier logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayLogs } = await db
      .from("copier_log")
      .select("*")
      .in("slave_account_id", accountIds)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    // Get latest market intel
    const { data: intel } = await db
      .from("market_intel")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    // Build status per account
    const statuses = accounts.map(acc => {
      const accLogs = (todayLogs ?? []).filter(l => l.slave_account_id === acc.id);
      const copied = accLogs.filter(l => l.action === "COPIED");
      const skipped = accLogs.filter(l => l.action === "SKIPPED");
      const todayPnl = copied.reduce((s, l) => s + (Number(l.pnl_result) || 0), 0);

      const ddBuffer = Number(acc.current_equity) > 0
        ? ((Number(acc.current_equity) - Number(acc.dd_limit)) / Number(acc.current_equity) * 100)
        : 0;

      const status = ddBuffer > 70 ? "NOMINAL" : ddBuffer > 40 ? "CAUTION" : ddBuffer > 20 ? "WARNING" : "CRITICAL";

      // Latest risk assessment
      const latestLog = accLogs[0];
      const riskAssessment = latestLog?.risk_assessment ?? null;

      return {
        id: acc.id,
        firmProfile: acc.firm_profile,
        mtLogin: acc.mt_login,
        brokerServer: acc.broker_server,
        equity: Number(acc.current_equity),
        initialBalance: Number(acc.initial_balance),
        equityHigh: Number(acc.equity_high),
        ddLimit: Number(acc.dd_limit),
        ddBuffer: Math.round(ddBuffer * 10) / 10,
        ddType: acc.dd_type,
        status,
        phase: acc.phase,
        copierActive: acc.copier_active,
        pausedReason: acc.copier_paused_reason,
        todayCopied: copied.length,
        todaySkipped: skipped.length,
        todayPnl: Math.round(todayPnl * 100) / 100,
        lastMultiplier: riskAssessment?.finalMultiplier ?? null,
        lastFactors: riskAssessment ? {
          time: riskAssessment.timeFactor,
          news: riskAssessment.newsFactor,
          dd: riskAssessment.ddFactor,
          perf: riskAssessment.performanceFactor,
          vol: riskAssessment.volatilityFactor,
          day: riskAssessment.weekdayFactor,
          intel: riskAssessment.intelFactor,
        } : null,
      };
    });

    return NextResponse.json({
      accounts: statuses,
      intel: intel?.[0] ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}
