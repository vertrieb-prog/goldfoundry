export const dynamic = "force-dynamic";
// src/app/api/trades/live/route.ts — Open positions + recent history from all MetaApi accounts
import { TRADER_CONFIG } from "@/lib/trader-config";
import { NextResponse } from "next/server";

const METAAPI_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";
const TOKEN = process.env.METAAPI_TOKEN ?? "";

async function fetchPositions(metaApiId: string) {
  try {
    const res = await fetch(
      `${METAAPI_BASE}/users/current/accounts/${metaApiId}/positions`,
      { headers: { "auth-token": TOKEN }, cache: "no-store" }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchDeals(metaApiId: string, startTime: string, endTime: string) {
  try {
    const res = await fetch(
      `${METAAPI_BASE}/users/current/accounts/${metaApiId}/history-deals/by-time-range` +
        `?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
      { headers: { "auth-token": TOKEN }, cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchAccountInfo(metaApiId: string) {
  try {
    const res = await fetch(
      `${METAAPI_BASE}/users/current/accounts/${metaApiId}/account-information`,
      { headers: { "auth-token": TOKEN }, cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function stripSuffix(s: string) {
  return s.replace(/\.pro$/i, "");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "7d";
    const rangeMs: Record<string, number> = {
      "24h": 86400000,
      "72h": 3 * 86400000,
      "7d": 7 * 86400000,
      "30d": 30 * 86400000,
      "all": 365 * 86400000,
    };
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (rangeMs[range] ?? 7 * 86400000));

    const results = await Promise.all(
      TRADER_CONFIG.map(async (trader) => {
        const [positions, deals, info] = await Promise.all([
          fetchPositions(trader.metaApiId),
          fetchDeals(trader.metaApiId, sevenDaysAgo.toISOString(), now.toISOString()),
          fetchAccountInfo(trader.metaApiId),
        ]);
        return { trader, positions, deals, info };
      })
    );

    let totalEquity = 0;
    let totalBalance = 0;
    let totalProfit = 0;
    const openPositions: any[] = [];
    const closedDeals: any[] = [];

    for (const { trader, positions, deals, info } of results) {
      const eq = info?.equity ?? 0;
      const bal = info?.balance ?? 0;
      totalEquity += eq;
      totalBalance += bal;

      for (const pos of positions) {
        totalProfit += pos.unrealizedProfit ?? pos.profit ?? 0;
        openPositions.push({
          id: pos.id,
          symbol: stripSuffix(pos.symbol ?? ""),
          type: (pos.type ?? "").toUpperCase().includes("BUY") ? "BUY" : "SELL",
          volume: pos.volume ?? 0,
          openPrice: pos.openPrice ?? 0,
          currentPrice: pos.currentPrice ?? 0,
          profit: Math.round((pos.unrealizedProfit ?? pos.profit ?? 0) * 100) / 100,
          swap: Math.round((pos.swap ?? 0) * 100) / 100,
          commission: Math.round((pos.commission ?? 0) * 100) / 100,
          openTime: pos.time ?? "",
          sl: pos.stopLoss ?? null,
          tp: pos.takeProfit ?? null,
          trader: trader.codename,
          traderColor: trader.color,
        });
      }

      for (const deal of deals) {
        const t = (deal.type ?? "").toUpperCase();
        if (!t.includes("BUY") && !t.includes("SELL")) continue;
        if (deal.entryType === "DEAL_ENTRY_IN") continue;
        closedDeals.push({
          id: deal.id ?? `${trader.mtLogin}-${deal.time}`,
          symbol: stripSuffix(deal.symbol ?? ""),
          type: t.includes("BUY") ? "SELL" : "BUY",
          volume: deal.volume ?? 0,
          profit: Math.round((deal.profit ?? 0) * 100) / 100,
          swap: Math.round((deal.swap ?? 0) * 100) / 100,
          commission: Math.round((deal.commission ?? 0) * 100) / 100,
          closeTime: deal.time ?? "",
          trader: trader.codename,
          traderColor: trader.color,
        });
      }
    }

    openPositions.sort(
      (a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime()
    );
    closedDeals.sort(
      (a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()
    );

    return NextResponse.json({
      summary: {
        equity: Math.round(totalEquity * 100) / 100,
        balance: Math.round(totalBalance * 100) / 100,
        floatingPnl: Math.round(totalProfit * 100) / 100,
        openCount: openPositions.length,
        accounts: results.length,
      },
      positions: openPositions,
      history: closedDeals.slice(0, 200),
      range,
    });
  } catch (err) {
    console.error("[trades/live]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
