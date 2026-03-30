#!/usr/bin/env node
/**
 * GoldFoundry TRADE MONITOR v1 — Standalone for Contabo
 * Real-Time SynchronizationListener + 5s Fallback + 60s Health Check
 * Start: node trade-monitor-standalone.mjs
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
const SB_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SB_KEY = getEnv("SUPABASE_SERVICE_KEY") || getEnv("SUPABASE_SERVICE_ROLE_KEY");
if (!METAAPI_TOKEN) { console.error("[ERR] METAAPI_TOKEN fehlt!"); process.exit(1); }
if (!SB_URL || !SB_KEY) { console.error("[ERR] Supabase credentials fehlen!"); process.exit(1); }

const SIGNALS = [
  { id: "707f3173-572e-4002-9e8a-21b864525d30", name: "RoboForex #1 (23651610)" },
  { id: "58934470-695b-404b-bcad-8c406fd7d04d", name: "RoboForex #2 (68297968)" },
  { id: "e19811f9-0dc4-4e47-8e99-183d2f266c57", name: "Phenex Live (50683542)" },
];
const COPY_ACCOUNTS = [
  { id: "66d8fe15-368b-4e3c-8c6c-ed32bea5b56b", name: "Copy-Demo (50701689)" },
  { id: "02f08a16-ae02-40f4-9195-2c62ec52e8eb", name: "Copy-Demo 2 (50701707)" },
];
const COPY_PAIRS = [];
for (const sig of SIGNALS) {
  for (const copy of COPY_ACCOUNTS) {
    COPY_PAIRS.push({ signal: sig.id, copy: copy.id, name: `${sig.name} → ${copy.name}` });
  }
}
const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";

// ── Supabase Helpers ──
async function sbInsert(table, data) {
  if (!SB_URL || !SB_KEY) return;
  await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(data),
  }).catch(() => {});
}

async function sbSelect(table, params) {
  const url = `${SB_URL}/rest/v1/${table}?${params}`;
  const r = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  return r.ok ? r.json() : [];
}

// ── MetaApi REST ──
async function apiFetch(accountId, path, opts) {
  const url = `${CLIENT_BASE}/users/current/accounts/${accountId}${path}`;
  const r = await fetch(url, {
    ...opts,
    headers: { "auth-token": METAAPI_TOKEN, "Content-Type": "application/json", ...(opts?.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  return r.json();
}

// ── Symbol Mapping: RoboForex → TagMarket ──
// TagMarket: Forex/Metalle/Indices/Oil = .pro Suffix, Crypto/Aktien = plain
function mapSymbol(symbol) {
  const sym = symbol.toUpperCase().replace(/\.PRO$|\.A$|\.B$|\.M$|\.E$/, "");
  const crypto = ["BTCUSD", "ETHUSD", "LTCUSD", "XRPUSD", "ADAUSD", "SOLUSD", "EOSUSD", "XLMUSD", "XMRUSD", "ETHEUR"];
  if (crypto.includes(sym)) return sym;
  const stocks = ["TESLA", "APPLE", "AMAZON", "MICROSOFT", "NETFLIX", "BOEING", "INTEL", "FORD", "GM",
    "VISA", "IBM", "HP", "ORACLE", "CISCO", "FERRARI", "ADIDAS", "SIEMENS", "LUFTHANSA", "DAIMLER",
    "ALLIANZ", "COMMERZBANK", "LVMH", "TOTAL", "BNP", "SOCIETE", "SANTANDER", "TELEFONICA",
    "COINBASE", "EBAY", "FEDEX", "GE", "HILTON", "JPMORGAN", "GOLDMANS", "CITI", "AIG",
    "AMEX", "CHEVRON", "EXXON", "JOHNSON", "MSTRCARD", "TEVA", "EON", "ALIBABA"];
  if (stocks.includes(sym)) return sym;
  return sym + ".pro";
}

// ── Lot Calculator — 4% Risk TOTAL (4 Splits à 1% = 4% pro Signal) ──
function calcLots(symbol, sl, entry, balance = 10000, riskPct = 4) {
  if (!entry) return 0.01;
  const slDist = sl ? Math.abs(entry - sl) : getDefaultSlDist(symbol);
  if (slDist === 0) return 0.01;
  const riskAmount = balance * (riskPct / 100);
  const isGold = /xau|gold/i.test(symbol);
  const isJPY = /jpy/i.test(symbol);
  const isIndex = /us500|us30|nas|de40|uk100|jp225/i.test(symbol);
  const isOil = /oil/i.test(symbol);
  const pipValue = isGold ? 100 : isJPY ? 1000 : isIndex ? 1 : isOil ? 10 : 100000;
  let lots = riskAmount / (slDist * pipValue);
  const maxLots = isGold ? 5.0 : isIndex ? 20.0 : isOil ? 10.0 : 10.0;
  lots = Math.max(0.01, Math.min(lots, maxLots));
  return Math.floor(lots * 100) / 100;
}

function getDefaultSlDist(symbol) {
  const sym = symbol.toUpperCase();
  if (/XAU|GOLD/.test(sym)) return 5;
  if (/XAG|SILVER/.test(sym)) return 0.15;
  if (/JPY/.test(sym)) return 0.15;
  if (/BTC/.test(sym)) return 200;
  if (/US30|NAS|US500|DE40|UK100|JP225/.test(sym)) return 25;
  if (/OIL/.test(sym)) return 0.50;
  return 0.0015;
}

function buildSplits(totalLots, tps, entry, sl, action, symbol) {
  const isBuy = action === "BUY";
  const slDist = sl && entry ? Math.abs(entry - sl) : getDefaultSlDist(symbol);
  while (tps.length < 4) {
    const mult = [1.5, 2.5, 3.5, 5.0][tps.length];
    tps.push(Math.round((isBuy ? entry + slDist * mult : entry - slDist * mult) * 100) / 100);
  }
  return [
    { pct: 0.40, tp: tps[0], label: "TP1" },
    { pct: 0.25, tp: tps[1], label: "TP2" },
    { pct: 0.20, tp: tps[2], label: "TP3" },
    { pct: 0.15, tp: tps[3], label: "Runner" },
  ].map(s => ({ lots: Math.max(0.01, Math.floor(totalLots * s.pct * 100) / 100), ...s }));
}

// ── Copy Execution ──
async function executeCopy(pos, pair) {
  const action = pos.type.includes("BUY") ? "BUY" : "SELL";
  const mappedSymbol = mapSymbol(pos.symbol);
  if (mappedSymbol !== pos.symbol) console.log(`  [MAP] ${pos.symbol} → ${mappedSymbol}`);
  const start = Date.now();

  // Duplicate check
  const existing = await sbSelect("copy_events", `position_id=eq.${pos.id}&status=eq.COPIED&limit=1`);
  if (existing.length > 0) {
    console.log(`  [SKIP] Already copied: ${pos.symbol} ${pos.id}`);
    return;
  }

  // Log detected
  await sbInsert("copy_events", {
    pair_name: pair.name, signal_account_id: pair.signal, copy_account_id: pair.copy,
    position_id: String(pos.id), symbol: pos.symbol, direction: action,
    volume: pos.volume, open_price: pos.openPrice, status: "DETECTED",
  });

  // Score-Filter DEAKTIVIERT — Signal-Trader setzen oft kein SL/TP, das ist normal

  // Get balance + calc lots
  let balance = 10000;
  try {
    const info = await apiFetch(pair.copy, "/account-information");
    balance = info.equity || info.balance || 10000;
  } catch {}

  let totalLots = calcLots(pos.symbol, pos.stopLoss, pos.openPrice, balance);
  totalLots = Math.max(0.01, Math.floor(totalLots * scoreMult * 100) / 100);
  const tps = pos.takeProfit ? [pos.takeProfit] : [];
  const splits = buildSplits(totalLots, [...tps], pos.openPrice, pos.stopLoss, action, pos.symbol);
  const actionType = action === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";

  console.log(`  ${action} ${pos.symbol} | ${totalLots}L -> ${splits.length} splits`);

  const results = await Promise.allSettled(splits.map(async (split) => {
    const payload = { actionType, symbol: mappedSymbol, volume: split.lots, comment: `COPY-${split.label}` };
    if (pos.stopLoss) payload.stopLoss = pos.stopLoss;
    if (split.tp) payload.takeProfit = split.tp;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await apiFetch(pair.copy, "/trade", { method: "POST", body: JSON.stringify(payload) });
        if (r.numericCode === 0 || r.stringCode === "TRADE_RETCODE_DONE" || r.stringCode === "ERR_NO_ERROR") return { ok: true };
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 500));
      } catch {}
    }
    return { ok: false };
  }));

  const success = results.filter(r => r.status === "fulfilled" && r.value.ok).length;
  const latency = Date.now() - start;

  await sbInsert("copy_events", {
    pair_name: pair.name, signal_account_id: pair.signal, copy_account_id: pair.copy,
    position_id: String(pos.id), symbol: pos.symbol, direction: action,
    volume: totalLots, open_price: pos.openPrice,
    status: success > 0 ? "COPIED" : "ERROR",
    error_message: success > 0 ? null : `0/${splits.length} orders failed`,
    latency_ms: latency,
  });

  console.log(`  [${success > 0 ? "COPIED" : "ERROR"}] ${success}/${splits.length} orders | ${latency}ms`);
}

// ── Health Check ──
const alertedPositions = new Set();

async function healthCheck() {
  for (const pair of COPY_PAIRS) {
    try {
      const masterPos = await apiFetch(pair.signal, "/positions");
      const followerPos = await apiFetch(pair.copy, "/positions");
      if (!Array.isArray(masterPos) || !Array.isArray(followerPos)) continue;

      const followerSymDirs = new Set(followerPos.map(p => `${p.symbol}-${p.type}`));
      const followerComments = followerPos.map(p => p.comment || "").join(" ");

      for (const mp of masterPos) {
        // Grace period: skip if <30s old
        if (mp.time && (Date.now() - new Date(mp.time).getTime()) < 30000) continue;

        const matched = followerComments.includes(`COPY-`) && followerSymDirs.has(`${mp.symbol}-${mp.type}`);
        if (matched) continue;

        const key = `${pair.signal}-${mp.id}`;
        if (alertedPositions.has(key)) continue;

        // Check copy_events
        const events = await sbSelect("copy_events", `position_id=eq.${mp.id}&signal_account_id=eq.${pair.signal}&limit=1`);
        if (events.length > 0) continue; // Already processed (COPIED or BLOCKED)

        // MISSED!
        alertedPositions.add(key);
        const dir = mp.type?.replace("POSITION_TYPE_", "") || "?";
        console.log(`\n[HEALTH] 🚨 MISSED: ${mp.symbol} ${dir} ${mp.volume}L on ${pair.name}`);

        await sbInsert("copy_events", {
          pair_name: pair.name, signal_account_id: pair.signal, copy_account_id: pair.copy,
          position_id: String(mp.id), symbol: mp.symbol, direction: dir,
          volume: mp.volume, open_price: mp.openPrice, status: "MISSED",
          block_reason: "Not found on follower, no copy event recorded",
        });

        await sbInsert("engine_events", {
          type: "signal", icon: "🚨", badge: "MISSED",
          text: "ALARM: Trade nicht kopiert!",
          detail: `${mp.symbol} ${dir} ${mp.volume}L @ ${mp.openPrice} auf ${pair.name}`,
          color: "#ff5045",
        });
      }
    } catch (e) {
      console.log(`[HEALTH] Error checking ${pair.name}: ${(e.message || "").slice(0, 60)}`);
    }
  }
}

// ── Real-Time Monitor ──
const fallbackIntervals = new Map();

async function startRealtime(pair) {
  try {
    const MetaApi = (await import("metaapi.cloud-sdk")).default;
    const api = new MetaApi(METAAPI_TOKEN, { retryOpts: { retries: 3, minDelayInSeconds: 1, maxDelayInSeconds: 10 } });
    const account = await api.metatraderAccountApi.getAccount(pair.signal);

    if (account.state !== "DEPLOYED") await account.deploy();
    await account.waitConnected();

    const conn = account.getStreamingConnection();

    conn.addSynchronizationListener({
      onDealAdded: async (_idx, deal) => {
        const ts = new Date().toLocaleTimeString("de-DE");
        console.log(`\n[${ts}] DEAL: ${deal.symbol} ${deal.type} ${deal.volume}L @ ${deal.price} (${pair.name})`);

        await sbInsert("engine_events", {
          type: "signal", icon: "📡", badge: "DEAL",
          text: `Deal erkannt: ${deal.symbol} ${deal.type}`,
          detail: `${deal.volume}L @ ${deal.price} | ${pair.name}`,
          color: "#d4a537",
        });

        if (deal.entryType === "DEAL_ENTRY_IN") {
          const pos = {
            id: deal.positionId || deal.id,
            symbol: deal.symbol,
            type: deal.type === "DEAL_TYPE_BUY" ? "POSITION_TYPE_BUY" : "POSITION_TYPE_SELL",
            openPrice: deal.price,
            stopLoss: deal.stopLoss,
            takeProfit: deal.takeProfit,
            volume: deal.volume,
          };
          await executeCopy(pos, pair);
        }

        if (deal.entryType === "DEAL_ENTRY_OUT") {
          console.log(`  [CLOSE] Position ${deal.positionId} closed, P&L: ${deal.profit}`);
        }
      },

      onDisconnected: (_idx) => {
        console.log(`\n[WARN] Disconnected: ${pair.name} — starting fallback poller`);
        startFallback(pair);
      },

      onReconnected: () => {
        console.log(`\n[OK] Reconnected: ${pair.name} — stopping fallback`);
        stopFallback(pair);
      },
    });

    await conn.connect();
    await conn.waitSynchronized();
    console.log(`  [OK] Real-time connected: ${pair.name}`);

    await sbInsert("engine_events", {
      type: "mode", icon: "🟢", badge: "LIVE",
      text: `Real-time verbunden: ${pair.name}`,
      detail: "SynchronizationListener aktiv",
      color: "#00e6a0",
    });

    return true;
  } catch (e) {
    console.log(`  [WARN] Real-time failed for ${pair.name}: ${(e.message || "").slice(0, 60)}`);
    console.log(`  [FALLBACK] Starting 5s poller for ${pair.name}`);
    startFallback(pair);
    return false;
  }
}

// ── Fallback Poller ──
function startFallback(pair) {
  if (fallbackIntervals.has(pair.signal)) return;

  const poll = async () => {
    try {
      const positions = await apiFetch(pair.signal, "/positions");
      if (!Array.isArray(positions)) return;

      // Get known positions from Supabase (persistent!)
      const known = await sbSelect("copy_events",
        `signal_account_id=eq.${pair.signal}&status=in.(COPIED,BLOCKED,DETECTED)&created_at=gte.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}&select=position_id`
      );
      const knownIds = new Set(known.map(k => k.position_id));

      // Gruppiere nach Symbol+Direction+Sekunde = EIN Signal (Trader setzt oft 4 Splits)
      const newPositions = positions.filter(p => !knownIds.has(String(p.id)));
      const signals = new Map();
      for (const pos of newPositions) {
        const dir = pos.type?.replace("POSITION_TYPE_", "") || "?";
        const timeKey = pos.time ? pos.time.slice(0, 19) : "now";
        const groupKey = `${pos.symbol}-${dir}-${timeKey}`;
        if (!signals.has(groupKey)) signals.set(groupKey, pos);
      }

      for (const [, pos] of signals) {
        const ts = new Date().toLocaleTimeString("de-DE");
        console.log(`\n[${ts}] FALLBACK SIGNAL: ${pos.symbol} ${pos.type?.replace("POSITION_TYPE_", "")} @${pos.openPrice} (${pair.name})`);
        await executeCopy(pos, pair);
      }
    } catch (e) {
      if (!String(e.message).includes("timeout")) {
        console.log(`[FALLBACK] Poll error: ${(e.message || "").slice(0, 60)}`);
      }
    }
  };

  poll(); // First poll immediately
  fallbackIntervals.set(pair.signal, setInterval(poll, 5000));
}

function stopFallback(pair) {
  const interval = fallbackIntervals.get(pair.signal);
  if (interval) {
    clearInterval(interval);
    fallbackIntervals.delete(pair.signal);
  }
}

// ── Main ──
async function start() {
  console.log("GoldFoundry TRADE MONITOR v1 (Standalone)");
  console.log("=".repeat(45));
  console.log("  Real-Time: SynchronizationListener");
  console.log("  Fallback:  5s REST Polling");
  console.log("  Health:    60s Master vs Follower Check");
  for (const p of COPY_PAIRS) console.log(`  ${p.name}`);
  console.log("=".repeat(45) + "\n");

  // Connect real-time for each pair
  for (const pair of COPY_PAIRS) {
    await startRealtime(pair);
  }

  // Start health check every 60s
  healthCheck();
  setInterval(healthCheck, 60000);

  console.log("\n[LIVE] Trade Monitor + Health Check aktiv!\n");

  // Heartbeat
  setInterval(() => {
    const ts = new Date().toLocaleTimeString("de-DE");
    const mode = fallbackIntervals.size > 0 ? `FALLBACK(${fallbackIntervals.size})` : "REALTIME";
    process.stdout.write(`\r[${ts}] Monitor OK | ${mode}`);
  }, 30000);
}

// Auto-restart
start().catch(e => {
  console.error(`[FATAL] ${e.message}`);
  console.log("[RESTART] Neustart in 10s...");
  setTimeout(() => start().catch(() => process.exit(1)), 10000);
});

process.on("unhandledRejection", (err) => {
  console.error(`[WARN] Unhandled rejection: ${(err?.message || String(err)).slice(0, 80)}`);
});
