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
// All tradeable symbols with their aliases
const SYMBOL_MAP: Record<string, string> = {
  gold: "XAUUSD", xau: "XAUUSD", xauusd: "XAUUSD",
  silver: "XAGUSD", xag: "XAGUSD", xagusd: "XAGUSD",
  eurusd: "EURUSD", eur: "EURUSD", eu: "EURUSD", fiber: "EURUSD",
  gbpusd: "GBPUSD", gbp: "GBPUSD", gu: "GBPUSD", cable: "GBPUSD", pound: "GBPUSD",
  usdjpy: "USDJPY", uj: "USDJPY", jpy: "USDJPY",
  usdcad: "USDCAD", uc: "USDCAD", ucad: "USDCAD",
  usdchf: "USDCHF", uchf: "USDCHF",
  audusd: "AUDUSD", au: "AUDUSD", aussie: "AUDUSD",
  nzdusd: "NZDUSD", nz: "NZDUSD", kiwi: "NZDUSD",
  eurgbp: "EURGBP", eg: "EURGBP",
  eurjpy: "EURJPY", ej: "EURJPY",
  gbpjpy: "GBPJPY", gj: "GBPJPY", guppy: "GBPJPY",
  audnzd: "AUDNZD", an: "AUDNZD",
  audcad: "AUDCAD", ac: "AUDCAD",
  audjpy: "AUDJPY", aj: "AUDJPY",
  nzdjpy: "NZDJPY", nj: "NZDJPY",
  eurchf: "EURCHF", echf: "EURCHF",
  euraud: "EURAUD", ea: "EURAUD",
  eurnzd: "EURNZD",
  eurcad: "EURCAD", ec: "EURCAD",
  gbpaud: "GBPAUD", ga: "GBPAUD",
  gbpcad: "GBPCAD", gc: "GBPCAD",
  gbpnzd: "GBPNZD", gn: "GBPNZD",
  gbpchf: "GBPCHF",
  cadjpy: "CADJPY", cj: "CADJPY",
  chfjpy: "CHFJPY",
  cadchf: "CADCHF",
  nzdcad: "NZDCAD",
  btcusd: "BTCUSD", btc: "BTCUSD", bitcoin: "BTCUSD",
  ethusd: "ETHUSD", eth: "ETHUSD", ethereum: "ETHUSD",
  us500: "US500", spx: "US500", sp500: "US500",
  us30: "US30", dow: "US30",
  nas100: "NAS100", nasdaq: "NAS100", nas: "NAS100",
  usoil: "USOIL", wti: "USOIL", oil: "USOIL", crude: "USOIL",
};
const SYM_PATTERN = Object.keys(SYMBOL_MAP).sort((a, b) => b.length - a.length).join("|");

function tryRegexParse(message: string): ParsedSignal | null {
  const m = message.replace(/\n/g, " ").trim();

  // Detect BUY or SELL
  let action: "BUY" | "SELL" | null = null;
  if (/\b(buy|buying|long)\b/i.test(m)) action = "BUY";
  else if (/\b(sell|selling|short)\b/i.test(m)) action = "SELL";
  if (!action) return null;

  // Find symbol (longest first to avoid partial matches like "au" in "xau")
  const symRegex = new RegExp(`(${SYM_PATTERN})`, "i");
  const symMatch = m.match(symRegex);
  if (!symMatch) return null;
  const symbol = SYMBOL_MAP[symMatch[1].toLowerCase()] || symMatch[1].toUpperCase();

  // Extract entry price: "at 4333", "@ 4333", "Entry: 4530", "4444–4456", after symbol
  let entryPrice: number | null = null;
  const atMatch = m.match(/(?:at|@|entry[:\s]*)\s*(\d+(?:\.\d{1,5})?)/i);
  const rangeMatch = m.match(/(\d{4,5}(?:\.\d{1,2})?)\s*[–\-]\s*(\d{4,5}(?:\.\d{1,2})?)/);
  if (atMatch) entryPrice = parseFloat(atMatch[1]);
  else if (rangeMatch) entryPrice = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;

  // Extract SL
  const slMatch = m.match(/(?:SL|stop\s*loss|sl)[:\s]+(\d+(?:\.\d{1,5})?)/i);
  const stopLoss = slMatch ? parseFloat(slMatch[1]) : null;

  // Extract TPs
  const tpMatches = [...m.matchAll(/(?:TP\d?|take\s*profit\d?|tp\d?)[:\s]+(\d+(?:\.\d{1,5})?)/gi)];
  const takeProfits = tpMatches.map(t => parseFloat(t[1])).filter(n => !isNaN(n));

  return {
    action,
    symbol,
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
