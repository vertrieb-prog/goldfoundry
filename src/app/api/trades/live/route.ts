export const dynamic = "force-dynamic";
// src/app/api/trades/live/route.ts — Live positions + history (MetaApi + MyFXBook fallback)
import { TRADER_CONFIG } from "@/lib/trader-config";
import { NextResponse } from "next/server";

const CLIENT = "https://mt-client-api-v1.london.agiliumtrade.ai";
const STATS = "https://metastats-api-v1.london.agiliumtrade.ai";
const MYFXBOOK = "https://www.myfxbook.com/api";
const TOKEN = process.env.METAAPI_TOKEN ?? "";

// MyFXBook account ID mapping (mtLogin -> myfxbook id)
const MFX_IDS: Record<string, number> = {
  "50707464": 11992338, "50701398": 11993800, "68297968": 11994589,
  "2100151348": 11994591, "23651610": 11994594, "50715676": 11995050,
  "50713387": 11995344,
};

let mfxSession: { session: string; ts: number } | null = null;

async function getMfxSession(): Promise<string | null> {
  if (mfxSession && Date.now() - mfxSession.ts < 300_000) return mfxSession.session;
  const email = process.env.MYFXBOOK_EMAIL ?? "";
  const pw = process.env.MYFXBOOK_PASSWORD ?? "";
  if (!email || !pw) return null;
  try {
    const res = await fetch(
      `${MYFXBOOK}/login.json?email=${encodeURIComponent(email)}&password=${encodeURIComponent(pw)}`,
      { signal: AbortSignal.timeout(8000), cache: "no-store" }
    );
    const d = await res.json();
    if (d.error || !d.session) return null;
    const s = decodeURIComponent(d.session);
    mfxSession = { session: s, ts: Date.now() };
    return s;
  } catch { return null; }
}

async function fetchMfxHistory(session: string, mfxId: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${MYFXBOOK}/get-history.json?session=${encodeURIComponent(session)}&id=${mfxId}`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" }
    );
    const d = await res.json();
    return d.history ?? [];
  } catch { return []; }
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
    const cutoff = Date.now() - (rangeMs[range] ?? 7 * 86400000);

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

    // Collect accounts that need MyFXBook fallback
    const needsMfx: typeof TRADER_CONFIG = [];

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
          sl: pos.stopLoss ?? null,
          tp: pos.takeProfit ?? null,
          trader: trader.codename,
          traderColor: trader.color,
        });
      }

      // MetaStats history
      if (metrics?.dailyGrowth?.length > 0) {
        for (const day of metrics.dailyGrowth) {
          if (!day.date) continue;
          const ts = new Date(day.date).getTime();
          if (ts < cutoff) continue;
          if ((day.profit ?? 0) === 0 && (day.lots ?? 0) === 0) continue;
          closedDeals.push({
            id: `${trader.mtLogin}-${day.date}`,
            symbol: "XAUUSD", type: (day.profit ?? 0) >= 0 ? "BUY" : "SELL",
            volume: Math.round((day.lots ?? 0) * 100) / 100,
            profit: Math.round((day.profit ?? 0) * 100) / 100,
            swap: 0, commission: 0, closeTime: day.date,
            trader: trader.codename, traderColor: trader.color,
            pips: Math.round((day.pips ?? 0) * 100) / 100,
            trades: day.trades ?? 0, isDaily: true,
          });
        }
      } else {
        needsMfx.push(trader);
      }
    }

    // MyFXBook fallback for accounts without MetaStats
    if (needsMfx.length > 0) {
      const session = await getMfxSession();
      if (session) {
        await Promise.all(needsMfx.map(async (trader) => {
          const mfxId = MFX_IDS[trader.mtLogin];
          if (!mfxId) return;
          const trades = await fetchMfxHistory(session, mfxId);
          for (const t of trades) {
            const ct = t.closeTime ?? t.close_time ?? "";
            const closeDate = ct.includes("/")
              ? new Date(ct.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2"))
              : new Date(ct);
            if (isNaN(closeDate.getTime())) continue;
            if (closeDate.getTime() < cutoff) continue;
            closedDeals.push({
              id: `mfx-${trader.mtLogin}-${ct}`,
              symbol: strip(t.symbol ?? "XAUUSD"),
              type: (t.action ?? "").toUpperCase().includes("BUY") ? "BUY" : "SELL",
              volume: parseFloat(t.sizing?.value ?? "0"),
              profit: Math.round((t.profit ?? 0) * 100) / 100,
              swap: Math.round((t.interest ?? 0) * 100) / 100,
              commission: Math.round((t.commission ?? 0) * 100) / 100,
              closeTime: closeDate.toISOString(),
              trader: trader.codename, traderColor: trader.color,
              pips: t.pips ?? 0, trades: 1, isDaily: false,
            });
          }
        }));
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
