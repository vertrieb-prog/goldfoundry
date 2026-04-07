export const dynamic = "force-dynamic";
// src/app/api/lp/stats/route.ts — LP stats powered 100% by MetaApi
import { NextResponse } from "next/server";
import { TRADER_CONFIG } from "@/lib/trader-config";

const BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";
const TOKEN = process.env.METAAPI_TOKEN ?? "";

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 30_000;

async function metaFetch(path: string) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "auth-token": TOKEN },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function strip(s: string) {
  return s.replace(/\.pro$/i, "");
}

function startOfDayUTC() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

async function fetchTrader(t: typeof TRADER_CONFIG[0]) {
  const now = new Date();
  const todayStart = startOfDayUTC().toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  const [info, positions, todayDeals, monthDeals] = await Promise.all([
    metaFetch(`/users/current/accounts/${t.metaApiId}/account-information`),
    metaFetch(`/users/current/accounts/${t.metaApiId}/positions`),
    metaFetch(
      `/users/current/accounts/${t.metaApiId}/history-deals/by-time-range` +
        `?startTime=${encodeURIComponent(todayStart)}&endTime=${encodeURIComponent(now.toISOString())}`
    ),
    metaFetch(
      `/users/current/accounts/${t.metaApiId}/history-deals/by-time-range` +
        `?startTime=${encodeURIComponent(thirtyDaysAgo)}&endTime=${encodeURIComponent(now.toISOString())}`
    ),
  ]);

  return { config: t, info, positions: positions ?? [], todayDeals: todayDeals ?? [], monthDeals: monthDeals ?? [] };
}

function isTrade(d: any) {
  const t = (d.type ?? "").toUpperCase();
  return (t.includes("BUY") || t.includes("SELL")) && d.entryType !== "DEAL_ENTRY_IN";
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const results = await Promise.all(TRADER_CONFIG.map(fetchTrader));

    let totalEquity = 0;
    let totalBalance = 0;
    let todayPnl = 0;
    let todayTradeCount = 0;
    let allMonthTrades: any[] = [];
    let allTodayTrades: any[] = [];
    let totalPositions = 0;

    const accounts: any[] = [];

    for (const r of results) {
      const eq = r.info?.equity ?? 0;
      const bal = r.info?.balance ?? 0;
      totalEquity += eq;
      totalBalance += bal;
      totalPositions += r.positions.length;

      const tTrades = (Array.isArray(r.todayDeals) ? r.todayDeals : []).filter(isTrade);
      const mTrades = (Array.isArray(r.monthDeals) ? r.monthDeals : []).filter(isTrade);

      const tPnl = tTrades.reduce((s: number, d: any) => s + (d.profit ?? 0), 0);
      todayPnl += tPnl;
      todayTradeCount += tTrades.length;

      for (const d of tTrades) allTodayTrades.push({ ...d, trader: r.config.codename, traderColor: r.config.color });
      for (const d of mTrades) allMonthTrades.push({ ...d, trader: r.config.codename, traderColor: r.config.color });

      // Per-account stats for profit table
      const mWins = mTrades.filter((d: any) => (d.profit ?? 0) > 0).length;
      const mPnl = mTrades.reduce((s: number, d: any) => s + (d.profit ?? 0), 0);
      const last3d = mTrades.filter((d: any) => new Date(d.time).getTime() > Date.now() - 3 * 86400000);
      const last7d = mTrades.filter((d: any) => new Date(d.time).getTime() > Date.now() - 7 * 86400000);

      accounts.push({
        name: r.config.codename,
        color: r.config.color,
        equity: Math.round(eq * 100) / 100,
        balance: Math.round(bal * 100) / 100,
        profit: Math.round(mPnl * 100) / 100,
        gain: bal > 0 ? Math.round(((eq - bal) / bal) * 10000) / 100 : 0,
        drawdown: 0,
        pnl24h: Math.round(tPnl * 100) / 100,
        pnl72h: Math.round(last3d.reduce((s: number, d: any) => s + (d.profit ?? 0), 0) * 100) / 100,
        pnl7d: Math.round(last7d.reduce((s: number, d: any) => s + (d.profit ?? 0), 0) * 100) / 100,
        pnl30d: Math.round(mPnl * 100) / 100,
        winrate: mTrades.length > 0 ? Math.round((mWins / mTrades.length) * 100) : 0,
        trades: mTrades.length,
        active: r.info !== null,
      });
    }

    // Aggregate win rate from all 30d trades
    const allWins = allMonthTrades.filter((d) => (d.profit ?? 0) > 0).length;
    const winrate = allMonthTrades.length > 0 ? Math.round((allWins / allMonthTrades.length) * 100) : 0;

    // Max drawdown estimate
    const maxDd = accounts.reduce((max, a) => Math.max(max, a.drawdown), 0);

    // Equity curve from daily PnL (30 days)
    const dailyPnl: Record<string, number> = {};
    for (const d of allMonthTrades) {
      if (!d.time) continue;
      const day = d.time.substring(0, 10);
      dailyPnl[day] = (dailyPnl[day] ?? 0) + (d.profit ?? 0);
    }
    const sortedDays = Object.keys(dailyPnl).sort();
    const total30dPnl = sortedDays.reduce((s, d) => s + dailyPnl[d], 0);
    let cum = totalBalance - total30dPnl;
    const equityCurve = sortedDays.map((day) => {
      cum += dailyPnl[day];
      return { date: day, equity: Math.round(cum * 100) / 100 };
    });

    // Growth curve (% from start)
    const startEq = equityCurve[0]?.equity ?? totalBalance;
    const growthCurve = equityCurve.map((p) => ({
      date: p.date,
      growth: startEq > 0 ? Math.round(((p.equity - startEq) / startEq) * 10000) / 100 : 0,
      equity: p.equity,
    }));

    // Drawdown curve
    let peak = 0;
    const drawdownCurve = equityCurve.map((p) => {
      if (p.equity > peak) peak = p.equity;
      const dd = peak > 0 ? ((peak - p.equity) / peak) * 100 : 0;
      return { date: p.date, dd: Math.round(dd * 100) / 100 };
    });

    // Recent trades
    allTodayTrades.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const recentTrades = allTodayTrades.slice(0, 8).map((d) => ({
      direction: (d.type ?? "").includes("BUY") ? "BUY" : "SELL",
      symbol: strip(d.symbol ?? ""),
      lots: d.volume ?? 0,
      pnl: Math.round((d.profit ?? 0) * 100) / 100,
      time: d.time,
      trader: d.trader,
      traderColor: d.traderColor,
    }));

    const gain = totalBalance > 0
      ? Math.round(((totalEquity - totalBalance) / totalBalance) * 10000) / 100
      : 0;

    const response = {
      equity: Math.round(totalEquity * 100) / 100,
      balance: Math.round(totalBalance * 100) / 100,
      todayPnl: Math.round(todayPnl * 100) / 100,
      todayTrades: todayTradeCount,
      winrate,
      maxDd: Math.round(maxDd * 10) / 10,
      gain,
      activePositions: totalPositions,
      equityCurve,
      growthCurve,
      drawdownCurve,
      recentTrades,
      lastUpdated: new Date().toISOString(),
      accounts,
      source: "metaapi",
    };

    cache = { data: response, ts: Date.now() };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[lp/stats]", err);
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
