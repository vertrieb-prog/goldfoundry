// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/sl-config.ts — Zentrale SL-Konfiguration
// Break Even Buffer, Minimum SL-Abstand, Cooldown, Stepped Trailing
// ═══════════════════════════════════════════════════════════════

// ── Break Even Buffer ────────────────────────────────────────
// Wenn BE ausgelöst wird: SL = Entry ± Buffer (nicht exakt Entry!)
// Verhindert Ausstoppen durch Spread/Slippage
export const BE_BUFFER: Record<string, number> = {
  XAUUSD: 1.5,    // $1.50 = ~15 Pips
  XAGUSD: 0.05,   // $0.05
  US30: 15,        // 15 Punkte
  NAS100: 20,      // 20 Punkte
  US500: 3,        // 3 Punkte
  BTCUSD: 50,      // $50
  ETHUSD: 5,       // $5
};
const DEFAULT_BE_BUFFER = 1.0;

export function getBeBuffer(symbol: string): number {
  return BE_BUFFER[symbol] ?? DEFAULT_BE_BUFFER;
}

// ── Minimum SL-Abstand ──────────────────────────────────────
// SL darf NIE enger als dieses Minimum sein (vom aktuellen Preis)
export const MIN_SL_DISTANCE: Record<string, number> = {
  XAUUSD: 2.0,    // Minimum $2.00
  XAGUSD: 0.08,   // $0.08
  US30: 20,        // 20 Punkte
  NAS100: 25,      // 25 Punkte
  US500: 5,        // 5 Punkte
  BTCUSD: 100,     // $100
  ETHUSD: 10,      // $10
};
const DEFAULT_MIN_DISTANCE = 2.0;

export function getMinSlDistance(symbol: string): number {
  return MIN_SL_DISTANCE[symbol] ?? DEFAULT_MIN_DISTANCE;
}

// ── SL Modification Cooldown ─────────────────────────────────
// Minimum 2 Minuten zwischen SL-Änderungen pro Position
const lastSLChange: Map<string, number> = new Map();
export const SL_COOLDOWN_MS = 2 * 60 * 1000; // 2 Minuten

export function canModifySL(positionId: string): boolean {
  const last = lastSLChange.get(positionId) || 0;
  if (Date.now() - last < SL_COOLDOWN_MS) return false;
  return true;
}

export function recordSLChange(positionId: string): void {
  lastSLChange.set(positionId, Date.now());
  // Cleanup alte Einträge (>30min)
  if (lastSLChange.size > 100) {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, t] of lastSLChange) {
      if (t < cutoff) lastSLChange.delete(id);
    }
  }
}

// ── Enforce Minimum SL Distance ──────────────────────────────
// Prüft ob der vorgeschlagene SL zu nah am Preis ist und korrigiert
export function enforceMinDistance(
  symbol: string,
  direction: "BUY" | "SELL",
  currentPrice: number,
  proposedSL: number
): number {
  const minDist = getMinSlDistance(symbol);
  const distance = direction === "BUY"
    ? currentPrice - proposedSL
    : proposedSL - currentPrice;

  if (distance < minDist) {
    return direction === "BUY"
      ? currentPrice - minDist
      : currentPrice + minDist;
  }
  return proposedSL;
}

// ── Break Even mit Buffer ────────────────────────────────────
export function calculateBreakEvenSL(
  symbol: string,
  direction: "BUY" | "SELL",
  entryPrice: number
): number {
  const buffer = getBeBuffer(symbol);
  return direction === "BUY"
    ? entryPrice + buffer
    : entryPrice - buffer;
}

// ── Stepped Trailing Stop ────────────────────────────────────
// SL springt in ATR-Stufen nach, nicht kontinuierlich
export function calculateSteppedTrailingSL(
  symbol: string,
  direction: "BUY" | "SELL",
  entryPrice: number,
  currentPrice: number,
  atr: number,
  currentSL: number
): { newSL: number; updated: boolean; profitATR: number } {
  if (atr <= 0) return { newSL: currentSL, updated: false, profitATR: 0 };

  const buffer = getBeBuffer(symbol);
  const profitATR = direction === "BUY"
    ? (currentPrice - entryPrice) / atr
    : (entryPrice - currentPrice) / atr;

  let newSL: number;

  // Noch nicht genug Gewinn → SL NICHT bewegen
  if (profitATR < 1.0) {
    return { newSL: currentSL, updated: false, profitATR };
  } else if (profitATR < 2.0) {
    // Break Even + Buffer
    newSL = direction === "BUY" ? entryPrice + buffer : entryPrice - buffer;
  } else if (profitATR < 3.0) {
    // 1× ATR über Entry
    newSL = direction === "BUY" ? entryPrice + atr * 1.0 : entryPrice - atr * 1.0;
  } else if (profitATR < 4.0) {
    // 2× ATR über Entry
    newSL = direction === "BUY" ? entryPrice + atr * 2.0 : entryPrice - atr * 2.0;
  } else {
    // 3× ATR über Entry
    newSL = direction === "BUY" ? entryPrice + atr * 3.0 : entryPrice - atr * 3.0;
  }

  // Nur nachziehen wenn BESSER als aktueller SL (nie zurück!)
  const isBetter = direction === "BUY"
    ? newSL > currentSL
    : newSL < currentSL || currentSL === 0;

  if (isBetter) {
    return { newSL, updated: true, profitATR };
  }
  return { newSL: currentSL, updated: false, profitATR };
}
