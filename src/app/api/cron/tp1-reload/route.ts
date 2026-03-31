export const dynamic = "force-dynamic";
export const maxDuration = 60;
// ═══════════════════════════════════════════════════════════════
// TP1 RELOAD — Einfach:
// TP1 hit + Preis bounced zurueck → 1 Order, gleiche Lots, Ziel TP1
// Die restlichen (TP2/TP3/Runner) laufen einfach weiter.
// Max 1 Reload pro Signal. Enger SL ($3 Gold).
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";

const log = (level: string, msg: string) =>
  console.log(`[${new Date().toISOString()}] [RELOAD] [${level}] ${msg}`);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const metaApiToken = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  if (!metaApiToken) return NextResponse.json({ error: "No token" }, { status: 500 });

  const db = createSupabaseAdmin();
  const reloads: any[] = [];

  try {
    // News Check
    const { data: news } = await db.from("economic_calendar")
      .select("title").lte("event_time", new Date(Date.now() + 15 * 60000).toISOString())
      .gte("event_time", new Date().toISOString()).in("tier", [0, 1]);
    if ((news?.length || 0) > 0) {
      return NextResponse.json({ reloads: [], message: "News — kein Reload" });
    }

    const { data: allAccounts } = await db.from("slave_accounts").select("*");
    const accounts = (allAccounts || []).filter((a: any) => a.copier_active === true);
    if (!accounts?.length) return NextResponse.json({ reloads: [] });

    for (const account of accounts) {
      const accountId = account.metaapi_account_id;
      try {
        const posRes = await fetch(
          `${CLIENT_BASE}/users/current/accounts/${accountId}/positions`,
          { headers: { "auth-token": metaApiToken }, signal: AbortSignal.timeout(15000), cache: "no-store" }
        );
        if (!posRes.ok) continue;
        const positions = await posRes.json();
        if (!Array.isArray(positions)) continue;

        // Originale (ohne RELOAD)
        const originals = positions.filter(
          (p: any) => p.comment && (p.comment.startsWith("TG-Signal") || p.comment.startsWith("COPY-")) && !p.comment.includes("RELOAD")
        );
        // Existierende Reloads
        const hasReload = positions.some((p: any) => p.comment?.includes("RELOAD"));

        // Gruppiere nach Symbol+Richtung
        const groups = new Map<string, any[]>();
        for (const pos of originals) {
          const dir = pos.type?.replace("POSITION_TYPE_", "") || "?";
          const key = `${pos.symbol}-${dir}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(pos);
        }

        for (const [groupKey, groupPos] of groups) {
          if (!groupPos?.length) continue;
          const remaining = groupPos.length;
          const isBuy = groupPos[0].type === "POSITION_TYPE_BUY";
          const symbol = groupPos[0].symbol;
          const entry = groupPos[0].openPrice;
          const currentPrice = groupPos[0].currentPrice;
          const originalSL = groupPos[0].stopLoss;
          if (!entry || !currentPrice) continue;

          // === BEDINGUNGEN ===
          // 1. TP1 muss getroffen sein (weniger als 4 Originale)
          if (remaining >= 4) continue;

          // 2. Kein Reload fuer dieses Symbol aktiv
          if (hasReload) continue;

          // 3. Preis muss zurueck in Entry-Zone sein (±$1 Gold)
          const distFromEntry = Math.abs(currentPrice - entry);
          const zone = /xau|gold/i.test(symbol) ? 1.0 : 0.002;
          if (distFromEntry > zone) continue;

          // 4. Trade muss mindestens 3 Min alt sein
          const ageMin = groupPos[0].time ? (Date.now() - new Date(groupPos[0].time).getTime()) / 60000 : 999;
          if (ageMin < 3) continue;

          // 5. Momentum: nicht alle 3 Kerzen gegen uns
          let momentumOk = true;
          try {
            const cRes = await fetch(
              `${CLIENT_BASE}/users/current/accounts/${accountId}/historical-market-data/symbols/${encodeURIComponent(symbol)}/timeframes/5m/candles?limit=5`,
              { headers: { "auth-token": metaApiToken }, signal: AbortSignal.timeout(10000) }
            );
            if (cRes.ok) {
              const candles = await cRes.json();
              if (Array.isArray(candles) && candles.length >= 3) {
                const last3 = candles.slice(-3);
                const against = isBuy
                  ? last3.filter((c: any) => c.close < c.open).length
                  : last3.filter((c: any) => c.close > c.open).length;
                if (against >= 3) momentumOk = false;
              }
            }
          } catch {}
          if (!momentumOk) continue;

          // === 1 ORDER: Gleiche Lots wie TP1 (40% vom Total) ===
          // TP1 war die groesste Position (40%). Wir nehmen die durchschnittliche Lot-Groesse
          // der verbleibenden Positionen als Referenz fuer die Original-Gesamtgroesse.
          const avgLot = groupPos.reduce((s: number, p: any) => s + p.volume, 0) / remaining;
          // Original Total war ungefaehr: remaining positions / ihre Anteile
          // TP1 = 40%, also TP1-Lots = Gesamt × 0.4
          // Einfacher: wir nehmen die groesste verbleibende Position als Referenz
          const maxLot = Math.max(...groupPos.map((p: any) => p.volume));
          const reloadLots = Math.max(0.01, maxLot); // Gleiche Groesse wie groesster Split

          // TP1 = naehstes TP der verbleibenden Positionen
          const tps = groupPos.map((p: any) => p.takeProfit).filter(Boolean);
          const tp1Target = isBuy
            ? Math.min(...tps.filter((t: number) => t > entry))  // Naehstes TP ueber Entry
            : Math.max(...tps.filter((t: number) => t < entry)); // Naehstes TP unter Entry

          if (!tp1Target || !isFinite(tp1Target)) continue;

          // SL: $3 fuer Gold, eng
          const reloadSL = isBuy ? currentPrice - 3 : currentPrice + 3;

          log("INFO", `${account.mt_login} ${groupKey}: RELOAD 1 Order ${reloadLots}L → TP ${tp1Target} (Preis ${currentPrice} nah an Entry ${entry})`);

          // Platziere 1 Order
          const actionType = isBuy ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";
          try {
            const res = await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, {
              method: "POST",
              headers: { "auth-token": metaApiToken, "Content-Type": "application/json" },
              body: JSON.stringify({
                actionType, symbol, volume: reloadLots,
                stopLoss: Math.round(reloadSL * 100) / 100,
                takeProfit: Math.round(tp1Target * 100) / 100,
                comment: "COPY-TP1-RELOAD",
              }),
            });
            const result = await res.json();
            if (result.numericCode === 10009 || result.stringCode === "TRADE_RETCODE_DONE") {
              log("INFO", `${account.mt_login}: RELOAD GESETZT ${reloadLots}L ${isBuy?"BUY":"SELL"} ${symbol} TP:${tp1Target} SL:${Math.round(reloadSL*100)/100}`);
              reloads.push({ account: account.mt_login, symbol, direction: isBuy?"BUY":"SELL", lots: reloadLots, tp: tp1Target, sl: Math.round(reloadSL*100)/100 });
            } else {
              log("WARN", `Reload fehlgeschlagen: ${result.stringCode || result.message}`);
            }
          } catch (e: any) {
            log("WARN", `Reload Fehler: ${e.message}`);
          }
        }
      } catch (err: any) {
        log("ERROR", `${account.mt_login}: ${err.message}`);
      }
    }

    return NextResponse.json({ reloads, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
