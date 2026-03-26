// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/parser.ts — AI Signal Parser
// Parst Telegram-Nachrichten zu strukturierten Trading-Signalen
// ═══════════════════════════════════════════════════════════════

import { cachedCall, PROMPTS } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { normalizeSymbol } from "./symbol-resolver";
import type { ParsedSignal } from "./types";

const EMPTY_SIGNAL: ParsedSignal = {
  action: "UNKNOWN",
  symbol: null,
  entryPrice: null,
  stopLoss: null,
  takeProfits: [],
  isModification: false,
  isClose: false,
  closePartial: null,
  moveToBreakeven: false,
  confidence: 0,
};

/**
 * Regex pre-parser: extract clear signals without AI (saves ~200 tokens).
 */
function tryRegexParse(message: string): ParsedSignal | null {
  const m = message.replace(/\n/g, " ");

  // Pattern: "SIGNAL ALERT BUY/SELL XAUUSD 4444-4456 TP1: 4440 TP2: 4433 SL: 4462"
  const alertMatch = m.match(/(?:SIGNAL\s*ALERT\s*)?(BUY|SELL|BUYING|SELLING)\s+(?:GOLD|XAU(?:USD)?|XAUUSD\.?\w*)\s*(?:@?\s*(\d{3,5}(?:\.\d{1,2})?))?\s*(?:[–\-]\s*(\d{3,5}(?:\.\d{1,2})?))?/i);
  if (!alertMatch) return null;

  const action = alertMatch[1].toUpperCase().startsWith("BUY") ? "BUY" : "SELL";
  const entry1 = alertMatch[2] ? parseFloat(alertMatch[2]) : null;
  const entry2 = alertMatch[3] ? parseFloat(alertMatch[3]) : null;
  const entryPrice = entry1 && entry2 ? (entry1 + entry2) / 2 : entry1 || null;

  // Extract SL
  const slMatch = m.match(/(?:SL|Stop\s*Loss|Sl)[:\s]+(\d{3,5}(?:\.\d{1,2})?)/i);
  const stopLoss = slMatch ? parseFloat(slMatch[1]) : null;

  // Extract TPs
  const tpMatches = [...m.matchAll(/(?:TP\d?|Take\s*Profit\d?|Tp\d?)[:\s]+(\d{3,5}(?:\.\d{1,2})?)/gi)];
  const takeProfits = tpMatches.map(t => parseFloat(t[1])).filter(n => !isNaN(n));

  if (!action) return null;

  return {
    action: action as any,
    symbol: "XAUUSD",
    entryPrice,
    stopLoss,
    takeProfits,
    isModification: false,
    isClose: false,
    closePartial: null,
    moveToBreakeven: false,
    confidence: stopLoss && takeProfits.length > 0 ? 90 : stopLoss ? 80 : 60,
  };
}

/**
 * Parse a raw Telegram message into a structured ParsedSignal using AI.
 * Falls back to UNKNOWN on any error.
 */
export async function parseSignal(message: string): Promise<ParsedSignal> {
  if (!message || message.trim().length < 3) {
    return { ...EMPTY_SIGNAL };
  }

  // Try regex first (free, instant)
  const regexResult = tryRegexParse(message);
  if (regexResult && regexResult.stopLoss) {
    return { ...regexResult, symbol: normalizeSymbol(regexResult.symbol || "") || regexResult.symbol };
  }

  try {
    const result = await cachedCall({
      prompt: PROMPTS.signalParser,
      message: message.slice(0, 500),
      model: MODELS.fast,
      maxTokens: 200,
    });

    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    return {
      action: parsed.action || "UNKNOWN",
      symbol: parsed.symbol ? normalizeSymbol(parsed.symbol) : null,
      entryPrice: parsed.entryPrice ?? null,
      stopLoss: parsed.stopLoss ?? null,
      takeProfits: Array.isArray(parsed.takeProfits) ? parsed.takeProfits : [],
      isModification: !!parsed.isModification,
      isClose: !!parsed.isClose,
      closePartial: parsed.closePartial ?? null,
      moveToBreakeven: !!parsed.moveToBreakeven,
      confidence: parsed.confidence ?? 0,
    };
  } catch (err) {
    console.error("[TG-PARSER] Parse error:", (err as Error).message);
    return { ...EMPTY_SIGNAL };
  }
}

/**
 * Quick pre-filter: skip messages that are clearly not signals.
 */
export function isLikelySignal(message: string): boolean {
  const lower = message.toLowerCase();
  const keywords = [
    "buy", "sell", "long", "short", "buying", "selling",
    "tp", "sl", "take profit", "stop loss", "stoploss", "takeprofit",
    "entry", "close", "modify", "breakeven", "break even",
    "re-entry", "reentry", "re entry", "nochmal rein", "wieder rein",
    "raus", "schließen", "dicht", "profit nehmen", "profite",
    "signal alert", "setup", "signal",
    "xauusd", "gold", "xau", "eurusd", "gbpusd", "btcusd", "nas", "us500",
  ];
  return keywords.some((kw) => lower.includes(kw));
}
