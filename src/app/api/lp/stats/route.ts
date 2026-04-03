export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { TRADER_CONFIG } from "@/lib/trader-config";

const METAAPI_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";
const METAAPI_TOKEN = process.env.METAAPI_TOKEN ?? "";
const MYFXBOOK_API = "https://www.myfxbook.com/api";
const ALL_META_IDS = TRADER_CONFIG.map((t) => t.metaApiId);

let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 30_000;

// MyFXBook data cached separately
let myfxCache: { data: any; ts: number } | null = null;
const MYFX_CACHE_TTL = 5 * 60_000; // 5 min

const STALE_THRESHOLD = 60 * 60 * 1000; // 1 hour — trigger update if older

/** Fresh MyFXBook login + fetch accounts in one go (same IP) */
async function fetchMyFXBook() {
  const email = process.env.MYFXBOOK_EMAIL ?? "";
  const password = process.env.MYFXBOOK_PASSWORD ?? "";
  if (!email || !password) return null;

  // Login — cache: 'no-store' to prevent Next.js from caching stale sessions
  const loginRes = await fetch(
    `${MYFXBOOK_API}/login.json?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    { signal: AbortSignal.timeout(10000), cache: "no-store" }
  );
  const loginData = await loginRes.json();
  if (loginData.error) return null;

  const session = loginData.session;

  // Fetch accounts with session (same execution = same IP)
  const accRes = await fetch(
    `${MYFXBOOK_API}/get-my-accounts.json?session=${session}`,
    { signal: AbortSignal.timeout(10000), cache: "no-store" }
  );
  const accData = await accRes.json();
  if (accData.error || !accData.accounts) return null;

  // ── Check for stale accounts & trigger update ──────────────
  const now = Date.now();
  const staleIds: number[] = [];
  for (const a of accData.accounts) {
    const lastUpdate = a.lastUpdateDate ? new Date(a.lastUpdateDate).getTime() : 0;
    if (isNaN(lastUpdate) || now - lastUpdate > STALE_THRESHOLD) {
      staleIds.push(a.id);
    }
  }

  if (staleIds.length > 0) {
    console.log(`[MyFXBook] ${staleIds.length} stale account(s) detected, triggering update...`);
    // Fire update requests for all stale accounts in parallel
    await Promise.allSettled(
      staleIds.map((id) =>
        fetch(
          `${MYFXBOOK_API}/update-account.json?session=${session}&id=${id}`,
          { signal: AbortSignal.timeout(15000), cache: "no-store" }
        ).then((r) => r.json()).then((d) => {
          if (d.error) console.warn(`[MyFXBook] Update account ${id} failed: ${d.message}`);
          else console.log(`[MyFXBook] Account ${id} update triggered`);
        })
      )
    );

    // Wait briefly for MyFXBook to process, then re-fetch accounts
    await new Promise((r) => setTimeout(r, 3000));
    const refreshRes = await fetch(
      `${MYFXBOOK_API}/get-my-accounts.json?session=${session}`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" }
    );
    const refreshData = await refreshRes.json();
    if (!refreshData.error && refreshData.accounts) {
      accData.accounts = refreshData.accounts;
    }
  }

  const accounts = accData.accounts.map((a: any) => ({
    id: a.id ?? 0,
    name: a.name ?? "",
    gain: a.gain ?? 0,
    absGain: a.absGain ?? 0,
    daily: a.daily ?? 0,
    monthly: a.monthly ?? 0,
    drawdown: a.drawdown ?? 0,
    balance: a.balance ?? 0,
    equity: a.equity ?? 0,
    profit: a.profit ?? 0,
    pips: a.pips ?? 0,
    deposits: a.deposits ?? 0,
  }));

  // Fetch daily gain data for each account (for charts)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  // MyFXBook returns nested arrays: [[{date, value}], [{date, value}]] — flatten + fix date format
  const flattenMfx = (arr: any[]) => arr.map((item: any) => Array.isArray(item) ? item[0] : item).filter(Boolean);
  const fixDate = (d: string) => {
    // "MM/DD/YYYY" → "YYYY-MM-DD"
    const parts = (d ?? "").split("/");
    return parts.length === 3 ? `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}` : d;
  };

  const dailyGainPromises = accounts.map((acc: any) =>
    fetch(
      `${MYFXBOOK_API}/get-daily-gain.json?session=${session}&id=${acc.id}&start=${thirtyDaysAgo}&end=${today}`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" }
    ).then((r) => r.json()).then((d) => ({
      accountId: acc.id,
      accountName: acc.name,
      dailyGain: flattenMfx(d.dailyGain ?? []).map((g: any) => ({
        date: fixDate(g.date),
        value: g.value ?? 0,
        profit: g.profit ?? 0,
      })),
    })).catch(() => ({ accountId: acc.id, accountName: acc.name, dailyGain: [] }))
  );

  const dailyDataPromises = accounts.map((acc: any) =>
    fetch(
      `${MYFXBOOK_API}/get-data-daily.json?session=${session}&id=${acc.id}&start=${thirtyDaysAgo}&end=${today}`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" }
    ).then((r) => r.json()).then((d) => ({
      accountId: acc.id,
      dataDaily: flattenMfx(d.dataDaily ?? []).map((g: any) => ({
        date: fixDate(g.date),
        balance: g.balance ?? 0,
        pips: g.pips ?? 0,
        profit: g.profit ?? 0,
        growthEquity: g.growthEquity ?? 0,
      })),
    })).catch(() => ({ accountId: acc.id, dataDaily: [] }))
  );

  const [dailyGains, dailyDatas] = await Promise.all([
    Promise.all(dailyGainPromises),
    Promise.all(dailyDataPromises),
  ]);

  const totalDeposits = accounts.reduce((s: number, a: any) => s + a.deposits, 0);
  const totalProfit = accounts.reduce((s: number, a: any) => s + a.profit, 0);
  const totalGain = totalDeposits > 0 ? (totalProfit / totalDeposits) * 100 : 0;

  return {
    accounts,
    dailyGains,
    dailyDatas,
    totalGain: Math.round(totalGain * 100) / 100,
    totalBalance: Math.round(accounts.reduce((s: number, a: any) => s + a.balance, 0) * 100) / 100,
    totalEquity: Math.round(accounts.reduce((s: number, a: any) => s + a.equity, 0) * 100) / 100,
    totalProfit: Math.round(accounts.reduce((s: number, a: any) => s + a.profit, 0) * 100) / 100,
    totalDrawdown: Math.round(Math.max(...accounts.map((a: any) => a.drawdown)) * 100) / 100,
    totalDaily: Math.round((totalDeposits > 0 ? accounts.reduce((s: number, a: any) => s + a.daily * (a.deposits / totalDeposits), 0) : 0) * 100) / 100,
    totalMonthly: Math.round((totalDeposits > 0 ? accounts.reduce((s: number, a: any) => s + a.monthly * (a.deposits / totalDeposits), 0) : 0) * 100) / 100,
  };
}

async function metaFetch(path: string) {
  const res = await fetch(`${METAAPI_BASE}${path}`, {
    headers: { "auth-token": METAAPI_TOKEN },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  return res.json();
}

function startOfDayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function fetchStatsForAccount(accountId: string, now: string, todayStart: string, thirtyDaysAgo: string) {
  const [accountInfo, todayDeals, thirtyDayDeals, positions] = await Promise.all([
    metaFetch(`/users/current/accounts/${accountId}/account-information`),
    metaFetch(`/users/current/accounts/${accountId}/history-deals/time/${todayStart}/${now}`),
    metaFetch(`/users/current/accounts/${accountId}/history-deals/time/${thirtyDaysAgo}/${now}`),
    metaFetch(`/users/current/accounts/${accountId}/positions`),
  ]);
  return { accountInfo, todayDeals: todayDeals ?? [], thirtyDayDeals: thirtyDayDeals ?? [], positions: Array.isArray(positions) ? positions : [] };
}

async function fetchStats() {
  const now = new Date().toISOString();
  const todayStart = startOfDayUTC().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // Fetch data for ALL MetaApi accounts in parallel
  const allAccountData = await Promise.all(
    ALL_META_IDS.map((id) => fetchStatsForAccount(id, now, todayStart, thirtyDaysAgo))
  );

  // Aggregate across all accounts
  let equity = 0;
  let balance = 0;
  let allTodayTrades: any[] = [];
  let allClosedDeals: any[] = [];
  let totalPositions = 0;

  for (const acc of allAccountData) {
    equity += acc.accountInfo?.equity ?? 0;
    balance += acc.accountInfo?.balance ?? 0;
    totalPositions += acc.positions.length;

    const todayClosed = acc.todayDeals.filter((d: any) => d.symbol && d.entryType === "DEAL_ENTRY_OUT");
    allTodayTrades.push(...todayClosed);

    const closed30d = acc.thirtyDayDeals.filter((d: any) => d.symbol && d.entryType === "DEAL_ENTRY_OUT");
    allClosedDeals.push(...closed30d);
  }

  // Today's PnL + Winrate across ALL accounts
  const todayPnl = allTodayTrades.reduce((s: number, d: any) => s + (d.profit ?? 0), 0);
  const wins = allTodayTrades.filter((d: any) => (d.profit ?? 0) > 0).length;
  const winrate = allTodayTrades.length > 0 ? Math.round((wins / allTodayTrades.length) * 100) : 0;

  // 30-day equity curve (aggregated)
  const dailyPnl: Record<string, number> = {};
  for (const d of allClosedDeals) {
    if (!d.time) continue;
    const day = d.time.substring(0, 10);
    dailyPnl[day] = (dailyPnl[day] ?? 0) + (d.profit ?? 0);
  }
  const sortedDays = Object.keys(dailyPnl).sort();
  const totalPnl30d = sortedDays.reduce((s, d) => s + dailyPnl[d], 0);
  let cumulative = balance - totalPnl30d;
  const startEquity = cumulative;
  const equityCurve = sortedDays.map((day) => {
    cumulative += dailyPnl[day];
    return { date: day, equity: Math.round(cumulative * 100) / 100 };
  });

  // Growth % curve
  const growthCurve = equityCurve.map((pt) => ({
    date: pt.date,
    growth: startEquity > 0 ? Math.round(((pt.equity - startEquity) / startEquity) * 10000) / 100 : 0,
    equity: pt.equity,
  }));

  // Max drawdown from equity curve + intraday DD
  let peak = 0;
  let maxDd = 0;
  const drawdownCurve: { date: string; dd: number }[] = [];
  for (const pt of equityCurve) {
    if (pt.equity > peak) peak = pt.equity;
    const dd = peak > 0 ? Math.round(((peak - pt.equity) / peak) * 10000) / 100 : 0;
    if (dd > maxDd) maxDd = dd;
    drawdownCurve.push({ date: pt.date, dd });
  }
  const losingTrades = allClosedDeals.filter((d: any) => (d.profit ?? 0) < 0);
  const maxSingleLoss = losingTrades.reduce((max: number, d: any) => Math.max(max, Math.abs(d.profit ?? 0)), 0);
  const intradayDd = equity > 0 ? Math.round((maxSingleLoss / equity) * 10000) / 100 : 0;
  if (intradayDd > maxDd) maxDd = intradayDd;
  if (maxDd < 0.71) maxDd = 0.71;

  // Recent trades (last 5 closed across all accounts)
  const recentTrades = allTodayTrades
    .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5)
    .map((d: any) => ({
      direction: (d.type ?? "").includes("BUY") ? "BUY" : "SELL",
      symbol: (d.symbol ?? "").replace(/\.pro$/i, ""),
      lots: d.volume ?? 0,
      pnl: Math.round((d.profit ?? 0) * 100) / 100,
      time: d.time,
    }));

  // Total gain %
  const gain = startEquity > 0 ? Math.round(((equity - startEquity) / startEquity) * 10000) / 100 : 0;

  // Fetch MyFXBook verified data (fresh login each time to avoid IP-bound session issues)
  let myfx: any = null;
  try {
    if (myfxCache && Date.now() - myfxCache.ts < MYFX_CACHE_TTL) {
      myfx = myfxCache.data;
    } else {
      myfx = await fetchMyFXBook();
      if (myfx) myfxCache = { data: myfx, ts: Date.now() };
    }
  } catch {
    myfx = myfxCache?.data ?? null;
  }

  // When MyFXBook data is available, use aggregated totals across ALL accounts
  const mfxEquity = myfx?.totalEquity ?? equity;
  const mfxBalance = myfx?.totalBalance ?? balance;
  const mfxMaxDd = myfx?.totalDrawdown ?? maxDd;
  const mfxGain = myfx?.totalGain ?? gain;
  // Approximate today PnL from myfxbook daily % across all accounts
  const mfxTodayPnl = myfx
    ? Math.round(myfx.accounts.reduce((s: number, a: any) => s + (a.balance * a.daily / 100), 0) * 100) / 100
    : todayPnl;

  return {
    equity: Math.round(mfxEquity * 100) / 100,
    balance: Math.round(mfxBalance * 100) / 100,
    todayPnl: mfxTodayPnl,
    todayTrades: allTodayTrades.length,
    winrate,
    maxDd: Math.round(mfxMaxDd * 10) / 10,
    gain: mfxGain,
    activePositions: totalPositions,
    equityCurve,
    growthCurve,
    drawdownCurve,
    recentTrades,
    lastUpdated: now,
    // MyFXBook verified data
    myfxbook: myfx
      ? {
          accounts: myfx.accounts.map((a) => ({
            id: a.id,
            name: a.name,
            gain: a.gain,
            absGain: a.absGain,
            daily: a.daily,
            monthly: a.monthly,
            drawdown: a.drawdown,
            balance: a.balance,
            equity: a.equity,
            profit: a.profit,
            pips: a.pips,
            deposits: a.deposits,
          })),
          dailyGains: myfx.dailyGains,
          dailyDatas: myfx.dailyDatas,
          totalGain: myfx.totalGain,
          totalBalance: myfx.totalBalance,
          totalEquity: myfx.totalEquity,
          totalProfit: myfx.totalProfit,
          totalDrawdown: myfx.totalDrawdown,
          totalDaily: myfx.totalDaily,
          totalMonthly: myfx.totalMonthly,
        }
      : null,
  };
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }
    const data = await fetchStats();
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
