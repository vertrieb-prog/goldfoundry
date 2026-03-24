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
 * Parse a raw Telegram message into a structured ParsedSignal using AI.
 * Falls back to UNKNOWN on any error.
 */
export async function parseSignal(message: string): Promise<ParsedSignal> {
  if (!message || message.trim().length < 3) {
    return { ...EMPTY_SIGNAL };
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
    "buy", "sell", "long", "short",
    "tp", "sl", "take profit", "stop loss",
    "entry", "close", "modify",
    "xauusd", "gold", "eurusd", "gbpusd", "btcusd",
  ];
  return keywords.some((kw) => lower.includes(kw));
}
