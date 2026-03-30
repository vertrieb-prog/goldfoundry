export const dynamic = "force-dynamic";
export const maxDuration = 300;
// ═══════════════════════════════════════════════════════════════
// CRON: Intelligent Position Manager
// Momentum-basiertes Trade Management — maximiert Profit,
// schneidet Verluste schnell ab, schuetzt Gewinne aggressiv.
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const META_PROV_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

function getClientBase(region?: string): string {
  if (region && region !== "default") return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  return "https://mt-client-api-v1.london.agiliumtrade.ai"; // Default: London (TagMarket Server)
}

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

    const { data: accounts } = await db.from("slave_accounts").select("*").is("copier_active", true);
    if (!accounts?.length) return NextResponse.json({ message: "No active accounts", modifications: [] });

    log("INFO", `Pruefe ${accounts.length} aktive(s) Konto(en)`);

    for (const account of accounts) {
      const accountId = account.metaapi_account_id;
      try {
        // IMMER London Region (alle TagMarket Accounts sind dort)
        const clientBase = "https://mt-client-api-v1.london.agiliumtrade.ai";

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
  const tradeUrl = `${clientBase}/users/current/accounts/${accountId}/trade`;

  if (state === "FRESH") return null;

  // CRITICAL — sofort schliessen
  if (state === "CRITICAL") {
    try {
      await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }) });
      log("INFO", `NOTFALL-CLOSE ${symbol} ${posId}: ${(profitRatio * 100).toFixed(0)}% zum SL, P&L: $${profit?.toFixed(2)}`);
      return { symbol, posId, action: "emergency_close", state, profitRatio: +profitRatio.toFixed(2), profit };
    } catch (e: any) {
      log("WARN", `Notfall-Close fehlgeschlagen (Position evtl. schon weg): ${e.message}`);
      return null; // Weiter zum naechsten — KEINE Endlosschleife
    }
  }

  // REVERSING — Gewinn sichern oder Teilschluss
  if (state === "REVERSING") {
    if (profitRatio > 0.5) {
      try {
        await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }) });
        log("INFO", `UMKEHR-CLOSE ${symbol} ${posId}: Gewinn bei ${(profitRatio * 100).toFixed(0)}% gesichert, P&L: $${profit?.toFixed(2)}`);
        return { symbol, posId, action: "reversal_close", state, profitRatio: +profitRatio.toFixed(2), profit };
      } catch (e: any) { log("WARN", `Umkehr-Close fehlgeschlagen: ${e.message}`); }
    } else if (profitRatio > 0 && volume > 0.02) {
      const closeVol = Math.max(0.01, Math.floor(volume * 50) / 100);
      if (closeVol >= 0.01) {
        try {
          await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_PARTIAL", positionId: posId, volume: closeVol }) });
          log("INFO", `UMKEHR-PARTIAL ${symbol} ${posId}: ${closeVol}L geschlossen, Momentum gegen uns`);
          return { symbol, posId, action: "reversal_partial", state, volume: closeVol };
        } catch (e: any) { log("WARN", `Umkehr-Partial fehlgeschlagen: ${e.message}`); }
      }
    }
  }

  // STALLING — Momentum stirbt, Gewinne schuetzen
  if (state === "STALLING") {
    if (momentum === "AGAINST" && volume > 0.02) {
      const closeVol = Math.max(0.01, Math.floor(volume * 50) / 100);
      if (closeVol >= 0.01) {
        try {
          await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_PARTIAL", positionId: posId, volume: closeVol }) });
          log("INFO", `STALL-PARTIAL ${symbol} ${posId}: ${closeVol}L geschlossen, Momentum stirbt`);
          return { symbol, posId, action: "stall_partial", state, volume: closeVol };
        } catch (e: any) { log("WARN", `Stall-Partial fehlgeschlagen: ${e.message}`); }
      }
    }
    const tightSL = isBuy
      ? Math.round((currentPrice - slDist * 0.3) * 100) / 100
      : Math.round((currentPrice + slDist * 0.3) * 100) / 100;
    const isBetter = isBuy ? (!stopLoss || tightSL > stopLoss) : (!stopLoss || tightSL < stopLoss);
    if (isBetter && Math.abs(currentPrice - tightSL) >= pip * 2) {
      try {
        await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: posId, stopLoss: tightSL, takeProfit: takeProfit ?? undefined }) });
        log("INFO", `STALL-TIGHTEN ${symbol} ${posId}: SL → ${tightSL} (${momentum} momentum)`);
        return { symbol, posId, action: "stall_tighten", state, newSL: tightSL, momentum };
      } catch (e: any) { log("WARN", `Stall-Tighten fehlgeschlagen: ${e.message}`); }
    }
  }

  // RUNNING — Trailing Stop je nach Momentum
  if (state === "RUNNING") {
    const mult = momentum === "WITH" ? 0.8 : momentum === "NEUTRAL" ? 0.5 : 0.3;
    const newSL = isBuy
      ? Math.round((currentPrice - slDist * mult) * 100) / 100
      : Math.round((currentPrice + slDist * mult) * 100) / 100;
    const isBetter = isBuy ? (!stopLoss || newSL > stopLoss + pip) : (!stopLoss || newSL < stopLoss - pip);
    if (isBetter && Math.abs(currentPrice - newSL) >= pip * 2) {
      try {
        await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: posId, stopLoss: newSL, takeProfit: takeProfit ?? undefined }) });
        log("INFO", `TRAIL ${symbol} ${posId}: SL → ${newSL} (${momentum} momentum, ${mult}x trail)`);
        return { symbol, posId, action: "trailing", state, newSL, momentum, trailMultiplier: mult };
      } catch (e: any) { log("WARN", `Trail fehlgeschlagen: ${e.message}`); }
    }
    // RUNNING + momentum against + fast → close all
    if (momentum === "AGAINST" && speed > 1.5) {
      try {
        await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }) });
        log("INFO", `SPEED-CLOSE ${symbol} ${posId}: Running + schnelle Umkehr (${speed.toFixed(1)}x), P&L: $${profit?.toFixed(2)}`);
        return { symbol, posId, action: "speed_close", state, speed, profit };
      } catch (e: any) { log("WARN", `Speed-Close fehlgeschlagen: ${e.message}`); }
    }
  }

  // PROFITABLE — Breakeven setzen
  if (state === "PROFITABLE") {
    const beSL = isBuy
      ? Math.round((openPrice + pip) * 100) / 100
      : Math.round((openPrice - pip) * 100) / 100;
    const needsMove = isBuy ? (!stopLoss || stopLoss < beSL) : (!stopLoss || stopLoss > beSL);
    if (needsMove && Math.abs(currentPrice - beSL) >= pip * 2) {
      try {
        await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: posId, stopLoss: beSL, takeProfit: takeProfit ?? undefined }) });
        log("INFO", `BREAKEVEN ${symbol} ${posId}: SL → ${beSL} (${(profitRatio * 100).toFixed(0)}% Profit)`);
        return { symbol, posId, action: "breakeven", state, newSL: beSL, profitRatio: +profitRatio.toFixed(2) };
      } catch (e: any) { log("WARN", `Breakeven fehlgeschlagen: ${e.message}`); }
    }
  }

  // LOSING + Momentum gegen uns → Cut bei >50% zum SL
  if (state === "LOSING" && momentum === "AGAINST" && profitRatio < -0.5) {
    try {
      await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }) });
      log("INFO", `VERLUST-CUT ${symbol} ${posId}: ${(profitRatio * 100).toFixed(0)}% Verlust + Momentum gegen uns, P&L: $${profit?.toFixed(2)}`);
      return { symbol, posId, action: "cut_loss", state, profitRatio: +profitRatio.toFixed(2), profit };
    } catch (e: any) { log("WARN", `Verlust-Cut fehlgeschlagen: ${e.message}`); }
  }

  // NEWS-SCHUTZ — 50% schliessen bei High-Impact News + Gewinn
  if (hasHighImpactNews && profit > 0 && volume > 0.02) {
    const closeVol = Math.max(0.01, Math.floor(volume * 50) / 100);
    if (closeVol >= 0.01) {
      try {
        await metaApiFetch(tradeUrl, token, { method: "POST", body: JSON.stringify({ actionType: "POSITION_PARTIAL", positionId: posId, volume: closeVol }) });
        log("INFO", `NEWS-SCHUTZ ${symbol} ${posId}: ${closeVol}L geschlossen vor High-Impact Event`);
        return { symbol, posId, action: "news_protect", state, volume: closeVol };
      } catch (e: any) { log("WARN", `News-Schutz fehlgeschlagen: ${e.message}`); }
    }
  }

  return null;
}
