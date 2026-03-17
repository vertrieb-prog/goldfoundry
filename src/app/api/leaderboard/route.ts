// src/app/api/leaderboard/route.ts
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const db = createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "30d";
  const instrument = searchParams.get("instrument"); // XAUUSD, US500, or null=all

  // Get master accounts with their recent performance
  const { data: masters } = await db.from("master_accounts").select("*").eq("active", true);
  if (!masters?.length) return NextResponse.json({ leaderboard: [] });

  const leaderboard: any[] = [];

  for (const master of masters) {
    // Get all copier logs for this master's trades
    const { data: logs } = await db.from("copier_log")
      .select("instrument, direction, pnl_result, created_at")
      .eq("action", "COPIED")
      .not("pnl_result", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!logs?.length) continue;

    const filtered = instrument ? logs.filter(l => l.instrument === instrument) : logs;
    const winners = filtered.filter(l => (l.pnl_result ?? 0) > 0);
    const totalPnl = filtered.reduce((s, l) => s + (l.pnl_result ?? 0), 0);
    const grossWin = winners.reduce((s, l) => s + (l.pnl_result ?? 0), 0);
    const grossLoss = Math.abs(filtered.filter(l => (l.pnl_result ?? 0) < 0).reduce((s, l) => s + (l.pnl_result ?? 0), 0));

    const wr = filtered.length > 0 ? (winners.length / filtered.length) * 100 : 0;
    const pf = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;

    // Simplified Sharpe (daily returns std)
    const dailyPnls: Record<string, number> = {};
    for (const l of filtered) {
      const day = l.created_at.split("T")[0];
      dailyPnls[day] = (dailyPnls[day] ?? 0) + (l.pnl_result ?? 0);
    }
    const dailyArr = Object.values(dailyPnls);
    const avgDaily = dailyArr.reduce((s, v) => s + v, 0) / Math.max(dailyArr.length, 1);
    const stdDaily = Math.sqrt(dailyArr.reduce((s, v) => s + (v - avgDaily) ** 2, 0) / Math.max(dailyArr.length - 1, 1));
    const sharpe = stdDaily > 0 ? (avgDaily / stdDaily) * Math.sqrt(252) : 0;

    leaderboard.push({
      id: master.id,
      name: master.name,
      strategyType: master.strategy_type,
      instruments: master.instruments,
      trades: filtered.length,
      winRate: Math.round(wr * 10) / 10,
      profitFactor: Math.round(pf * 100) / 100,
      sharpe: Math.round(sharpe * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      rank: 0, // Calculated below
    });
  }

  // Rank by Sharpe (risk-adjusted)
  leaderboard.sort((a, b) => b.sharpe - a.sharpe);
  leaderboard.forEach((entry, i) => entry.rank = i + 1);

  return NextResponse.json({ leaderboard });
}
