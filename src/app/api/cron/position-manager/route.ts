export const dynamic = "force-dynamic";
export const maxDuration = 300;
// ═══════════════════════════════════════════════════════════════
// CRON: Intelligent Position Manager
// Momentum-basiertes Trade Management — maximiert Profit,
// schneidet Verluste schnell ab, schuetzt Gewinne aggressiv.
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

function pipSize(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return 0.01;
  if (s.includes("XAU") || s.includes("GOLD")) return 0.1;
  if (s.includes("XAG") || s.includes("SILVER")) return 0.01;
  if (s.includes("US30") || s.includes("NAS") || s.includes("SPX") || s.includes("DAX")) return 1;
  return 0.0001;
}

function getDefaultSlDist(symbol: string): number {
  const sym = symbol.toUpperCase();
  if (/XAU|GOLD/.test(sym)) return 5;
  if (/XAG|SILVER/.test(sym)) return 0.15;
  if (/JPY/.test(sym)) return 0.15;
  if (/BTC/.test(sym)) return 200;
  if (/US30|NAS|US500|DE40|UK100|JP225/.test(sym)) return 25;
  if (/OIL/.test(sym)) return 0.50;
  return 0.0015;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const metaApiToken = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  if (!metaApiToken) return NextResponse.json({ error: "No MetaApi token" }, { status: 500 });

  const db = createSupabaseAdmin();
  const modifications: any[] = [];

  try {
    const { data: upcomingNews } = await db
      .from("economic_calendar")
      .select("title, tier, event_time")
      .lte("event_time", new Date(Date.now() + 30 * 60000).toISOString())
      .gte("event_time", new Date().toISOString())
      .in("tier", [0, 1]);

    const hasHighImpactNews = (upcomingNews?.length || 0) > 0;
    if (hasHighImpactNews) log("WARN", `${upcomingNews!.length} High-Impact News in 30min — Schutz aktiv`);

    const { data: allAccounts } = await db.from("slave_accounts").select("*");
    const accounts = (allAccounts || []).filter((a: any) => a.copier_active === true);
    if (!accounts?.length) return NextResponse.json({ message: "No active accounts", modifications: [] });

    log("INFO", `Pruefe ${accounts.length} aktive(s) Konto(en)`);

    for (const account of accounts) {
      const accountId = account.metaapi_account_id;
      try {
        const clientBase = CLIENT_BASE;

        // Frische Positionen holen (kein Cache!)
        const posResponse = await fetch(
          `${clientBase}/users/current/accounts/${accountId}/positions`,
          { headers: { "auth-token": metaApiToken }, signal: AbortSignal.timeout(15000), cache: "no-store" }
        );
        if (!posResponse.ok) { log("WARN", `${account.mt_login}: HTTP ${posResponse.status}`); continue; }
        const positions = await posResponse.json();
        if (!Array.isArray(positions) || !positions.length) continue;

        const managedPositions = positions.filter(
          (p: any) => p.comment && (p.comment.startsWith("TG-Signal") || p.comment.startsWith("COPY-"))
        );
        if (!managedPositions.length) continue;

        log("INFO", `${account.mt_login}: ${managedPositions.length} Positionen`);

        // === TP-HIT ERKENNUNG ===
        // Gruppiere nach Symbol+Richtung. Wenn eine Gruppe weniger als 4 Positionen hat,
        // wurde mindestens ein TP getroffen → SL der verbleibenden nachziehen.
        // TP1 hit (3 uebrig) → SL auf Entry
        // TP2 hit (2 uebrig) → SL auf TP1 Level
        // TP3 hit (1 uebrig, Runner) → SL auf TP2 Level
        const groups = new Map<string, any[]>();
        for (const pos of managedPositions) {
          const dir = pos.type?.replace("POSITION_TYPE_", "") || "?";
          const key = `${pos.symbol}-${dir}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(pos);
        }

        for (const [groupKey, groupPositions] of groups) {
          const remaining = groupPositions.length;
          // Sortiere nach TP-Abstand (naehstes TP zuerst)
          const isBuy = groupPositions[0].type === "POSITION_TYPE_BUY";
          const sortedByTp = [...groupPositions].sort((a, b) => {
            const aTp = a.takeProfit || (isBuy ? 999999 : 0);
            const bTp = b.takeProfit || (isBuy ? 999999 : 0);
            return isBuy ? aTp - bTp : bTp - aTp; // Naehstes TP zuerst
          });

          if (remaining < 4 && remaining > 0) {
            // Mindestens 1 TP wurde getroffen — SL der verbleibenden nachziehen
            const entry = groupPositions[0].openPrice;
            const pip = pipSize(groupPositions[0].symbol);
            const minBuf = /xau|gold/i.test(groupPositions[0].symbol) ? 1.0 : 0.001;

            let newSL: number;
            if (remaining === 3) {
              // TP1 hit → SL auf Entry + Puffer (Breakeven)
              newSL = isBuy ? entry + minBuf : entry - minBuf;
              log("INFO", `${groupKey}: TP1 HIT → SL auf BE ${newSL} fuer ${remaining} verbleibende`);
            } else if (remaining === 2) {
              // TP2 hit → SL auf TP1 Level (das naehste verbleibende TP als Referenz)
              // Nutze 30% des TP-Abstands der naehsten Position als SL
              const nearestTpDist = sortedByTp[0].takeProfit ? Math.abs(sortedByTp[0].takeProfit - entry) : 0;
              newSL = isBuy ? entry + nearestTpDist * 0.3 : entry - nearestTpDist * 0.3;
              if (!nearestTpDist) newSL = isBuy ? entry + minBuf : entry - minBuf; // Fallback BE
              log("INFO", `${groupKey}: TP2 HIT → SL auf ${newSL} fuer ${remaining} verbleibende`);
            } else {
              // TP3 hit → Runner laeuft, SL eng nachziehen
              const nearestTpDist = sortedByTp[0].takeProfit ? Math.abs(sortedByTp[0].takeProfit - entry) : 0;
              newSL = isBuy ? entry + nearestTpDist * 0.5 : entry - nearestTpDist * 0.5;
              if (!nearestTpDist) newSL = isBuy ? entry + minBuf * 3 : entry - minBuf * 3;
              log("INFO", `${groupKey}: TP3 HIT → Runner SL auf ${newSL}`);
            }

            const newSLRounded = Math.round(newSL * 100) / 100;
            for (const pos of groupPositions) {
              const currentSL = pos.stopLoss || 0;
              const shouldMove = isBuy ? newSLRounded > currentSL + pip : (currentSL > 0 && newSLRounded < currentSL - pip);
              if (shouldMove) {
                try {
                  await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, metaApiToken, {
                    method: "POST",
                    body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: pos.id, stopLoss: newSLRounded, takeProfit: pos.takeProfit ?? undefined }),
                  });
                  log("INFO", `TP-HIT TRAIL ${pos.symbol} ${pos.id}: SL ${currentSL}→${newSLRounded} (${remaining} verbleibend)`);
                  modifications.push({ symbol: pos.symbol, posId: pos.id, action: "tp_hit_trail", oldSL: currentSL, newSL: newSLRounded, remaining });
                } catch (e: any) { log("WARN", `TP-Hit Trail fehlgeschlagen: ${e.message}`); }
              }
            }
          }
        }

        // Danach: Standard Position Management pro Position
        for (const pos of managedPositions) {
          const mod = await managePosition(pos, accountId, clientBase, metaApiToken, hasHighImpactNews);
          if (mod) modifications.push(mod);
        }
      } catch (err: any) {
        log("ERROR", `Account ${accountId}: ${err.message}`);
        modifications.push({ account: accountId, error: err.message });
      }
    }

    log("INFO", `Fertig. ${modifications.length} Aktion(en).`);
    return NextResponse.json({ modifications, timestamp: new Date().toISOString() });
  } catch (err: any) {
    log("ERROR", `Cron Fehler: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function managePosition(
  pos: any, accountId: string, clientBase: string, token: string, hasHighImpactNews: boolean
): Promise<any | null> {
  const { id: posId, type, symbol, openPrice, currentPrice, stopLoss, takeProfit, volume, profit, time } = pos;
  const isBuy = type === "POSITION_TYPE_BUY";
  const pip = pipSize(symbol);
  if (!openPrice || !currentPrice) return null;

  // === STEP 1: MOMENTUM aus letzten 10 Kerzen (5min) ===
  let momentum: "WITH" | "NEUTRAL" | "AGAINST" = "NEUTRAL";
  let isReversing = false;
  let speed = 1.0;

  try {
    const candles = await metaApiFetch(
      `${clientBase}/users/current/accounts/${accountId}/historical-market-data/symbols/${encodeURIComponent(symbol)}/timeframes/5m/candles?limit=10`,
      token
    );
    if (Array.isArray(candles) && candles.length >= 5) {
      const last3 = candles.slice(-3);
      const bullish = last3.filter((c: any) => c.close > c.open).length;
      const bearish = last3.filter((c: any) => c.close < c.open).length;
      if (isBuy) momentum = bullish >= 2 ? "WITH" : bearish >= 2 ? "AGAINST" : "NEUTRAL";
      else momentum = bearish >= 2 ? "WITH" : bullish >= 2 ? "AGAINST" : "NEUTRAL";

      const lastC = candles[candles.length - 1];
      const prevC = candles[candles.length - 2];
      isReversing = (lastC.close > lastC.open) !== (prevC.close > prevC.open) && momentum === "AGAINST";

      const ranges = candles.map((c: any) => Math.abs(c.high - c.low));
      const avg = ranges.reduce((s: number, r: number) => s + r, 0) / ranges.length;
      const recent = last3.reduce((s: number, c: any) => s + Math.abs(c.high - c.low), 0) / 3;
      speed = avg > 0 ? recent / avg : 1.0;
    }
  } catch { /* Neutral bei Fehler */ }

  // === STEP 2: POSITION KLASSIFIZIEREN ===
  const slDist = stopLoss ? Math.abs(openPrice - stopLoss) : getDefaultSlDist(symbol);
  const profitDist = isBuy ? currentPrice - openPrice : openPrice - currentPrice;
  const profitRatio = slDist > 0 ? profitDist / slDist : 0;
  const ageMin = time ? (Date.now() - new Date(time).getTime()) / 60000 : 999999;

  let state: string;
  if (ageMin < 2) state = "FRESH";
  else if (profitRatio >= 1.0) state = "RUNNING";
  else if (profitRatio >= 0.3) state = momentum === "AGAINST" || isReversing ? "STALLING" : "PROFITABLE";
  else if (profitRatio >= 0) state = "BUILDING";
  else if (profitRatio > -0.6) state = "LOSING";
  else state = "CRITICAL";

  if (profitRatio > 0.1 && momentum === "AGAINST" && isReversing) state = "REVERSING";

  log("INFO", `${symbol} ${posId.slice(-6)} | ${state} | Profit: ${(profitRatio * 100).toFixed(0)}% | Momentum: ${momentum} | Speed: ${speed.toFixed(1)}x | Alter: ${ageMin.toFixed(0)}min`);

  // === STEP 3: AKTIONEN ===
  // REIHENFOLGE: Exit-Entscheidungen ZUERST, dann SL-Trail
  const tradeUrl = `${clientBase}/users/current/accounts/${accountId}/trade`;
  // Minimum SL-Abstand: $1.00 fuer Gold (deckt Spread + Noise), skaliert fuer andere
  const minSlBuffer = /xau|gold/i.test(symbol) ? 1.0 : /jpy/i.test(symbol) ? 0.10 : 0.0010;

  if (state === "FRESH") return null;

  // === EXIT-ENTSCHEIDUNGEN ZUERST (vor SL-Trail!) ===

  // CRITICAL — sofort schliessen
  if (state === "CRITICAL") {
    try {
      await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }) });
      log("INFO", `NOTFALL-CLOSE ${symbol} ${posId}: ${(profitRatio * 100).toFixed(0)}% zum SL, P&L: $${profit?.toFixed(2)}`);
      return { symbol, posId, action: "emergency_close", state, profitRatio: +profitRatio.toFixed(2), profit };
    } catch (e: any) {
      log("WARN", `Notfall-Close fehlgeschlagen: ${e.message}`);
      return null;
    }
  }

  // REVERSING — im Profit + Markt dreht klar → Gewinn mitnehmen
  if (state === "REVERSING") {
    if (profitRatio > 0.5) {
      try {
        await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }) });
        log("INFO", `UMKEHR-CLOSE ${symbol} ${posId}: Gewinn bei ${(profitRatio * 100).toFixed(0)}% gesichert, P&L: $${profit?.toFixed(2)}`);
        return { symbol, posId, action: "reversal_close", state, profitRatio: +profitRatio.toFixed(2), profit };
      } catch (e: any) { log("WARN", `Umkehr-Close fehlgeschlagen: ${e.message}`); }
    }
  }

  // RUNNING + schnelle Umkehr → sofort schliessen
  if (state === "RUNNING" && momentum === "AGAINST" && speed > 1.5) {
    try {
      await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }) });
      log("INFO", `SPEED-CLOSE ${symbol} ${posId}: Schnelle Umkehr (${speed.toFixed(1)}x), P&L: $${profit?.toFixed(2)}`);
      return { symbol, posId, action: "speed_close", state, speed, profit };
    } catch (e: any) { log("WARN", `Speed-Close fehlgeschlagen: ${e.message}`); }
  }

  // LOSING + Momentum gegen uns → Cut bei >50% zum SL
  if (state === "LOSING" && momentum === "AGAINST" && profitRatio < -0.5) {
    try {
      await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }) });
      log("INFO", `VERLUST-CUT ${symbol} ${posId}: ${(profitRatio * 100).toFixed(0)}% Verlust, P&L: $${profit?.toFixed(2)}`);
      return { symbol, posId, action: "cut_loss", state, profitRatio: +profitRatio.toFixed(2), profit };
    } catch (e: any) { log("WARN", `Verlust-Cut fehlgeschlagen: ${e.message}`); }
  }

  // NEWS-SCHUTZ — 50% schliessen bei High-Impact News + Gewinn
  if (hasHighImpactNews && profit > 0 && volume > 0.02) {
    const closeVol = Math.max(0.01, Math.floor(volume * 50) / 100);
    if (closeVol >= 0.01) {
      try {
        await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId, volume: closeVol }) });
        log("INFO", `NEWS-SCHUTZ ${symbol} ${posId}: ${closeVol}L geschlossen`);
        return { symbol, posId, action: "news_protect", state, volume: closeVol };
      } catch (e: any) { log("WARN", `News-Schutz fehlgeschlagen: ${e.message}`); }
    }
  }

  // === SL-TRAIL (nur wenn kein Exit getriggert) ===
  // Optimale Regeln fuer Gold (XAUUSD):
  // - BE erst bei 65% zum TP (Trade Raum geben, nicht bei jedem Dip rausfliegen)
  // - BE-Puffer: min $1.00 (Gold-Spread + Noise)
  // - 80% zum TP: 40% Profit locken
  // - 100%+: Trailing mit ATR-Awareness
  // - Momentum AGAINST: enger, aber nicht sofort schliessen (nur SL anpassen)

  let targetSL = stopLoss || (isBuy ? openPrice - slDist : openPrice + slDist);

  if (takeProfit && openPrice && currentPrice) {
    const tpDist = Math.abs(takeProfit - openPrice);
    if (tpDist >= minSlBuffer) {
      const progressToTp = isBuy
        ? (currentPrice - openPrice) / tpDist
        : (openPrice - currentPrice) / tpDist;

      if (progressToTp >= 1.0) {
        // Runner: Preis UEBER TP → SL unter TP mit Momentum-Slack
        const slack = momentum === "WITH" ? 0.25 : momentum === "NEUTRAL" ? 0.15 : 0.08;
        targetSL = isBuy
          ? Math.max(targetSL, takeProfit - tpDist * slack)
          : Math.min(targetSL, takeProfit + tpDist * slack);
      } else if (progressToTp >= 0.8) {
        // 80%+ zum TP → Lock 40% Profit
        targetSL = isBuy
          ? Math.max(targetSL, openPrice + tpDist * 0.4)
          : Math.min(targetSL, openPrice - tpDist * 0.4);
      } else if (progressToTp >= 0.65) {
        // 65%+ zum TP → Breakeven mit echtem Puffer ($1 Gold)
        targetSL = isBuy
          ? Math.max(targetSL, openPrice + minSlBuffer)
          : Math.min(targetSL, openPrice - minSlBuffer);
      }
      // UNTER 65%: KEIN SL-TRAIL. Trade Raum geben.
    }
  } else if (profitRatio >= 1.0) {
    // Kein TP gesetzt → Trailing basierend auf SL-Distanz + Momentum
    const mult = momentum === "WITH" ? 0.7 : momentum === "NEUTRAL" ? 0.5 : 0.35;
    const trailDist = Math.max(slDist * mult, minSlBuffer * 3); // Nie enger als 3x min Buffer
    targetSL = isBuy
      ? Math.max(targetSL, currentPrice - trailDist)
      : Math.min(targetSL, currentPrice + trailDist);
  } else if (profitRatio >= 0.5 && !takeProfit) {
    // 50%+ Profit ohne TP → Breakeven
    targetSL = isBuy
      ? Math.max(targetSL, openPrice + minSlBuffer)
      : Math.min(targetSL, openPrice - minSlBuffer);
  }

  // SL-Modifikation ausfuehren (wenn besser als aktuell)
  const targetSLRounded = Math.round(targetSL * 100) / 100;
  const currentSL = stopLoss || 0;
  const needsMove = isBuy ? targetSLRounded > currentSL + pip : (currentSL > 0 && targetSLRounded < currentSL - pip);
  const farEnough = Math.abs(currentPrice - targetSLRounded) >= minSlBuffer;

  if (needsMove && farEnough && targetSLRounded !== currentSL) {
    try {
      await metaApiFetch(tradeUrl, token, {
        method: "POST",
        body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: posId, stopLoss: targetSLRounded, takeProfit: takeProfit ?? undefined }),
      });
      log("INFO", `SL-TRAIL ${symbol} ${posId}: SL ${currentSL}→${targetSLRounded} | ${state} | ${momentum} | ${(profitRatio * 100).toFixed(0)}%`);
      return { symbol, posId, action: "sl_trail", oldSL: currentSL, newSL: targetSLRounded, state, momentum };
    } catch (e: any) { log("WARN", `SL-Trail fehlgeschlagen: ${e.message}`); }
  }

  return null;
}
