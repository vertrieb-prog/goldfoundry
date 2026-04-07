// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/smart-orders.ts — Smart Order Management
// 4-Split TP, Auto-BE, Trailing Runner
// ═══════════════════════════════════════════════════════════════

import { getBeBuffer } from "./sl-config";

export interface SmartOrderConfig {
  splitMode: "equal" | "pyramid" | "aggressive";
  autoBreakeven: boolean;
  beAfterTP: number; // Move to BE after TP X hit
  trailingRunner: boolean;
  trailingDistance: number; // in pips
}

export const DEFAULT_SMART_CONFIG: SmartOrderConfig = {
  splitMode: "pyramid",
  autoBreakeven: true,
  beAfterTP: 1,
  trailingRunner: true,
  trailingDistance: 15,
};

// ── Split TPs into 4 parts ──────────────────────────────────
export function splitTakeProfits(
  entryPrice: number,
  takeProfits: number[],
  totalLots: number,
  config: SmartOrderConfig = DEFAULT_SMART_CONFIG
): Array<{ tp: number; lots: number; percentage: number }> {
  if (takeProfits.length === 0) return [];

  // Ensure we have at least 4 TPs
  const tps = [...takeProfits];
  while (tps.length < 4) {
    const lastTP = tps[tps.length - 1];
    const prevTP = tps.length > 1 ? tps[tps.length - 2] : entryPrice;
    const diff = lastTP - prevTP;
    tps.push(lastTP + diff);
  }

  // Split percentages based on mode
  const splits = config.splitMode === "equal"
    ? [25, 25, 25, 25]
    : config.splitMode === "pyramid"
      ? [40, 25, 20, 15]
      : [50, 25, 15, 10]; // aggressive

  return tps.slice(0, 4).map((tp, i) => ({
    tp,
    lots: Math.max(0.01, Math.round(totalLots * (splits[i] / 100) * 100) / 100),
    percentage: splits[i],
  }));
}

// ── Auto Breakeven Logic ────────────────────────────────────
export function shouldMoveToBreakeven(
  entryPrice: number,
  direction: "BUY" | "SELL",
  tpHit: number,
  config: SmartOrderConfig = DEFAULT_SMART_CONFIG,
  symbol?: string
): { moveBE: boolean; newSL: number } {
  if (!config.autoBreakeven) return { moveBE: false, newSL: 0 };
  if (tpHit >= config.beAfterTP) {
    // Symbol-spezifischer Buffer (XAUUSD $1.50, US30 15pt, etc.)
    const buffer = symbol ? getBeBuffer(symbol) : (entryPrice > 100 ? 1.5 : 0.0015);
    const newSL = direction === "BUY" ? entryPrice + buffer : entryPrice - buffer;
    return { moveBE: true, newSL };
  }
  return { moveBE: false, newSL: 0 };
}

// ── Trailing Stop Logic ─────────────────────────────────────
export function calculateTrailingStop(
  direction: "BUY" | "SELL",
  currentPrice: number,
  currentSL: number,
  highestPrice: number,
  lowestPrice: number,
  config: SmartOrderConfig = DEFAULT_SMART_CONFIG
): { newSL: number; updated: boolean } {
  if (!config.trailingRunner) return { newSL: currentSL, updated: false };

  const pipSize = currentPrice > 100 ? 0.01 : 0.0001;
  const trailDist = config.trailingDistance * pipSize;

  if (direction === "BUY") {
    const proposedSL = highestPrice - trailDist;
    if (proposedSL > currentSL) {
      return { newSL: Math.round(proposedSL * 100000) / 100000, updated: true };
    }
  } else {
    const proposedSL = lowestPrice + trailDist;
    if (proposedSL < currentSL || currentSL === 0) {
      return { newSL: Math.round(proposedSL * 100000) / 100000, updated: true };
    }
  }
  return { newSL: currentSL, updated: false };
}

// ── Smart Order Manager ─────────────────────────────────────
export function processSmartOrder(opts: {
  entryPrice: number;
  currentPrice: number;
  direction: "BUY" | "SELL";
  stopLoss: number;
  takeProfits: number[];
  totalLots: number;
  tpHit: number;
  highestPrice: number;
  lowestPrice: number;
  config?: SmartOrderConfig;
}) {
  const config = opts.config || DEFAULT_SMART_CONFIG;
  const splits = splitTakeProfits(opts.entryPrice, opts.takeProfits, opts.totalLots, config);
  const be = shouldMoveToBreakeven(opts.entryPrice, opts.direction, opts.tpHit, config);
  const trailing = calculateTrailingStop(
    opts.direction, opts.currentPrice, opts.stopLoss,
    opts.highestPrice, opts.lowestPrice, config
  );

  return {
    splits,
    breakeven: be,
    trailing,
    action: be.moveBE ? "MOVE_BE" : trailing.updated ? "TRAIL_SL" : "HOLD",
    newSL: be.moveBE ? be.newSL : trailing.updated ? trailing.newSL : opts.stopLoss,
  };
}
