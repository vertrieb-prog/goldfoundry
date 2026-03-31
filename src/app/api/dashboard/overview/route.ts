export const dynamic = "force-dynamic";

import { createSupabaseServer } from "@/lib/supabase/server";
import { TRADER_CONFIG, TraderConfig } from "@/lib/trader-config";
import { NextResponse } from "next/server";

const METAAPI_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";
const METAAPI_TOKEN = process.env.METAAPI_TOKEN ?? "";
const DD_LIMIT = 5.0;

interface AccountInfo {
  equity: number;
  balance: number;
  [key: string]: unknown;
}

interface Deal {
  type?: string;
  profit?: number;
  symbol?: string;
  time?: string;
  volume?: number;
  entryType?: string;
  [key: string]: unknown;
}

// ---------- MetaApi fetch helpers ----------

async function fetchAccountInfo(
  metaApiId: string
): Promise<AccountInfo | null> {
  try {
    const res = await fetch(
      `${METAAPI_BASE}/users/current/accounts/${metaApiId}/account-information`,
      {
        headers: { "auth-token": METAAPI_TOKEN },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as AccountInfo;
  } catch {
    return null;
  }
}

async function fetchDealsByRange(
  metaApiId: string,
  startTime: string,
  endTime: string
): Promise<Deal[]> {
  try {
    const res = await fetch(
      `${METAAPI_BASE}/users/current/accounts/${metaApiId}/history-deals/by-time-range` +
        `?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
      {
        headers: { "auth-token": METAAPI_TOKEN },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    // MetaApi returns the array directly
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function isTradeDeal(deal: Deal): boolean {
  const t = (deal.type ?? "").toUpperCase();
  return t.includes("BUY") || t.includes("SELL") || deal.profit !== undefined;
}

function stripProSuffix(symbol: string): string {
  return symbol.replace(/\.pro$/i, "");
}

function startOfDayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

function startOf30DaysAgoUTC(): Date {
  const d = startOfDayUTC();
  d.setUTCDate(d.getUTCDate() - 30);
  return d;
}

// ---------- Per-trader data ----------

interface TraderData {
  config: TraderConfig;
  accountInfo: AccountInfo | null;
  todayDeals: Deal[];
  thirtyDayDeals: Deal[];
}

async function fetchTraderData(trader: TraderConfig): Promise<TraderData> {
  const now = new Date().toISOString();
  const todayStart = startOfDayUTC().toISOString();
  const thirtyDaysAgo = startOf30DaysAgoUTC().toISOString();

  const [accountInfo, todayDeals, thirtyDayDeals] = await Promise.all([
    fetchAccountInfo(trader.metaApiId),
    fetchDealsByRange(trader.metaApiId, todayStart, now),
    fetchDealsByRange(trader.metaApiId, thirtyDaysAgo, now),
  ]);

  return { config: trader, accountInfo, todayDeals, thirtyDayDeals };
}

// ---------- Aggregation ----------

function buildResponse(tradersData: TraderData[]) {
  let totalEquity = 0;
  let totalBalance = 0;
  let todayPnl = 0;
  let todayTrades = 0;
  let worstDdBuffer = Infinity;
  let equityHigh = 0;

  const traders: Record<string, unknown>[] = [];
  const allRecentDeals: {
    direction: string;
    symbol: string;
    pnl: number;
    trader: string;
    traderColor: string;
    time: string;
    lots: number;
  }[] = [];

  // For equity curve: aggregate daily PnL across all traders
  const dailyPnlMap: Record<string, number> = {};

  for (const td of tradersData) {
    const { config, accountInfo, todayDeals, thirtyDayDeals } = td;
    const equity = accountInfo?.equity ?? 0;
    const balance = accountInfo?.balance ?? 0;

    totalEquity += equity;
    totalBalance += balance;

    // Today's trade deals
    const todayTradeDeals = todayDeals.filter(isTradeDeal);
    const traderTodayProfit = todayTradeDeals.reduce(
      (sum, d) => sum + (d.profit ?? 0),
      0
    );
    todayPnl += traderTodayProfit;
    todayTrades += todayTradeDeals.length;

    // DD calculation
    const eqHigh = Math.max(balance, equity);
    if (eqHigh > equityHigh) equityHigh = eqHigh;
    const ddUsed =
      eqHigh > 0 ? ((eqHigh - equity) / eqHigh) * 100 : 0;
    const ddBuffer = DD_LIMIT - ddUsed;
    if (ddBuffer < worstDdBuffer) worstDdBuffer = ddBuffer;

    traders.push({
      codename: config.codename,
      asset: config.asset,
      assetLabel: config.assetLabel,
      color: config.color,
      active: accountInfo !== null,
      todayProfit: Math.round(traderTodayProfit * 100) / 100,
      equity: Math.round(equity * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      ddUsed: Math.round(ddUsed * 100) / 100,
      ddBuffer: Math.round(ddBuffer * 100) / 100,
    });

    // Collect recent deals for recentTrades
    for (const deal of todayTradeDeals) {
      const t = (deal.type ?? "").toUpperCase();
      const direction = t.includes("BUY") ? "BUY" : "SELL";
      allRecentDeals.push({
        direction,
        symbol: stripProSuffix(deal.symbol ?? config.asset),
        pnl: Math.round((deal.profit ?? 0) * 100) / 100,
        trader: config.codename,
        traderColor: config.color,
        time: deal.time ?? new Date().toISOString(),
        lots: deal.volume ?? 0,
      });
    }

    // 30-day deals for equity curve
    const tradeDeals30d = thirtyDayDeals.filter(isTradeDeal);
    for (const deal of tradeDeals30d) {
      if (!deal.time) continue;
      const day = deal.time.substring(0, 10); // YYYY-MM-DD
      dailyPnlMap[day] = (dailyPnlMap[day] ?? 0) + (deal.profit ?? 0);
    }
  }

  // Recent trades: sorted by time desc, top 20
  allRecentDeals.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );
  const recentTrades = allRecentDeals.slice(0, 20);

  // Equity curve: last 30 days, cumulative
  const sortedDays = Object.keys(dailyPnlMap).sort();
  let cumulative = totalBalance; // start from current balance as baseline
  // Walk backwards to find a starting point: balance - total 30d PnL
  const total30dPnl = sortedDays.reduce(
    (s, d) => s + dailyPnlMap[d],
    0
  );
  cumulative = totalBalance - total30dPnl;

  const datapoints: { date: string; equity: number }[] = [];
  for (const day of sortedDays) {
    cumulative += dailyPnlMap[day];
    datapoints.push({
      date: day,
      equity: Math.round(cumulative * 100) / 100,
    });
  }

  const periodChange =
    totalBalance > 0
      ? Math.round(((totalEquity - totalBalance) / totalBalance) * 10000) / 100
      : 0;

  const equityChange =
    totalBalance > 0
      ? Math.round(((totalEquity - totalBalance) / totalBalance) * 10000) / 100
      : 0;

  return {
    kpis: {
      totalEquity: Math.round(totalEquity * 100) / 100,
      totalBalance: Math.round(totalBalance * 100) / 100,
      equityChange,
      todayPnl: Math.round(todayPnl * 100) / 100,
      todayTrades,
      ddBuffer:
        worstDdBuffer === Infinity
          ? DD_LIMIT
          : Math.round(worstDdBuffer * 100) / 100,
      ddLimit: DD_LIMIT,
      equityHigh: Math.round(equityHigh * 100) / 100,
    },
    traders,
    recentTrades,
    equityCurve: {
      datapoints,
      periodChange,
      periodPnl: Math.round(total30dPnl * 100) / 100,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ---------- Route handler ----------

export async function GET() {
  try {
    // DEV MODE: skip auth when Supabase not configured
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL
    ) {
      const tradersData = await Promise.all(
        TRADER_CONFIG.map(fetchTraderData)
      );
      return NextResponse.json(buildResponse(tradersData));
    }

    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all trader data in parallel
    const tradersData = await Promise.all(
      TRADER_CONFIG.map(fetchTraderData)
    );

    return NextResponse.json(buildResponse(tradersData));
  } catch (err) {
    console.error("[dashboard/overview] Error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard overview" },
      { status: 500 }
    );
  }
}
