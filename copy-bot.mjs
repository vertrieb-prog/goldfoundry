#!/usr/bin/env node
/**
 * GoldFoundry ACCOUNT COPIER v2 — ALL BUGS FIXED
 * Liest Trades vom RoboForex Signal-Konto und kopiert sie auf TagMarket.
 * NUR LESEN auf RoboForex — NUR SCHREIBEN auf TagMarket.
 * Start: node copy-bot.mjs
 */
import { readFileSync } from "fs";
import { join } from "path";

// ── Config aus .env.local ──
let envContent = "";
try { envContent = readFileSync("C:\\signal-bot\\.env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(".env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(join(process.cwd(), ".env.local"), "utf8"); } catch {}
const getEnv = (k, fb = "") => { const m = envContent.match(new RegExp(`${k}=(.+)`)); return m ? m[1].trim() : (process.env[k] || fb); };

const METAAPI_TOKEN = getEnv("METAAPI_TOKEN");
const SB_KEY = getEnv("SUPABASE_SERVICE_KEY");
if (!METAAPI_TOKEN) { console.error("[ERR] METAAPI_TOKEN fehlt!"); process.exit(1); }

// ── Account Pairs: Signal (READ ONLY) → Copy (WRITE) ──
const COPY_PAIRS = [
  { signal: "707f3173-572e-4002-9e8a-21b864525d30", copy: "66d8fe15-368b-4e3c-8c6c-ed32bea5b56b", name: "RoboForex #1 → TagMarket Copy-Demo" },
  { signal: "58934470-695b-404b-bcad-8c406fd7d04d", copy: "02f08a16-ae02-40f4-9195-2c62ec52e8eb", name: "RoboForex #2 → TagMarket Copy-Demo 2" },
];
const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";
const POLL_INTERVAL = 3000;

// ── Supabase Logging ──
const SB_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
async function logCopyEvent(pair, pos, status, extra = {}) {
  if (!SB_URL || !SB_KEY) return;
  const data = {
    pair_name: pair.name,
    signal_account_id: pair.signal,
    copy_account_id: pair.copy,
    position_id: String(pos.id),
    symbol: pos.symbol,
    direction: pos.type?.replace("POSITION_TYPE_", "") || "UNKNOWN",
    volume: pos.volume,
    open_price: pos.openPrice,
    status,
    ...extra,
  };
  await fetch(`${SB_URL}/rest/v1/copy_events`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

// ── Symbol Mapping: RoboForex → TagMarket ──
// TagMarket: Forex/Metalle/Indices/Oil = .pro Suffix, Crypto/Aktien = plain
// Ergebnis aus Live-Test aller Symbole auf Account 66d8fe15
function mapSymbol(symbol) {
  const sym = symbol.toUpperCase().replace(/\.PRO$|\.A$|\.B$|\.M$|\.E$/, ""); // Strip existing suffixes

  // Crypto — KEIN Suffix (existieren plain auf TagMarket)
  const crypto = ["BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD", "ADAUSD", "SOLUSD", "EOSUSD", "XLMUSD", "XMRUSD", "ETHEUR"];
  if (crypto.includes(sym)) return sym;

  // Aktien — KEIN Suffix
  const stocks = ["TESLA", "APPLE", "AMAZON", "MICROSOFT", "NETFLIX", "BOEING", "INTEL", "FORD", "GM",
    "VISA", "IBM", "HP", "ORACLE", "CISCO", "FERRARI", "ADIDAS", "SIEMENS", "LUFTHANSA", "DAIMLER",
    "ALLIANZ", "COMMERZBANK", "LVMH", "TOTAL", "BNP", "SOCIETE", "SANTANDER", "TELEFONICA",
    "COINBASE", "EBAY", "FEDEX", "GE", "HILTON", "JPMORGAN", "GOLDMANS", "CITI", "AIG",
    "AMEX", "CHEVRON", "EXXON", "JOHNSON", "MSTRCARD", "TEVA", "EON", "ALIBABA"];
  if (stocks.includes(sym)) return sym;

  // Alles andere (Forex, Metalle, Indices, Oil) → .pro Suffix
  // Verifiziert: XAUUSD.pro, EURUSD.pro, GBPJPY.pro, US30.pro, NAS100.pro, USOIL.pro, etc.
  return sym + ".pro";
}

// ── State ──
const knownPositions = new Map();
let errorCount = 0;

async function apiFetch(url, opts) {
  const r = await fetch(url, {
    ...opts,
    headers: { "auth-token": METAAPI_TOKEN, "Content-Type": "application/json", ...(opts?.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  return r.json();
}

// ── FIX #3: SL-Distanz pro Instrument-Typ ──
function getDefaultSlDist(symbol) {
  const sym = symbol.toUpperCase();
  if (/XAU|GOLD/.test(sym)) return 10;
  if (/JPY/.test(sym)) return 0.30;
  if (/BTC/.test(sym)) return 500;
  if (/US500|NAS/.test(sym)) return 50;
  return 0.003; // Standard Forex
}

// ── Lot Calculator ──
function calcLots(symbol, sl, entry, balance = 10000, riskPct = 1) {
  if (!sl || !entry) return 0.01;
  const slDist = Math.abs(entry - sl);
  if (slDist === 0) return 0.01;
  const riskAmount = balance * (riskPct / 100);
  const isGold = /xau|gold/i.test(symbol);
  const riskPerLot = slDist * (isGold ? 100 : /jpy/i.test(symbol) ? 1000 : 100000);
  let lots = riskAmount / riskPerLot;
  lots = Math.max(0.01, Math.min(lots, isGold ? 2.0 : 5.0));
  return Math.floor(lots * 100) / 100;
}

// ── 4-Split Orders — IMMER 4, KEINE Filterung ──
function buildSplits(totalLots, tps, entry, sl, action, symbol) {
  const isBuy = action === "BUY";
  // FIX #3: Instrument-spezifische SL-Distanz
  const slDist = sl && entry ? Math.abs(entry - sl) : getDefaultSlDist(symbol);

  while (tps.length < 4) {
    const mult = [1.5, 2.5, 3.5, 5.0][tps.length];
    tps.push(Math.round((isBuy ? entry + slDist * mult : entry - slDist * mult) * 100) / 100);
  }
  // FIX #1: KEINE Filterung — IMMER 4 Orders, min 0.01 Lots
  return [
    { pct: 0.40, tp: tps[0], label: "TP1" },
    { pct: 0.25, tp: tps[1], label: "TP2" },
    { pct: 0.20, tp: tps[2], label: "TP3" },
    { pct: 0.15, tp: tps[3], label: "Runner" },
  ].map(s => ({ lots: Math.max(0.01, Math.floor(totalLots * s.pct * 100) / 100), ...s }));
}

// ── Signal Scoring + Anti-Tilt ──
const copyLossTracker = { consecutive: 0, pauseUntil: 0 };

function scoreCopySignal(sl, tp, entry) {
  let score = 0;
  if (sl) score += 25;
  if (tp) score += 25;
  if (entry) score += 15;
  if (sl && entry && entry !== sl) score += 15;
  if (sl && entry && tp) {
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    const rr = risk > 0 ? reward / risk : 0;
    if (rr >= 2) score += 20;
    else if (rr >= 1.5) score += 15;
    else if (rr >= 1) score += 10;
  }
  return score;
}

// ── Copy a single position ──
async function copyPosition(pos, copyAccountId, pair) {
  const action = pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
  const symbol = mapSymbol(pos.symbol);
  const entry = pos.openPrice;
  if (symbol !== pos.symbol) console.log(`  [MAP] ${pos.symbol} → ${symbol}`);
  const sl = pos.stopLoss;
  const tps = pos.takeProfit ? [pos.takeProfit] : [];

  // Score-Filter DEAKTIVIERT — Signal-Trader setzen oft kein SL/TP, das ist normal
  // Nur Anti-Tilt bleibt aktiv (bei 5+ Verlusten in Folge pausieren)
  const tiltMult = Date.now() < copyLossTracker.pauseUntil ? 0 : copyLossTracker.consecutive >= 5 ? 0 : copyLossTracker.consecutive >= 3 ? 0.5 : 1.0;
  console.log(`  Tilt: x${tiltMult}`);
  if (tiltMult === 0) { console.log("  [TILT] Paused"); await logCopyEvent(pair, pos, "BLOCKED", { block_reason: "Tilt pause" }); return 0; }

  let balance = 10000;
  try {
    const info = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${copyAccountId}/account-information`);
    balance = info.equity || info.balance || 10000;
  } catch {}

  let totalLots = calcLots(symbol, sl, entry, balance);
  totalLots = Math.max(0.01, Math.floor(totalLots * tiltMult * 100) / 100);
  const splits = buildSplits(totalLots, [...tps], entry, sl, action, symbol);
  const actionType = action === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";

  console.log(`  ${action} ${symbol} | Entry:${entry} SL:${sl} TP:${tps[0] || "auto"} | ${totalLots}L -> ${splits.length} orders`);

  const results = await Promise.allSettled(splits.map(async (split) => {
    const payload = { actionType, symbol, volume: split.lots, comment: `COPY-${split.label}` };
    if (sl) payload.stopLoss = sl;
    if (split.tp) payload.takeProfit = split.tp;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${copyAccountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
        if (r.numericCode === 0 || r.stringCode === "TRADE_RETCODE_DONE" || r.stringCode === "ERR_NO_ERROR") {
          return { ok: true, label: split.label };
        }
        console.log(`  [DEBUG] ${split.label}: ${r.stringCode || "?"} ${(r.message || "").slice(0, 40)}`);
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.log(`  [DEBUG] ${split.label} attempt ${attempt}: ${(e.message || "").slice(0, 40)}`);
      }
    }
    return { ok: false, label: split.label };
  }));

  const success = results.filter(r => r.status === "fulfilled" && r.value.ok).length;
  console.log(`  [${success > 0 ? "OK" : "FAIL"}] ${success}/${splits.length} Orders gesetzt`);
  if (success > 0) {
    await logCopyEvent(pair, pos, "COPIED", { latency_ms: Date.now() - (pos.time ? new Date(pos.time).getTime() : Date.now()) });
  } else {
    await logCopyEvent(pair, pos, "ERROR", { error_message: `0/${splits.length} orders failed` });
  }
  return success;
}

// ── Main Poll Loop ──
async function poll() {
  for (let i = 0; i < COPY_PAIRS.length; i++) {
    const pair = COPY_PAIRS[i];
    if (!knownPositions.has(i)) knownPositions.set(i, new Set());
    const known = knownPositions.get(i);

    try {
      const positions = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${pair.signal}/positions`);
      if (!Array.isArray(positions)) continue;
      errorCount = 0; // Reset bei Erfolg

      for (const pos of positions) {
        const key = `${pos.id}-${pos.type}-${pos.symbol}`;
        if (known.has(key)) continue;
        known.add(key);

        const ts = new Date().toLocaleTimeString("de-DE");
        console.log(`\n[${ts}] SIGNAL: ${pair.name}`);
        console.log(`  ${pos.type.replace("POSITION_TYPE_", "")} ${pos.symbol} ${pos.volume}L @${pos.openPrice}`);

        await logCopyEvent(pair, pos, "DETECTED");
        await copyPosition(pos, pair.copy, pair);
      }

      // Track closed
      const currentIds = new Set(positions.map(p => `${p.id}-${p.type}-${p.symbol}`));
      for (const key of known) { if (!currentIds.has(key)) known.delete(key); }
    } catch (e) {
      // FIX #2: Fehler loggen statt verschlucken
      errorCount++;
      if (errorCount <= 3 || errorCount % 10 === 0) {
        console.log(`[${new Date().toLocaleTimeString("de-DE")}] [WARN] Poll-Fehler #${errorCount} (${pair.name}): ${(e.message || "").slice(0, 60)}`);
      }
      if (errorCount >= 20) {
        console.log(`[${new Date().toLocaleTimeString("de-DE")}] [ERR] 20+ Fehler, warte 30s...`);
        await new Promise(r => setTimeout(r, 30000));
        errorCount = 0;
      }
    }
  }
}

// ── FIX #4: Auto-Restart Wrapper ──
async function start() {
  console.log("GoldFoundry ACCOUNT COPIER v2");
  console.log("=".repeat(40));
  for (const p of COPY_PAIRS) console.log(`  ${p.name}`);
  console.log(`  Poll: alle ${POLL_INTERVAL / 1000}s`);
  console.log("=".repeat(40) + "\n");

  // Initial: load existing positions
  for (let i = 0; i < COPY_PAIRS.length; i++) {
    knownPositions.set(i, new Set());
    try {
      const existing = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${COPY_PAIRS[i].signal}/positions`);
      if (Array.isArray(existing)) {
        for (const p of existing) knownPositions.get(i).add(`${p.id}-${p.type}-${p.symbol}`);
        console.log(`  ${COPY_PAIRS[i].name}: ${existing.length} bestehende Positionen`);
      }
    } catch (e) {
      console.log(`  ${COPY_PAIRS[i].name}: Fehler beim Laden: ${(e.message || "").slice(0, 40)}`);
    }
  }

  // FIX #4b: Tracked positions count
  const totalTracked = [...knownPositions.values()].reduce((s, set) => s + set.size, 0);
  console.log(`\n[LIVE] Warte auf neue Signale... (${totalTracked} tracked)\n`);

  setInterval(poll, POLL_INTERVAL);

  // Heartbeat mit korrektem Count
  setInterval(() => {
    const tracked = [...knownPositions.values()].reduce((s, set) => s + set.size, 0);
    process.stdout.write(`\r[${new Date().toLocaleTimeString("de-DE")}] OK | ${tracked} positions tracked`);
  }, 30000);
}

// FIX #4: Auto-Restart bei unerwarteten Fehlern
start().catch(e => {
  console.error(`[FATAL] ${e.message}`);
  console.log("[RESTART] Neustart in 10s...");
  setTimeout(() => {
    start().catch(() => process.exit(1));
  }, 10000);
});

// Unhandled rejections abfangen statt crashen
process.on("unhandledRejection", (err) => {
  console.error(`[WARN] Unhandled rejection: ${(err?.message || String(err)).slice(0, 80)}`);
});
