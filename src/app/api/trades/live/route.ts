export const dynamic = "force-dynamic";
// src/app/api/trades/live/route.ts — Live positions + history (MetaApi + Supabase fallback)
import { TRADER_CONFIG } from "@/lib/trader-config";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const TOKEN = process.env.METAAPI_TOKEN ?? "";
const META_PROV = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

let regionCache: Record<string, string> = {};
let regionCacheTs = 0;

async function resolveRegions(): Promise<Record<string, string>> {
  if (regionCacheTs && Date.now() - regionCacheTs < 300_000) return regionCache;
  try {
    const res = await fetch(`${META_PROV}/users/current/accounts`, {
      headers: { "auth-token": TOKEN }, signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return regionCache;
    const accounts = await res.json();
    const map: Record<string, string> = {};
    for (const a of accounts) map[a._id] = a.region || "london";
    regionCache = map;
    regionCacheTs = Date.now();
    return map;
  } catch { return regionCache; }
}

function clientBase(region: string) { return `https://mt-client-api-v1.${region}.agiliumtrade.ai`; }
function statsBase(region: string) { return `https://metastats-api-v1.${region}.agiliumtrade.ai`; }

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

    // Resolve regions + fetch MetaApi data for all traders
    const regions = await resolveRegions();
    const results = await Promise.all(
      TRADER_CONFIG.map(async (trader) => {
        const region = regions[trader.metaApiId] || "london";
        const cb = clientBase(region);
        const sb = statsBase(region);
        const [info, positions, metrics] = await Promise.all([
          metaFetch(`${cb}/users/current/accounts/${trader.metaApiId}/account-information`),
          metaFetch(`${cb}/users/current/accounts/${trader.metaApiId}/positions`),
          metaFetch(`${sb}/users/current/accounts/${trader.metaApiId}/metrics`),
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

    }

    // History: Supabase als PRIMARY (einzelne Trades, nicht Tages-Aggregate)
    const allMfxIds = TRADER_CONFIG.map(t => MFX_IDS[t.mtLogin]).filter(Boolean);
    try {
      const db = createSupabaseAdmin();
      const { data: sbTrades } = await db
        .from("trade_history")
        .select("symbol,direction,profit,commission,swap,lots,close_time,myfxbook_account_id,pips")
        .in("myfxbook_account_id", allMfxIds)
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
          volume: Math.round((t.lots ?? 0) * 100) / 100,
          profit: Math.round((t.profit ?? 0) * 100) / 100,
          swap: Math.round((t.swap ?? 0) * 100) / 100,
          commission: Math.round((t.commission ?? 0) * 100) / 100,
          closeTime: t.close_time,
          trader: traderInfo.name, traderColor: traderInfo.color,
          pips: Math.round((t.pips ?? 0) * 10) / 10, trades: 1, isDaily: false,
        });
      }
    } catch (err) {
      console.warn("[trades/live] Supabase trades failed:", err);
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
