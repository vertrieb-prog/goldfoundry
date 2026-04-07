export const dynamic = "force-dynamic";
export const maxDuration = 60;
// src/app/api/cron/sync-trades/route.ts — Sync all MetaApi trades to Supabase
import { TRADER_CONFIG } from "@/lib/trader-config";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MYFXBOOK = "https://www.myfxbook.com/api";

const MFX_IDS: Record<string, number> = {
  "50707464": 11992338, "50701398": 11993800, "68297968": 11994589,
  "2100151348": 11994591, "23651610": 11994594, "50715676": 11995050,
  "50713387": 11995344,
};

function strip(s: string) { return s.replace(/\.pro$/i, ""); }

async function getMfxSession(): Promise<string | null> {
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
    return decodeURIComponent(d.session);
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
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = createSupabaseAdmin();
    const session = await getMfxSession();
    if (!session) {
      return NextResponse.json({ error: "MyFXBook login failed" }, { status: 500 });
    }

    let totalSynced = 0;
    let totalSkipped = 0;
    const traderResults: any[] = [];

    for (const trader of TRADER_CONFIG) {
      const mfxId = MFX_IDS[trader.mtLogin];
      if (!mfxId) continue;

      const trades = await fetchMfxHistory(session, mfxId);
      let synced = 0;
      let skipped = 0;

      for (const t of trades) {
        const ct = t.closeTime ?? t.close_time ?? "";
        const ot = t.openTime ?? t.open_time ?? "";
        const closeDate = parseMfxDate(ct);
        const openDate = parseMfxDate(ot);
        if (!closeDate) continue;

        const tradeId = `${mfxId}_${ot}_${t.symbol ?? "UNKNOWN"}`;

        const row = {
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
          raw_data: { ...t, trader: trader.codename, traderColor: trader.color },
        };

        const { error } = await db
          .from("trade_history")
          .upsert(row, { onConflict: "trade_id" });

        if (error) {
          skipped++;
        } else {
          synced++;
        }
      }

      totalSynced += synced;
      totalSkipped += skipped;
      traderResults.push({
        trader: trader.codename,
        mfxId,
        fetched: trades.length,
        synced,
        skipped,
      });
    }

    console.log(`[sync-trades] Done: ${totalSynced} synced, ${totalSkipped} skipped`);

    return NextResponse.json({
      success: true,
      totalSynced,
      totalSkipped,
      traders: traderResults,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[sync-trades]", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
