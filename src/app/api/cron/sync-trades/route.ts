export const dynamic = "force-dynamic";
export const maxDuration = 60;
// src/app/api/cron/sync-trades/route.ts — Sync trades to Supabase (MetaStats first, MyFXBook fallback)
import { TRADER_CONFIG } from "@/lib/trader-config";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const STATS = "https://metastats-api-v1.london.agiliumtrade.ai";
const META_TOKEN = process.env.METAAPI_TOKEN ?? "";
const MYFXBOOK = "https://www.myfxbook.com/api";

const MFX_IDS: Record<string, number> = {
  "50707464": 11992338, "50701398": 11993800, "68297968": 11994589,
  "2100151348": 11994591, "23651610": 11994594, "50715676": 11995050,
  "50713387": 11995344,
};

function strip(s: string) { return s.replace(/\.pro$/i, ""); }

// ---------- MetaStats ----------

async function fetchMetaStatsTrades(metaApiId: string): Promise<any[] | null> {
  try {
    const res = await fetch(
      `${STATS}/users/current/accounts/${metaApiId}/open-trades`,
      { headers: { "auth-token": META_TOKEN }, signal: AbortSignal.timeout(12000), cache: "no-store" }
    );
    // Try the trades list from metrics
    const metricsRes = await fetch(
      `${STATS}/users/current/accounts/${metaApiId}/metrics`,
      { headers: { "auth-token": META_TOKEN }, signal: AbortSignal.timeout(12000), cache: "no-store" }
    );
    if (!metricsRes.ok) return null;
    const data = await metricsRes.json();
    const m = data?.metrics;
    if (!m || !m.trades || m.trades === 0) return null;
    // MetaStats has trade data but not individual trades list via this endpoint
    // We use currencySummary + dailyGrowth to reconstruct
    return m.dailyGrowth ?? null;
  } catch { return null; }
}

// ---------- MyFXBook ----------

let mfxSessionCache: { session: string; ts: number } | null = null;

async function getMfxSession(): Promise<string | null> {
  if (mfxSessionCache && Date.now() - mfxSessionCache.ts < 300_000) return mfxSessionCache.session;
  const email = process.env.MYFXBOOK_EMAIL ?? "";
  const pw = process.env.MYFXBOOK_PASSWORD ?? "";
  if (!email || !pw) return null;
  try {
    const res = await fetch(
      `${MYFXBOOK}/login.json?email=${encodeURIComponent(email)}&password=${encodeURIComponent(pw)}`,
      { signal: AbortSignal.timeout(10000), cache: "no-store" }
    );
    const d = await res.json();
    if (d.error || !d.session) return null;
    const s = decodeURIComponent(d.session);
    mfxSessionCache = { session: s, ts: Date.now() };
    return s;
  } catch { return null; }
}

async function fetchMfxHistory(session: string, mfxId: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${MYFXBOOK}/get-history.json?session=${encodeURIComponent(session)}&id=${mfxId}`,
      { signal: AbortSignal.timeout(15000), cache: "no-store" }
    );
    const d = await res.json();
    return d.history ?? [];
  } catch { return []; }
}

function parseMfxDate(ct: string): Date | null {
  if (!ct) return null;
  if (ct.includes("/")) {
    const d = new Date(ct.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2"));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(ct);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = createSupabaseAdmin();
    let totalSynced = 0;
    let totalSkipped = 0;
    const traderResults: any[] = [];
    let mfxSession: string | null = null;

    for (const trader of TRADER_CONFIG) {
      let source = "none";
      let synced = 0;
      let skipped = 0;
      let fetched = 0;

      // 1. Try MetaStats first
      const metaTrades = await fetchMetaStatsTrades(trader.metaApiId);
      if (metaTrades && metaTrades.length > 0) {
        source = "metastats";
        fetched = metaTrades.length;
        for (const day of metaTrades) {
          if (!day.date || ((day.profit ?? 0) === 0 && (day.lots ?? 0) === 0)) continue;
          const tradeId = `metastats_${trader.mtLogin}_${day.date.substring(0, 10)}`;
          const { error } = await db.from("trade_history").upsert({
            myfxbook_account_id: MFX_IDS[trader.mtLogin]?.toString() ?? trader.mtLogin,
            trade_id: tradeId,
            symbol: "XAUUSD",
            direction: (day.profit ?? 0) >= 0 ? "buy" : "sell",
            open_time: day.date,
            close_time: day.date,
            open_price: 0,
            close_price: 0,
            lots: day.lots ?? 0,
            pips: day.pips ?? 0,
            profit: day.profit ?? 0,
            commission: 0,
            swap: 0,
            status: "closed",
            raw_data: { ...day, source: "metastats", trader: trader.codename },
          }, { onConflict: "trade_id" });
          if (error) skipped++; else synced++;
        }
      }

      // 2. Fallback to MyFXBook if MetaStats empty
      if (source === "none") {
        const mfxId = MFX_IDS[trader.mtLogin];
        if (mfxId) {
          if (!mfxSession) mfxSession = await getMfxSession();
          if (mfxSession) {
            source = "myfxbook";
            const trades = await fetchMfxHistory(mfxSession, mfxId);
            fetched = trades.length;
            for (const t of trades) {
              const ct = t.closeTime ?? t.close_time ?? "";
              const ot = t.openTime ?? t.open_time ?? "";
              const closeDate = parseMfxDate(ct);
              const openDate = parseMfxDate(ot);
              if (!closeDate) continue;
              const tradeId = `${mfxId}_${ot}_${strip(t.symbol ?? "UNKNOWN")}`;
              const { error } = await db.from("trade_history").upsert({
                myfxbook_account_id: String(mfxId),
                trade_id: tradeId,
                symbol: strip(t.symbol ?? ""),
                direction: (t.action ?? "").toLowerCase(),
                open_time: openDate?.toISOString() ?? null,
                close_time: closeDate.toISOString(),
                open_price: parseFloat(t.openPrice ?? "0"),
                close_price: parseFloat(t.closePrice ?? "0"),
                lots: parseFloat(t.sizing?.value ?? "0"),
                pips: t.pips ?? 0,
                profit: t.profit ?? 0,
                commission: t.commission ?? 0,
                swap: t.interest ?? 0,
                status: "closed",
                raw_data: { ...t, source: "myfxbook", trader: trader.codename },
              }, { onConflict: "trade_id" });
              if (error) skipped++; else synced++;
            }
          }
        }
      }

      totalSynced += synced;
      totalSkipped += skipped;
      traderResults.push({
        trader: trader.codename, source, fetched, synced, skipped,
      });
    }

    console.log(`[sync-trades] ${totalSynced} synced, ${totalSkipped} skipped`);
    return NextResponse.json({
      success: true, totalSynced, totalSkipped,
      traders: traderResults,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[sync-trades]", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
