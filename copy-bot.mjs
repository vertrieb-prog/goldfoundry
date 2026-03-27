#!/usr/bin/env node
/**
 * GoldFoundry ACCOUNT COPIER
 * Liest Trades vom RoboForex Signal-Konto und kopiert sie auf TagMarket mit unserer Strategie.
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
if (!METAAPI_TOKEN) { console.error("❌ METAAPI_TOKEN fehlt!"); process.exit(1); }

// ── Account Pairs: Signal (READ ONLY) → Copy (WRITE) ──
const COPY_PAIRS = [
  { signal: "707f3173-572e-4002-9e8a-21b864525d30", copy: "66d8fe15-368b-4e3c-8c6c-ed32bea5b56b", name: "RoboForex #1 → TagMarket Copy-Demo" },
  { signal: "58934470-695b-404b-bcad-8c406fd7d04d", copy: "02f08a16-ae02-40f4-9195-2c62ec52e8eb", name: "RoboForex #2 → TagMarket Copy-Demo 2" },
];
const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";
const POLL_INTERVAL = 3000; // 3 Sekunden

// ── State (per pair) ──
const knownPositions = new Map(); // pairIndex → Set
let lastCheck = 0;

async function apiFetch(url, opts) {
  const r = await fetch(url, {
    ...opts,
    headers: { "auth-token": METAAPI_TOKEN, "Content-Type": "application/json", ...(opts?.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  return r.json();
}

// ── Lot Calculator (simplified) ──
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

// ── 4-Split Orders ──
function buildSplits(totalLots, tps, entry, sl, action) {
  const isBuy = action === "BUY";
  const slDist = sl && entry ? Math.abs(entry - sl) : 10;
  // Auto-generate TPs if missing
  while (tps.length < 4) {
    const mult = tps.length === 0 ? 1.5 : tps.length === 1 ? 2.5 : tps.length === 2 ? 3.5 : 5;
    tps.push(Math.round((isBuy ? entry + slDist * mult : entry - slDist * mult) * 100) / 100);
  }
  return [
    { pct: 0.40, tp: tps[0], label: "TP1" },
    { pct: 0.25, tp: tps[1], label: "TP2" },
    { pct: 0.20, tp: tps[2], label: "TP3" },
    { pct: 0.15, tp: tps[3], label: "Runner" },
  ].map(s => ({ lots: Math.max(0.01, Math.floor(totalLots * s.pct * 100) / 100), ...s }))
   .filter(s => s.lots >= 0.01);
}

// ── Copy a single position ──
let copyAccountId = ""; // set per poll iteration
async function copyPosition(pos) {
  const action = pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
  const symbol = pos.symbol;
  const entry = pos.openPrice;
  const sl = pos.stopLoss;
  const tps = pos.takeProfit ? [pos.takeProfit] : [];

  // Get copy account balance
  let balance = 10000;
  try {
    const info = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${copyAccountId}/account-information`);
    balance = info.equity || info.balance || 10000;
  } catch {}

  const totalLots = calcLots(symbol, sl, entry, balance);
  const splits = buildSplits(totalLots, [...tps], entry, sl, action);
  const actionType = action === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";

  console.log(`  📊 ${action} ${symbol} | Entry:${entry} SL:${sl} TP:${tps[0] || "auto"} | ${totalLots}L → ${splits.length} orders`);

  // Place all splits in parallel
  const results = await Promise.allSettled(splits.map(async (split) => {
    const payload = { actionType, symbol, volume: split.lots, comment: `COPY-${split.label}` };
    if (sl) payload.stopLoss = sl;
    if (split.tp) payload.takeProfit = split.tp;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${copyAccountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
        if (r.numericCode === 0 || r.stringCode === "TRADE_RETCODE_DONE" || r.stringCode === "ERR_NO_ERROR") {
          return { ok: true, orderId: r.orderId, label: split.label };
        }
        if (attempt === 0) await new Promise(r => setTimeout(r, 500));
      } catch {}
    }
    return { ok: false, label: split.label };
  }));

  const success = results.filter(r => r.status === "fulfilled" && r.value.ok).length;
  console.log(`  ✅ ${success}/${splits.length} Orders gesetzt`);
}

// ── Main Poll Loop ──
async function poll() {
  for (let i = 0; i < COPY_PAIRS.length; i++) {
    const pair = COPY_PAIRS[i];
    copyAccountId = pair.copy;
    if (!knownPositions.has(i)) knownPositions.set(i, new Set());
    const known = knownPositions.get(i);

    try {
      const positions = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${pair.signal}/positions`);
      if (!Array.isArray(positions)) continue;

      for (const pos of positions) {
        const key = `${pos.id}-${pos.type}-${pos.symbol}`;
        if (known.has(key)) continue;
        known.add(key);

        const age = Date.now() - (pos.time ? new Date(pos.time).getTime() : 0);
        if (age > 5 * 60 * 1000 && known.size > 1) continue;

        const ts = new Date().toLocaleTimeString("de-DE");
        console.log(`\n[${ts}] ⚡ SIGNAL: ${pair.name}`);
        console.log(`  ${pos.type.replace("POSITION_TYPE_", "")} ${pos.symbol} ${pos.volume}L @${pos.openPrice}`);

        await copyPosition(pos);
      }

      // Track closed
      const currentIds = new Set(positions.map(p => `${p.id}-${p.type}-${p.symbol}`));
      for (const key of known) { if (!currentIds.has(key)) known.delete(key); }
    } catch {}
  }
}

// ── Start ──
console.log("🚀 GoldFoundry ACCOUNT COPIER");
console.log("═══════════════════════════════════════");
for (const p of COPY_PAIRS) console.log(`  ${p.name}`);
console.log(`  Poll: alle ${POLL_INTERVAL / 1000}s`);
console.log("═══════════════════════════════════════\n");

// Initial: load existing positions
for (let i = 0; i < COPY_PAIRS.length; i++) {
  knownPositions.set(i, new Set());
  try {
    const existing = await apiFetch(`${CLIENT_BASE}/users/current/accounts/${COPY_PAIRS[i].signal}/positions`);
    if (Array.isArray(existing)) {
      for (const p of existing) knownPositions.get(i).add(`${p.id}-${p.type}-${p.symbol}`);
      console.log(`📋 ${COPY_PAIRS[i].name}: ${existing.length} bestehende Positionen`);
    }
} catch {}

console.log("⚡ Warte auf neue Signale...\n");

// Poll every 3 seconds
setInterval(poll, POLL_INTERVAL);

// Heartbeat
setInterval(() => {
  process.stdout.write(`\r[${new Date().toLocaleTimeString("de-DE")}] 💚 Watching... (${knownPositions.size} tracked)`);
}, 30000);
