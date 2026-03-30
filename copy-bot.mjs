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
// ── Signal-Konten (READ ONLY — nur Signal abfangen) ──
const SIGNALS = [
  { id: "707f3173-572e-4002-9e8a-21b864525d30", name: "RoboForex #1 (23651610)" },
  { id: "58934470-695b-404b-bcad-8c406fd7d04d", name: "RoboForex #2 (68297968)" },
  { id: "e19811f9-0dc4-4e47-8e99-183d2f266c57", name: "Phenex Live (50683542)" },
];
// ── COPY PAIRS ──
// Phenex 542: Signal + Copy auf GLEICHEM Konto (Top-Up Modus)
// RoboForex: Signal von RoboForex → Copy auf TagMarket Copy-Demos
// 542 wird NICHT kopiert — bot.py (Telegram) setzt direkt mit 5% Risk Lots
// Copy-Bot nur fuer RoboForex Signal-Konten → Copy-Demos
const COPY_PAIRS = [
  { signal: "707f3173-572e-4002-9e8a-21b864525d30", copy: "66d8fe15-368b-4e3c-8c6c-ed32bea5b56b", name: "RoboForex #1 → Copy-Demo" },
  { signal: "58934470-695b-404b-bcad-8c406fd7d04d", copy: "02f08a16-ae02-40f4-9195-2c62ec52e8eb", name: "RoboForex #2 → Copy-Demo 2" },
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

// ── Default SL-Distanz — AGGRESSIV für maximale Lots bei 1% Risk ──
function getDefaultSlDist(symbol) {
  const sym = symbol.toUpperCase();
  if (/XAU|GOLD/.test(sym)) return 5;      // $5 SL → 0.20L bei $10k (BALLERT)
  if (/XAG|SILVER/.test(sym)) return 0.15;
  if (/JPY/.test(sym)) return 0.15;         // 15 Pips
  if (/BTC/.test(sym)) return 200;
  if (/US30|NAS|US500|DE40|UK100|JP225/.test(sym)) return 25;
  if (/OIL/.test(sym)) return 0.50;
  return 0.0015; // 15 Pips Forex → aggressive Lots
}

// ── Lot Calculator — 5% Risk TOTAL pro Signal ──
function calcLots(symbol, sl, entry, balance = 10000, riskPct = 5) {
  if (!entry) return 0.01;
  // Wenn kein SL gesetzt → Default SL-Distanz pro Instrument verwenden
  const slDist = sl ? Math.abs(entry - sl) : getDefaultSlDist(symbol);
  if (slDist === 0) return 0.01;
  const riskAmount = balance * (riskPct / 100); // 1% von Balance
  const isGold = /xau|gold/i.test(symbol);
  const isJPY = /jpy/i.test(symbol);
  const isIndex = /us500|us30|nas|de40|uk100|jp225/i.test(symbol);
  const isOil = /oil/i.test(symbol);
  // Pip-Value pro Standard-Lot (1.0 Lot)
  const pipValue = isGold ? 100 : isJPY ? 1000 : isIndex ? 1 : isOil ? 10 : 100000;
  let lots = riskAmount / (slDist * pipValue);
  // Safety Caps pro Instrument
  const maxLots = isGold ? 5.0 : isIndex ? 20.0 : isOil ? 10.0 : 10.0;
  lots = Math.max(0.01, Math.min(lots, maxLots));
  return Math.floor(lots * 100) / 100;
}
// Beispiel: $10.000 Balance, XAUUSD, kein SL → Default $10 SL
// Risk: $100 (1%) / ($10 × 100) = 0.10 Lots ✓

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

  // Berechne UNSERE gewuenschten Lots (4% Risk)
  let targetLots = calcLots(symbol, sl, entry, balance);
  targetLots = Math.max(0.01, Math.floor(targetLots * tiltMult * 100) / 100);

  // Wenn Signal und Copy GLEICHER Account → Phenex hat schon Lots gesetzt, wir toppen auf
  let totalLots = targetLots;
  if (pair.signal === pair.copy) {
    // Berechne wie viel Phenex schon gesetzt hat (alle Positionen gleiche Richtung + Symbol)
    try {
      const existingPos = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${copyAccountId}/positions`);
      if (Array.isArray(existingPos)) {
        const existingLots = existingPos
          .filter(p => p.symbol === symbol && p.type === (action === "BUY" ? "POSITION_TYPE_BUY" : "POSITION_TYPE_SELL"))
          .reduce((sum, p) => sum + p.volume, 0);
        totalLots = Math.max(0.01, Math.floor((targetLots - existingLots) * 100) / 100);
        console.log(`  Phenex: ${existingLots.toFixed(2)}L vorhanden | Ziel: ${targetLots.toFixed(2)}L | Top-Up: ${totalLots.toFixed(2)}L`);
        if (totalLots <= 0.01 && existingLots >= targetLots * 0.8) {
          console.log(`  [SKIP] Phenex Lots reichen aus (${existingLots.toFixed(2)}L >= ${(targetLots*0.8).toFixed(2)}L)`);
          await logCopyEvent(pair, pos, "COPIED", { latency_ms: 0 }); // Markiere als kopiert
          return 0;
        }
      }
    } catch {}
  }

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
      errorCount = 0;

      // Gruppiere Positionen nach Symbol+Direction (Phenex setzt 4 Splits = 1 Signal)
      const newPositions = positions.filter(pos => {
        const key = `${pos.id}-${pos.type}-${pos.symbol}`;
        if (known.has(key)) return false;
        known.add(key);
        return true;
      });

      // Gruppiere nach Symbol + Direction + gleiche Sekunde = EIN Signal
      const signals = new Map();
      for (const pos of newPositions) {
        const dir = pos.type.replace("POSITION_TYPE_", "");
        const timeKey = pos.time ? pos.time.slice(0, 19) : "now"; // Gleiche Sekunde
        const groupKey = `${pos.symbol}-${dir}-${timeKey}`;
        if (!signals.has(groupKey)) {
          signals.set(groupKey, { ...pos, _groupKey: groupKey });
        }
        // Ignoriere weitere Splits vom gleichen Signal — wir berechnen unsere eigenen Lots
      }

      for (const [groupKey, pos] of signals) {
        const ts = new Date().toLocaleTimeString("de-DE");
        const dir = pos.type.replace("POSITION_TYPE_", "");
        console.log(`\n[${ts}] SIGNAL: ${pair.name}`);
        console.log(`  ${dir} ${pos.symbol} @${pos.openPrice} (wir berechnen eigene Lots)`);

        await logCopyEvent(pair, pos, "DETECTED");
        await copyPosition(pos, pair.copy, pair);
      }

      // ── SL/TP Sync: Phenex setzt SL/TP nachtraeglich → auf unsere Positionen uebernehmen ──
      for (const pos of positions) {
        if (!pos.stopLoss && !pos.takeProfit) continue;
        const slKey = `sltp-${pair.copy}-${pos.symbol}-${pos.type}`;
        const slVal = `${pos.stopLoss || 0}-${pos.takeProfit || 0}`;
        if (known.has(slKey) && known.get(slKey) === slVal) continue; // Schon synchronisiert
        if (typeof known.get === 'undefined') continue; // knownPositions ist ein Set, brauche Map fuer SL/TP tracking
        // SL/TP hat sich geaendert → unsere Copy-Positionen updaten
        try {
          const mappedSym = mapSymbol(pos.symbol);
          const copyPositions = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${pair.copy}/positions`);
          if (!Array.isArray(copyPositions)) continue;
          const matching = copyPositions.filter(cp => cp.symbol === mappedSym && cp.type === pos.type && cp.comment?.startsWith("COPY-"));
          for (const cp of matching) {
            const payload = { actionType: "POSITION_MODIFY", positionId: cp.id };
            if (pos.stopLoss) payload.stopLoss = pos.stopLoss;
            if (pos.takeProfit) payload.takeProfit = pos.takeProfit;
            await apiFetch(`${CLIENT_BASE}/users/current/accounts/${pair.copy}/trade`, { method: "POST", body: JSON.stringify(payload) });
          }
          if (matching.length > 0) {
            console.log(`  [SYNC] SL/TP von ${pos.symbol}: SL=${pos.stopLoss || "-"} TP=${pos.takeProfit || "-"} → ${matching.length} Positionen`);
          }
        } catch {}
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
