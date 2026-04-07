export const dynamic = "force-dynamic";
// src/app/api/lp/stats/route.ts — LP stats 100% MetaApi (MetaStats + Account Info)
import { NextResponse } from "next/server";
import { TRADER_CONFIG } from "@/lib/trader-config";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";
const STATS_BASE = "https://metastats-api-v1.london.agiliumtrade.ai";
const TOKEN = process.env.METAAPI_TOKEN ?? "";

// Persistent fallback cache — NEVER show zeros
let lastGoodResponse: any = null;
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL = 30_000;

async function metaFetch(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "auth-token": TOKEN },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function strip(s: string) { return s.replace(/\.pro$/i, ""); }

async function fetchTrader(t: typeof TRADER_CONFIG[0]) {
  const [info, positions, metrics] = await Promise.all([
    metaFetch(`${CLIENT_BASE}/users/current/accounts/${t.metaApiId}/account-information`),
    metaFetch(`${CLIENT_BASE}/users/current/accounts/${t.metaApiId}/positions`),
    metaFetch(`${STATS_BASE}/users/current/accounts/${t.metaApiId}/metrics`),
  ]);
  return { config: t, info, positions: positions ?? [], metrics: metrics?.metrics ?? null };
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const results = await Promise.all(TRADER_CONFIG.map(fetchTrader));

    let totalEquity = 0;
    let totalBalance = 0;
    let totalPositions = 0;
    let totalTrades = 0;
    let totalWon = 0;
    let totalProfit = 0;
    let worstDd = 0;
    const accounts: any[] = [];
    const equityCurveMap: Record<string, number> = {};
    const recentTrades: any[] = [];

    for (const r of results) {
      const eq = r.info?.equity ?? 0;
      const bal = r.info?.balance ?? 0;
      const m = r.metrics;
      totalEquity += eq;
      totalBalance += bal;
      totalPositions += r.positions.length;

      const trades = m?.trades ?? 0;
      const won = m?.wonTrades ?? 0;
      const profit = m?.profit ?? 0;
      const dd = m?.maxDrawdown ?? 0;
      totalTrades += trades;
      totalWon += won;
      totalProfit += profit;
      if (dd > worstDd) worstDd = dd;

      // Period PnL from MetaStats
      const periods = m?.periods ?? {};
      const pnl24h = periods.today?.profit ?? 0;
      const pnl7d = periods.thisWeek?.profit ?? 0;
      const pnl30d = periods.thisMonth?.profit ?? 0;
      // 72h: estimate from dailyGrowth last 3 days
      const dg = m?.dailyGrowth ?? [];
      const last3 = dg.slice(-3);
      const pnl72h = last3.reduce((s: number, d: any) => s + (d.profit ?? 0), 0);

      const wr = trades > 0 ? Math.round((won / trades) * 100) : 0;

      accounts.push({
        name: r.config.codename,
        color: r.config.color,
        equity: Math.round(eq * 100) / 100,
        balance: Math.round(bal * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        gain: m?.absoluteGain ? Math.round(m.absoluteGain * 100) / 100 : 0,
        drawdown: Math.round(dd * 100) / 100,
        pnl24h: Math.round(pnl24h * 100) / 100,
        pnl72h: Math.round(pnl72h * 100) / 100,
        pnl7d: Math.round(pnl7d * 100) / 100,
        pnl30d: Math.round(pnl30d * 100) / 100,
        winrate: wr,
        trades,
        active: r.info !== null,
      });

      // Equity curve from dailyGrowth
      for (const d of dg) {
        if (!d.date) continue;
        const day = d.date.substring(0, 10);
        equityCurveMap[day] = (equityCurveMap[day] ?? 0) + (d.balance ?? 0);
      }

      // Collect today's info for recent trades display
      const todayDeals = m?.currencySummary ?? [];
      for (const cs of todayDeals) {
        const lastDay = cs.history?.[cs.history.length - 1];
        if (lastDay) {
          recentTrades.push({
            direction: (lastDay.longProfit ?? 0) > (lastDay.shortProfit ?? 0) ? "BUY" : "SELL",
            symbol: strip(cs.currency ?? ""),
            lots: 0,
            pnl: Math.round((lastDay.totalProfit ?? 0) * 100) / 100,
            time: new Date().toISOString(),
            trader: r.config.codename,
            traderColor: r.config.color,
          });
        }
      }
    }

    // Supabase fallback for accounts with 0 MetaStats trades
    const zeroAccounts = accounts.filter(a => a.trades === 0);
    if (zeroAccounts.length > 0) {
      try {
        const db = createSupabaseAdmin();
        const mfxIds: Record<string, string> = {
          "50707464": "11992338", "50701398": "11993800", "68297968": "11994589",
          "2100151348": "11994591", "23651610": "11994594", "50715676": "11995050",
          "50713387": "11995344",
        };
        const traderByMfx: Record<string, string> = {};
        for (const t of TRADER_CONFIG) {
          const mid = mfxIds[t.mtLogin];
          if (mid) traderByMfx[mid] = t.codename;
        }
        const missingIds = zeroAccounts
          .map(a => { const t = TRADER_CONFIG.find(tc => tc.codename === a.name); return t ? mfxIds[t.mtLogin] : null; })
          .filter(Boolean) as string[];

        if (missingIds.length > 0) {
          const { data: sbTrades } = await db
            .from("trade_history")
            .select("profit,commission,swap,close_time,myfxbook_account_id")
            .in("myfxbook_account_id", missingIds)
            .eq("status", "closed");

          const now = Date.now();
          for (const t of sbTrades ?? []) {
            const traderName = traderByMfx[t.myfxbook_account_id];
            const acc = accounts.find((a: any) => a.name === traderName);
            if (!acc) continue;

            const net = (t.profit ?? 0) + (t.commission ?? 0) + (t.swap ?? 0);
            const ct = new Date(t.close_time).getTime();
            acc.trades += 1;
            acc.profit += net;
            totalTrades += 1;
            totalProfit += net;
            if (net > 0) { acc._wins = (acc._wins ?? 0) + 1; totalWon += 1; }
            if (now - ct < 86400000) acc.pnl24h += net;
            if (now - ct < 3 * 86400000) acc.pnl72h += net;
            if (now - ct < 7 * 86400000) acc.pnl7d += net;
            if (now - ct < 30 * 86400000) acc.pnl30d += net;
          }
          // Recalc winrate per account
          for (const acc of zeroAccounts) {
            if (acc.trades > 0) {
              acc.winrate = Math.round(((acc._wins ?? 0) / acc.trades) * 100);
              acc.profit = Math.round(acc.profit * 100) / 100;
              acc.pnl24h = Math.round(acc.pnl24h * 100) / 100;
              acc.pnl72h = Math.round(acc.pnl72h * 100) / 100;
              acc.pnl7d = Math.round(acc.pnl7d * 100) / 100;
              acc.pnl30d = Math.round(acc.pnl30d * 100) / 100;
            }
            delete acc._wins;
          }
        }
      } catch (err) {
        console.warn("[lp/stats] Supabase fallback failed:", err);
      }
    }

    const winrate = totalTrades > 0 ? Math.round((totalWon / totalTrades) * 100) : 0;
    const gain = totalBalance > 0
      ? Math.round(((totalEquity - totalBalance) / totalBalance) * 10000) / 100
      : 0;

    // Build equity curve
    const sortedDays = Object.keys(equityCurveMap).sort();
    const equityCurve = sortedDays.map((day) => ({
      date: day,
      equity: Math.round(equityCurveMap[day] * 100) / 100,
    }));

    // Growth + drawdown curves
    const startEq = equityCurve[0]?.equity || totalBalance;
    let peak = 0;
    const growthCurve = equityCurve.map((p) => ({
      date: p.date,
      growth: startEq > 0 ? Math.round(((p.equity - startEq) / startEq) * 10000) / 100 : 0,
      equity: p.equity,
    }));
    const drawdownCurve = equityCurve.map((p) => {
      if (p.equity > peak) peak = p.equity;
      return { date: p.date, dd: peak > 0 ? Math.round(((peak - p.equity) / peak) * 10000) / 100 : 0 };
    });

    const todayPnl = accounts.reduce((s, a) => s + a.pnl24h, 0);

    const response = {
      equity: Math.round(totalEquity * 100) / 100,
      balance: Math.round(totalBalance * 100) / 100,
      todayPnl: Math.round(todayPnl * 100) / 100,
      todayTrades: accounts.reduce((s, a) => s + (a.trades > 0 ? 1 : 0), 0),
      winrate,
      maxDd: Math.round(worstDd * 10) / 10,
      gain,
      activePositions: totalPositions,
      equityCurve,
      growthCurve,
      drawdownCurve,
      recentTrades: recentTrades.slice(0, 8),
      lastUpdated: new Date().toISOString(),
      accounts,
      source: "metaapi",
    };

    // Save as fallback
    if (totalEquity > 0) lastGoodResponse = response;
    cache = { data: response, ts: Date.now() };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[lp/stats]", err);
    // FALLBACK: never show zeros
    if (lastGoodResponse) return NextResponse.json(lastGoodResponse);
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
