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

        // Originale fuer Floor-System (OHNE Reload)
        const originals = positions.filter(
          (p: any) => p.comment && (p.comment.startsWith("TG-Signal") || p.comment.startsWith("COPY-")) && !p.comment.includes("RELOAD")
        );
        // RELOAD Positionen: werden AUCH getrailt aber nicht im Floor-Count
        const reloadPositions = positions.filter(
          (p: any) => p.comment?.includes("RELOAD")
        );
        // Alle managed = Originale (fuer Gruppierung) + Reloads (fuer separates Trail)
        const managed = originals;
        if (!managed.length) continue;

        // === GRUPPIERE nach Symbol+Richtung ===
        const groups = new Map<string, any[]>();
        for (const pos of managed) {
          const dir = pos.type?.replace("POSITION_TYPE_", "") || "?";
          const key = `${pos.symbol}-${dir}-${Math.round(pos.openPrice * 10)}`; // Gruppen nach Entry-Preis (verhindert Vermischung bei 2 Signalen auf gleichem Symbol)
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(pos);
        }

        for (const [groupKey, groupPos] of groups) {
          if (!groupPos?.length) continue; // Safety: leere Gruppe ueberspringen
          const remaining = groupPos.length;
          const isBuy = groupPos[0].type === "POSITION_TYPE_BUY";
          const symbol = groupPos[0].symbol;
          const entry = groupPos[0].openPrice;
          const originalSL = groupPos[0].stopLoss;
          const currentPrice = groupPos[0].currentPrice;
          if (!entry || !currentPrice) continue;

          // 1R = Original Risk (Entry bis SL)
          let oneR = originalSL ? Math.abs(entry - originalSL) : 5; // Default $5 fuer Gold
          if (oneR < 0.5) { log("WARN", `${groupKey}: 1R zu klein (${oneR}), Default 5`); oneR = 5; }
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

          log("INFO", `${account.mt_login} ${groupKey}: ${remaining} Pos | ${rMultiple.toFixed(1)}R | ATR:$${atr.toFixed(2)} | ${momentum} | Speed:${speed.toFixed(1)}x`);

          // === HYBRID F: Floor + ATR Trail + Clamp + Ratchet ===
          // Forschungsbasiert: Floor garantiert Minimum, ATR-Trail faengt Profit ein
          // Clamp: SL NIE ueber/unter Preis. Ratchet: SL geht nur in Profit-Richtung.

          // Phase-spezifische Parameter
          let floorR: number;    // Floor als R-Multiple von Entry
          let atrMultPhase: number; // ATR Multiplikator fuer Trail
          let minDist: number;   // Minimum-Abstand vom Preis (Broker-Schutz)

          if (remaining >= 4) {
            // PHASE 0: Alle offen — Trail TROTZDEM wenn im Profit!
            // Floor bleibt Original SL, aber ATR-Trail startet ab 0.5R Profit
            floorR = -1; // Original SL als Floor
            atrMultPhase = rMultiple >= 0.3 ? 1.5 : 0; // Trail ab 0.3R Profit (war 0.5 — zu spaet)
            minDist = /xau|gold/i.test(symbol) ? 1.5 : 0.003;
          } else if (remaining === 3) {
            // PHASE 1: TP1 hit → Floor auf Entry, aggressiver Trail
            floorR = 0;
            atrMultPhase = 1.5; // 1.5x ATR (war 2.0 — enger fuer schnelleres Nachziehen)
            minDist = /xau|gold/i.test(symbol) ? 1.5 : 0.003;
          } else if (remaining === 2) {
            // PHASE 2: TP2 hit → Floor auf +0.5R, noch enger
            floorR = 0.5;
            atrMultPhase = 1.2; // 1.2x ATR (war 1.5)
            minDist = /xau|gold/i.test(symbol) ? 1.0 : 0.002;
          } else {
            // PHASE 3: Runner → Floor auf +1R, engster Trail
            floorR = 1.0;
            atrMultPhase = 0.8; // 0.8x ATR (war 1.0 — Runner braucht engen Trail)
            minDist = /xau|gold/i.test(symbol) ? 0.8 : 0.001;
          }

          const ageMin = groupPos[0].time ? (Date.now() - new Date(groupPos[0].time).getTime()) / 60000 : 999;

          // FRESH oder im Verlust → Original SL behalten
          if (rMultiple <= 0 || ageMin < 2 || atrMultPhase === 0) {
            // KEIN Trail — original SL behalten
            // Trotzdem Exits pruefen (weiter unten)
          } else {
            // === FLOOR berechnen ===
            const floor = isBuy ? entry + oneR * floorR : entry - oneR * floorR;

            // === ATR TRAIL berechnen (bei News 30% enger) ===
            const newsAdjust = hasNews ? 0.7 : 1.0;
            const phaseTrailDist = Math.max(atr * atrMultPhase * newsAdjust, oneR * 0.3);
            let trail: number;
            if (momentum === "AGAINST") {
              trail = isBuy ? currentPrice - phaseTrailDist * 0.6 : currentPrice + phaseTrailDist * 0.6;
            } else if (momentum === "WITH") {
              trail = isBuy ? currentPrice - phaseTrailDist * 1.3 : currentPrice + phaseTrailDist * 1.3;
            } else {
              trail = isBuy ? currentPrice - phaseTrailDist : currentPrice + phaseTrailDist;
            }

            // === EFFECTIVE SL = max(Floor, Trail) fuer BUY, min fuer SELL ===
            let effectiveSL = isBuy ? Math.max(floor, trail) : Math.min(floor, trail);

            // === CLAMP: SL darf NIE auf der falschen Seite vom Preis sein ===
            if (isBuy) effectiveSL = Math.min(effectiveSL, currentPrice - minDist);
            else effectiveSL = Math.max(effectiveSL, currentPrice + minDist);

            // === ROUNDING ===
            const newSL = Math.round(effectiveSL * 100) / 100;

            // === RATCHET: SL geht nur in Profit-Richtung ===
            for (const pos of groupPos) {
              const currentSL = pos.stopLoss || 0;
              const isBetter = isBuy
                ? newSL > currentSL + 0.1
                : currentSL === 0 ? true : newSL < currentSL - 0.1;
              const notTooClose = Math.abs(currentPrice - newSL) >= Math.max(minDist, 0.5);

              if (isBetter && notTooClose) {
                try {
                  await metaApiFetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, metaApiToken, {
                    method: "POST",
                    body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: pos.id, stopLoss: newSL, takeProfit: pos.takeProfit ?? undefined }),
                  });
                  log("INFO", `SL-TRAIL ${symbol} ${pos.id}: ${currentSL}→${newSL} | Phase ${4-remaining} | Floor:${Math.round(floor*100)/100} Trail:${Math.round(trail*100)/100} | ${rMultiple.toFixed(1)}R ${momentum}`);
                  modifications.push({ symbol, posId: pos.id, action: "sl_trail", oldSL: currentSL, newSL, rMultiple: +rMultiple.toFixed(2), phase: 4 - remaining, momentum });
                } catch (e: any) {
                  log("WARN", `SL-Trail FEHLER ${symbol} ${pos.id}: ${e.message} (versuchter SL: ${newSL}, Preis: ${currentPrice})`);
                }
              }
            }
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

          // SL-Trail ist oben im Phase-System integriert
        }

        // === RELOAD POSITIONEN SEPARAT TRAILEN ===
        for (const pos of reloadPositions) {
          if (!pos.openPrice || !pos.currentPrice || !pos.stopLoss) continue;
          const isBuyR = pos.type === "POSITION_TYPE_BUY";
          const profitR = isBuyR ? pos.currentPrice - pos.openPrice : pos.openPrice - pos.currentPrice;
          if (profitR <= 0) continue; // Nur im Profit trailen
          // Einfacher Trail: 50% vom Profit locken
          const lockSL = isBuyR
            ? pos.openPrice + profitR * 0.5
            : pos.openPrice - profitR * 0.5;
          const newRL = Math.round(lockSL * 100) / 100;
          const minD = /xau|gold/i.test(pos.symbol) ? 1.0 : 0.002;
          const betterR = isBuyR ? newRL > pos.stopLoss + 0.1 : newRL < pos.stopLoss - 0.1;
          const farR = Math.abs(pos.currentPrice - newRL) >= minD;
          if (betterR && farR) {
            try {
              await metaApiFetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, metaApiToken, {
                method: "POST",
                body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: pos.id, stopLoss: newRL, takeProfit: pos.takeProfit ?? undefined }),
              });
              log("INFO", `RELOAD-TRAIL ${pos.symbol} ${pos.id}: SL ${pos.stopLoss}→${newRL}`);
              modifications.push({ symbol: pos.symbol, posId: pos.id, action: "reload_trail", oldSL: pos.stopLoss, newSL: newRL });
            } catch (e: any) { log("WARN", `Reload-Trail fehlgeschlagen: ${e.message}`); }
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
