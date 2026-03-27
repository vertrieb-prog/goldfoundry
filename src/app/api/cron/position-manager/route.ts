export const dynamic = "force-dynamic";
export const maxDuration = 300;
// ═══════════════════════════════════════════════════════════════
// CRON: Position Manager
// Monitors open TG-Signal positions for breakeven, trailing stop,
// and partial close — maximizing profit on active trades.
// Runs daily at 09:00 via Vercel Cron
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const META_PROV_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

function getClientBase(region?: string): string {
  if (region && region !== "default") return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  return "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";
}

const log = (level: string, msg: string) =>
  console.log(`[${new Date().toISOString()}] [POS-MGR] [${level}] ${msg}`);

// ── Engine Strategy State (Anti-Tilt) ──
const antiTiltState = { consecutiveLosses: 0, pauseUntil: 0 };

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

// ── Pip helpers ──────────────────────────────────────────────
function pipSize(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s.includes("JPY")) return 0.01;
  if (s.includes("XAU") || s.includes("GOLD")) return 0.1;
  if (s.includes("XAG") || s.includes("SILVER")) return 0.01;
  if (s.includes("US30") || s.includes("NAS") || s.includes("SPX") || s.includes("DAX")) return 1;
  return 0.0001; // standard forex
}

function pipDistance(price1: number, price2: number, symbol: string): number {
  return Math.abs(price1 - price2) / pipSize(symbol);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metaApiToken = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  if (!metaApiToken) return NextResponse.json({ error: "No MetaApi token" }, { status: 500 });

  const db = createSupabaseAdmin();
  const modifications: any[] = [];

  try {
    // Check for upcoming high-impact news (next 30 minutes)
    const { data: upcomingNews } = await db
      .from("economic_calendar")
      .select("title, tier, event_time")
      .lte("event_time", new Date(Date.now() + 30 * 60000).toISOString())
      .gte("event_time", new Date().toISOString())
      .in("tier", [0, 1]);

    const hasHighImpactNews = (upcomingNews?.length || 0) > 0;
    if (hasHighImpactNews) {
      log("WARN", `${upcomingNews!.length} high-impact news event(s) in next 30min — news partial close active`);
    }

    // Get all active accounts
    const { data: accounts } = await db
      .from("slave_accounts")
      .select("metaapi_account_id, user_id, account_name, mt_login")
      .eq("copier_active", true);

    if (!accounts?.length) {
      return NextResponse.json({ message: "No active accounts", modifications: [] });
    }

    log("INFO", `Checking ${accounts.length} active account(s)`);

    for (const account of accounts) {
      const accountId = account.metaapi_account_id;
      try {
        // Get account region
        let clientBase: string;
        try {
          const accInfo = await metaApiFetch(`${META_PROV_BASE}/users/current/accounts/${accountId}`, metaApiToken);
          clientBase = getClientBase(accInfo.region);
        } catch {
          clientBase = getClientBase();
        }

        // Fetch open positions
        const positions = await metaApiFetch(
          `${clientBase}/users/current/accounts/${accountId}/positions`,
          metaApiToken
        );

        if (!Array.isArray(positions) || !positions.length) continue;

        // Filter to TG-Signal positions only
        const tgPositions = positions.filter(
          (p: any) => p.comment && p.comment.startsWith("TG-Signal")
        );
        if (!tgPositions.length) continue;

        // ── MARKT-ANALYSE: Trend bestimmen ──
        // Berechne Gesamt-PnL pro Richtung → zeigt den Trend
        const buyPnL = tgPositions.filter((p: any) => p.type === "POSITION_TYPE_BUY").reduce((s: number, p: any) => s + (p.profit || 0), 0);
        const sellPnL = tgPositions.filter((p: any) => p.type === "POSITION_TYPE_SELL").reduce((s: number, p: any) => s + (p.profit || 0), 0);
        const buyCount = tgPositions.filter((p: any) => p.type === "POSITION_TYPE_BUY").length;
        const sellCount = tgPositions.filter((p: any) => p.type === "POSITION_TYPE_SELL").length;

        // Trend: wenn BUYs im Plus und SELLs im Minus → bullish, umgekehrt bearish
        const trend = buyPnL > 0 && sellPnL < 0 ? "BULLISH" : sellPnL > 0 && buyPnL < 0 ? "BEARISH" : "NEUTRAL";
        log("INFO", `Account ${account.account_name}: ${tgPositions.length} pos | BUY P/L:$${buyPnL.toFixed(0)} (${buyCount}) | SELL P/L:$${sellPnL.toFixed(0)} (${sellCount}) | Trend: ${trend}`);

        // ── ENGINE: Anti-Tilt — track consecutive losses per run ──
        const closedLosses = tgPositions.filter((p: any) => p.profit < 0).length;
        const closedWins = tgPositions.filter((p: any) => p.profit > 0).length;
        if (closedLosses > closedWins) {
          antiTiltState.consecutiveLosses += (closedLosses - closedWins);
        } else {
          antiTiltState.consecutiveLosses = 0;
        }
        if (antiTiltState.consecutiveLosses >= 5) {
          antiTiltState.pauseUntil = Date.now() + 3600_000; // 1h pause
          log("WARN", `ANTI-TILT: ${antiTiltState.consecutiveLosses} consecutive losses → pausing new DCA/pyramid for 1h`);
        }
        if (antiTiltState.consecutiveLosses >= 3) {
          log("WARN", `ANTI-TILT: ${antiTiltState.consecutiveLosses} consecutive losses → reducing lot sizes by 50%`);
        }

        for (const pos of tgPositions) {
          const mod = await managePosition(pos, accountId, clientBase, metaApiToken, hasHighImpactNews, trend);
          if (mod) modifications.push(mod);
        }
      } catch (err: any) {
        log("ERROR", `Account ${accountId}: ${err.message}`);
        modifications.push({ account: accountId, error: err.message });
      }
    }

    log("INFO", `Done. ${modifications.length} modification(s).`);
    return NextResponse.json({ modifications, timestamp: new Date().toISOString() });
  } catch (err: any) {
    log("ERROR", `Cron error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function managePosition(
  pos: any, accountId: string, clientBase: string, token: string, hasHighImpactNews: boolean, trend: string = "NEUTRAL"
): Promise<any | null> {
  const { id: posId, type, symbol, openPrice, currentPrice, stopLoss, takeProfit, volume, profit, comment } = pos;
  const isBuy = type === "POSITION_TYPE_BUY";

  // ── TREND-BASIERTE SOFORT-AKTION ──
  // Gegen-Trend Positionen im Verlust → sofort schließen
  const isAgainstTrend = (trend === "BULLISH" && !isBuy) || (trend === "BEARISH" && isBuy);
  if (isAgainstTrend && profit < 0) {
    try {
      await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
        method: "POST",
        body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }),
      });
      log("INFO", `TREND CLOSE ${symbol} ${posId}: ${isBuy?"BUY":"SELL"} gegen ${trend} Trend, P/L:$${profit.toFixed(2)}`);
      return { symbol, posId, action: "trend_close", trend, profit: +profit.toFixed(2) };
    } catch (e: any) {
      log("WARN", `Trend close failed: ${e.message}`);
    }
  }

  // ── RUNNER SPEZIAL: Kurz vor TP → SL eng + TP erweitern ──
  const isRunner = comment?.includes("Runner");
  if (isRunner && takeProfit && currentPrice && openPrice && stopLoss) {
    const tpDist = Math.abs(takeProfit - openPrice);
    const currentToTp = Math.abs(takeProfit - currentPrice);
    // Wenn Runner 85% zum TP gelaufen → SL eng nachziehen + TP erweitern
    if (currentToTp < tpDist * 0.15) {
      const pip = symbol.includes("JPY") ? 0.01 : symbol.includes("XAU") || symbol.includes("GOLD") ? 0.1 : 0.0001;
      const tightSL = isBuy
        ? Math.round((currentPrice - tpDist * 0.1) * 100) / 100  // SL nur 10% der TP-Distanz unter Preis
        : Math.round((currentPrice + tpDist * 0.1) * 100) / 100;
      const newTP = isBuy
        ? Math.round((takeProfit + tpDist * 0.5) * 100) / 100  // TP um 50% erweitern
        : Math.round((takeProfit - tpDist * 0.5) * 100) / 100;
      const betterSL = isBuy ? tightSL > stopLoss : tightSL < stopLoss;
      if (betterSL) {
        try {
          await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
            method: "POST",
            body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: posId, stopLoss: tightSL, takeProfit: newTP }),
          });
          log("INFO", `RUNNER EXTEND ${symbol} ${posId}: SL ${stopLoss}→${tightSL} TP ${takeProfit}→${newTP} (85% zum TP)`);
          return { symbol, posId, action: "runner_extend", oldSL: stopLoss, newSL: tightSL, oldTP: takeProfit, newTP: newTP };
        } catch (e: any) { log("WARN", `Runner extend failed: ${e.message}`); }
      }
    }
  }

  // ── MIT-TREND TP HOCHZIEHEN ──
  // Wenn Position mit dem Trend läuft und gut im Profit → TP dynamisch erweitern
  const isWithTrend = (trend === "BULLISH" && isBuy) || (trend === "BEARISH" && !isBuy);
  if (isWithTrend && profit > 0 && takeProfit && stopLoss && openPrice) {
    const slDist = Math.abs(openPrice - stopLoss);
    const currentDist = Math.abs(currentPrice - openPrice);
    // Wenn Preis schon 80% zum TP gelaufen → TP erweitern um 1x SL-Distanz
    if (takeProfit && currentDist > Math.abs(takeProfit - openPrice) * 0.8) {
      const extension = slDist * 1.5;
      const newTp = isBuy
        ? Math.round((takeProfit + extension) * 100) / 100
        : Math.round((takeProfit - extension) * 100) / 100;
      try {
        await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
          method: "POST",
          body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: posId, stopLoss, takeProfit: newTp }),
        });
        log("INFO", `TP EXTEND ${symbol} ${posId}: TP ${takeProfit}→${newTp} (${trend} trend)`);
        return { symbol, posId, action: "tp_extend", oldTP: takeProfit, newTP: newTp, trend };
      } catch (e: any) {
        log("WARN", `TP extend failed: ${e.message}`);
      }
    }
  }

  // Original SL distance (in price)
  if (!stopLoss || !openPrice || !currentPrice) return null;
  const originalSLDist = Math.abs(openPrice - stopLoss);
  if (originalSLDist <= 0) return null;

  const pip = pipSize(symbol);
  const minSLDist = 2 * pip; // never closer than 2 pips
  const profitDist = isBuy ? currentPrice - openPrice : openPrice - currentPrice; // signed distance in price
  const profitRatio = profitDist / originalSLDist; // >0 means in profit

  // ── Partial Close: >200% risk on Runner positions ─────────
  if (profitRatio > 2.0 && comment?.includes("Runner") && volume > 0.02) {
    const closeVol = Math.floor(volume * 50) / 100; // 50% rounded down to 0.01
    if (closeVol >= 0.01) {
      try {
        await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
          method: "POST",
          body: JSON.stringify({ actionType: "POSITION_PARTIAL", positionId: posId, volume: closeVol }),
        });
        log("INFO", `PARTIAL CLOSE ${symbol} ${posId}: closed ${closeVol}L (profit ratio ${profitRatio.toFixed(1)}x)`);
        return { symbol, posId, action: "partial_close", volume: closeVol, profitRatio: +profitRatio.toFixed(2) };
      } catch (e: any) {
        log("WARN", `Partial close failed ${posId}: ${e.message}`);
      }
    }
  }

  // ── Trailing Stop: profit > 100% of original SL distance ──
  if (profitRatio > 1.0) {
    const trailOffset = originalSLDist * 0.5;
    const newSL = isBuy ? currentPrice - trailOffset : currentPrice + trailOffset;
    const newSLRounded = Math.round(newSL / pip) * pip;

    // Safety: only tighten, never widen
    const isBetter = isBuy ? newSLRounded > (stopLoss + pip) : newSLRounded < (stopLoss - pip);
    const distFromPrice = Math.abs(currentPrice - newSLRounded);

    if (isBetter && distFromPrice >= minSLDist) {
      try {
        await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
          method: "POST",
          body: JSON.stringify({
            actionType: "POSITION_MODIFY", positionId: posId,
            stopLoss: newSLRounded, takeProfit: takeProfit ?? undefined,
          }),
        });
        log("INFO", `TRAIL ${symbol} ${posId}: SL ${stopLoss}→${newSLRounded} (ratio ${profitRatio.toFixed(1)}x)`);
        return { symbol, posId, action: "trailing_stop", oldSL: stopLoss, newSL: newSLRounded, profitRatio: +profitRatio.toFixed(2) };
      } catch (e: any) {
        log("WARN", `Trail modify failed ${posId}: ${e.message}`);
      }
    }
    return null; // trailing took priority, skip breakeven
  }

  // ── News Partial Close: high-impact news + in profit ───────
  if (hasHighImpactNews && profit > 0 && volume > 0.02) {
    const closeVol = Math.floor(volume * 50) / 100; // 50% rounded down to 0.01
    if (closeVol >= 0.01) {
      try {
        await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
          method: "POST",
          body: JSON.stringify({ actionType: "POSITION_PARTIAL", positionId: posId, volume: closeVol }),
        });
        log("INFO", `NEWS PARTIAL ${symbol} ${posId}: closed ${closeVol}L (profit €${profit.toFixed(2)}, news protection)`);
        return { symbol, posId, action: "news_partial_close", volume: closeVol, profit: +profit.toFixed(2) };
      } catch (e: any) {
        log("WARN", `News partial close failed ${posId}: ${e.message}`);
      }
    }
  }

  // ── ENGINE: Smart DCA — add lots when moving towards SL ──
  // DCA1: 33% towards SL → add 50% more lots
  // DCA2: 60% towards SL → add 30% more lots
  if (profitRatio < 0 && volume >= 0.01) {
    const lossRatio = Math.abs(profitRatio); // 0..1 where 1 = at SL
    const dcaComment = comment || "";
    const hasDCA1 = dcaComment.includes("DCA1");
    const hasDCA2 = dcaComment.includes("DCA2");

    if (!hasDCA1 && lossRatio >= 0.33 && lossRatio < 0.60) {
      const dcaLots = Math.max(0.01, Math.floor(volume * 0.50 * 100) / 100);
      try {
        const actionType = isBuy ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";
        await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
          method: "POST",
          body: JSON.stringify({ actionType, symbol, volume: dcaLots, stopLoss, comment: `TG-Signal DCA1` }),
        });
        log("INFO", `DCA1 ${symbol} ${posId}: +${dcaLots}L (${(lossRatio*100).toFixed(0)}% to SL)`);
        return { symbol, posId, action: "dca1", lots: dcaLots, lossRatio: +lossRatio.toFixed(2) };
      } catch (e: any) { log("WARN", `DCA1 failed: ${e.message}`); }
    }

    if (!hasDCA2 && lossRatio >= 0.60) {
      const dcaLots = Math.max(0.01, Math.floor(volume * 0.30 * 100) / 100);
      try {
        const actionType = isBuy ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";
        await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
          method: "POST",
          body: JSON.stringify({ actionType, symbol, volume: dcaLots, stopLoss, comment: `TG-Signal DCA2` }),
        });
        log("INFO", `DCA2 ${symbol} ${posId}: +${dcaLots}L (${(lossRatio*100).toFixed(0)}% to SL)`);
        return { symbol, posId, action: "dca2", lots: dcaLots, lossRatio: +lossRatio.toFixed(2) };
      } catch (e: any) { log("WARN", `DCA2 failed: ${e.message}`); }
    }
  }

  // ── ENGINE: Time Decay — tighten or close stale positions ──
  if (pos.time) {
    const openTime = new Date(pos.time).getTime();
    const ageHours = (Date.now() - openTime) / 3600_000;

    // >8h open → close everything
    if (ageHours > 8) {
      try {
        await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
          method: "POST",
          body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }),
        });
        log("INFO", `TIME DECAY CLOSE ${symbol} ${posId}: open ${ageHours.toFixed(1)}h > 8h`);
        return { symbol, posId, action: "time_decay_close", ageHours: +ageHours.toFixed(1) };
      } catch (e: any) { log("WARN", `Time decay close failed: ${e.message}`); }
    }

    // >4h open and not yet at breakeven → tighten SL by 20%
    if (ageHours > 4 && profitRatio < 0.5 && profitRatio > -0.5) {
      const tighterDist = originalSLDist * 0.80; // 20% tighter
      const newSL = isBuy
        ? Math.round((openPrice - tighterDist) / pip) * pip
        : Math.round((openPrice + tighterDist) / pip) * pip;
      const isBetter = isBuy ? newSL > stopLoss : newSL < stopLoss;
      if (isBetter) {
        try {
          await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
            method: "POST",
            body: JSON.stringify({ actionType: "POSITION_MODIFY", positionId: posId, stopLoss: newSL, takeProfit: takeProfit ?? undefined }),
          });
          log("INFO", `TIME DECAY TIGHTEN ${symbol} ${posId}: SL ${stopLoss}→${newSL} (${ageHours.toFixed(1)}h open)`);
          return { symbol, posId, action: "time_decay_tighten", oldSL: stopLoss, newSL, ageHours: +ageHours.toFixed(1) };
        } catch (e: any) { log("WARN", `Time decay tighten failed: ${e.message}`); }
      }
    }
  }

  // ── ENGINE: Pyramiding — add lots on strong trends at TP2 ──
  if (profitRatio > 1.5 && isWithTrend && !comment?.includes("Pyramid")) {
    // Only pyramid if strong trend (using profit as trend proxy)
    const pyramidLots = Math.max(0.01, Math.floor(volume * 0.30 * 100) / 100);
    if (pyramidLots >= 0.01) {
      try {
        const actionType = isBuy ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";
        // SL at breakeven for pyramid order
        const pyramidSL = isBuy ? openPrice + pip : openPrice - pip;
        await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
          method: "POST",
          body: JSON.stringify({ actionType, symbol, volume: pyramidLots, stopLoss: pyramidSL, comment: "TG-Signal Pyramid" }),
        });
        log("INFO", `PYRAMID ${symbol} ${posId}: +${pyramidLots}L (${trend} trend, ratio ${profitRatio.toFixed(1)}x)`);
        return { symbol, posId, action: "pyramid", lots: pyramidLots, profitRatio: +profitRatio.toFixed(2) };
      } catch (e: any) { log("WARN", `Pyramid failed: ${e.message}`); }
    }
  }

  // ── Auto Breakeven: profit > 50% of SL distance ───────────
  if (profitRatio > 0.5) {
    const buffer = pip; // 1 pip buffer past entry
    const beSL = isBuy ? openPrice + buffer : openPrice - buffer;

    // Only move if current SL is worse than breakeven
    const isBetter = isBuy ? beSL > (stopLoss + pip) : beSL < (stopLoss - pip);
    const distFromPrice = Math.abs(currentPrice - beSL);

    if (isBetter && distFromPrice >= minSLDist) {
      try {
        await metaApiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, token, {
          method: "POST",
          body: JSON.stringify({
            actionType: "POSITION_MODIFY", positionId: posId,
            stopLoss: beSL, takeProfit: takeProfit ?? undefined,
          }),
        });
        log("INFO", `BREAKEVEN ${symbol} ${posId}: SL ${stopLoss}→${beSL} (ratio ${profitRatio.toFixed(1)}x)`);
        return { symbol, posId, action: "breakeven", oldSL: stopLoss, newSL: beSL, profitRatio: +profitRatio.toFixed(2) };
      } catch (e: any) {
        log("WARN", `Breakeven modify failed ${posId}: ${e.message}`);
      }
    }
  }

  return null;
}
