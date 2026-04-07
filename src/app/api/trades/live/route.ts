export const dynamic = "force-dynamic";
// src/app/api/trades/live/route.ts — Live positions + history (MetaApi + MetaStats fallback)
import { TRADER_CONFIG } from "@/lib/trader-config";
import { NextResponse } from "next/server";

const CLIENT = "https://mt-client-api-v1.london.agiliumtrade.ai";
const STATS = "https://metastats-api-v1.london.agiliumtrade.ai";
const TOKEN = process.env.METAAPI_TOKEN ?? "";

async function metaFetch(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "auth-token": TOKEN },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function strip(s: string) { return s.replace(/\.pro$/i, ""); }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "7d";

    const results = await Promise.all(
      TRADER_CONFIG.map(async (trader) => {
        const [info, positions, metrics] = await Promise.all([
          metaFetch(`${CLIENT}/users/current/accounts/${trader.metaApiId}/account-information`),
          metaFetch(`${CLIENT}/users/current/accounts/${trader.metaApiId}/positions`),
          metaFetch(`${STATS}/users/current/accounts/${trader.metaApiId}/metrics`),
        ]);
        return { trader, info, positions: positions ?? [], metrics: metrics?.metrics ?? null };
      })
    );

    let totalEquity = 0;
    let totalBalance = 0;
    let totalProfit = 0;
    const openPositions: any[] = [];
    const closedDeals: any[] = [];

    for (const { trader, info, positions, metrics } of results) {
      const eq = info?.equity ?? 0;
      const bal = info?.balance ?? 0;
      totalEquity += eq;
      totalBalance += bal;

      // Open positions
      for (const pos of positions) {
        totalProfit += pos.unrealizedProfit ?? pos.profit ?? 0;
        openPositions.push({
          id: pos.id,
          symbol: strip(pos.symbol ?? ""),
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

      // History from MetaStats dailyGrowth (always available, no 404)
      if (metrics?.dailyGrowth) {
        const rangeMs: Record<string, number> = {
          "24h": 86400000, "72h": 3 * 86400000, "7d": 7 * 86400000,
          "30d": 30 * 86400000, "all": 365 * 86400000,
        };
        const cutoff = Date.now() - (rangeMs[range] ?? 7 * 86400000);

        for (const day of metrics.dailyGrowth) {
          if (!day.date) continue;
          const ts = new Date(day.date).getTime();
          if (ts < cutoff) continue;
          if ((day.profit ?? 0) === 0 && (day.trades ?? 0) === 0) continue;

          closedDeals.push({
            id: `${trader.mtLogin}-${day.date}`,
            symbol: "XAUUSD",
            type: (day.profit ?? 0) >= 0 ? "BUY" : "SELL",
            volume: Math.round((day.lots ?? 0) * 100) / 100,
            profit: Math.round((day.profit ?? 0) * 100) / 100,
            swap: 0,
            commission: 0,
            closeTime: day.date,
            trader: trader.codename,
            traderColor: trader.color,
            pips: day.pips ?? 0,
            trades: day.trades ?? 0,
            isDaily: true,
          });
        }
      }
    }

    openPositions.sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
    closedDeals.sort((a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime());

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
