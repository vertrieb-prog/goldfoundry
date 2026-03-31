export const dynamic = "force-dynamic";
export const maxDuration = 60;
// ═══════════════════════════════════════════════════════════════
// CRON: Smart Re-Entry
// Wenn alle Trades geschlossen und Preis zurueck am Entry → nochmal rein
// Bedingungen: 30 Min seit letztem Close, gleiche Richtung, Momentum passt
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";

const log = (level: string, msg: string) =>
  console.log(`[${new Date().toISOString()}] [RE-ENTRY] [${level}] ${msg}`);

function getDefaultSlDist(symbol: string): number {
  const sym = symbol.toUpperCase();
  if (/XAU|GOLD/.test(sym)) return 5;
  if (/JPY/.test(sym)) return 0.15;
  if (/BTC/.test(sym)) return 200;
  if (/US30|NAS|US500|DE40|UK100|JP225/.test(sym)) return 25;
  if (/OIL/.test(sym)) return 0.50;
  return 0.0015;
}

function mapSymbol(symbol: string): string {
  const sym = symbol.toUpperCase().replace(/\.PRO$|\.A$|\.B$|\.M$|\.E$/, "");
  const crypto = ["BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD", "ADAUSD", "SOLUSD"];
  if (crypto.includes(sym)) return sym;
  return sym + ".pro";
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metaApiToken = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  if (!metaApiToken) return NextResponse.json({ error: "No token" }, { status: 500 });

  const db = createSupabaseAdmin();
  const reEntries: any[] = [];

  try {
    const { data: allAccounts } = await db.from("slave_accounts").select("*");
    const accounts = (allAccounts || []).filter((a: any) => a.copier_active === true);
    if (!accounts?.length) return NextResponse.json({ reEntries: [], message: "No accounts" });

    for (const account of accounts) {
      const accountId = account.metaapi_account_id;
      try {
        // 1. Check: Hat dieser Account offene managed Positionen?
        const posRes = await fetch(
          `${CLIENT_BASE}/users/current/accounts/${accountId}/positions`,
          { headers: { "auth-token": metaApiToken }, signal: AbortSignal.timeout(15000), cache: "no-store" }
        );
        if (!posRes.ok) continue;
        const positions = await posRes.json();
        const managed = (positions || []).filter(
          (p: any) => p.comment && (p.comment.startsWith("TG-Signal") || p.comment.startsWith("COPY-"))
        );

        // Nur Re-Entry wenn KEINE offenen Positionen auf diesem Account
        if (managed.length > 0) continue;

        // 2. Check: Gab es kuerzlich geschlossene Trades? (letzte 2h aus copy_events)
        const { data: recentCloses } = await db
          .from("copy_events")
          .select("symbol, direction, open_price, created_at")
          .eq("copy_account_id", accountId)
          .eq("status", "COPIED")
          .gte("created_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(5);

        if (!recentCloses?.length) continue;

        const lastClose = recentCloses[0];
        const closedAgoMs = Date.now() - new Date(lastClose.created_at).getTime();
        const closedAgoMin = closedAgoMs / 60000;

        // 3. Check: Mindestens 30 Min seit letztem Trade
        if (closedAgoMin < 30) {
          log("INFO", `${account.mt_login}: Letzter Trade vor ${closedAgoMin.toFixed(0)}min — zu frueh fuer Re-Entry`);
          continue;
        }

        // 4. Check: Aktueller Preis nahe am alten Entry?
        const symbol = mapSymbol(lastClose.symbol);
        let currentPrice = 0;
        try {
          const priceRes = await fetch(
            `${CLIENT_BASE}/users/current/accounts/${accountId}/symbols/${encodeURIComponent(symbol)}/current-price`,
            { headers: { "auth-token": metaApiToken }, signal: AbortSignal.timeout(10000) }
          );
          if (priceRes.ok) {
            const priceData = await priceRes.json();
            currentPrice = priceData.bid || priceData.ask || 0;
          }
        } catch { continue; }

        if (!currentPrice || !lastClose.open_price) continue;

        const entryPrice = Number(lastClose.open_price);
        const distFromEntry = Math.abs(currentPrice - entryPrice);
        const slDist = getDefaultSlDist(symbol);

        // Preis muss innerhalb von 50% der SL-Distanz vom alten Entry sein
        if (distFromEntry > slDist * 0.5) {
          log("INFO", `${account.mt_login}: Preis $${distFromEntry.toFixed(2)} vom Entry entfernt (max $${(slDist * 0.5).toFixed(2)}) — kein Re-Entry`);
          continue;
        }

        // 5. Check: Momentum pruefen (letzte 5 Kerzen)
        let momentumOk = true;
        try {
          const candleRes = await fetch(
            `${CLIENT_BASE}/users/current/accounts/${accountId}/historical-market-data/symbols/${encodeURIComponent(symbol)}/timeframes/5m/candles?limit=5`,
            { headers: { "auth-token": metaApiToken }, signal: AbortSignal.timeout(10000) }
          );
          if (candleRes.ok) {
            const candles = await candleRes.json();
            if (Array.isArray(candles) && candles.length >= 3) {
              const last3 = candles.slice(-3);
              const bullish = last3.filter((c: any) => c.close > c.open).length;
              const bearish = last3.filter((c: any) => c.close < c.open).length;
              const isBuy = lastClose.direction === "BUY";
              // Momentum muss MIT der Trade-Richtung sein
              if (isBuy && bearish >= 2) momentumOk = false;
              if (!isBuy && bullish >= 2) momentumOk = false;
            }
          }
        } catch {}

        if (!momentumOk) {
          log("INFO", `${account.mt_login}: Momentum gegen ${lastClose.direction} — kein Re-Entry`);
          continue;
        }

        // 6. RE-ENTRY! Gleiche Richtung, 4 Splits, 5% Risk
        log("INFO", `${account.mt_login}: RE-ENTRY ${lastClose.direction} ${symbol} @ ${currentPrice} (Entry war ${entryPrice})`);

        const isBuy = lastClose.direction === "BUY";
        const sl = isBuy ? currentPrice - slDist : currentPrice + slDist;
        const balance = Number(account.current_equity) || 10000;
        const riskAmount = balance * 0.05;
        const pipValue = /xau|gold/i.test(symbol) ? 100 : /jpy/i.test(symbol) ? 1000 : 100000;
        let totalLots = Math.max(0.01, Math.floor((riskAmount / (slDist * pipValue)) * 100) / 100);

        const splits = [
          { pct: 0.40, label: "TP1", tpMult: 1.5 },
          { pct: 0.25, label: "TP2", tpMult: 2.5 },
          { pct: 0.20, label: "TP3", tpMult: 3.5 },
          { pct: 0.15, label: "Runner", tpMult: 5.0 },
        ];

        let placed = 0;
        for (const split of splits) {
          const lots = Math.max(0.01, Math.floor(totalLots * split.pct * 100) / 100);
          const tp = isBuy
            ? Math.round((currentPrice + slDist * split.tpMult) * 100) / 100
            : Math.round((currentPrice - slDist * split.tpMult) * 100) / 100;

          const actionType = isBuy ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";
          try {
            const res = await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, {
              method: "POST",
              headers: { "auth-token": metaApiToken, "Content-Type": "application/json" },
              body: JSON.stringify({
                actionType, symbol, volume: lots,
                stopLoss: Math.round(sl * 100) / 100,
                takeProfit: tp,
                comment: `COPY-${split.label}`,
              }),
            });
            const result = await res.json();
            if (result.numericCode === 10009 || result.stringCode === "TRADE_RETCODE_DONE") placed++;
          } catch {}
        }

        log("INFO", `${account.mt_login}: RE-ENTRY ${placed}/4 Orders gesetzt (${totalLots}L total)`);
        reEntries.push({
          account: account.mt_login, symbol, direction: lastClose.direction,
          entry: currentPrice, lots: totalLots, placed,
          reason: `Preis zurueck am Entry nach ${closedAgoMin.toFixed(0)}min`,
        });
      } catch (err: any) {
        log("ERROR", `${account.mt_login}: ${err.message}`);
      }
    }

    return NextResponse.json({ reEntries, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
