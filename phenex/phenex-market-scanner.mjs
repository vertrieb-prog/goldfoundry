// PHENEX MARKET SCANNER (Phase 1)
// Reads OHLC from MetaApi, computes ATR / ADX / Market Structure,
// classifies the current market phase and writes market-state.json.
// Runs as independent PM2 app. Read-only — never touches trades.

import fs from "node:fs/promises";
import path from "node:path";

const CONFIG = {
  metaApi: {
    token: process.env.METAAPI_TOKEN,
    accountId: process.env.METAAPI_ACCOUNT_ID || "e534fb5e-c8f7-44e3-a4f9-ab49b3e76d77",
    region: "london",
  },
  symbol: process.env.SCAN_SYMBOL || "XAUUSD",
  scanIntervalMs: parseInt(process.env.SCAN_INTERVAL_MS || "30000", 10),
  candleCount: 100,
  outFile: path.resolve("C:/Users/Administrator/goldfoundry/market-state.json"),
  newsApi: process.env.NEWS_API_URL || null,
};

if (!CONFIG.metaApi.token) {
  console.error("[FATAL] METAAPI_TOKEN missing — copy from ecosystem.config.cjs");
  process.exit(1);
}

const META_BASE = `https://mt-client-api-v1.${CONFIG.metaApi.region}.agiliumtrade.ai`;
const ACC_PATH = `/users/current/accounts/${CONFIG.metaApi.accountId}`;

function ts() { return new Date().toISOString(); }
function log(level, msg, meta) {
  const line = `[${ts()}] [${level}] ${msg}` + (meta ? " " + JSON.stringify(meta) : "");
  console.log(line);
}

async function metaFetch(p, opts) {
  const res = await fetch(`${META_BASE}${p}`, {
    ...opts,
    headers: {
      "auth-token": CONFIG.metaApi.token,
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MetaApi ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function getCandles(symbol, tf, count) {
  return metaFetch(`${ACC_PATH}/historical-market-data/symbols/${symbol}/timeframes/${tf}/candles?limit=${count}`);
}

// ─── INDICATORS ───────────────────────────────────────────────────────────────
function trueRange(c, prev) {
  return Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
}

function atr(candles, period = 14) {
  if (candles.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < candles.length; i++) trs.push(trueRange(candles[i], candles[i - 1]));
  let val = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) val = (val * (period - 1) + trs[i]) / period;
  return val;
}

function adx(candles, period = 14) {
  if (candles.length < period * 2 + 1) return null;
  const plusDM = [];
  const minusDM = [];
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const dn = candles[i - 1].low - candles[i].low;
    plusDM.push(up > dn && up > 0 ? up : 0);
    minusDM.push(dn > up && dn > 0 ? dn : 0);
    trs.push(trueRange(candles[i], candles[i - 1]));
  }
  const wilder = (arr) => {
    const out = [];
    let smooth = arr.slice(0, period).reduce((a, b) => a + b, 0);
    out.push(smooth);
    for (let i = period; i < arr.length; i++) {
      smooth = smooth - smooth / period + arr[i];
      out.push(smooth);
    }
    return out;
  };
  const trS = wilder(trs);
  const plusS = wilder(plusDM);
  const minusS = wilder(minusDM);
  const dx = [];
  for (let i = 0; i < trS.length; i++) {
    const pDI = (100 * plusS[i]) / trS[i];
    const mDI = (100 * minusS[i]) / trS[i];
    dx.push((100 * Math.abs(pDI - mDI)) / (pDI + mDI || 1));
  }
  if (dx.length < period) return null;
  let adxVal = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dx.length; i++) adxVal = (adxVal * (period - 1) + dx[i]) / period;
  const last = trS.length - 1;
  const pDI = (100 * plusS[last]) / trS[last];
  const mDI = (100 * minusS[last]) / trS[last];
  return { adx: adxVal, pDI, mDI };
}

function marketStructure(candles, look = 20) {
  if (candles.length < look) return "UNCLEAR";
  const slice = candles.slice(-look);
  const highs = slice.map((c) => c.high);
  const lows = slice.map((c) => c.low);
  const recHi = Math.max(...highs.slice(-5));
  const oldHi = Math.max(...highs.slice(0, -5));
  const recLo = Math.min(...lows.slice(-5));
  const oldLo = Math.min(...lows.slice(0, -5));
  const hh = recHi > oldHi;
  const hl = recLo > oldLo;
  const lh = recHi < oldHi;
  const ll = recLo < oldLo;
  if (hh && hl) return "HH-HL";
  if (lh && ll) return "LH-LL";
  if (hh && ll) return "EXPANSION";
  return "RANGE";
}

function dailyRangePct(candles) {
  if (!candles.length) return null;
  const last = candles[candles.length - 1];
  const dayStart = candles[candles.length - 1].time
    ? new Date(candles[candles.length - 1].time).setUTCHours(0, 0, 0, 0)
    : null;
  let dayHigh = -Infinity;
  let dayLow = Infinity;
  for (const c of candles) {
    const t = c.time ? new Date(c.time).getTime() : null;
    if (t === null || t < dayStart) continue;
    if (c.high > dayHigh) dayHigh = c.high;
    if (c.low < dayLow) dayLow = c.low;
  }
  if (dayHigh === -Infinity) return null;
  const range = dayHigh - dayLow;
  const fromLow = last.close - dayLow;
  return { range, pct: range > 0 ? (fromLow / range) * 100 : 50 };
}

function currentSession() {
  const h = new Date().getUTCHours();
  if (h >= 0 && h < 7) return "ASIA";
  if (h >= 7 && h < 12) return "LONDON";
  if (h >= 12 && h < 16) return "LONDON_NY_OVERLAP";
  if (h >= 16 && h < 21) return "NY";
  return "POST_NY";
}

// ─── PHASE CLASSIFIER ─────────────────────────────────────────────────────────
function classify({ atrM15, adxObj, structure, atrM5 }) {
  if (!atrM15 || !adxObj) return { phase: "UNKNOWN", strategy: "DEFAULT", reason: "insufficient data" };
  const { adx: adxVal, pDI, mDI } = adxObj;

  if (adxVal > 25 && structure === "HH-HL" && pDI > mDI) {
    return { phase: "STRONG_TREND_UP", strategy: "CHANDELIER_RUN", reason: `ADX ${adxVal.toFixed(0)} + HH-HL` };
  }
  if (adxVal > 25 && structure === "LH-LL" && mDI > pDI) {
    return { phase: "STRONG_TREND_DOWN", strategy: "CHANDELIER_RUN", reason: `ADX ${adxVal.toFixed(0)} + LH-LL` };
  }
  if (adxVal < 18 && structure === "RANGE") {
    return { phase: "RANGE", strategy: "FAST_LOCK", reason: `ADX ${adxVal.toFixed(0)} flat` };
  }
  if (atrM15 > atrM5 * 4) {
    return { phase: "HIGH_VOLATILITY", strategy: "WIDE_DEFENSE", reason: `ATR-M15 ${atrM15.toFixed(2)} >> ATR-M5` };
  }
  if (structure === "EXPANSION") {
    return { phase: "EXPANSION", strategy: "STAIR_TIGHT", reason: "HH + LL = breakout candidate" };
  }
  return { phase: "WEAK_TREND", strategy: "STAIR_STEP", reason: `ADX ${adxVal.toFixed(0)}, ${structure}` };
}

// ─── MAIN SCAN LOOP ───────────────────────────────────────────────────────────
async function scan() {
  try {
    const symbol = CONFIG.symbol;
    const [m5, m15] = await Promise.all([
      getCandles(symbol, "5m", CONFIG.candleCount),
      getCandles(symbol, "15m", CONFIG.candleCount),
    ]);
    if (!Array.isArray(m15) || m15.length < 30) {
      log("WARN", "Not enough M15 candles", { len: m15?.length });
      return;
    }
    const atrM15 = atr(m15, 14);
    const atrM5 = atr(m5, 14);
    const adxObj = adx(m15, 14);
    const structure = marketStructure(m15, 20);
    const drange = dailyRangePct(m15);
    const session = currentSession();

    const cls = classify({ atrM15, atrM5, adxObj, structure });

    const lastClose = m15[m15.length - 1].close;
    const state = {
      ts: ts(),
      symbol,
      lastClose,
      session,
      atr: { m5: atrM5, m15: atrM15 },
      adx: adxObj,
      structure,
      dailyRange: drange,
      phase: cls.phase,
      selectedStrategy: cls.strategy,
      reason: cls.reason,
    };
    await fs.writeFile(CONFIG.outFile, JSON.stringify(state, null, 2));
    log("INFO", `[SCAN] ${cls.phase} → ${cls.strategy}`, {
      px: lastClose,
      atrM15: atrM15?.toFixed(2),
      adx: adxObj?.adx?.toFixed(1),
      struct: structure,
      session,
      reason: cls.reason,
    });
  } catch (e) {
    log("ERROR", `Scan failed: ${e.message}`);
  }
}

log("INFO", `🔍 PHENEX Market Scanner starting`, {
  symbol: CONFIG.symbol,
  intervalMs: CONFIG.scanIntervalMs,
  out: CONFIG.outFile,
});
await scan();
setInterval(scan, CONFIG.scanIntervalMs);
