// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/smart-orders-v2.ts — 4-Split Order Calculator
// 25% / 25% / 25% / 25% equal split with auto-BE and trailing runner
// ═══════════════════════════════════════════════════════════════

import type { ParsedSignal, SmartOrder } from "./types";
import { getBeBuffer } from "./sl-config";

const SPLIT_PERCENTAGES = [25, 25, 25, 25];
const SPLIT_LABELS = ["TP1 (Quick)", "TP2 (Standard)", "TP3 (Extended)", "TP4 (Runner)"];

/**
 * Calculate pip size for a given symbol.
 */
function getPipSize(symbol: string): number {
  if (symbol.includes("JPY")) return 0.01;
  if (symbol === "XAUUSD") return 0.01;
  if (symbol === "XAGUSD") return 0.001;
  return 0.0001;
}

/**
 * Calculate lot size based on risk percent and stop loss distance.
 */
function calculateLotSize(
  accountBalance: number,
  riskPercent: number,
  stopLossPips: number,
  symbol: string
): number {
  if (stopLossPips <= 0) return 0.01;

  const riskAmount = accountBalance * (riskPercent / 100);
  const pipValue = symbol === "XAUUSD" ? 1.0 : symbol.includes("JPY") ? 100 : 10;
  const lots = riskAmount / (stopLossPips * pipValue);

  return Math.max(0.01, Math.round(lots * 100) / 100);
}

/**
 * Generate 4 TPs from the signal. If fewer than 4 TPs provided,
 * extrapolate additional ones based on the distance pattern.
 */
function generateTakeProfits(signal: ParsedSignal): number[] {
  const tps = [...signal.takeProfits];
  if (tps.length === 0 || !signal.entryPrice || !signal.stopLoss) return tps;

  const entry = signal.entryPrice;
  const slDist = Math.abs(entry - signal.stopLoss);

  while (tps.length < 4) {
    if (tps.length === 0) {
      // 1:1 R:R
      const tp = signal.action === "BUY" ? entry + slDist : entry - slDist;
      tps.push(Math.round(tp * 100000) / 100000);
    } else {
      const lastTP = tps[tps.length - 1];
      const prevTP = tps.length > 1 ? tps[tps.length - 2] : entry;
      const diff = lastTP - prevTP;
      const nextTP = lastTP + (diff !== 0 ? diff : (signal.action === "BUY" ? slDist : -slDist));
      tps.push(Math.round(nextTP * 100000) / 100000);
    }
  }

  return tps.slice(0, 4);
}

/**
 * Calculate 4-split smart orders from a parsed signal.
 *
 * - 4 TPs: 25% / 25% / 25% / 25% (equal split)
 * - Auto-breakeven after TP1
 * - Trailing stop on runner (last split)
 */
export function calculateOrders(
  signal: ParsedSignal,
  accountBalance: number,
  riskPercent: number
): SmartOrder[] {
  if (!signal.symbol || !signal.stopLoss || signal.action === "UNKNOWN") {
    return [];
  }

  const action = signal.action as "BUY" | "SELL";
  if (action !== "BUY" && action !== "SELL") return [];

  const entry = signal.entryPrice ?? 0;
  const pipSize = getPipSize(signal.symbol);
  const stopLossPips = Math.abs(entry - signal.stopLoss) / pipSize;

  const totalLots = calculateLotSize(accountBalance, riskPercent, stopLossPips, signal.symbol);
  const takeProfits = generateTakeProfits(signal);

  if (takeProfits.length === 0) {
    // Single order without TP splits
    return [{
      symbol: signal.symbol,
      action,
      lots: totalLots,
      stopLoss: signal.stopLoss,
      takeProfit: 0,
      splitPercent: 100,
      label: "Full Position",
    }];
  }

  const orders: SmartOrder[] = [];

  for (let i = 0; i < Math.min(4, takeProfits.length); i++) {
    const pct = SPLIT_PERCENTAGES[i];
    const lots = Math.max(0.01, Math.round(totalLots * (pct / 100) * 100) / 100);

    orders.push({
      symbol: signal.symbol,
      action,
      lots,
      stopLoss: signal.stopLoss,
      takeProfit: takeProfits[i],
      splitPercent: pct,
      label: SPLIT_LABELS[i],
    });
  }

  return orders;
}

/**
 * Calculate breakeven price with symbol-specific buffer.
 * XAUUSD: $1.50, US30: 15pt, NAS100: 20pt — nicht nur 2 Pips!
 */
export function getBreakevenPrice(
  entryPrice: number,
  direction: "BUY" | "SELL",
  symbol: string
): number {
  const buffer = getBeBuffer(symbol);
  return direction === "BUY" ? entryPrice + buffer : entryPrice - buffer;
}

/**
 * Calculate trailing stop for the runner (last split).
 */
export function getTrailingStop(
  direction: "BUY" | "SELL",
  currentPrice: number,
  currentSL: number,
  symbol: string,
  trailingPips: number = 15
): number {
  const pipSize = getPipSize(symbol);
  const trailDist = trailingPips * pipSize;

  if (direction === "BUY") {
    const proposed = currentPrice - trailDist;
    return proposed > currentSL ? Math.round(proposed * 100000) / 100000 : currentSL;
  } else {
    const proposed = currentPrice + trailDist;
    return (proposed < currentSL || currentSL === 0)
      ? Math.round(proposed * 100000) / 100000
      : currentSL;
  }
}
