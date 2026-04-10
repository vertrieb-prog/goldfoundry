export const dynamic = "force-dynamic";
// src/app/api/lp/stats/route.ts — LP stats: MetaApi (live) + MyFXBook (enrichment)
import { NextResponse } from "next/server";
import { TRADER_CONFIG } from "@/lib/trader-config";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getPortfolio, type MyfxAccount } from "@/lib/myfxbook";

const TOKEN = process.env.METAAPI_TOKEN ?? "";
const META_PROV = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";
const REGIONS = ["london", "new-york", "singapore", "vint-hill"];

// Persistent fallback cache — NEVER show zeros
let lastGoodResponse: any = null;
let cache: { data: any; ts: number } | null = null;
let regionCache: Record<string, string> = {};
let regionCacheTs = 0;
const CACHE_TTL = 30_000;
const REGION_CACHE_TTL = 300_000; // 5 min

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

function clientBase(region: string) {
  return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
}
function statsBase(region: string) {
  return `https://metastats-api-v1.${region}.agiliumtrade.ai`;
}

async function resolveRegions(): Promise<Record<string, string>> {
  if (regionCacheTs && Date.now() - regionCacheTs < REGION_CACHE_TTL) return regionCache;
  try {
    const res = await fetch(`${META_PROV}/users/current/accounts`, {
      headers: { "auth-token": TOKEN },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return regionCache;
    const accounts = await res.json();
    const map: Record<string, string> = {};
    for (const a of accounts) map[a._id] = a.region || "london";
    regionCache = map;
    regionCacheTs = Date.now();
    return map;
  } catch {
    return regionCache;
  }
}

async function fetchTrader(t: typeof TRADER_CONFIG[0], region: string) {
  const cb = clientBase(region);
  const sb = statsBase(region);
  const [info, positions, metrics] = await Promise.all([
    metaFetch(`${cb}/users/current/accounts/${t.metaApiId}/account-information`),
    metaFetch(`${cb}/users/current/accounts/${t.metaApiId}/positions`),
    metaFetch(`${sb}/users/current/accounts/${t.metaApiId}/metrics`),
  ]);
  return { config: t, info, positions: positions ?? [], metrics: metrics?.metrics ?? null };
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    // Fetch MetaApi + MyFXBook in parallel
    // Resolve regions + fetch MetaApi + MyFXBook in parallel
    const regions = await resolveRegions();
    const [results, myfxData] = await Promise.all([
      Promise.all(TRADER_CONFIG.map(t => fetchTrader(t, regions[t.metaApiId] || "london"))),
      getPortfolio().catch(() => null),
    ]);

    // Build MyFXBook lookup by codename → MyfxAccount
    // Match via MyFXBook account ID (from mfxIds mapping)
    const mfxIdToCodename: Record<number, string> = {
      11992338: "PHANTOM", 11993800: "VIPER", 11994589: "APEX",
      11994591: "SPECTRE", 11994594: "HYDRA", 11995050: "AEGIS",
      11995344: "RONIN",
    };
    const mfxByName: Record<string, MyfxAccount> = {};
    if (myfxData?.accounts) {
      for (const a of myfxData.accounts) {
        // Match by MyFXBook account ID
        const codename = mfxIdToCodename[a.id];
        if (codename) {
          mfxByName[codename] = a;
          continue;
        }
        // Fallback: match by name containing codename
        const matched = TRADER_CONFIG.find(t =>
          a.name?.toLowerCase().includes(t.codename.toLowerCase())
        );
        if (matched) mfxByName[matched.codename] = a;
      }
    }

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
      let dd = m?.maxDrawdown ?? 0;
      // Fallback: calculate DD from dailyGrowth if MetaStats returns 0
      if (dd === 0 && (m?.dailyGrowth?.length ?? 0) > 0) {
        let peak = 0;
        for (const d of m.dailyGrowth) {
          const b = d.balance ?? 0;
          if (b > peak) peak = b;
          if (peak > 0) { const drawdown = ((peak - b) / peak) * 100; if (drawdown > dd) dd = drawdown; }
        }
      }
      totalTrades += trades;
      totalWon += won;
      totalProfit += profit;

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

      // Enrich with MyFXBook data (gain, drawdown, daily, monthly)
      const mfx = mfxByName[r.config.codename];
      // Gain: MetaStats absoluteGain → MyFXBook gain → profit/initialDeposit (config)
      //       → profit/(balance-profit) Fallback (nur ohne Withdrawals korrekt)
      let accGain = 0;
      if (m?.absoluteGain) {
        accGain = Math.round(m.absoluteGain * 100) / 100;
      } else if (mfx?.gain) {
        accGain = Math.round(mfx.gain * 100) / 100;
      } else if (r.config.initialDeposit && profit !== 0) {
        accGain = Math.round((profit / r.config.initialDeposit) * 10000) / 100;
      } else if (bal > 0 && profit !== 0 && bal > profit) {
        accGain = Math.round((profit / (bal - profit)) * 10000) / 100;
      }
      // maxDd: MetaStats → MyFXBook → statischer Config-Fallback
      const accDd = dd > 0 ? Math.round(dd * 100) / 100
        : mfx?.drawdown ? Math.round(mfx.drawdown * 100) / 100
        : r.config.maxDdFallback ?? 0;
      if (accDd > worstDd) worstDd = accDd;

      accounts.push({
        name: r.config.codename,
        color: r.config.color,
        equity: Math.round(eq * 100) / 100,
        balance: Math.round(bal * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        gain: accGain,
        drawdown: accDd,
        daily: mfx?.daily ? Math.round(mfx.daily * 100) / 100 : 0,
        monthly: mfx?.monthly ? Math.round(mfx.monthly * 100) / 100 : 0,
        deposits: mfx?.deposits ? Math.round(mfx.deposits * 100) / 100 : 0,
        pips: mfx?.pips ?? 0,
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

      // Collect recent trades from dailyGrowth (real trade data, not currency summary)
      const recent = dg.slice(-7);
      for (const day of recent) {
        if (!day.date || ((day.profit ?? 0) === 0 && (day.lots ?? 0) === 0)) continue;
        recentTrades.push({
          direction: (day.profit ?? 0) >= 0 ? "BUY" : "SELL",
          symbol: strip(r.config.asset ?? "XAUUSD"),
          lots: Math.round((day.lots ?? 0) * 100) / 100,
          pnl: Math.round((day.profit ?? 0) * 100) / 100,
          time: day.date,
          trader: r.config.codename,
          traderColor: r.config.color,
        });
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
          // Recalc winrate + gain per account nach Supabase-Merge
          for (const acc of zeroAccounts) {
            if (acc.trades > 0) {
              acc.winrate = Math.round(((acc._wins ?? 0) / acc.trades) * 100);
              acc.profit = Math.round(acc.profit * 100) / 100;
              acc.pnl24h = Math.round(acc.pnl24h * 100) / 100;
              acc.pnl72h = Math.round(acc.pnl72h * 100) / 100;
              acc.pnl7d = Math.round(acc.pnl7d * 100) / 100;
              acc.pnl30d = Math.round(acc.pnl30d * 100) / 100;
              // Gain neu berechnen — wichtig für Accounts wie HYDRA mit Withdrawals
              const cfg = TRADER_CONFIG.find(t => t.codename === acc.name);
              if (cfg?.initialDeposit && acc.profit !== 0) {
                acc.gain = Math.round((acc.profit / cfg.initialDeposit) * 10000) / 100;
              } else if (acc.balance > 0 && acc.profit !== 0 && acc.balance > acc.profit) {
                acc.gain = Math.round((acc.profit / (acc.balance - acc.profit)) * 10000) / 100;
              }
            }
            delete acc._wins;
          }
        }
      } catch (err) {
        console.warn("[lp/stats] Supabase fallback failed:", err);
      }
    }

    // Final pass: calculate gain for any account still at 0 but with profit
    for (const acc of accounts) {
      if (acc.gain === 0 && acc.profit !== 0 && acc.balance > 0) {
        const cfg = TRADER_CONFIG.find(t => t.codename === acc.name);
        // Priorität: MyFXBook deposits → config initialDeposit → balance-profit
        let deposit = 0;
        if (acc.deposits > 0) deposit = acc.deposits;
        else if (cfg?.initialDeposit) deposit = cfg.initialDeposit;
        else if (acc.balance > acc.profit) deposit = acc.balance - acc.profit;
        if (deposit > 0) acc.gain = Math.round((acc.profit / deposit) * 10000) / 100;
      }
    }

    const winrate = totalTrades > 0 ? Math.round((totalWon / totalTrades) * 100) : 0;
    // Global Gain: MyFXBook totalGain → Summe über initialDeposits + (balance-profit) Fallback
    // Wichtig: einzelne Accounts mit Withdrawals (HYDRA) würden die globale Formel kippen.
    const gain = myfxData?.totalGain
      ? Math.round(myfxData.totalGain * 100) / 100
      : (() => {
          let portfolioDeposit = 0;
          for (const acc of accounts) {
            const cfg = TRADER_CONFIG.find(t => t.codename === acc.name);
            if (cfg?.initialDeposit) {
              portfolioDeposit += cfg.initialDeposit;
            } else if (acc.balance > acc.profit) {
              portfolioDeposit += acc.balance - acc.profit;
            } else {
              portfolioDeposit += acc.balance; // Worst-Case-Fallback
            }
          }
          return portfolioDeposit > 0
            ? Math.round((totalProfit / portfolioDeposit) * 10000) / 100
            : 0;
        })();

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
      maxDd: Math.round((worstDd > 0 ? worstDd : (myfxData?.totalDrawdown ?? 0)) * 10) / 10,
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
