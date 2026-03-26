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

        log("INFO", `Account ${account.label || accountId}: ${tgPositions.length} TG-Signal position(s)`);

        for (const pos of tgPositions) {
          const mod = await managePosition(pos, accountId, clientBase, metaApiToken);
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
  pos: any, accountId: string, clientBase: string, token: string
): Promise<any | null> {
  const { id: posId, type, symbol, openPrice, currentPrice, stopLoss, takeProfit, volume, profit, comment } = pos;
  const isBuy = type === "POSITION_TYPE_BUY";

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
