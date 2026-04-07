export const dynamic = "force-dynamic";
// src/app/api/analyst/stats/route.ts — Dashboard-Stats aus Forge Analyst (MyFXBook)
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = createSupabaseAdmin();

    const { data: trades } = await db
      .from("trade_history")
      .select(
        "symbol,direction,profit,commission,swap,lots,open_time,close_time,status,myfxbook_account_id"
      )
      .eq("status", "closed")
      .order("close_time", { ascending: false });

    if (!trades?.length) {
      return NextResponse.json({ trades: [], stats: null });
    }

    const totalProfit = trades.reduce(
      (s, t) => s + (t.profit ?? 0) + (t.commission ?? 0) + (t.swap ?? 0),
      0
    );
    const winners = trades.filter((t) => t.profit > 0);
    const losers = trades.filter((t) => t.profit < 0);
    const winRate =
      trades.length > 0 ? (winners.length / trades.length) * 100 : 0;
    const avgWin =
      winners.length > 0
        ? winners.reduce((s, t) => s + t.profit, 0) / winners.length
        : 0;
    const avgLoss =
      losers.length > 0
        ? Math.abs(losers.reduce((s, t) => s + t.profit, 0) / losers.length)
        : 0;
    const profitFactor =
      avgLoss > 0 ? (avgWin * winners.length) / (avgLoss * losers.length) : 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTrades = trades.filter(
      (t) => new Date(t.close_time) >= todayStart
    );
    const todayPnl = todayTrades.reduce(
      (s, t) => s + (t.profit ?? 0) + (t.commission ?? 0) + (t.swap ?? 0),
      0
    );

    const sortedAsc = [...trades].reverse();
    let cumulative = 0;
    const equityCurve = sortedAsc.map((t) => {
      cumulative += (t.profit ?? 0) + (t.commission ?? 0) + (t.swap ?? 0);
      return Math.round(cumulative * 100) / 100;
    });

    let peak = 0;
    let maxDd = 0;
    for (const val of equityCurve) {
      if (val > peak) peak = val;
      const dd = peak - val;
      if (dd > maxDd) maxDd = dd;
    }

    const accountIds = [
      ...new Set(trades.map((t) => t.myfxbook_account_id)),
    ];

    const recentTrades = trades.slice(0, 10).map((t) => ({
      symbol: t.symbol,
      direction: t.direction?.toUpperCase() ?? "BUY",
      pnl:
        Math.round((t.profit + (t.commission ?? 0) + (t.swap ?? 0)) * 100) /
        100,
      lots: t.lots,
      closeTime: t.close_time,
    }));

    return NextResponse.json({
      stats: {
        totalTrades: trades.length,
        totalProfit: Math.round(totalProfit * 100) / 100,
        todayPnl: Math.round(todayPnl * 100) / 100,
        todayTrades: todayTrades.length,
        winRate: Math.round(winRate * 10) / 10,
        profitFactor: Math.round(profitFactor * 100) / 100,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        maxDrawdown: Math.round(maxDd * 100) / 100,
        accounts: accountIds.length,
      },
      recentTrades,
      equityCurve,
    });
  } catch (err) {
    console.error("[analyst/stats]", err);
    return NextResponse.json(
      { error: "Failed to load analyst stats" },
      { status: 500 }
    );
  }
}
