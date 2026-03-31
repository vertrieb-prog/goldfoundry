export const dynamic = "force-dynamic";
export const maxDuration = 300;
// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — R-Multiple + ATR + TP-Hit Hybrid Position Manager
// Forschungsbasiert: Van Tharp R-Multiple, Chandelier Exit (3x ATR),
// TP-Hit Floor System. Optimiert fuer XAUUSD Copy Trading.
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";

const log = (level: string, msg: string) =>
  console.log(`[${new Date().toISOString()}] [POS-MGR] [${level}] ${msg}`);

async function metaApiFetch(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "auth-token": token, "Content-Type": "application/json", ...(options?.headers ?? {}) },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text();
    let msg = `MetaApi ${res.status}`;
    try { msg = JSON.parse(body).message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// === ATR BERECHNUNG aus Candle-Daten ===
function calcATR(candles: any[]): number {
  if (!candles?.length) return 0;
  const ranges = candles.map((c: any) => Math.abs(c.high - c.low));
  return ranges.reduce((s, r) => s + r, 0) / ranges.length;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const metaApiToken = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  if (!metaApiToken) return NextResponse.json({ error: "No MetaApi token" }, { status: 500 });

  const db = createSupabaseAdmin();
  const modifications: any[] = [];

  try {
    // News Check
    const { data: upcomingNews } = await db
      .from("economic_calendar")
      .select("title, tier, event_time")
      .lte("event_time", new Date(Date.now() + 15 * 60000).toISOString())
      .gte("event_time", new Date().toISOString())
      .in("tier", [0, 1]);
    const hasNews = (upcomingNews?.length || 0) > 0;
    if (hasNews) log("WARN", `News in 15min — Trail verengen`);

    // Alle Accounts (JS-Filter wegen Supabase Bug)
    const { data: allAccounts } = await db.from("slave_accounts").select("*");
    const accounts = (allAccounts || []).filter((a: any) => a.copier_active === true);
    if (!accounts?.length) return NextResponse.json({ message: "No active accounts", modifications: [] });

    for (const account of accounts) {
      const accountId = account.metaapi_account_id;
      try {
        // Positionen holen (kein Cache)
        const posRes = await fetch(
          `${CLIENT_BASE}/users/current/accounts/${accountId}/positions`,
          { headers: { "auth-token": metaApiToken }, signal: AbortSignal.timeout(15000), cache: "no-store" }
        );
        if (!posRes.ok) continue;
        const positions = await posRes.json();
        if (!Array.isArray(positions) || !positions.length) continue;

        const managed = positions.filter(
          (p: any) => p.comment && (p.comment.startsWith("TG-Signal") || p.comment.startsWith("COPY-"))
        );
        if (!managed.length) continue;

        // === GRUPPIERE nach Symbol+Richtung ===
        const groups = new Map<string, any[]>();
        for (const pos of managed) {
          const dir = pos.type?.replace("POSITION_TYPE_", "") || "?";
          const key = `${pos.symbol}-${dir}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(pos);
        }

        for (const [groupKey, groupPos] of groups) {
          const remaining = groupPos.length;
          const isBuy = groupPos[0].type === "POSITION_TYPE_BUY";
          const symbol = groupPos[0].symbol;
          const entry = groupPos[0].openPrice;
          const originalSL = groupPos[0].stopLoss;
          const currentPrice = groupPos[0].currentPrice;
          if (!entry || !currentPrice) continue;

          // 1R = Original Risk (Entry bis SL)
          const oneR = originalSL ? Math.abs(entry - originalSL) : 5; // Default $5 fuer Gold
          const profitDist = isBuy ? currentPrice - entry : entry - currentPrice;
          const rMultiple = oneR > 0 ? profitDist / oneR : 0;

          // ATR + Momentum aus EINEM API-Call (14 Candles, 5min)
          let atr = oneR; // Fallback: 1R als ATR
          let momentum: "WITH" | "NEUTRAL" | "AGAINST" = "NEUTRAL";
          let speed = 1.0;
          try {
            const candles = await metaApiFetch(
              `${CLIENT_BASE}/users/current/accounts/${accountId}/historical-market-data/symbols/${encodeURIComponent(symbol)}/timeframes/5m/candles?limit=14`,
              metaApiToken
            );
            if (Array.isArray(candles) && candles.length >= 5) {
              // ATR aus allen 14 Kerzen
              atr = calcATR(candles);
              // Momentum: nur GESCHLOSSENE Kerzen (letzte weglassen — formt sich noch)
              const closed = candles.slice(-4, -1);
              const bull = closed.filter((c: any) => c.close > c.open).length;
              const bear = closed.filter((c: any) => c.close < c.open).length;
              if (isBuy) momentum = bull >= 2 ? "WITH" : bear >= 2 ? "AGAINST" : "NEUTRAL";
              else momentum = bear >= 2 ? "WITH" : bull >= 2 ? "AGAINST" : "NEUTRAL";
              // Speed: letzte 3 vs Durchschnitt
              const ranges = candles.map((c: any) => Math.abs(c.high - c.low));
              const avg = ranges.reduce((s: number, r: number) => s + r, 0) / ranges.length;
              const recent = candles.slice(-3).reduce((s: number, c: any) => s + Math.abs(c.high - c.low), 0) / 3;
              speed = avg > 0 ? recent / avg : 1.0;
            }
          } catch {}

          // Trail-Distanz: ATR-basiert, mit News-Anpassung
          const atrMult = hasNews ? 1.0 : 2.0; // Bei News: enger, sonst Standard
          const trailDist = Math.max(atr * atrMult, oneR * 0.3); // Nie enger als 30% von 1R

          log("INFO", `${account.mt_login} ${groupKey}: ${remaining} Pos | ${rMultiple.toFixed(1)}R | ATR:$${atr.toFixed(2)} | ${momentum} | Speed:${speed.toFixed(1)}x`);

          // === R-MULTIPLE + TP-HIT FLOOR SYSTEM ===
          // Floor = absolutes Minimum SL (geht nur in Profit-Richtung)
          // Trail = dynamischer SL basierend auf ATR
          // Effektiver SL = das BESSERE von Floor und Trail

          let floor: number;
          if (remaining >= 4) {
            // Alle 4 Splits offen — KEIN Floor, Original-SL
            floor = originalSL || (isBuy ? entry - oneR : entry + oneR);
          } else if (remaining === 3) {
            // TP1 hit → Floor auf Entry (kein Puffer — Forschung zeigt BE-Puffer killt Trades)
            floor = entry;
          } else if (remaining === 2) {
            // TP2 hit → Floor auf Entry + 1R (1x Risk als Profit gesichert)
            floor = isBuy ? entry + oneR : entry - oneR;
          } else {
            // TP3 hit, Runner → Floor auf Entry + 2R
            floor = isBuy ? entry + oneR * 2 : entry - oneR * 2;
          }

          // Continuous ATR Trail (nur wenn im Profit)
          let trail = isBuy ? currentPrice - trailDist : currentPrice + trailDist;

          // Momentum-Anpassung: AGAINST → enger, WITH → lockerer
          if (momentum === "AGAINST") {
            trail = isBuy ? currentPrice - trailDist * 0.6 : currentPrice + trailDist * 0.6;
          } else if (momentum === "WITH") {
            trail = isBuy ? currentPrice - trailDist * 1.3 : currentPrice + trailDist * 1.3;
          }

          // Effektiver SL = das Bessere von Floor und Trail
          let effectiveSL: number;
          if (isBuy) {
            effectiveSL = Math.max(floor, trail); // Hoeher = besser fuer BUY
          } else {
            effectiveSL = Math.min(floor, trail); // Niedriger = besser fuer SELL
          }

          // Nur Trail wenn im Profit (rMultiple > 0) und nicht FRESH
          const ageMin = groupPos[0].time ? (Date.now() - new Date(groupPos[0].time).getTime()) / 60000 : 999;
          if (rMultiple <= 0 || ageMin < 2) {
            effectiveSL = originalSL || (isBuy ? entry - oneR : entry + oneR);
          }

          // === EXIT ENTSCHEIDUNGEN (vor SL-Trail) ===

          // CRITICAL: >70% zum SL + Momentum AGAINST → Emergency Close
          if (rMultiple < -0.7 && momentum === "AGAINST") {
            for (const pos of groupPos) {
              try {
                await metaApiFetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, metaApiToken, {
                  method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: pos.id }),
                });
                log("INFO", `NOTFALL-CLOSE ${symbol} ${pos.id}: ${rMultiple.toFixed(1)}R + AGAINST`);
                modifications.push({ symbol, posId: pos.id, action: "emergency_close", rMultiple: +rMultiple.toFixed(2) });
              } catch (e: any) { log("WARN", `Close fehlgeschlagen: ${e.message}`); }
            }
            continue; // Naechste Gruppe
          }

          // SPEED CLOSE: Im Profit + schnelle Umkehr → sofort raus
          if (rMultiple > 0.5 && momentum === "AGAINST" && speed > 1.5) {
            for (const pos of groupPos) {
              try {
                await metaApiFetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, metaApiToken, {
                  method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: pos.id }),
                });
                log("INFO", `SPEED-CLOSE ${symbol} ${pos.id}: ${rMultiple.toFixed(1)}R + Speed ${speed.toFixed(1)}x`);
                modifications.push({ symbol, posId: pos.id, action: "speed_close", rMultiple: +rMultiple.toFixed(2), speed });
              } catch (e: any) { log("WARN", `Speed-Close fehlgeschlagen: ${e.message}`); }
            }
            continue;
          }

          // TIME DECAY: Runner > 4h ohne neues Hoch → schliessen
          if (remaining === 1 && ageMin > 240 && rMultiple > 0) {
            const pos = groupPos[0];
            try {
              await metaApiFetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, metaApiToken, {
                method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: pos.id }),
              });
              log("INFO", `TIME-DECAY ${symbol} ${pos.id}: Runner > 4h, ${rMultiple.toFixed(1)}R`);
              modifications.push({ symbol, posId: pos.id, action: "time_decay", rMultiple: +rMultiple.toFixed(2), ageMin: +ageMin.toFixed(0) });
            } catch (e: any) { log("WARN", `Time-Decay fehlgeschlagen: ${e.message}`); }
            continue;
          }

          // === SL MODIFICATION (fuer alle Positionen der Gruppe) ===
          const newSL = Math.round(effectiveSL * 100) / 100;

          for (const pos of groupPos) {
            const currentSL = pos.stopLoss || 0;
            const isBetter = isBuy
              ? newSL > currentSL + 0.1  // BUY: neuer SL hoeher als alter
              : currentSL === 0 ? true : newSL < currentSL - 0.1; // SELL: neuer SL niedriger (oder kein SL gesetzt)
            const notTooClose = Math.abs(currentPrice - newSL) >= Math.max(atr * 0.3, 0.5); // Min 30% ATR oder $0.50

            if (isBetter && notTooClose) {
              try {
                await metaApiFetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, metaApiToken, {
                  method: "POST",
                  body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: pos.id, stopLoss: newSL, takeProfit: pos.takeProfit ?? undefined }),
                });
                log("INFO", `SL-TRAIL ${symbol} ${pos.id}: ${currentSL}→${newSL} | ${rMultiple.toFixed(1)}R | Floor:${Math.round(floor*100)/100} | Trail:${Math.round(trail*100)/100} | ${remaining}pos | ${momentum}`);
                modifications.push({ symbol, posId: pos.id, action: "sl_trail", oldSL: currentSL, newSL, rMultiple: +rMultiple.toFixed(2), remaining, momentum });
              } catch (e: any) { log("WARN", `SL-Trail fehlgeschlagen: ${e.message}`); }
            }
          }
        }
      } catch (err: any) {
        log("ERROR", `Account ${accountId}: ${err.message}`);
      }
    }

    log("INFO", `Fertig. ${modifications.length} Aktion(en).`);
    return NextResponse.json({ modifications, timestamp: new Date().toISOString() });
  } catch (err: any) {
    log("ERROR", `Fehler: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
