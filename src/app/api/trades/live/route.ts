export const dynamic = "force-dynamic";
// src/app/api/trades/live/route.ts — Live positions + history (MetaApi + Supabase fallback)
import { TRADER_CONFIG } from "@/lib/trader-config";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const CLIENT = "https://mt-client-api-v1.london.agiliumtrade.ai";
const STATS = "https://metastats-api-v1.london.agiliumtrade.ai";
const TOKEN = process.env.METAAPI_TOKEN ?? "";

const MFX_IDS: Record<string, string> = {
  "50707464": "11992338", "50701398": "11993800", "68297968": "11994589",
  "2100151348": "11994591", "23651610": "11994594", "50715676": "11995050",
  "50713387": "11995344",
};

const TRADER_BY_MFX: Record<string, { name: string; color: string }> = {};
for (const t of TRADER_CONFIG) {
  const mfxId = MFX_IDS[t.mtLogin];
  if (mfxId) TRADER_BY_MFX[mfxId] = { name: t.codename, color: t.color };
}

async function metaFetch(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "auth-token": TOKEN }, cache: "no-store",
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
    const rangeMs: Record<string, number> = {
      "24h": 86400000, "72h": 3 * 86400000, "7d": 7 * 86400000,
      "30d": 30 * 86400000, "all": 365 * 86400000,
    };
    const cutoff = new Date(Date.now() - (rangeMs[range] ?? 7 * 86400000));

    // Fetch MetaApi data for all traders
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

    let totalEquity = 0, totalBalance = 0, totalProfit = 0;
    const openPositions: any[] = [];
    const closedDeals: any[] = [];
    const tradersWithMetaStats = new Set<string>();

    for (const { trader, info, positions, metrics } of results) {
      const eq = info?.equity ?? 0;
      const bal = info?.balance ?? 0;
      totalEquity += eq;
      totalBalance += bal;

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
          sl: pos.stopLoss ?? null, tp: pos.takeProfit ?? null,
          trader: trader.codename, traderColor: trader.color,
        });
      }

      // MetaStats daily history
      if (metrics?.dailyGrowth?.length > 0) {
        tradersWithMetaStats.add(trader.mtLogin);
        for (const day of metrics.dailyGrowth) {
          if (!day.date) continue;
          if (new Date(day.date) < cutoff) continue;
          if ((day.profit ?? 0) === 0 && (day.lots ?? 0) === 0) continue;
          closedDeals.push({
            id: `ms-${trader.mtLogin}-${day.date.substring(0, 10)}`,
            symbol: "XAUUSD", type: (day.profit ?? 0) >= 0 ? "BUY" : "SELL",
            volume: Math.round((day.lots ?? 0) * 100) / 100,
            profit: Math.round((day.profit ?? 0) * 100) / 100,
            swap: 0, commission: 0, closeTime: day.date,
            trader: trader.codename, traderColor: trader.color,
            pips: Math.round((day.pips ?? 0) * 100) / 100,
            trades: day.trades ?? 0, isDaily: true,
          });
        }
      }
    }

    // Supabase fallback for traders without MetaStats
    const missingMfxIds = TRADER_CONFIG
      .filter(t => !tradersWithMetaStats.has(t.mtLogin))
      .map(t => MFX_IDS[t.mtLogin])
      .filter(Boolean);

    if (missingMfxIds.length > 0) {
      try {
        const db = createSupabaseAdmin();
        const { data: sbTrades } = await db
          .from("trade_history")
          .select("symbol,direction,profit,commission,swap,lots,close_time,myfxbook_account_id,pips,raw_data")
          .in("myfxbook_account_id", missingMfxIds)
          .eq("status", "closed")
          .gte("close_time", cutoff.toISOString())
          .order("close_time", { ascending: false })
          .limit(200);

        for (const t of sbTrades ?? []) {
          const traderInfo = TRADER_BY_MFX[t.myfxbook_account_id] ?? { name: "UNKNOWN", color: "#888" };
          closedDeals.push({
            id: `sb-${t.myfxbook_account_id}-${t.close_time}`,
            symbol: strip(t.symbol ?? ""),
            type: (t.direction ?? "").toUpperCase().includes("BUY") ? "BUY" : "SELL",
            volume: t.lots ?? 0,
            profit: Math.round((t.profit ?? 0) * 100) / 100,
            swap: Math.round((t.swap ?? 0) * 100) / 100,
            commission: Math.round((t.commission ?? 0) * 100) / 100,
            closeTime: t.close_time,
            trader: traderInfo.name, traderColor: traderInfo.color,
            pips: t.pips ?? 0, trades: 1, isDaily: false,
          });
        }
      } catch (err) {
        console.warn("[trades/live] Supabase fallback failed:", err);
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
