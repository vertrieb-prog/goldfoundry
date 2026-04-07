#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — PHENEX REALTIME LISTENER
// Läuft auf Contabo Server via pm2
// Empfängt Telegram-Nachrichten in ECHTZEIT und führt sofort aus
// ═══════════════════════════════════════════════════════════════

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";

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
    accountId: "cb652594-04e0-4123-a89b-7528250958ed", // Phenex TagMarket
    region: "london",
  },
  risk: {
    riskPercent: 5,
    maxOpenPositions: 10,
    maxSlippageGold: 20.0,
    maxSlippageForex: 0.0020,
  },
};

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
  if (slMatch) return { type: "SL_UPDATE", symbol, newSL: parseFloat(slMatch[1]) };

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
    // Position limit check
    const positions = await api.getPositions();
    if (positions.length >= CONFIG.risk.maxOpenPositions) {
      log("WARN", `Max ${CONFIG.risk.maxOpenPositions} Positionen erreicht — übersprungen`);
      return;
    }

    // Resolve broker symbol (might have .pro suffix)
    let brokerSymbol = signal.symbol;
    try {
      await api.getPrice(signal.symbol);
    } catch {
      brokerSymbol = signal.symbol + ".pro";
      try { await api.getPrice(brokerSymbol); } catch { brokerSymbol = signal.symbol; }
    }

    // Get current price for slippage check
    const tick = await api.getPrice(brokerSymbol);
    const currentPrice = tick.bid || tick.ask;

    if (signal.entry) {
      const isGold = /xau|gold/i.test(brokerSymbol);
      const maxSlip = isGold ? CONFIG.risk.maxSlippageGold : CONFIG.risk.maxSlippageForex;
      if (Math.abs(currentPrice - signal.entry) > maxSlip) {
        log("WARN", `Slippage zu hoch: ${currentPrice} vs ${signal.entry} — übersprungen`);
        return;
      }
    }

    // Auto-SL wenn keiner im Signal
    let sl = signal.sl;
    if (!sl && signal.entry) {
      const isGold = /xau|gold/i.test(brokerSymbol);
      const dist = isGold ? 10 : 0.003;
      sl = signal.action === "BUY" ? signal.entry - dist : signal.entry + dist;
      log("INFO", `Auto-SL: ${sl}`);
    }

    // Auto-TPs wenn keine im Signal
    let tps = [...signal.tps];
    if (tps.length === 0 && sl && signal.entry) {
      const slDist = Math.abs(signal.entry - sl);
      for (const mult of [1.5, 2.5, 3.5, 5.0]) {
        tps.push(Math.round((signal.action === "BUY" ? signal.entry + slDist * mult : signal.entry - slDist * mult) * 100) / 100);
      }
    }

    // Lot Size berechnen
    const info = await api.getAccount();
    const slPips = sl ? Math.abs((signal.entry || currentPrice) - sl) / pipSize(brokerSymbol) : 50;
    const totalLots = calcLots(info.balance, CONFIG.risk.riskPercent, slPips, brokerSymbol);

    // 4 EQUAL SPLITS: 25/25/25/25
    const splits = [];
    for (let i = 0; i < Math.min(4, Math.max(1, tps.length)); i++) {
      const lots = Math.max(0.01, Math.floor(totalLots * 0.25 * 100) / 100);
      splits.push({ lots, tp: tps[i] || null, label: `TP${i + 1}` });
    }

    // PARALLEL EXECUTION — alle Orders gleichzeitig
    const method = signal.action === "BUY" ? api.buy : api.sell;
    const results = await Promise.allSettled(
      splits.map(s => method(brokerSymbol, s.lots, sl, s.tp, `TG-Phenex ${s.label}`))
    );

    const filled = results.filter(r => r.status === "fulfilled").length;
    const execMs = Date.now() - startMs;

    log("TRADE", `${signal.action} ${brokerSymbol} — ${filled}/${splits.length} Orders in ${execMs}ms`, {
      totalLots, splits: splits.map(s => `${s.label}=${s.lots}L`), sl, tps,
    });
  } catch (err) {
    log("ERROR", `Signal execution failed: ${err.message}`);
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

// ═══ MESSAGE HANDLER ═════════════════════════════════════════
const processedMessages = new Set();
const DEDUP_TTL = 10 * 60 * 1000;

async function handleMessage(event) {
  try {
    const msg = event.message;
    if (!msg?.message) return;

    const text = msg.message.trim();
    if (text.length < 3) return;

    // Dedup
    if (processedMessages.has(msg.id)) return;
    processedMessages.add(msg.id);
    setTimeout(() => processedMessages.delete(msg.id), DEDUP_TTL);

    log("INFO", `📩 Neue Nachricht: "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}"`);

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
      log("INFO", `📊 Signal: ${signal.action} ${signal.symbol} @ ${signal.entry || "MARKET"} SL:${signal.sl || "auto"} TPs:${signal.tps.length}`);
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

  // Find Phenex Channel
  const dialogs = await client.getDialogs({ limit: 100 });
  const phenex = dialogs.find(d => d.title?.toLowerCase().includes("phenex"));
  if (!phenex) {
    log("ERROR", "❌ Phenex Channel nicht gefunden!");
    process.exit(1);
  }
  log("INFO", `📡 Phenex Channel: ${phenex.title} (ID: ${phenex.id})`);

  // Event Handler — ECHTZEIT!
  client.addEventHandler(handleMessage, new NewMessage({ chats: [phenex.inputEntity] }));
  log("INFO", "🚀 LISTENER AKTIV — warte auf Signale...");

  // Health Check alle 5 Minuten
  setInterval(healthCheck, 5 * 60 * 1000);

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

  // Reconnect bei Disconnect
  process.on("unhandledRejection", (err) => {
    log("ERROR", `Unhandled rejection: ${err}`);
  });
}

main().catch(err => {
  log("ERROR", `Fatal: ${err.message}`);
  process.exit(1);
});
