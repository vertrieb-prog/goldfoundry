// ═══════════════════════════════════════════════════════════════
// COPY EXECUTOR — Shared copy logic for real-time + fallback poller
// Extracted from copy-bot.mjs, typed for TypeScript
// ═══════════════════════════════════════════════════════════════

import { createRestAdapter, type RestAdapter } from "@/lib/engine-adapter";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── Types ─────────────────────────────────────────────────────

export interface CopyPosition {
  id: string;
  symbol: string;
  type: string; // "POSITION_TYPE_BUY" | "POSITION_TYPE_SELL"
  openPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  volume: number;
  time?: string;
}

export interface CopyPair {
  signal: string;  // MetaApi account ID
  copy: string;    // MetaApi account ID
  name: string;
}

export interface CopyResult {
  action: "COPIED" | "BLOCKED" | "DUPLICATE" | "ERROR";
  reason?: string;
  ordersPlaced?: number;
  totalOrders?: number;
  latencyMs?: number;
}

export interface Split {
  lots: number;
  pct: number;
  tp: number;
  label: string;
}

// ── Anti-Tilt Tracker (module-level state) ────────────────────

const tiltTracker = { consecutive: 0, pauseUntil: 0 };

const TILT_MAX_CONSECUTIVE = 4;
const TILT_PAUSE_MS = 15 * 60 * 1000; // 15 min pause after tilt

export function resetTilt() {
  tiltTracker.consecutive = 0;
  tiltTracker.pauseUntil = 0;
}

export function recordWin() {
  tiltTracker.consecutive = 0;
}

export function recordLoss() {
  tiltTracker.consecutive++;
  if (tiltTracker.consecutive >= TILT_MAX_CONSECUTIVE) {
    tiltTracker.pauseUntil = Date.now() + TILT_PAUSE_MS;
  }
}

function isTilted(): boolean {
  return Date.now() < tiltTracker.pauseUntil;
}

// ── Score Copy Signal ─────────────────────────────────────────

export function scoreCopySignal(
  sl: number | undefined,
  tp: number | undefined,
  entry: number | undefined
): number {
  let score = 0;
  if (sl) score += 25;
  if (tp) score += 25;
  if (entry) score += 15;
  if (sl && entry && entry !== sl) score += 15;
  if (sl && entry && tp) {
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    const rr = risk > 0 ? reward / risk : 0;
    if (rr >= 2) score += 20;
    else if (rr >= 1.5) score += 15;
    else if (rr >= 1) score += 10;
  }
  return score;
}

// ── Calculate Lots ────────────────────────────────────────────

export function calcLots(
  symbol: string,
  sl: number | undefined,
  entry: number | undefined,
  balance = 10000,
  riskPct = 1
): number {
  if (!entry) return 0.01;
  // Wenn kein SL → Default SL-Distanz pro Instrument
  const slDist = sl ? Math.abs(entry - sl) : getDefaultSlDist(symbol);
  if (slDist === 0) return 0.01;
  const riskAmount = balance * (riskPct / 100); // 1% Risk
  const isGold = /xau|gold/i.test(symbol);
  const isJPY = /jpy/i.test(symbol);
  const isIndex = /us500|us30|nas|de40|uk100|jp225/i.test(symbol);
  const isOil = /oil/i.test(symbol);
  const pipValue = isGold ? 100 : isJPY ? 1000 : isIndex ? 1 : isOil ? 10 : 100000;
  let lots = riskAmount / (slDist * pipValue);
  const maxLots = isGold ? 5.0 : isIndex ? 20.0 : isOil ? 10.0 : 10.0;
  lots = Math.max(0.01, Math.min(lots, maxLots));
  return Math.floor(lots * 100) / 100;
}

// ── Default SL Distance ──────────────────────────────────────

export function getDefaultSlDist(symbol: string): number {
  const sym = symbol.toUpperCase();
  if (/XAU|GOLD/.test(sym)) return 5;       // $5 → 0.20L bei $10k
  if (/XAG|SILVER/.test(sym)) return 0.15;
  if (/JPY/.test(sym)) return 0.15;          // 15 Pips
  if (/BTC/.test(sym)) return 200;
  if (/US30|NAS|US500|DE40|UK100|JP225/.test(sym)) return 25;
  if (/OIL/.test(sym)) return 0.50;
  return 0.0015;                              // 15 Pips Forex
}

// ── Build 4-Split Orders ──────────────────────────────────────

export function buildSplits(
  totalLots: number,
  tps: number[],
  entry: number,
  sl: number | undefined,
  action: "BUY" | "SELL",
  symbol: string
): Split[] {
  const isBuy = action === "BUY";
  const slDist = sl && entry ? Math.abs(entry - sl) : getDefaultSlDist(symbol);
  const filledTps = [...tps];
  while (filledTps.length < 4) {
    const mult = [1.5, 2.5, 3.5, 5.0][filledTps.length];
    filledTps.push(
      Math.round((isBuy ? entry + slDist * mult : entry - slDist * mult) * 100) / 100
    );
  }
  return [
    { pct: 0.40, tp: filledTps[0], label: "TP1" },
    { pct: 0.25, tp: filledTps[1], label: "TP2" },
    { pct: 0.20, tp: filledTps[2], label: "TP3" },
    { pct: 0.15, tp: filledTps[3], label: "Runner" },
  ].map((s) => ({
    lots: Math.max(0.01, Math.floor(totalLots * s.pct * 100) / 100),
    ...s,
  }));
}

// ── Execute Copy ──────────────────────────────────────────────

export async function executeCopy(
  position: CopyPosition,
  copyAccountId: string,
  token: string
): Promise<CopyResult> {
  const start = Date.now();
  const db = supabaseAdmin;

  // 1. Anti-tilt check
  if (isTilted()) {
    return {
      action: "BLOCKED",
      reason: `Tilt pause active until ${new Date(tiltTracker.pauseUntil).toISOString()}`,
    };
  }

  // 2. Duplicate check — BEFORE any trading action
  const { data: existing } = await db
    .from("copy_events")
    .select("id")
    .eq("source_position_id", position.id)
    .eq("copy_account_id", copyAccountId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { action: "DUPLICATE", reason: `Position ${position.id} already copied` };
  }

  // 3. Score-Filter DEAKTIVIERT — Signal-Trader setzen oft kein SL/TP, das ist deren Stil
  // Nur Anti-Tilt bleibt aktiv (oben geprueft)
  const score = 100; // Scoring disabled — all signals pass

  try {
    // 4. Get account balance via REST
    const api = createRestAdapter(token, copyAccountId);
    const accountInfo = await api.getAccountInfo();
    const balance = accountInfo.balance ?? 10000;

    // 5. Calculate lots (kein Score-Multiplier mehr)
    const baseLots = calcLots(
      position.symbol,
      position.stopLoss,
      position.openPrice,
      balance,
      5 // 5% total pro Signal
    );
    const adjustedLots = Math.max(0.01, Math.floor(baseLots * 100) / 100);

    // 6. Build 4-split orders
    const action = position.type.includes("BUY") ? "BUY" as const : "SELL" as const;
    const tps = position.takeProfit ? [position.takeProfit] : [];
    const splits = buildSplits(adjustedLots, tps, position.openPrice, position.stopLoss, action, position.symbol);

    // 7. Execute all splits via REST
    const method = action === "BUY" ? "createMarketBuyOrder" : "createMarketSellOrder";
    let ordersPlaced = 0;

    for (const split of splits) {
      try {
        await api[method](position.symbol, split.lots, position.stopLoss ?? null, split.tp);
        ordersPlaced++;
      } catch (err) {
        console.error(`[COPY-EXECUTOR] Split ${split.label} failed:`, (err as Error).message);
      }
    }

    // 8. Log result to copy_events
    await logCopyEvent(db, position, copyAccountId, "COPIED", `${ordersPlaced}/${splits.length} splits`, {
      score,
      adjustedLots,
      splits: splits.map((s) => ({ label: s.label, lots: s.lots, tp: s.tp })),
      balance,
      latencyMs: Date.now() - start,
    });

    return {
      action: "COPIED",
      ordersPlaced,
      totalOrders: splits.length,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    const reason = (err as Error).message;
    await logCopyEvent(db, position, copyAccountId, "ERROR", reason);
    recordLoss();
    return { action: "ERROR", reason, latencyMs: Date.now() - start };
  }
}

// ── Log Helper ────────────────────────────────────────────────

async function logCopyEvent(
  db: typeof supabaseAdmin,
  position: CopyPosition,
  copyAccountId: string,
  action: CopyResult["action"],
  reason: string,
  meta?: Record<string, unknown>
) {
  try {
    await db.from("copy_events").insert({
      source_position_id: position.id,
      copy_account_id: copyAccountId,
      symbol: position.symbol,
      action,
      reason,
      meta: meta ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[COPY-EXECUTOR] Failed to log copy event:", (err as Error).message);
  }
}
