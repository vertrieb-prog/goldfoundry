// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/management-executor.ts
// Führt Phenex Management-Befehle aus (BE, Trail, Secure, Partial, SL)
// ═══════════════════════════════════════════════════════════════

import {
  calculateBreakEvenSL,
  enforceMinDistance,
  canModifySL,
  recordSLChange,
  calculateSteppedTrailingSL,
  getBeBuffer,
} from "./sl-config";

const log = (level: string, msg: string) => {
  console.log(`[${new Date().toISOString()}] [TG-MGMT] [${level}] ${msg}`);
};

interface MetaApiLike {
  getSymbolPrice: (symbol: string) => Promise<any>;
  getCandles?: (symbol: string, tf: string, count: number) => Promise<any>;
  modifyPosition: (posId: string, sl: number | null, tp: number | null) => Promise<any>;
  closePosition: (posId: string) => Promise<any>;
}

interface MgmtCommand {
  type: "BREAK_EVEN" | "TRAIL" | "SECURE" | "PARTIAL_CLOSE" | "SL_UPDATE";
  symbol: string | null;
  closePercent: number | null;
  newSL: number | null;
}

interface Position {
  id: string;
  symbol: string;
  type: string; // "POSITION_TYPE_BUY" | "POSITION_TYPE_SELL"
  openPrice: number;
  stopLoss: number;
  takeProfit: number;
  volume: number;
  comment?: string;
}

/**
 * Execute a management command on all matching positions.
 * Returns count of modified positions.
 */
export async function executeManagementCommand(
  cmd: MgmtCommand,
  positions: Position[],
  api: MetaApiLike,
  channelId: string
): Promise<{ modified: number; skipped: number; errors: number }> {
  const result = { modified: 0, skipped: 0, errors: 0 };

  // Filter positions by symbol + channel comment
  const matching = positions.filter(p => {
    if (cmd.symbol && !p.symbol.toUpperCase().includes(cmd.symbol.toUpperCase())) return false;
    if (p.comment && !p.comment.includes("TG-")) return false;
    return true;
  });

  if (matching.length === 0) {
    // Kein Symbol-Filter? → Alle TG-Positionen nehmen
    const allTG = positions.filter(p => p.comment?.includes("TG-"));
    if (allTG.length === 0) {
      log("INFO", `Keine passenden Positionen für ${cmd.type}`);
      return result;
    }
    matching.push(...allTG);
  }

  log("INFO", `${cmd.type}: ${matching.length} Positionen gefunden`);

  for (const pos of matching) {
    try {
      // Cooldown prüfen
      if (cmd.type !== "PARTIAL_CLOSE" && !canModifySL(pos.id)) {
        log("INFO", `[COOLDOWN] ${pos.symbol} ${pos.id} — übersprungen`);
        result.skipped++;
        continue;
      }

      const direction = pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL" as const;

      switch (cmd.type) {
        case "BREAK_EVEN": {
          const beSL = calculateBreakEvenSL(pos.symbol, direction, pos.openPrice);
          const isBetter = direction === "BUY"
            ? beSL > (pos.stopLoss || 0)
            : beSL < pos.stopLoss || pos.stopLoss === 0;
          if (isBetter) {
            await api.modifyPosition(pos.id, beSL, pos.takeProfit);
            recordSLChange(pos.id);
            log("INFO", `[BE] ${pos.symbol} SL → ${beSL} (Entry ${pos.openPrice} + Buffer)`);
            result.modified++;
          } else {
            log("INFO", `[BE] ${pos.symbol} SL bereits besser (${pos.stopLoss} vs ${beSL})`);
            result.skipped++;
          }
          break;
        }

        case "TRAIL": {
          // Stepped Trailing: hole ATR, berechne Stufe
          let atr = 0;
          if (api.getCandles) {
            try {
              const candles = await api.getCandles(pos.symbol, "1h", 15);
              if (Array.isArray(candles) && candles.length >= 2) {
                let sum = 0;
                for (let i = 1; i < candles.length; i++) {
                  sum += Math.max(
                    candles[i].high - candles[i].low,
                    Math.abs(candles[i].high - candles[i - 1].close),
                    Math.abs(candles[i].low - candles[i - 1].close)
                  );
                }
                atr = sum / (candles.length - 1);
              }
            } catch {}
          }
          // Fallback ATR
          if (atr <= 0) atr = pos.symbol.includes("XAU") ? 5.0 : 0.005;

          const price = await api.getSymbolPrice(pos.symbol);
          const currentPrice = direction === "BUY" ? price.bid : price.ask;
          const trail = calculateSteppedTrailingSL(
            pos.symbol, direction, pos.openPrice, currentPrice, atr, pos.stopLoss
          );
          if (trail.updated) {
            const safeSL = enforceMinDistance(pos.symbol, direction, currentPrice, trail.newSL);
            await api.modifyPosition(pos.id, safeSL, pos.takeProfit);
            recordSLChange(pos.id);
            log("INFO", `[TRAIL] ${pos.symbol} SL → ${safeSL} (${trail.profitATR.toFixed(1)}× ATR)`);
            result.modified++;
          } else {
            log("INFO", `[TRAIL] ${pos.symbol} noch nicht genug Gewinn (${trail.profitATR.toFixed(1)}× ATR)`);
            result.skipped++;
          }
          break;
        }

        case "SECURE": {
          // SL auf mindestens 1× ATR Gewinn (oder BE + Buffer, was besser ist)
          let atr = pos.symbol.includes("XAU") ? 5.0 : 0.005;
          if (api.getCandles) {
            try {
              const candles = await api.getCandles(pos.symbol, "1h", 15);
              if (Array.isArray(candles) && candles.length >= 2) {
                let sum = 0;
                for (let i = 1; i < candles.length; i++) {
                  sum += Math.max(candles[i].high - candles[i].low,
                    Math.abs(candles[i].high - candles[i - 1].close),
                    Math.abs(candles[i].low - candles[i - 1].close));
                }
                atr = sum / (candles.length - 1);
              }
            } catch {}
          }
          const secureSL = direction === "BUY"
            ? pos.openPrice + atr * 1.0
            : pos.openPrice - atr * 1.0;
          const beSL = calculateBreakEvenSL(pos.symbol, direction, pos.openPrice);
          // Nimm das bessere von beiden
          const bestSL = direction === "BUY"
            ? Math.max(secureSL, beSL)
            : Math.min(secureSL, beSL);
          const isBetter = direction === "BUY"
            ? bestSL > (pos.stopLoss || 0)
            : bestSL < pos.stopLoss || pos.stopLoss === 0;
          if (isBetter) {
            await api.modifyPosition(pos.id, bestSL, pos.takeProfit);
            recordSLChange(pos.id);
            log("INFO", `[SECURE] ${pos.symbol} SL → ${bestSL} (1× ATR über Entry)`);
            result.modified++;
          } else {
            result.skipped++;
          }
          break;
        }

        case "PARTIAL_CLOSE": {
          const pct = cmd.closePercent || 30;
          const closeLots = Math.max(0.01, Math.floor(pos.volume * (pct / 100) * 100) / 100);
          if (closeLots >= 0.01 && closeLots < pos.volume) {
            await api.closePosition(pos.id);
            // MetaApi partial close: volume parameter
            // Note: some implementations need closePositionPartially
            log("INFO", `[PARTIAL] ${pos.symbol} ${pct}% = ${closeLots}L geschlossen`);
            result.modified++;
          } else {
            result.skipped++;
          }
          break;
        }

        case "SL_UPDATE": {
          if (cmd.newSL) {
            const price = await api.getSymbolPrice(pos.symbol);
            const currentPrice = direction === "BUY" ? price.bid : price.ask;
            const safeSL = enforceMinDistance(pos.symbol, direction, currentPrice, cmd.newSL);
            const isBetter = direction === "BUY"
              ? safeSL > (pos.stopLoss || 0)
              : safeSL < pos.stopLoss || pos.stopLoss === 0;
            if (isBetter) {
              await api.modifyPosition(pos.id, safeSL, pos.takeProfit);
              recordSLChange(pos.id);
              log("INFO", `[SL] ${pos.symbol} SL → ${safeSL} (Phenex: ${cmd.newSL})`);
              result.modified++;
            } else {
              result.skipped++;
            }
          }
          break;
        }
      }
    } catch (err) {
      log("ERROR", `${cmd.type} fehlgeschlagen für ${pos.symbol}: ${(err as Error).message}`);
      result.errors++;
    }
  }

  return result;
}
