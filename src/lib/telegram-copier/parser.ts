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
  const m = message.replace(/\n/g, " ").trim();
  const lower = m.toLowerCase();

  // Detect BUY or SELL action
  let action: "BUY" | "SELL" | null = null;
  if (/\b(buy|buying|long)\b/i.test(m)) action = "BUY";
  else if (/\b(sell|selling|short)\b/i.test(m)) action = "SELL";
  if (!action) return null;

  // Must mention gold/xau somewhere
  if (!/\b(gold|xau|xauusd)/i.test(m)) return null;

  // Extract entry price: "at 4333", "@ 4333", "4444–4456", "Entry: 4530", "XAUUSD 4408"
  let entryPrice: number | null = null;
  const atMatch = m.match(/(?:at|@|entry[:\s]*)\s*(\d{3,5}(?:\.\d{1,2})?)/i);
  const rangeMatch = m.match(/(\d{4,5}(?:\.\d{1,2})?)\s*[–\-]\s*(\d{4,5}(?:\.\d{1,2})?)/);
  const afterSymMatch = m.match(/(?:xau(?:usd)?(?:\.?\w*)?|gold)\s+(\d{4,5}(?:\.\d{1,2})?)/i);
  if (atMatch) entryPrice = parseFloat(atMatch[1]);
  else if (rangeMatch) entryPrice = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
  else if (afterSymMatch) entryPrice = parseFloat(afterSymMatch[1]);

  // Extract SL: "SL: 4462", "Sl 4323", "Stop Loss: 4548.87", "sl 4510"
  const slMatch = m.match(/(?:SL|stop\s*loss|sl)[:\s]+(\d{3,5}(?:\.\d{1,2})?)/i);
  const stopLoss = slMatch ? parseFloat(slMatch[1]) : null;

  // Extract TPs: "TP1: 4440", "Tp: 4363", "Take Profit: 4476.94", "tp 4480"
  const tpMatches = [...m.matchAll(/(?:TP\d?|take\s*profit\d?|tp\d?)[:\s]+(\d{3,5}(?:\.\d{1,2})?)/gi)];
  const takeProfits = tpMatches.map(t => parseFloat(t[1])).filter(n => !isNaN(n));

  return {
    action,
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
