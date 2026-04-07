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

  // Try regex first (free, instant) — akzeptiere IMMER wenn action+symbol erkannt
  const regexResult = tryRegexParse(message);
  if (regexResult) {
    const normalized = { ...regexResult, symbol: normalizeSymbol(regexResult.symbol || "") || regexResult.symbol };
    // Wenn Regex SL hat → direkt nutzen (kein AI nötig)
    if (normalized.stopLoss) return normalized;
    // Wenn kein SL → versuche AI, aber Regex als Fallback behalten
    try {
      const result = await cachedCall({
        prompt: PROMPTS.signalParser,
        message: message.slice(0, 500),
        model: MODELS.fast,
        maxTokens: 200,
      });
      const cleaned = result.replace(/```json\n?/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.action && parsed.action !== "UNKNOWN") {
        return {
          action: parsed.action || normalized.action,
          symbol: parsed.symbol ? normalizeSymbol(parsed.symbol) : normalized.symbol,
          entryPrice: parsed.entryPrice ?? normalized.entryPrice,
          stopLoss: parsed.stopLoss ?? null,
          takeProfits: Array.isArray(parsed.takeProfits) && parsed.takeProfits.length > 0 ? parsed.takeProfits : normalized.takeProfits,
          isModification: !!parsed.isModification,
          isClose: !!parsed.isClose,
          closePartial: parsed.closePartial ?? null,
          moveToBreakeven: !!parsed.moveToBreakeven,
          confidence: parsed.confidence ?? normalized.confidence,
        };
      }
    } catch {
      // AI down → Regex-Ergebnis direkt nutzen (SIGNAL DARF NICHT VERLOREN GEHEN)
    }
    return normalized;
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
    // Deutsche Trade-Management Befehle (Phenex-Muster)
    "nachziehen", "absichern", "sichern", "teilgewinn", "partial",
    "trail", "lock", "be setzen", "sl nachziehen",
    "gewinne mitnehmen", "gewinne absichern",
    "profite nehmen", "profit mit", "laufen lassen",
    "% raus", "sl auf",
  ];
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Parse Phenex-style Telegram-Befehle für Trade-Management.
 * Basiert auf echten Nachrichten aus "THE TRADING PHENEX" Channel.
 *
 * Phenex-Muster:
 *   "SL nach Belieben auf BE…" → Break Even
 *   "Break Even auf sicher wieder…" → Break Even
 *   "gerne wieder Break Even alles sichern!" → Secure
 *   "Teilgewinne nehmen" → Partial Close 30%
 *   "Profite nehmen und so…" → Partial Close 30%
 *   "nehme dort dann 50% raus!" → Partial Close 50%
 *   "Wir lassen die SELLS laufen nehmen bissl Profit mit" → Partial Close 30%
 *   "Schlechte Einstiege im Profit schließen" → Partial Close 30%
 *   "absichern und laufen lassen" → Secure
 *
 * FALSE POSITIVES zu vermeiden:
 *   "Break Even Hit" → Nur Info, KEIN Befehl
 *   "Seid ready für BUY" → Vorwarnung, NICHT traden
 *   "TP1 hit, that's +300 pips" → Info, kein Befehl
 */
export function parseManagementCommand(message: string): {
  type: "BREAK_EVEN" | "TRAIL" | "SECURE" | "PARTIAL_CLOSE" | "SL_UPDATE" | null;
  symbol: string | null;
  closePercent: number | null;
  newSL: number | null;
} {
  const lower = message.toLowerCase();

  // === FALSE POSITIVES ausfiltern ===
  // "Break Even Hit" = Status-Update, kein Befehl
  if (/break\s*even\s*hit/i.test(lower)) {
    return { type: null, symbol: null, closePercent: null, newSL: null };
  }
  // "TP1/2/3/4 hit" = Info, kein Befehl
  if (/tp\d?\s*hit/i.test(lower)) {
    return { type: null, symbol: null, closePercent: null, newSL: null };
  }
  // "Seid ready" = Vorwarnung
  if (/seid\s*ready/i.test(lower)) {
    return { type: null, symbol: null, closePercent: null, newSL: null };
  }

  // Symbol erkennen
  const symRegex = new RegExp(`(${Object.keys(SYMBOL_MAP).sort((a, b) => b.length - a.length).join("|")})`, "i");
  const symMatch = message.match(symRegex);
  const symbol = symMatch ? (SYMBOL_MAP[symMatch[1].toLowerCase()] || symMatch[1].toUpperCase()) : null;

  // === Konkreter SL-Preis: "SL auf 4650" ===
  const slPriceMatch = message.match(/sl\s+auf\s+(\d{3,5}(?:\.\d{1,3})?)/i);
  if (slPriceMatch) {
    return { type: "SL_UPDATE", symbol, closePercent: null, newSL: parseFloat(slPriceMatch[1]) };
  }

  // === Break Even (Phenex: "SL nach Belieben auf BE", "SL auf Break Even") ===
  if (
    /sl\s+(?:nach\s+belieben\s+)?auf\s+b(?:reak\s*)?e(?:ven)?/i.test(lower) ||
    /break\s*even/i.test(lower) ||
    lower.includes("be setzen") ||
    (/\bauf\s+be\b/i.test(lower))
  ) {
    return { type: "BREAK_EVEN", symbol, closePercent: null, newSL: null };
  }

  // === SL nachziehen / Trail ===
  if (lower.includes("nachziehen") || lower.includes("trail") || lower.includes("sl nachziehen") || lower.includes("sl enger")) {
    return { type: "TRAIL", symbol, closePercent: null, newSL: null };
  }

  // === Absichern / Sichern / Laufen lassen (Phenex: "absichern und laufen lassen") ===
  if (
    lower.includes("absichern") || lower.includes("sichern") ||
    lower.includes("lock") || lower.includes("gewinne absichern") ||
    /laufen\s+lassen/i.test(lower)
  ) {
    return { type: "SECURE", symbol, closePercent: null, newSL: null };
  }

  // === Partial Close mit dynamischem Prozentsatz ===
  // "50% raus", "30% schließen", etc.
  const pctMatch = message.match(/(\d{1,3})\s*%\s*(?:raus|schlie[ßs]en|close)/i);
  if (pctMatch) {
    const pct = Math.min(100, Math.max(10, parseInt(pctMatch[1])));
    return { type: "PARTIAL_CLOSE", symbol, closePercent: pct, newSL: null };
  }

  // === Teilgewinn / Profit nehmen (Phenex: "Teilgewinne nehmen", "Profite nehmen", "bissl Profit mit") ===
  if (
    lower.includes("teilgewinn") || lower.includes("partial") ||
    lower.includes("teil schliessen") || lower.includes("teil schließen") ||
    lower.includes("gewinne mitnehmen") || lower.includes("profit nehmen") ||
    /profite?\s+(nehmen|mitnehmen|mit\b)/i.test(lower) ||
    /(?:im\s+profit|einstiege)\s+schlie[ßs]en/i.test(lower)
  ) {
    return { type: "PARTIAL_CLOSE", symbol, closePercent: 30, newSL: null };
  }

  return { type: null, symbol: null, closePercent: null, newSL: null };
}
