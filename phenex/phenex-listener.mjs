#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — PHENEX REALTIME LISTENER
// Läuft auf Contabo Server via pm2
// Empfängt Telegram-Nachrichten in ECHTZEIT und führt sofort aus
// ═══════════════════════════════════════════════════════════════

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { readFileSync as _readFileSync, writeFileSync as _writeFileSync, existsSync as _existsSync } from "fs";

// BULLETPROOF: Persistent lastMessageId across restarts
const STATE_FILE = "C:/Users/Administrator/goldfoundry/phenex-state.json";
function loadState() {
  try {
    if (_existsSync(STATE_FILE)) {
      return JSON.parse(_readFileSync(STATE_FILE, "utf8"));
    }
  } catch (e) {}
  return { lastMessageId: 0 };
}
function saveState(state) {
  try { _writeFileSync(STATE_FILE, JSON.stringify(state), "utf8"); } catch (e) {}
}

// ═══ STAIR-STEP TRAIL — Signal-Group State ════════════════════
// User-Wunsch 2026-05-05: BE-Trail bei TP1 hit ist zu aggressiv. Stattdessen:
// TP1 hit → keine SL-Änderung an verbleibenden Splits.
// TP2 hit → SL der verbleibenden Splits auf TP1.
// TP3 hit → SL des Runners auf TP2.
const GROUPS_FILE = "C:/Users/Administrator/goldfoundry/phenex-groups.json";
function loadGroups() {
  try {
    if (_existsSync(GROUPS_FILE)) return JSON.parse(_readFileSync(GROUPS_FILE, "utf8"));
  } catch (e) {}
  return { groups: [] };
}
function saveGroups(s) {
  try { _writeFileSync(GROUPS_FILE, JSON.stringify(s, null, 2), "utf8"); } catch (e) {}
}
function appendGroup(g) {
  const s = loadGroups();
  s.groups.push(g);
  // Cleanup: groups älter als 7 Tage rauswerfen
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  s.groups = s.groups.filter(x => new Date(x.openedAt).getTime() > cutoff);
  saveGroups(s);
}
function isPositionInAnyGroup(posId) {
  const s = loadGroups();
  return s.groups.some(g => g.positions.some(p => p.positionId === posId));
}

// ═══ CONFIG ═══════════════════════════════════════════════════
const CONFIG = {
  telegram: {
    apiId: 27346428,
    apiHash: "474624b94fcf276b0f787d2061b1aa09",
    session: "1AgAOMTQ5LjE1NC4xNjcuNTEBuzu5FzjD6QWJWBWWH1DlC7W8t5+XUe2JPvfiRSUEbkdYmI6Yk90hXvd6Qpejklb4RmlhhLpoleUxfWBeTr7njq0+OgQZWnNdeFlhLimNa5NReUTYVjhCAUcx/31wtLhN9QJ/1mcTQc35fuTvnNesRn6NHz4rgaUoRFSVCMBIHJx4GFGJy3k71wJlC0rZib23E012CuXaTrXR1P/c4Qlf5hMsu7AZWAFT4fQaG0sjbayecdKBxRXr7joZgd24a32btEPBmISWC0J7tMYZf+4piUF9aKQHMgGPpkenN1GEI7QKddQkS/hFG3usQIJy2+Migc7l/e5kxYFUscbVLK0W4og=",
    channelId: "-1002568714747", // THE TRADING PHENEX
  },
  metaApi: {
    token: process.env.METAAPI_TOKEN || "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI0MjQ5ZWQ4MDEwZDNiNGJkZGU3YWQxMjBhNTJlYmQ3MCIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJiaWxsaW5nLWFwaSIsIm1ldGhvZHMiOlsiYmlsbGluZy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfV0sImlnbm9yZVJhdGVMaW1pdHMiOmZhbHNlLCJ0b2tlbklkIjoiMjAyMTAyMTMiLCJpbXBlcnNvbmF0ZWQiOmZhbHNlLCJyZWFsVXNlcklkIjoiNDI0OWVkODAxMGQzYjRiZGRlN2FkMTIwYTUyZWJkNzAiLCJpYXQiOjE3NzM5NDYxMTJ9.Kosa8veGvSNB-k55gx4rzSimVYRizHKxCuRmXz_uVvtZcyDzl3xrpKACg6LNjXsCkPpfjEuXZn-CCLLRnTGHOCsd4b5gOPdxwwYZz-p42emLyq7ods3OosYRZsc3SHaNUvb81Vc9o6YCl22XC2KBEVlW4518l6j4nyF5026DHhlTS2UHM4D9YdiKMxun_hwaIUqUuV2b1Nv2xO5UgqSblxXoQ5pX5HP4urKhtjO3kYlBoCwSntNHqMrvblaXORJpQHAPpuHjZzbHVPw8c-kw-2jR5I6Z7St60Yb-kSTkxtXaxUU0nn-1rkvODeupb_f4tj6Z4fxDOPO944xQMblnJlHoAQKxwejSW-_SceIDLPRWUvHoKPPrx0Qc2EYrXwssbXlPL3k164uRnn9RdYx2WOjUJeiMm9xuOO601ljo99-MNUFgdF9DERAR-rpOPK7XRl7xYzosH4-yd4z5nIzfLfqUGc16vxFbodDP24qWTBYQQ1dVwZhUar47MVL5VzelfAjdaXWW9z6gh4GsltaWtdwJKHvYLYawqf9OZyn2s_MugmQvh-ZnrUH1kvGgOwl1UzMVgPRUcVbKY465qg3OSZeacyfU1G7WuO0zV9M4Qnidt8Xd07kKacXREtiVyPfVa7RL32mrTcQy2EuZGcRqe0XL-5rJNZbiZ4h3K0GEmBw",
    accountId: process.env.METAAPI_ACCOUNT_ID || "e534fb5e-c8f7-44e3-a4f9-ab49b3e76d77", // PHANTOM Ronja TegasFX (seit 2026-05-04)
    region: "london",
  },
  risk: {
    // Lot-Sizing — Risk-basiert (User-Wunsch 2026-05-06): Lot ergibt sich aus Account-Equity × Risk% / SL-Distanz
    riskPercent: 1.0,               // Max Verlust pro Signal in % vom Equity (1% bei $100k = $1000)
    numSplits: 4,                   // Anzahl Splits pro Signal (TP1/TP2/TP3/TP4)
    maxLotsPerSplit: 1.0,           // Cap: bei sehr engem SL nicht über 1.0L pro Split
    minLotsPerSplit: 0.01,          // Broker-Minimum
    fixedLotsPerOrder: 0.3,         // Fallback wenn balance/SL-Distanz nicht verfügbar
    highRiskLotMultiplier: 0.5,     // HIGH-RISK Vorwarnung: ×0.5 zusätzlich
    // Caps
    maxOpenPositions: 10,           // Hard Cap (über alle Symbole)
    maxPositionsPerSymbol: 2,       // Pyramiding-Cap: max 2 Vitus-Positionen pro Symbol
    // DD-Schutz
    dailyDdCutoffPct: 3.0,          // Bei -3% Equity vom UTC-Tagesstart → autonom stoppen
    // Recovery-Filter
    recoveryWindowMs: 60 * 60 * 1000, // 60min: kein 2. Signal in selbe Richtung
    // Slippage
    maxSlippageGold: 20.0,
    maxSlippageForex: 0.0020,
    // High-Risk-Detection
    highRiskKeywords: ["HIGH RISK", "HIGHRISK", "RISKY", "HIGH-RISK"],
  },
};

// ═══ KAPITAL-SCHUTZ STATE ═══════════════════════════════════════
// Wird beim Boot von dailyDdProbe() initialisiert
let dailyEquityStart = null;     // Equity zum UTC-Tagesstart (00:00)
let dailyEquityStartDate = null; // YYYY-MM-DD String — bei Tageswechsel zurücksetzen
let tradingHalted = false;       // Master-Switch: bei DD-Cutoff = true, dann werden ALLE Signale geskippt
let metaApiHealthFails = 0;      // Counter für aufeinanderfolgende MetaApi-Health-Probe-Fehler
let lastIncomingMessageText = "";// Letzter Telegram-Message-Text (für High-Risk-Vorwarn-Detect)
let lastIncomingMessageAt = 0;
let lastSignalDirection = null;  // {symbol, action, ts} — für Recovery-Detection

// ═══ SYMBOL-CACHE (Latenz-Reduktion) ═══════════════════════════
// Bei Vitus läuft praktisch nur XAUUSD durch. Wenn wir den Broker-Symbol
// (mit oder ohne .pro Suffix) einmal aufgelöst haben, brauchen wir das
// nicht bei jedem Signal nochmal — spart 200-600ms pro Trade.
const SYMBOL_CACHE = new Map();
async function resolveBrokerSymbol(symbol) {
  if (SYMBOL_CACHE.has(symbol)) return SYMBOL_CACHE.get(symbol);
  let bs = symbol;
  try {
    await api.getPrice(symbol);
  } catch {
    bs = symbol + ".pro";
    try { await api.getPrice(bs); } catch { bs = symbol; }
  }
  SYMBOL_CACHE.set(symbol, bs);
  return bs;
}

// ═══ LOGGING ═════════════════════════════════════════════════
const log = (level, msg, data) => {
  const ts = new Date().toISOString();
  const icon = level === "ERROR" ? "🔴" : level === "WARN" ? "🟡" : level === "TRADE" ? "💰" : "🟢";
  console.log(`${icon} [${ts}] [${level}] ${msg}`, data ? JSON.stringify(data) : "");
};

// ═══ METAAPI REST CLIENT ═════════════════════════════════════
const META_BASE = `https://mt-client-api-v1.${CONFIG.metaApi.region}.agiliumtrade.ai`;
const META_PROV = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

async function metaFetch(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { "auth-token": CONFIG.metaApi.token, "Content-Type": "application/json", ...(options?.headers ?? {}) },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MetaApi ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

const api = {
  getPositions: () => metaFetch(`${META_BASE}/users/current/accounts/${CONFIG.metaApi.accountId}/positions`),
  getPrice: (symbol) => metaFetch(`${META_BASE}/users/current/accounts/${CONFIG.metaApi.accountId}/symbols/${symbol}/current-price`),
  getCandles: (symbol, tf, count) => metaFetch(`${META_BASE}/users/current/accounts/${CONFIG.metaApi.accountId}/historical-market-data/symbols/${symbol}/timeframes/${tf}/candles?limit=${count}`),
  getAccount: () => metaFetch(`${META_BASE}/users/current/accounts/${CONFIG.metaApi.accountId}/account-information`),
  trade: (payload) => metaFetch(`${META_BASE}/users/current/accounts/${CONFIG.metaApi.accountId}/trade`, { method: "POST", body: JSON.stringify(payload) }),
  modifyPosition: (posId, sl, tp) => {
    const p = { actionType: "POSITION_MODIFY", positionId: posId };
    if (sl !== null && sl !== undefined) p.stopLoss = sl;
    if (tp !== null && tp !== undefined) p.takeProfit = tp;
    return api.trade(p);
  },
  closePosition: (posId) => api.trade({ actionType: "POSITION_CLOSE_ID", positionId: posId }),
  closePartial: (posId, volume) => api.trade({ actionType: "POSITION_CLOSE_ID", positionId: posId, volume }),
  buy: (symbol, lots, sl, tp, comment) => {
    const p = { actionType: "ORDER_TYPE_BUY", symbol, volume: lots, comment };
    if (sl) p.stopLoss = sl;
    if (tp) p.takeProfit = tp;
    return api.trade(p);
  },
  sell: (symbol, lots, sl, tp, comment) => {
    const p = { actionType: "ORDER_TYPE_SELL", symbol, volume: lots, comment };
    if (sl) p.stopLoss = sl;
    if (tp) p.takeProfit = tp;
    return api.trade(p);
  },
};

// ═══ SL CONFIG ═══════════════════════════════════════════════
const BE_BUFFER = { XAUUSD: 1.5, "XAUUSD.pro": 1.5, XAGUSD: 0.05, US30: 15, NAS100: 20, US500: 3, BTCUSD: 50 };
const MIN_SL_DIST = { XAUUSD: 2.0, "XAUUSD.pro": 2.0, XAGUSD: 0.08, US30: 20, NAS100: 25, US500: 5, BTCUSD: 100 };
const SL_COOLDOWN_MS = 2 * 60 * 1000;
const lastSLChange = new Map();

function getBeBuffer(sym) { return BE_BUFFER[sym] ?? BE_BUFFER[sym.replace(".pro", "")] ?? 1.0; }
function getMinDist(sym) { return MIN_SL_DIST[sym] ?? MIN_SL_DIST[sym.replace(".pro", "")] ?? 2.0; }
function canModifySL(posId) { const t = lastSLChange.get(posId) || 0; return Date.now() - t >= SL_COOLDOWN_MS; }
function recordSL(posId) { lastSLChange.set(posId, Date.now()); }

function enforceMinDist(sym, dir, price, sl) {
  const min = getMinDist(sym);
  const dist = dir === "BUY" ? price - sl : sl - price;
  if (dist < min) return dir === "BUY" ? price - min : price + min;
  return sl;
}

function calcBE(sym, dir, entry) {
  const buf = getBeBuffer(sym);
  return dir === "BUY" ? entry + buf : entry - buf;
}

// ═══ SYMBOL MAP ══════════════════════════════════════════════
const SYMBOL_MAP = {
  gold: "XAUUSD", xau: "XAUUSD", xauusd: "XAUUSD",
  silver: "XAGUSD", xag: "XAGUSD",
  eurusd: "EURUSD", gbpusd: "GBPUSD", usdjpy: "USDJPY",
  us30: "US30", dow: "US30", nas100: "NAS100", nasdaq: "NAS100", nas: "NAS100", us500: "US500",
  btcusd: "BTCUSD", btc: "BTCUSD", ethusd: "ETHUSD",
};

function resolveSymbol(text) {
  const lower = text.toLowerCase();
  for (const [alias, sym] of Object.entries(SYMBOL_MAP)) {
    if (lower.includes(alias)) return sym;
  }
  return null;
}

// ═══ SIGNAL PARSER ═══════════════════════════════════════════
function parseSignal(text) {
  const m = text.replace(/\n/g, " ").trim();
  let action = null;
  if (/\b(buy|buying|long)\b/i.test(m)) action = "BUY";
  else if (/\b(sell|selling|short)\b/i.test(m)) action = "SELL";

  const symbol = resolveSymbol(m);

  // Entry price
  let entry = null;
  const atMatch = m.match(/(?:at|@|entry[:\s]*)\s*(\d+(?:\.\d{1,5})?)/i);
  const rangeMatch = m.match(/(\d{4,5}(?:\.\d{1,2})?)\s*[–\-]\s*(\d{4,5}(?:\.\d{1,2})?)/);
  if (atMatch) entry = parseFloat(atMatch[1]);
  else if (rangeMatch) entry = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;

  // SL
  const slMatch = m.match(/(?:SL|stop\s*loss)[:\s]+(\d+(?:\.\d{1,5})?)/i);
  const sl = slMatch ? parseFloat(slMatch[1]) : null;

  // TPs
  const tpMatches = [...m.matchAll(/(?:TP\d?|take\s*profit\d?)[:\s]+(\d+(?:\.\d{1,5})?)/gi)];
  const tps = tpMatches.map(t => parseFloat(t[1])).filter(n => !isNaN(n));

  if (!action || !symbol) return null;
  return { action, symbol, entry, sl, tps };
}

// ═══ MANAGEMENT COMMAND PARSER ═══════════════════════════════
function parseMgmtCommand(text) {
  const lower = text.toLowerCase();

  // False positives: check if management command exists alongside TP hit
  const hasCmd = /auf\s+be|break\s*even(?!\s*hit)|absichern|sichern|profite?\s+nehmen|teilgewinn|nachziehen|sl\s+auf\s+\d/i.test(lower);

  if (/break\s*even\s*hit/i.test(lower) && !hasCmd) return null;
  if (/tp\d?\s*hit/i.test(lower) && !hasCmd) return null;
  if (/seid\s*ready/i.test(lower)) return null;

  const symbol = resolveSymbol(text);

  // Konkreter SL-Preis
  const slMatch = text.match(/sl\s+auf\s+(\d{3,5}(?:\.\d{1,3})?)/i);
  if (slMatch) {
    let newSL = parseFloat(slMatch[1]);
    // Gold Fix: Phenex schreibt oft 3740 statt 4740 (ohne Tausender)
    if ((symbol === "XAUUSD" || !symbol) && newSL >= 2000 && newSL < 4500) {
      newSL += 1000;
    }
    return { type: "SL_UPDATE", symbol, newSL };
  }

  // Break Even
  if (/sl\s+(?:nach\s+belieben\s+)?auf\s+b(?:reak\s*)?e(?:ven)?/i.test(lower) || /break\s*even/i.test(lower) || /\bauf\s+be\b/i.test(lower)) {
    return { type: "BREAK_EVEN", symbol };
  }

  // Trail
  if (lower.includes("nachziehen") || lower.includes("trail") || lower.includes("sl enger")) {
    return { type: "TRAIL", symbol };
  }

  // Secure
  if (lower.includes("absichern") || lower.includes("sichern") || lower.includes("lock") || lower.includes("gewinne absichern") || /laufen\s+lassen/i.test(lower)) {
    return { type: "SECURE", symbol };
  }

  // Partial Close mit Prozent
  const pctMatch = text.match(/(\d{1,3})\s*%\s*(?:raus|schlie[ßs]en|close)/i);
  if (pctMatch) return { type: "PARTIAL_CLOSE", symbol, pct: Math.min(100, Math.max(10, parseInt(pctMatch[1]))) };

  // Teilgewinn / Profit nehmen
  if (lower.includes("teilgewinn") || lower.includes("profit nehmen") || lower.includes("gewinne mitnehmen") ||
      /profite?\s+(nehmen|mitnehmen|mit\b)/i.test(lower) || /(?:im\s+profit|einstiege)\s+schlie[ßs]en/i.test(lower)) {
    return { type: "PARTIAL_CLOSE", symbol, pct: 30 };
  }

  return null;
}

// ═══ LOT CALCULATOR ══════════════════════════════════════════
function calcLots(balance, riskPct, slPips, symbol) {
  if (slPips <= 0) return 0.01;
  const riskAmount = balance * (riskPct / 100);
  const isGold = /xau|gold/i.test(symbol);
  const pipValue = isGold ? 1.0 : /jpy/i.test(symbol) ? 100 : 10;
  const lots = riskAmount / (slPips * pipValue);
  return Math.max(0.01, Math.round(lots * 100) / 100);
}

function pipSize(symbol) {
  if (/jpy/i.test(symbol)) return 0.01;
  if (/xau|gold/i.test(symbol)) return 0.01;
  return 0.0001;
}

// ═══ EXECUTE BUY/SELL SIGNAL ═════════════════════════════════
async function executeSignal(signal) {
  const startMs = Date.now();
  try {
    // ═══ KAPITAL-SCHUTZ GUARDS ═══════════════════════════════
    // 0a. Trading-Halt (DD-Cutoff getriggert)?
    if (tradingHalted) {
      log("WARN", `[GUARD] Trading-Halt aktiv (DD-Cutoff) — Signal verworfen`);
      try {
        await client.sendMessage("me", {
          message: `🛑 Gold Foundry SIGNAL VERWORFEN\n\nTrading-Halt aktiv (Daily-DD-Cutoff).\nSignal: ${signal.action} ${signal.symbol}\n\nManueller Reset nötig (pm2 restart phenex-listener).`,
        });
      } catch {}
      return;
    }

    // 0b. HARD-SL-GUARD: Trade ohne expliziten SL aus Signal → SKIP.
    // Verhindert Auto-SL auf Vitus' Vorwarn-Tease-Messages ("XAU BUY HIGH RISK 🚨"),
    // die der Parser fälschlich als Signal erkennt.
    if (!signal.sl || isNaN(Number(signal.sl))) {
      log("WARN", `[GUARD] HARD-SL-MISS: ${signal.action} ${signal.symbol} ohne SL — SKIP`);
      try {
        await client.sendMessage("me", {
          message: `⚠️ Gold Foundry SL-LESS SKIP\n\n${signal.action} ${signal.symbol}\n(Tease/Vorwarn-Message ohne SL)\n\nSignal verworfen. Echtes Signal mit SL kommt vermutlich gleich.`,
        });
      } catch {}
      return;
    }

    // 0c. Recovery-Detection: kein 2. Signal in selbe Richtung innerhalb 60min
    if (lastSignalDirection
        && lastSignalDirection.symbol === signal.symbol
        && lastSignalDirection.action === signal.action
        && Date.now() - lastSignalDirection.ts < CONFIG.risk.recoveryWindowMs) {
      const minsAgo = Math.round((Date.now() - lastSignalDirection.ts) / 60000);
      log("WARN", `[GUARD] RECOVERY-SKIP: ${signal.action} ${signal.symbol} (gleiches Signal vor ${minsAgo}min)`);
      try {
        await client.sendMessage("me", {
          message: `🛑 Gold Foundry RECOVERY-SKIP\n\n${signal.action} ${signal.symbol}\nGleiches Signal vor ${minsAgo}min schon getradet. Recovery-Add wird verworfen.`,
        });
      } catch {}
      return;
    }

    // ═══ FAST PATH: Symbol-Resolve (cached) + Pre-Trade Parallel ═══
    // Symbol-Resolve ist nach Boot-Pre-Warm typisch 0ms (Cache-Hit).
    // Dann getPositions UND (nur bei Limit-Order) getPrice parallel.
    const brokerSymbol = await resolveBrokerSymbol(signal.symbol);
    const isLimitOrder = !!signal.entry;

    const preTradePromises = [api.getPositions()];
    if (isLimitOrder) preTradePromises.push(api.getPrice(brokerSymbol));
    const preTradeResults = await Promise.all(preTradePromises);
    const positions = preTradeResults[0];
    const tick = isLimitOrder ? preTradeResults[1] : null;

    // Position limit check (global)
    if (positions.length >= CONFIG.risk.maxOpenPositions) {
      log("WARN", `[GUARD] Max ${CONFIG.risk.maxOpenPositions} Positionen erreicht — übersprungen`);
      return;
    }

    // Pyramiding-Cap: max N Vitus-Positionen pro Symbol
    const sameSymbolPositions = positions.filter(p => {
      const sym = p.symbol.toUpperCase();
      return sym.includes(signal.symbol.toUpperCase().replace(".PRO", ""))
          && (p.comment || "").startsWith("TG-");
    });
    if (sameSymbolPositions.length >= CONFIG.risk.maxPositionsPerSymbol) {
      log("WARN", `[GUARD] PYRAMIDING-CAP: ${sameSymbolPositions.length} ${signal.symbol}-Positionen schon offen — SKIP`);
      try {
        await client.sendMessage("me", {
          message: `🛑 Gold Foundry PYRAMIDING-CAP\n\n${signal.action} ${signal.symbol}\n${sameSymbolPositions.length}/${CONFIG.risk.maxPositionsPerSymbol} Positionen schon offen. Signal verworfen.`,
        });
      } catch {}
      return;
    }

    // Slippage-Check NUR bei Limit-Order (entry vorgegeben). Bei MARKET egal.
    if (isLimitOrder && tick) {
      const currentPrice = tick.bid || tick.ask;
      const isGold = /xau|gold/i.test(brokerSymbol);
      const maxSlip = isGold ? CONFIG.risk.maxSlippageGold : CONFIG.risk.maxSlippageForex;
      if (Math.abs(currentPrice - signal.entry) > maxSlip) {
        log("WARN", `Slippage zu hoch: ${currentPrice} vs ${signal.entry} — übersprungen`);
        return;
      }
    }

    // SL aus Signal — Hard-SL-Guard hat oben bereits sichergestellt dass signal.sl existiert
    const sl = Number(signal.sl);

    // Auto-TPs wenn keine im Signal (SL existiert garantiert hier)
    let tps = [...signal.tps];
    if (tps.length === 0 && signal.entry) {
      const slDist = Math.abs(signal.entry - sl);
      for (const mult of [1.5, 2.5, 3.5, 5.0]) {
        tps.push(Math.round((signal.action === "BUY" ? signal.entry + slDist * mult : signal.entry - slDist * mult) * 100) / 100);
      }
    }

    // TP-Auffüllung: wenn < 4 TPs, linear extrapolieren damit jeder Split einen TP bekommt
    while (tps.length > 0 && tps.length < 4) {
      const last = tps[tps.length - 1];
      const prev = tps.length >= 2 ? tps[tps.length - 2] : (signal.entry ?? last);
      const step = last - prev;
      tps.push(Math.round((last + step) * 100) / 100);
    }

    // ═══ RISK-BASIERTES LOT-SIZING ══════════════════════════════
    // Lot ergibt sich aus Equity × Risk% / SL-Distanz / Anzahl Splits.
    // Bei XAUUSD: 1$ Bewegung = $100 PnL pro Lot (contract size 100 oz).
    // Damit ist das Risk pro Signal konstant, egal ob SL eng (4$) oder weit (20$) ist.
    let lotsPerOrder = CONFIG.risk.fixedLotsPerOrder; // Fallback
    let lotMode = "FIXED-FALLBACK";
    let riskInfo = null;
    try {
      const acct = await api.getAccount();
      const equity = acct?.equity || acct?.balance || 0;
      let entryPx = signal.entry;
      if (!entryPx) {
        const tick = await api.getPrice(brokerSymbol);
        entryPx = signal.action === "BUY" ? tick?.ask : tick?.bid;
      }
      const slDist = entryPx && sl ? Math.abs(entryPx - sl) : null;
      if (equity > 0 && slDist && slDist > 0) {
        const isGold = /xau|gold/i.test(brokerSymbol);
        const contractSize = isGold ? 100 : 100000;
        const riskAmount = equity * (CONFIG.risk.riskPercent / 100);
        const totalRiskLots = riskAmount / (slDist * contractSize);
        let perSplit = totalRiskLots / CONFIG.risk.numSplits;
        perSplit = Math.max(CONFIG.risk.minLotsPerSplit, Math.min(CONFIG.risk.maxLotsPerSplit, perSplit));
        perSplit = +perSplit.toFixed(2);
        lotsPerOrder = perSplit;
        lotMode = "RISK-BASED";
        riskInfo = { equity: +equity.toFixed(0), riskPct: CONFIG.risk.riskPercent, riskAmount: +riskAmount.toFixed(0), slDist: +slDist.toFixed(2), perSplit, totalLots: +(perSplit * CONFIG.risk.numSplits).toFixed(2) };
        log("INFO", `[RISK-SIZING] equity=$${equity.toFixed(0)} risk=${CONFIG.risk.riskPercent}%=$${riskAmount.toFixed(0)} SLdist=$${slDist.toFixed(2)} → ${perSplit}L/split (${(perSplit * CONFIG.risk.numSplits).toFixed(2)}L total)`);
      } else {
        log("WARN", `[RISK-SIZING] equity=${equity} slDist=${slDist} — Fallback auf fix ${lotsPerOrder}L`);
      }
    } catch (e) {
      log("WARN", `[RISK-SIZING] failed: ${e.message} — Fallback auf fix ${lotsPerOrder}L`);
    }

    // HIGH-RISK Halving: zusätzlich ×0.5 wenn HIGH-RISK Keyword innerhalb 5min vorm Signal kam
    const recentMsgAgeMs = Date.now() - lastIncomingMessageAt;
    if (recentMsgAgeMs < 5 * 60 * 1000) {
      const upperMsg = (lastIncomingMessageText || "").toUpperCase();
      if (CONFIG.risk.highRiskKeywords.some(kw => upperMsg.includes(kw))) {
        lotsPerOrder = +(lotsPerOrder * CONFIG.risk.highRiskLotMultiplier).toFixed(2);
        lotsPerOrder = Math.max(CONFIG.risk.minLotsPerSplit, lotsPerOrder);
        lotMode = lotMode + "+HIGH-RISK-HALVED";
        log("WARN", `[GUARD] HIGH-RISK-Vorwarnung erkannt — Lot-Size halbiert auf ${lotsPerOrder}L pro Split`);
      }
    }

    const splits = [];
    for (let i = 0; i < 4; i++) {
      const lots = lotsPerOrder;
      const tp = i < tps.length ? tps[i] : null;
      const label = i < tps.length ? `TP${i + 1}` : "RUNNER";
      splits.push({ lots, tp, label });
    }

    // Comment-Tag (Pyramiding-Cap matched auf "TG-")
    const commentBase = lotMode === "HIGH-RISK-HALVED" ? "TG-PhxHR" : "TG-Phenex";

    // ═══ TP-PRE-VALIDATION ═══════════════════════════════════════════
    // Prüft jeden Split-TP gegen aktuellen Bid/Ask + min-stop-distance.
    // Ungültige TPs werden zu null → Order wird OHNE TP gesetzt (statt INVALID_STOPS Reject).
    // Das stellt sicher dass IMMER 4 Splits öffnen, auch wenn Markt weit von Signal-Zone steht.
    try {
      const tick = await api.getPrice(brokerSymbol);
      if (tick && (tick.bid || tick.ask)) {
        const minDist = getMinDist(brokerSymbol);
        for (const s of splits) {
          if (s.tp == null) continue;
          if (signal.action === "BUY" && s.tp <= (tick.ask || 0) + minDist) {
            log("WARN", `[VALIDATE] ${s.label} TP=${s.tp} ungültig für BUY (Ask=${tick.ask}+${minDist}) → Split öffnet ohne TP`);
            s.tp = null;
          } else if (signal.action === "SELL" && s.tp >= (tick.bid || 1e9) - minDist) {
            log("WARN", `[VALIDATE] ${s.label} TP=${s.tp} ungültig für SELL (Bid=${tick.bid}-${minDist}) → Split öffnet ohne TP`);
            s.tp = null;
          }
        }
      }
    } catch (e) {
      log("WARN", `[VALIDATE] getPrice failed: ${e.message} — TPs ungeprüft an Broker`);
    }

    // PARALLEL EXECUTION — alle Orders gleichzeitig
    const method = signal.action === "BUY" ? api.buy : api.sell;
    const results = await Promise.allSettled(
      splits.map(s => method(brokerSymbol, s.lots, sl, s.tp, `${commentBase} ${s.label}`))
    );

    // ECHTER fill-Count: HTTP-OK reicht nicht — muss stringCode=DONE oder numericCode=10009 sein.
    const isOk = (r) => {
      if (r.status !== "fulfilled") return false;
      const v = r.value;
      return v?.stringCode === "TRADE_RETCODE_DONE" || v?.numericCode === 10009 || v?.numericCode === 0;
    };
    const filled = results.filter(isOk).length;
    // Log Reject-Reasons damit wir sie sehen
    results.forEach((r, i) => {
      if (!isOk(r)) {
        const reason = r.status === "rejected"
          ? (r.reason?.message || String(r.reason)).slice(0, 200)
          : `${r.value?.stringCode || "?"}/${r.value?.numericCode || "?"}: ${r.value?.message || ""}`;
        log("ERROR", `[REJECT] Split ${splits[i].label} (${signal.action} ${brokerSymbol}): ${reason}`);
      }
    });
    const execMs = Date.now() - startMs;

    const totalLots = +(splits.reduce((sum, s) => sum + s.lots, 0)).toFixed(2);
    log("TRADE", `${signal.action} ${brokerSymbol} — ${filled}/${splits.length} Orders in ${execMs}ms (${lotMode}, ${totalLots}L)`, {
      totalLots, splits: splits.map(s => `${s.label}=${s.lots}L`), sl, tps, lotMode, riskInfo,
    });

    // Recovery-Detection: nur bei erfolgreichem Trade (>=1 Order) merken
    if (filled > 0) {
      lastSignalDirection = { symbol: signal.symbol, action: signal.action, ts: Date.now() };
    }
    // VERIFY-AND-LOG: Trade Verification — pruefe ob Position wirklich auf MetaApi existiert
    if (filled > 0) {
      try {
        await new Promise(r => setTimeout(r, 2000)); // 2s warten bis MetaApi sync
        const verifyPositions = await api.getPositions();
        const matchingPositions = verifyPositions.filter(p => {
          const sameDir = (p.type === "POSITION_TYPE_BUY" && signal.action === "BUY") ||
                          (p.type === "POSITION_TYPE_SELL" && signal.action === "SELL");
          return sameDir && p.symbol.toUpperCase().includes(brokerSymbol.replace(".pro", "").toUpperCase());
        });
        if (matchingPositions.length === 0) {
          log("ERROR", `🚨 VERIFY: ${signal.action} ${brokerSymbol} — Order gesendet aber KEINE Position auf MetaApi gefunden!`);
          try {
            await client.sendMessage("me", {
              message: `🚨 Gold Foundry VERIFY-FAIL\n\n${signal.action} ${brokerSymbol}\nSL: ${sl}\n\n${filled}/${splits.length} Orders gesendet aber KEINE Position auf MetaApi gefunden!\n\nManuell pruefen!`,
            });
          } catch {}
        } else {
          log("INFO", `✅ VERIFY: ${matchingPositions.length} Position(en) auf MetaApi bestaetigt`);
          logMessage(0, `${signal.action} ${brokerSymbol} ${filled}L verified`, "trade-verified");

          // ═══ STAIR-STEP: Speichere Signal-Group ═══
          // Filter auf nur die JETZT geöffneten Splits (commentBase + letzte 30s)
          const cutoffMs = Date.now() - 30 * 1000;
          const splitsForGroup = matchingPositions.filter(p =>
            (p.comment || "").startsWith(commentBase) &&
            new Date(p.time).getTime() >= cutoffMs
          );
          if (splitsForGroup.length > 0) {
            const groupPositions = splitsForGroup.map(p => {
              const m = (p.comment || "").match(/(TP[1-4]|RUNNER)/);
              return { label: m ? m[1] : "?", positionId: p.id, tp: p.takeProfit ?? null, openPrice: p.openPrice };
            });
            // Stair-Step tps[]: wenn ein Split-TP per Validation auf null gesetzt wurde,
            // verwende statt des ungültigen Original-TPs den Entry-Preis (BE-Fallback).
            // So springt SL bei TP2-Hit auf BE statt auf einen ungültigen Wert.
            const entryPrice = signal.entry || splitsForGroup[0].openPrice;
            const stairTps = splits.map((s, i) => s.tp ?? (tps[i] ?? entryPrice) ?? entryPrice);
            // Falls validation TP1 invalidiert hat: zwinge tps[0]=entry für BE-Fallback
            for (let i = 0; i < splits.length; i++) {
              if (splits[i].tp == null) stairTps[i] = entryPrice;
            }
            appendGroup({
              id: `g_${Date.now()}`,
              symbol: brokerSymbol,
              side: signal.action,
              entry: entryPrice,
              sl: sl,
              tps: stairTps,
              openedAt: new Date().toISOString(),
              positions: groupPositions,
            });
            log("INFO", `[STAIR-STEP] Group saved: ${signal.action} ${brokerSymbol} ${groupPositions.length} splits, SL=${sl}, TPs=[${stairTps.join(",")}]`);
          }
        }
      } catch (verifyErr) {
        log("WARN", `Verify failed: ${verifyErr.message}`);
      }
    }
    // BULLETPROOF: Alert when 0 orders filled
    if (filled === 0) {
      try {
        const firstErr = results.find(r => r.status === "rejected");
        const errMsg = firstErr ? (firstErr.reason?.message || String(firstErr.reason)).slice(0, 200) : "unknown";
        await client.sendMessage("me", {
          message: `🚨 Gold Foundry 0/${splits.length} ORDERS\n\n${signal.action} ${brokerSymbol}\nEntry: ${signal.entry || "MARKET"}\nSL: ${sl}\n\nKeine Order gesetzt!\nFehler: ${errMsg}`,
        });
      } catch {}
    } else if (filled < splits.length) {
      try {
        await client.sendMessage("me", {
          message: `⚠️ Gold Foundry PARTIAL FILL\n\n${signal.action} ${brokerSymbol}\nNur ${filled}/${splits.length} Orders gesetzt.`,
        });
      } catch {}
    }
  } catch (err) {
    log("ERROR", `Signal execution failed: ${err.message}`);
    // BULLETPROOF: Alert on signal failure
    try {
      await client.sendMessage("me", {
        message: `🚨 Gold Foundry SIGNAL FEHLER\n\n${signal.action} ${signal.symbol}\nEntry: ${signal.entry || "MARKET"}\nSL: ${signal.sl}\n\nFehler: ${err.message}\n\nTrade wurde NICHT gesetzt!`,
      });
    } catch {}
  }
}

// ═══ EXECUTE MANAGEMENT COMMAND ══════════════════════════════
async function executeMgmtCommand(cmd) {
  try {
    const positions = await api.getPositions();
    const matching = positions.filter(p => {
      if (cmd.symbol && !p.symbol.toUpperCase().includes(cmd.symbol)) return false;
      return p.comment?.includes("TG-") || true; // alle Positionen
    });

    if (matching.length === 0) {
      log("INFO", `[${cmd.type}] Keine offenen Positionen`);
      return;
    }

    let modified = 0;
    for (const pos of matching) {
      if (cmd.type !== "PARTIAL_CLOSE" && !canModifySL(pos.id)) {
        log("INFO", `[COOLDOWN] ${pos.symbol} — übersprungen`);
        continue;
      }

      const dir = pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";

      switch (cmd.type) {
        case "BREAK_EVEN": {
          const beSL = calcBE(pos.symbol, dir, pos.openPrice);
          const better = dir === "BUY" ? beSL > (pos.stopLoss || 0) : beSL < pos.stopLoss || !pos.stopLoss;
          if (better) {
            await api.modifyPosition(pos.id, beSL, pos.takeProfit);
            recordSL(pos.id);
            log("TRADE", `[BE] ${pos.symbol} SL → ${beSL.toFixed(2)} (Entry ${pos.openPrice} + Buffer)`);
            modified++;
          }
          break;
        }

        case "TRAIL": {
          let atr = /xau|gold/i.test(pos.symbol) ? 5.0 : 0.005;
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

          const tick = await api.getPrice(pos.symbol);
          const price = dir === "BUY" ? tick.bid : tick.ask;
          const profitATR = dir === "BUY" ? (price - pos.openPrice) / atr : (pos.openPrice - price) / atr;
          const buf = getBeBuffer(pos.symbol);

          let newSL;
          if (profitATR < 1.0) { continue; } // Nicht genug Gewinn
          else if (profitATR < 2.0) newSL = dir === "BUY" ? pos.openPrice + buf : pos.openPrice - buf;
          else if (profitATR < 3.0) newSL = dir === "BUY" ? pos.openPrice + atr : pos.openPrice - atr;
          else if (profitATR < 4.0) newSL = dir === "BUY" ? pos.openPrice + atr * 2 : pos.openPrice - atr * 2;
          else newSL = dir === "BUY" ? pos.openPrice + atr * 3 : pos.openPrice - atr * 3;

          const safeSL = enforceMinDist(pos.symbol, dir, price, newSL);
          const better = dir === "BUY" ? safeSL > (pos.stopLoss || 0) : safeSL < pos.stopLoss || !pos.stopLoss;
          if (better) {
            await api.modifyPosition(pos.id, safeSL, pos.takeProfit);
            recordSL(pos.id);
            log("TRADE", `[TRAIL] ${pos.symbol} SL → ${safeSL.toFixed(2)} (${profitATR.toFixed(1)}× ATR)`);
            modified++;
          }
          break;
        }

        case "SECURE": {
          let atr = /xau|gold/i.test(pos.symbol) ? 5.0 : 0.005;
          try {
            const candles = await api.getCandles(pos.symbol, "1h", 15);
            if (Array.isArray(candles) && candles.length >= 2) {
              let sum = 0;
              for (let i = 1; i < candles.length; i++) sum += Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - candles[i - 1].close), Math.abs(candles[i].low - candles[i - 1].close));
              atr = sum / (candles.length - 1);
            }
          } catch {}
          const secureSL = dir === "BUY" ? pos.openPrice + atr : pos.openPrice - atr;
          const beSL = calcBE(pos.symbol, dir, pos.openPrice);
          const bestSL = dir === "BUY" ? Math.max(secureSL, beSL) : Math.min(secureSL, beSL);
          const better = dir === "BUY" ? bestSL > (pos.stopLoss || 0) : bestSL < pos.stopLoss || !pos.stopLoss;
          if (better) {
            await api.modifyPosition(pos.id, bestSL, pos.takeProfit);
            recordSL(pos.id);
            log("TRADE", `[SECURE] ${pos.symbol} SL → ${bestSL.toFixed(2)} (1× ATR Gewinn)`);
            modified++;
          }
          break;
        }

        case "PARTIAL_CLOSE": {
          const pct = cmd.pct || 30;
          const closeLots = Math.max(0.01, Math.floor(pos.volume * (pct / 100) * 100) / 100);
          if (closeLots >= 0.01 && closeLots < pos.volume) {
            await api.closePartial(pos.id, closeLots);
            log("TRADE", `[PARTIAL] ${pos.symbol} ${pct}% = ${closeLots}L geschlossen`);
            modified++;
          }
          break;
        }

        case "SL_UPDATE": {
          if (cmd.newSL) {
            const tick = await api.getPrice(pos.symbol);
            const price = dir === "BUY" ? tick.bid : tick.ask;
            // Gold Fix: SL muss im Preisbereich sein (±200 vom aktuellen Preis)
            if (/xau|gold/i.test(pos.symbol) && Math.abs(cmd.newSL - price) > 200) {
              if (cmd.newSL < price - 200 && cmd.newSL + 1000 < price + 200) cmd.newSL += 1000;
            }
            const safeSL = enforceMinDist(pos.symbol, dir, price, cmd.newSL);
            const better = dir === "BUY" ? safeSL > (pos.stopLoss || 0) : safeSL < pos.stopLoss || !pos.stopLoss;
            if (better) {
              await api.modifyPosition(pos.id, safeSL, pos.takeProfit);
              recordSL(pos.id);
              log("TRADE", `[SL] ${pos.symbol} SL → ${safeSL.toFixed(2)}`);
              modified++;
            }
          }
          break;
        }
      }
    }
    log("INFO", `[${cmd.type}] ${modified}/${matching.length} Positionen modifiziert`);
  } catch (err) {
    log("ERROR", `Management command failed: ${err.message}`);
  }
}

// ═══ WATCHDOG STATE ══════════════════════════════════════════
// lastMessageAt = letzter erfolgreich verarbeiteter Telegram-Update
// errorCount/errorWindowStart = Rolling-Window Error Counter
// lastStaleAlert = Dedup damit wir nicht jede Runde alerten
let lastMessageAt = Date.now();
let errorCount = 0;
let errorWindowStart = Date.now();
let lastStaleAlert = 0;
const ERROR_WINDOW_MS = 60 * 1000;
const ERROR_THRESHOLD = 10;                      // >10 Errors/min → exit
const STALE_ALERT_MS = 10 * 60 * 1000;           // >10min keine Poll -> exit
const STALE_ALERT_COOLDOWN_MS = 60 * 60 * 1000;  // max 1 Alert/h

// ═══ MESSAGE HANDLER ═════════════════════════════════════════
const processedMessages = new Set();
// Track edited messages (msgId → last seen editDate)
const editedSeen = new Map();

const DEDUP_TTL = 10 * 60 * 1000;

// VERIFY-AND-LOG
const MESSAGE_LOG_FILE = "C:/Users/Administrator/goldfoundry/messages.log";
function logMessage(msgId, text, action) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      msgId,
      action,
      text: text.slice(0, 500),
    }) + "\n";
    _writeFileSync(MESSAGE_LOG_FILE, line, { encoding: "utf8", flag: "a" });
  } catch {}
}


// === EDITED MESSAGE HANDLER — SL/TP Updates nach Edit ===
async function handleEditedMessage(event) {
  try {
    const msg = event.originalUpdate?.message;
    if (!msg?.message) return;
    const text = msg.message.trim();
    if (text.length < 3) return;

    log("INFO", "[EDIT] Text: " + text.slice(0, 100));

    // Parse als Signal (SL/TP aus Edit holen)
    const signal = parseSignal(text);
    if (signal && (signal.sl || signal.tps.length > 0)) {
      // Anstatt neuen Trade: SL/TP auf bestehende Positionen setzen
      try {
        const positions = await api.getPositions();
        const now = Date.now();
        // Matche nur Positionen der letzten 10 Min mit passendem Symbol
        const matching = positions.filter(p => {
          const sym = p.symbol.toUpperCase();
          if (!sym.includes(signal.symbol)) return false;
          const openTime = new Date(p.time || p.openTime).getTime();
          return (now - openTime) < 10 * 60 * 1000;
        });
        // Sortiere nach openPrice für korrekte TP-Zuordnung
        matching.sort((a, b) => a.openPrice - b.openPrice);

        if (matching.length === 0) {
          log("INFO", "[EDIT] Keine passenden Positionen gefunden");
          return;
        }

        let modified = 0;
        // Sortiere Positionen nach openPrice für konsistente TP-Zuordnung
        matching.sort((a, b) => a.openPrice - b.openPrice);
        for (let i = 0; i < matching.length; i++) {
          const pos = matching[i];
          // Jede Position bekommt ihren i-ten TP (oder letzten wenn weniger TPs)
          const tp = signal.tps[i] || signal.tps[signal.tps.length - 1] || pos.takeProfit;
          const sl = signal.sl || pos.stopLoss;
          try {
            await api.modifyPosition(pos.id, sl, tp);
            modified++;
            log("TRADE", "[EDIT-SL/TP] " + pos.symbol + " #" + pos.id + " SL:" + sl + " TP:" + tp);
          } catch (err) {
            log("ERROR", "[EDIT] modify failed: " + err.message);
          }
        }
        log("INFO", "[EDIT] " + modified + "/" + matching.length + " Positionen aktualisiert");
      } catch (err) {
        log("ERROR", "[EDIT] Handler error: " + err.message);
      }
      return;
    }

    // Fallback: als Management Command parsen
    const mgmt = parseMgmtCommand(text);
    if (mgmt) {
      log("INFO", "[EDIT] Management: " + mgmt.type);
      await executeMgmtCommand(mgmt);
    }
  } catch (err) {
    log("ERROR", "[EDIT] Error: " + err.message);
  }
}

// Re-Entry Support
let lastTrade = null;
const RE_ENTRY_PATTERN = /(re[s-]?entry|reentry|nochmals+rein|sames+trade)/i;

async function handleMessage(event) {
  lastMessageAt = Date.now(); // Watchdog: Liveness-Ping
  try {
    const msg = event.message;
    if (!msg?.message) return;
    // Log every incoming message for forensics
    logMessage(msg.id, msg.message, "received");

    const text = msg.message.trim();
    if (text.length < 3) return;

    // Dedup
    if (processedMessages.has(msg.id)) return;
    processedMessages.add(msg.id);
    setTimeout(() => processedMessages.delete(msg.id), DEDUP_TTL);

    log("INFO", `📩 Neue Nachricht: "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}"`);

    // Message-Cache fuer High-Risk-Detection in executeSignal
    lastIncomingMessageText = text;
    lastIncomingMessageAt = Date.now();

    // 0. Re-Entry? (neuer Trade mit letztem Signal)
    if (RE_ENTRY_PATTERN.test(text)) {
      const reentryNoise = /profit|hit|kranker|gute nacht|bester entry|bewertung|trustpilot|wer re.entry hat/i;
      if (reentryNoise.test(text)) {
        log("INFO", "[RE-ENTRY] Jubel/Info — ignoriert");
        return;
      }
      if (!lastTrade) {
        log("WARN", "[RE-ENTRY] Kein vorheriger Trade gespeichert");
        return;
      }
      // Preis extrahieren falls vorhanden
      const priceMatch = text.match(/(?:bei|ab|at|@)s*(d{4,5}(?:.d{1,3})?)/i);
      const reEntryPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
      log("INFO", "[RE-ENTRY] " + lastTrade.action + " " + lastTrade.symbol + " @ " + (reEntryPrice || "MARKET"));
      await executeSignal({ ...lastTrade, entry: reEntryPrice });
      return;
    }

    // 1. Management Command? (BE, Trail, Secure, Partial, SL Update)
    const mgmt = parseMgmtCommand(text);
    if (mgmt) {
      log("INFO", `🔧 Management: ${mgmt.type}${mgmt.symbol ? ` (${mgmt.symbol})` : ""}`);
      await executeMgmtCommand(mgmt);
      return;
    }

    // 2. BUY/SELL Signal?
    const signal = parseSignal(text);
    if (signal) {
      lastTrade = { ...signal, ts: Date.now() };
      log("INFO", `📊 Signal: ${signal.action} ${signal.symbol} @ ${signal.entry || "MARKET"} SL:${signal.sl || "MISSING"} TPs:${signal.tps.length}`);
      logMessage(msg.id, text, "signal-detected");
      await executeSignal(signal);
      return;
    }

    // 3. Kein Signal erkannt
    log("INFO", `⏭️ Kein Signal/Command erkannt`);
  } catch (err) {
    log("ERROR", `Message handler error: ${err.message}`);
  }
}

// ═══ HEALTH CHECK ════════════════════════════════════════════
async function healthCheck() {
  try {
    const info = await api.getAccount();
    const positions = await api.getPositions();
    log("INFO", `💓 Health: Balance ${info.balance}, Equity ${info.equity}, ${positions.length} Positionen offen`);
  } catch (err) {
    log("ERROR", `Health check failed: ${err.message}`);
  }
}

// ═══ MAIN ════════════════════════════════════════════════════
async function main() {
  log("INFO", "═══════════════════════════════════════════");
  log("INFO", "  GOLD FOUNDRY — PHENEX REALTIME LISTENER");
  log("INFO", "═══════════════════════════════════════════");

  if (!CONFIG.metaApi.token) {
    log("ERROR", "METAAPI_TOKEN nicht gesetzt! export METAAPI_TOKEN=...");
    process.exit(1);
  }

  // MetaApi Health Check
  await healthCheck();

  // Telegram Connect
  const client = new TelegramClient(
    new StringSession(CONFIG.telegram.session),
    CONFIG.telegram.apiId,
    CONFIG.telegram.apiHash,
    { connectionRetries: 5, timeout: 30 }
  );

  await client.connect();
  log("INFO", "✅ Telegram verbunden!");

  // Find Phenex Channel — resolve via getEntity (getDialogs entity is broken)
  let phenexEntity = null;
  try {
    const numericId = BigInt(CONFIG.telegram.channelId);
    phenexEntity = await client.getEntity(numericId);
    log("INFO", `Channel resolved: ${phenexEntity.title || "PHENEX"} via getEntity`);
  } catch (e1) {
    log("WARN", `getEntity failed: ${e1.message} — trying getDialogs`);
    try {
      const dialogs = await client.getDialogs({ limit: 100 });
      const found = dialogs.find(d => d.title?.toLowerCase().includes("phenex"));
      if (found) { phenexEntity = found.inputEntity || found; log("INFO", `Channel resolved via getDialogs: ${found.title}`); }
    } catch (e2) { log("ERROR", `getDialogs failed: ${e2.message}`); }
  }
  if (!phenexEntity) { log("ERROR", "Channel nicht aufloesbar — exit"); process.exit(1); }
  const phenex = { entity: phenexEntity, id: CONFIG.telegram.channelId };

  // POLLING MODE — robuster als Event-Handler (kann nicht silent stuck werden)
  // FIX 2026-04-09: NewMessage Event-Handler hat Signale verpasst (5h stuck).
  // Polling holt alle 3s aktiv die letzten Messages. Bei Fehler: exit -> pm2 restart.
  log("INFO", "🚀 LISTENER AKTIV — Polling-Modus (alle 3s)");

  // BULLETPROOF: Load lastMessageId from persistent state
  const state = loadState();
  let lastMessageId = state.lastMessageId || 0;
  let lastSuccessfulPoll = Date.now();
  let consecutivePollErrors = 0;
  const POLL_INTERVAL_MS = 1000; // 500ms war zu aggressiv → Telegram FLOOD_WAIT auf messages.GetHistory
  const MAX_CONSECUTIVE_ERRORS = 3;
  const HARD_STALE_MS = 5 * 60 * 1000;

  if (lastMessageId > 0) {
    log("INFO", `📍 Loaded lastMessageId from state: ${lastMessageId}`);
    // Catch up: verarbeite alle verpassten Messages seit letztem bekannten Stand
    try {
      const missed = await client.getMessages(phenexEntity, { limit: 100 });
      const missedNew = (missed || []).filter(m => m.id > lastMessageId && m.message).sort((a, b) => a.id - b.id);
      if (missedNew.length > 0) {
        log("WARN", `🔄 Catch-up: ${missedNew.length} verpasste Messages seit Restart werden verarbeitet`);
        try {
          await client.sendMessage("me", {
            message: `⚠️ Gold Foundry Phenex Listener\n\nCatch-up nach Restart: ${missedNew.length} verpasste Messages werden jetzt verarbeitet.`,
          });
        } catch {}
      }
    } catch (e) {
      log("WARN", `Catch-up failed: ${e.message}`);
    }
  } else {
    // Erstmaliger Start: aktuelle Message-ID als Baseline
    try {
      const initialMsgs = await client.getMessages(phenexEntity, { limit: 1 });
      if (initialMsgs && initialMsgs.length > 0) {
        lastMessageId = initialMsgs[0].id;
        saveState({ lastMessageId });
        log("INFO", `📍 Initial Baseline Message ID: ${lastMessageId}`);
      }
    } catch (e) {
      log("WARN", `Baseline fetch failed: ${e.message}`);
    }
  }

  async function pollLoop() {
    try {
      const msgs = await client.getMessages(phenexEntity, { limit: 20 });
      lastSuccessfulPoll = Date.now();
      lastMessageAt = Date.now();
      consecutivePollErrors = 0;
      if (!pollLoop._c) pollLoop._c = 0; pollLoop._c++;
      if (pollLoop._c % 100 === 1) log("INFO", `[POLL] #${pollLoop._c} OK — ${msgs?.length || 0} msgs, lastId=${lastMessageId}`);

      if (!msgs || msgs.length === 0) return;

      // Nur Messages neuer als lastMessageId verarbeiten, aufsteigend
      const newMsgs = msgs
        .filter(m => m.id > lastMessageId && m.message)
        .sort((a, b) => a.id - b.id);

      for (const m of newMsgs) {
        lastMessageId = m.id;
        saveState({ lastMessageId });
        if (m.editDate) editedSeen.set(m.id, m.editDate);
        await handleMessage({ message: m });
      }

      // Detect edits on recent messages (last 20)
      for (const m of msgs) {
        if (!m.message || !m.editDate) continue;
        if (m.id > lastMessageId) continue; // already handled as new
        const prev = editedSeen.get(m.id);
        if (prev && prev === m.editDate) continue; // no new edit
        editedSeen.set(m.id, m.editDate);
        // Clean up old entries
        if (editedSeen.size > 100) {
          const first = editedSeen.keys().next().value;
          editedSeen.delete(first);
        }
        log("INFO", "EDIT erkannt via Polling: msg " + m.id);
        await handleEditedMessage({ originalUpdate: { message: m } });
      }
    } catch (err) {
      consecutivePollErrors++;
      log("ERROR", `Poll #${consecutivePollErrors} failed: ${err.message}`);

      if (consecutivePollErrors >= MAX_CONSECUTIVE_ERRORS) {
        log("ERROR", `🚨 ${consecutivePollErrors} Poll-Fehler in Folge -> exit(1) fuer pm2 restart`);
        try {
          await client.sendMessage("me", {
            message: `🚨 Gold Foundry Phenex Listener\n\n${consecutivePollErrors}x Poll-Fehler in Folge. Neustart via pm2.\n\nLetzter Fehler: ${err.message}`,
          });
        } catch {}
        setTimeout(() => process.exit(1), 1000);
        return;
      }
    }

    // Hard-Stale-Check: >5min ohne erfolgreichen Poll -> exit
    if (Date.now() - lastSuccessfulPoll > HARD_STALE_MS) {
      log("ERROR", `🚨 ${Math.round((Date.now() - lastSuccessfulPoll) / 60000)}min ohne erfolgreichen Poll -> exit(1)`);
      try {
        await client.sendMessage("me", {
          message: `🚨 Gold Foundry Phenex Listener\n\nKein erfolgreicher Poll seit ${Math.round((Date.now() - lastSuccessfulPoll) / 60000)}min. Neustart.`,
        });
      } catch {}
      setTimeout(() => process.exit(1), 1000);
    }
  }

  setInterval(pollLoop, POLL_INTERVAL_MS);
  log("INFO", `📡 Poll-Loop gestartet (${POLL_INTERVAL_MS}ms, max ${MAX_CONSECUTIVE_ERRORS} errors in Folge, hard-stale ${HARD_STALE_MS / 60000}min)`);

  // HEARTBEAT — alle 5s einen Timestamp in eine Datei schreiben.
  // External Watchdog prueft die Datei: ist sie >30s alt, wird der Prozess gekillt + restartet.
  const HEARTBEAT_FILE = "C:/Users/Administrator/goldfoundry/phenex-heartbeat.txt";
  setInterval(() => {
    try {
      _writeFileSync(HEARTBEAT_FILE, JSON.stringify({
        ts: Date.now(),
        iso: new Date().toISOString(),
        lastMessageId,
        lastSuccessfulPoll,
        consecutivePollErrors,
        pid: process.pid,
      }), "utf8");
    } catch (e) {
      log("WARN", `Heartbeat write failed: ${e.message}`);
    }
  }, 5000);
  log("INFO", "💓 Heartbeat-File aktiv (5s Interval)");

  // Health Check alle 5 Minuten
  setInterval(healthCheck, 5 * 60 * 1000);

  // ═══ WATCHDOG — alle 10min prüfen ob Listener stumm ist ══════
  // Während Marktzeiten (Mo–Fr, ~06–22 UTC) sollten regelmäßig Messages
  // kommen. Wenn >3h Stille → Telegram-Alert an "Saved Messages" (me).
  async function watchdog() {
    try {
      const sinceLast = Date.now() - lastMessageAt;
      const now = new Date();
      const utcHour = now.getUTCHours();
      const utcDay = now.getUTCDay(); // 0 Sun, 6 Sat
      const isWeekday = utcDay >= 1 && utcDay <= 5;
      const isActiveHours = utcHour >= 6 && utcHour <= 22;
      const isMarketActive = isWeekday && isActiveHours;

      if (sinceLast > STALE_ALERT_MS && isMarketActive) {
        const mins = Math.round(sinceLast / 60000);
        log("ERROR", `🚨 Watchdog: ${mins}min keine Telegram-Aktivitaet waehrend Marktzeit -> exit(1)`);
        try {
          await client.sendMessage("me", {
            message: `🚨 Gold Foundry Watchdog\n\nPhenex Listener seit ${mins}min ohne Telegram-Aktivitaet. Neustart via pm2.\n\nZeit (UTC): ${now.toISOString()}`,
          });
        } catch {}
        setTimeout(() => process.exit(1), 1000);
      }
    } catch (e) {
      log("ERROR", `Watchdog check failed: ${e.message}`);
    }
  }
  setInterval(watchdog, 2 * 60 * 1000);

  // ═══ AUTO-TRAIL — alle 30s SL aggressiv nachziehen ══════════════
  // User-Wunsch 2026-04-20: DD aggressiver schützen, nicht nur auf
  // Telegram-"trail"-Commands warten. Chandelier-Style: SL klebt
  // ~1.5× ATR hinterm aktuellen Preis, sobald >= 1 ATR im Gewinn.
  async function autoTrailStep() {
    let positions;
    try {
      positions = await api.getPositions();
    } catch (e) {
      log("WARN", `[AUTO-TRAIL] getPositions failed: ${e.message}`);
      return;
    }
    if (!positions || positions.length === 0) return;

    for (const pos of positions) {
      try {
        if (!pos.comment || !pos.comment.includes("TG-")) continue; // nur eigene Trades
        // Stair-Step ist zuständig für Group-Mitglieder — Auto-Trail darf nicht reinpfuschen
        if (isPositionInAnyGroup(pos.id)) continue;
        if (!canModifySL(pos.id)) continue; // Cooldown
        const dir = pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";

        // ATR (1h, 14 candles) — Fallback bei Fehler
        let atr = /xau|gold/i.test(pos.symbol) ? 5.0 : 0.005;
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

        const tick = await api.getPrice(pos.symbol);
        const price = dir === "BUY" ? tick.bid : tick.ask;
        const profitATR = dir === "BUY" ? (price - pos.openPrice) / atr : (pos.openPrice - price) / atr;

        if (profitATR < 1.0) continue; // Noch nicht genug Gewinn für BE

        const buf = getBeBuffer(pos.symbol);
        const be = dir === "BUY" ? pos.openPrice + buf : pos.openPrice - buf;

        let newSL;
        if (profitATR < 1.5) {
          // Phase 1: BE + Buffer
          newSL = be;
        } else {
          // Phase 2: Chandelier — SL = Preis ∓ 1.5× ATR, aber min. BE
          const chandelier = dir === "BUY" ? price - 1.5 * atr : price + 1.5 * atr;
          newSL = dir === "BUY" ? Math.max(chandelier, be) : Math.min(chandelier, be);
        }

        const safeSL = enforceMinDist(pos.symbol, dir, price, newSL);
        const currentSL = pos.stopLoss || 0;
        const better = dir === "BUY"
          ? safeSL > currentSL
          : (currentSL === 0 ? true : safeSL < currentSL);

        if (better) {
          await api.modifyPosition(pos.id, safeSL, pos.takeProfit);
          recordSL(pos.id);
          log("TRADE", `[AUTO-TRAIL] ${pos.symbol} ${dir} SL → ${safeSL.toFixed(2)} (${profitATR.toFixed(1)}× ATR Gewinn, ATR=${atr.toFixed(2)})`);
        }
      } catch (e) {
        log("WARN", `[AUTO-TRAIL] ${pos.symbol} failed: ${e.message}`);
      }
    }
  }
  // Auto-Trail (legacy, ATR-Chandelier) — DEAKTIVIERT 2026-05-06.
  // Hat sich als zu aggressiv erwiesen — zog SL nach TP1-Hit auf BE+1.5,
  // Pullbacks von 5-7$ stoppten alles aus, Markt lief danach +30-100$ weiter.
  // Funktion bleibt als Code für Notfall-Aktivierung, aber kein setInterval mehr.
  void autoTrailStep; // unused-Hint stillstellen
  // setInterval(() => { autoTrailStep().catch(() => {}); }, 30 * 1000);
  // log("INFO", "🎯 Auto-Trail aktiv (...)");

  // ═══ SMART SWING-TRAIL ═══════════════════════════════════════════
  // Phase 1 (vor TP3-Hit): KEINE Änderung. Original-SL bleibt unangetastet.
  // Phase 2 (nach TP3-Hit): SL = MAX(TP1, lastSwingLow - 1×ATR) bei BUY
  //                          SL = MIN(TP1, lastSwingHigh + 1×ATR) bei SELL
  //   Profit-Floor = TP1 (wir können nicht mehr unter TP1-Profit fallen)
  //   Marktstruktur = Swing-Low/High der letzten 5× 1H-Candles + 1×ATR Atemraum
  // Updated alle 60s während Phase 2 (Markt entwickelt sich).
  async function smartSwingTrail() {
    const state = loadGroups();
    if (!state.groups || state.groups.length === 0) return;

    let positions;
    try { positions = await api.getPositions(); }
    catch (e) { log("WARN", `[SMART-TRAIL] getPositions failed: ${e.message}`); return; }

    const openIds = new Set((positions || []).map(p => p.id));
    let stateChanged = false;

    for (const g of state.groups) {
      const stillOpen = g.positions.filter(p => openIds.has(p.positionId));
      if (stillOpen.length === 0) {
        g._closed = true;
        stateChanged = true;
        continue;
      }

      // Phase 1: solange TP3 noch offen → KEINE Änderung
      const stillOpenLabels = new Set(stillOpen.map(p => p.label));
      const tp3Closed = g.positions.some(p => p.label === "TP3") && !stillOpenLabels.has("TP3");
      if (!tp3Closed) continue;

      // Phase 2: TP3 ist gehit → Smart Swing-Trail aktiv für verbleibende Splits (typ. TP4/RUNNER)
      let candles;
      try { candles = await api.getCandles(g.symbol, "1h", 6); }
      catch (e) { log("WARN", `[SMART-TRAIL] getCandles failed: ${e.message}`); continue; }
      if (!Array.isArray(candles) || candles.length < 4) continue;

      // ATR der letzten 5 Candles (True Range avg)
      let trSum = 0;
      for (let i = 1; i < candles.length; i++) {
        trSum += Math.max(
          candles[i].high - candles[i].low,
          Math.abs(candles[i].high - candles[i - 1].close),
          Math.abs(candles[i].low - candles[i - 1].close)
        );
      }
      const atr = trSum / (candles.length - 1);

      const last5 = candles.slice(-5);
      const lowestLow = Math.min(...last5.map(c => c.low));
      const highestHigh = Math.max(...last5.map(c => c.high));

      let newSL;
      const tp1 = g.tps?.[0] ?? g.entry;
      if (g.side === "BUY") {
        const swingSL = lowestLow - atr;
        newSL = Math.max(tp1, swingSL); // Floor: TP1
      } else {
        const swingSL = highestHigh + atr;
        newSL = Math.min(tp1, swingSL); // Ceiling: TP1
      }

      for (const sp of stillOpen) {
        const livePos = positions.find(p => p.id === sp.positionId);
        if (!livePos) continue;
        const dir = livePos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
        const currentSL = livePos.stopLoss || 0;
        const better = dir === "BUY"
          ? newSL > currentSL
          : (currentSL === 0 ? true : newSL < currentSL);
        if (!better) continue;
        if (!canModifySL(livePos.id)) continue;
        try {
          await api.modifyPosition(livePos.id, newSL, livePos.takeProfit);
          recordSL(livePos.id);
          log("TRADE", `[SMART-TRAIL] ${g.symbol} ${sp.label} SL → ${newSL.toFixed(2)} (TP3-hit, swing ${dir === "BUY" ? lowestLow.toFixed(2) : highestHigh.toFixed(2)} ± ${atr.toFixed(2)} ATR, floor TP1=${tp1})`);
        } catch (e) {
          log("WARN", `[SMART-TRAIL] ${sp.label} modify failed: ${e.message}`);
        }
      }
    }

    if (stateChanged) {
      const fresh = loadGroups();
      fresh.groups = fresh.groups.filter(g => !state.groups.find(sg => sg.id === g.id && sg._closed));
      saveGroups(fresh);
    }
  }
  setInterval(() => { smartSwingTrail().catch(() => {}); }, 60 * 1000);
  log("INFO", "🎯 Smart Swing-Trail aktiv (60s Tick, Phase 1: kein Trail bis TP3, Phase 2: SL=MAX(TP1, swing-low − 1×ATR))");

  // ═══ SYMBOL-CACHE PRE-WARM ═══════════════════════════════════════
  // Vitus tradet praktisch nur XAUUSD. Beim Boot resolven damit das erste
  // Live-Signal keinen 200-600ms Symbol-Resolve mehr braucht.
  resolveBrokerSymbol("XAUUSD").then(bs => {
    log("INFO", `⚡ Symbol-Cache pre-warmed: XAUUSD → ${bs}`);
  }).catch(e => log("WARN", `Symbol pre-warm failed: ${e.message}`));

  // ═══ DAILY-DD-CUTOFF — Equity vom UTC-Tagesstart tracken ═══════
  // Bei -X% Drop wird tradingHalted=true gesetzt → ALLE Signale werden
  // verworfen (Hard-Stop). Reset nur durch pm2 restart phenex-listener.
  async function dailyDdProbe() {
    let info;
    try {
      info = await api.getAccount();
    } catch (e) {
      // Health-Probe übernimmt Logging; hier still bleiben um nicht zu spammen
      return;
    }
    if (!info || typeof info.equity !== "number") return;

    const todayUtc = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    if (dailyEquityStartDate !== todayUtc) {
      // Tageswechsel oder Initial-Boot — Anchor neu setzen
      dailyEquityStart = info.equity;
      dailyEquityStartDate = todayUtc;
      log("INFO", `📅 Daily-DD Anchor gesetzt: ${todayUtc} Equity=${info.equity.toFixed(2)} ${info.currency || "USD"}`);
      return;
    }

    const ddPct = ((dailyEquityStart - info.equity) / dailyEquityStart) * 100;
    if (ddPct >= CONFIG.risk.dailyDdCutoffPct && !tradingHalted) {
      tradingHalted = true;
      log("ERROR", `🛑 DAILY-DD-CUTOFF: ${ddPct.toFixed(2)}% Drop (Start=${dailyEquityStart.toFixed(2)}, Now=${info.equity.toFixed(2)}) — Trading-Halt aktiv`);
      try {
        await client.sendMessage("me", {
          message: `🛑 Gold Foundry DAILY-DD-CUTOFF\n\nEquity-Drop heute: -${ddPct.toFixed(2)}%\nStart: ${dailyEquityStart.toFixed(2)} ${info.currency || ""}\nJetzt: ${info.equity.toFixed(2)} ${info.currency || ""}\n\nTrading wurde GESTOPPT.\nNeue Signale werden verworfen bis pm2 restart phenex-listener.`,
        });
      } catch {}
    }
  }
  setInterval(() => { dailyDdProbe().catch(() => {}); }, 60 * 1000);
  // Sofort-Probe beim Boot damit dailyEquityStart gesetzt wird
  dailyDdProbe().catch(() => {});
  log("INFO", `🛡️ Daily-DD-Cutoff aktiv (60s Tick, Cutoff bei -${CONFIG.risk.dailyDdCutoffPct}%)`);

  // ═══ METAAPI HEALTH-PROBE — Connection-Disconnect frueh erkennen ═══
  // Wenn 5x in Folge getAccount() failt, Telegram-Alert. Dann selbst-killen
  // damit pm2 restart einen frischen Connect versucht.
  async function metaApiHealthProbe() {
    try {
      const info = await api.getAccount();
      if (info && typeof info.balance === "number") {
        if (metaApiHealthFails > 0) {
          log("INFO", `✅ MetaApi wieder erreichbar (nach ${metaApiHealthFails} Fehlern)`);
        }
        metaApiHealthFails = 0;
      }
    } catch (e) {
      metaApiHealthFails++;
      log("WARN", `[HEALTH] MetaApi-Probe ${metaApiHealthFails}× fehlgeschlagen: ${e.message.slice(0, 100)}`);
      if (metaApiHealthFails === 5) {
        try {
          await client.sendMessage("me", {
            message: `🚨 Gold Foundry METAAPI-DOWN\n\nMetaApi-Account ${CONFIG.metaApi.accountId.slice(0, 8)}... unerreichbar (5x in Folge).\n\nProzess wird neu gestartet.`,
          });
        } catch {}
      }
      if (metaApiHealthFails >= 10) {
        log("ERROR", `🛑 MetaApi-Probe 10x failed — exit(1) für pm2 restart`);
        setTimeout(() => process.exit(1), 1000);
      }
    }
  }
  setInterval(() => { metaApiHealthProbe().catch(() => {}); }, 60 * 1000);
  log("INFO", "🩺 MetaApi-Health-Probe aktiv (60s Tick, Alert bei 5×, Exit bei 10×)");

  // Keep alive
  process.on("SIGINT", async () => {
    log("INFO", "Shutting down...");
    await client.disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    log("INFO", "Shutting down...");
    await client.disconnect();
    process.exit(0);
  });

  // ═══ ERROR COUNTER — bei Error-Storm selbst-killen ═══════════
  // Wenn gramjs-Update-Loop kaputt ist (z.B. chats-Filter Bug),
  // kommen Errors alle ~9s. >10 Errors/min → exit → pm2 restart.
  process.on("unhandledRejection", (err) => {
    log("ERROR", `Unhandled rejection: ${err}`);

    const now = Date.now();
    if (now - errorWindowStart > ERROR_WINDOW_MS) {
      errorWindowStart = now;
      errorCount = 0;
    }
    errorCount++;

    if (errorCount > ERROR_THRESHOLD) {
      log("ERROR", `🚨 ${errorCount} Errors in ${Math.round((now - errorWindowStart) / 1000)}s — exit(1) → pm2 restart`);
      // Best-effort Telegram-Alert vor dem Exit
      client.sendMessage("me", {
        message: `🚨 Gold Foundry Phenex Listener Error-Storm\n\n${errorCount} Unhandled Rejections in 60s.\nLetzter Error: ${err}\n\nProzess wird neugestartet via pm2.`,
      }).catch(() => {}).finally(() => {
        setTimeout(() => process.exit(1), 2000);
      });
    }
  });
}

main().catch(err => {
  log("ERROR", `Fatal: ${err.message}`);
  process.exit(1);
});
