#!/usr/bin/env node
/**
 * GoldFoundry Signal Bot v4 — EINZIGE Telegram-Verbindung
 * WebSocket für Millisekunden + Auto-Recovery + Direct MetaApi Trade
 *
 * REGEL: NUR dieser Bot darf Telegram nutzen. Vercel/Dashboard NIEMALS.
 */
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { readFileSync } from "fs";
import { join } from "path";

// ── Config ──
let envContent = "";
try { envContent = readFileSync("C:\\signal-bot\\.env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(".env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(join(process.cwd(), ".env.local"), "utf8"); } catch {}
const getEnv = (k, fb = "") => { const m = envContent.match(new RegExp(`${k}=(.+)`)); return m ? m[1].trim() : (process.env[k] || fb); };

const SB_KEY = getEnv("SUPABASE_SERVICE_KEY");
const SB_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exgmqztwuvwlncrmgmhq.supabase.co");
const METAAPI_TOKEN = getEnv("METAAPI_TOKEN");
const TG_API_ID = parseInt(getEnv("TELEGRAM_API_ID", "27346428"));
const TG_API_HASH = getEnv("TELEGRAM_API_HASH", "474624b94fcf276b0f787d2061b1aa09");
const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";
const CHANNELS = { "-1002568714747": "THE TRADING PHENEX", "-1002359719499": "Elite Channel" };

// ── Symbol Map ──
const SYMBOL_MAP = {gold:"XAUUSD",xau:"XAUUSD",xauusd:"XAUUSD",silver:"XAGUSD",xagusd:"XAGUSD",eurusd:"EURUSD",gbpusd:"GBPUSD",usdjpy:"USDJPY",usdcad:"USDCAD",usdchf:"USDCHF",audusd:"AUDUSD",nzdusd:"NZDUSD",eurgbp:"EURGBP",audnzd:"AUDNZD",gbpjpy:"GBPJPY",eurjpy:"EURJPY",btcusd:"BTCUSD",us500:"US500",nas100:"NAS100"};
const SYM_PATTERN = Object.keys(SYMBOL_MAP).sort((a, b) => b.length - a.length).join("|");

// ── Regex Parser ──
function parseSignal(msg) {
  const m = msg.replace(/\n/g, " ").trim();
  let action = null;
  if (/\b(buy|buying|long)\b/i.test(m)) action = "BUY";
  else if (/\b(sell|selling|short)\b/i.test(m)) action = "SELL";
  if (!action) return null;
  const symMatch = m.match(new RegExp(`(${SYM_PATTERN})`, "i"));
  if (!symMatch) return null;
  const symbol = SYMBOL_MAP[symMatch[1].toLowerCase()] || symMatch[1].toUpperCase();
  const atM = m.match(/(?:at|@|entry[:\s]*)\s*(\d+(?:\.\d{1,5})?)/i);
  const rangeM = m.match(/(\d{4,5}(?:\.\d{1,2})?)\s*[–\-]\s*(\d{4,5}(?:\.\d{1,2})?)/);
  const entry = atM ? parseFloat(atM[1]) : rangeM ? (parseFloat(rangeM[1]) + parseFloat(rangeM[2])) / 2 : null;
  const slM = m.match(/(?:SL|stop\s*loss|sl)[:\s]+(\d+(?:\.\d{1,5})?)/i);
  const sl = slM ? parseFloat(slM[1]) : null;
  const tpM = [...m.matchAll(/(?:TP\d?|take\s*profit\d?|tp\d?)[:\s]+(\d+(?:\.\d{1,5})?)/gi)];
  const tps = tpM.map(t => parseFloat(t[1])).filter(n => !isNaN(n));
  return { action, symbol, entry, sl, tps };
}

function isLikelySignal(text) {
  const l = text.toLowerCase();
  return ["buy","sell","buying","selling","long","short","tp","sl","signal","gold","xau","entry","close","raus","profite"].some(k => l.includes(k));
}

// ── Signal Scoring (from Strategy Engine v3) ──
// Score 0-100: hasSL(20) + hasTP(20) + confidence(20) + trendAlign(20) + R:R(20)
const lossTracker = { consecutive: 0, pauseUntil: 0 };

function scoreSignal(signal) {
  let score = 0;
  // 1. Has SL (20pts)
  if (signal.sl) score += 20;
  // 2. Has TP (20pts)
  if (signal.tps?.length) score += 20;
  // 3. Confidence — based on how complete the signal is (20pts)
  let conf = 0;
  if (signal.entry) conf += 7;
  if (signal.sl) conf += 7;
  if (signal.tps?.length >= 2) conf += 6;
  score += conf;
  // 4. Trend alignment — based on signal structure (20pts)
  // If we have entry+SL we know direction is intentional
  if (signal.entry && signal.sl) {
    const dirOk = (signal.action === "BUY" && signal.entry > signal.sl) ||
                  (signal.action === "SELL" && signal.entry < signal.sl);
    if (dirOk) score += 20;
  } else {
    score += 10; // partial credit without entry
  }
  // 5. Risk:Reward ratio (20pts)
  if (signal.sl && signal.entry && signal.tps?.length) {
    const risk = Math.abs(signal.entry - signal.sl);
    const reward = Math.abs(signal.tps[signal.tps.length - 1] - signal.entry);
    const rr = risk > 0 ? reward / risk : 0;
    if (rr >= 3) score += 20;
    else if (rr >= 2) score += 15;
    else if (rr >= 1.5) score += 10;
    else if (rr >= 1) score += 5;
  }
  return score;
}

function getAntiTiltMultiplier() {
  if (Date.now() < lossTracker.pauseUntil) return 0; // paused
  if (lossTracker.consecutive >= 5) return 0;
  if (lossTracker.consecutive >= 3) return 0.5;
  return 1.0;
}

// ── Broker Symbol Cache ──
const symbolCache = new Map();
async function getBrokerSymbol(accountId, symbol) {
  const key = `${accountId}-${symbol}`;
  if (symbolCache.has(key)) return symbolCache.get(key);
  try {
    const syms = await (await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/symbols`, {
      headers: { "auth-token": METAAPI_TOKEN }, signal: AbortSignal.timeout(10000),
    })).json();
    if (Array.isArray(syms)) {
      const names = syms.map(s => s.symbol || s);
      const found = names.find(n => n === symbol) || names.find(n => n === symbol + ".pro") || names.find(n => n.startsWith(symbol));
      if (found) { symbolCache.set(key, found); return found; }
    }
  } catch {}
  symbolCache.set(key, symbol);
  return symbol;
}

// ── Place Trade DIREKT via MetaApi ──
async function placeTrade(accountId, signal, brokerSymbol) {
  const actionType = signal.action === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";
  let balance = 10000;
  try {
    const info = await (await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/account-information`, {
      headers: { "auth-token": METAAPI_TOKEN }, signal: AbortSignal.timeout(8000),
    })).json();
    balance = info.equity || info.balance || 10000;
  } catch {}

  let lots = 0.01;
  if (signal.sl && signal.entry) {
    const slDist = Math.abs(signal.entry - signal.sl);
    const isGold = /xau|gold/i.test(signal.symbol);
    lots = Math.max(0.01, Math.min(Math.floor((balance * 0.01 / (slDist * (isGold ? 100 : 100000))) * 100) / 100, isGold ? 2 : 5));
  }
  // Apply engine lot multiplier (score + anti-tilt)
  if (signal._lotMultiplier && signal._lotMultiplier < 1) {
    lots = Math.max(0.01, Math.floor(lots * signal._lotMultiplier * 100) / 100);
  }

  const tps = [...(signal.tps || [])];
  if (signal.sl && signal.entry) {
    const slDist = Math.abs(signal.entry - signal.sl);
    const isBuy = signal.action === "BUY";
    while (tps.length < 4) {
      const mult = [1.5, 2.5, 3.5, 5][tps.length];
      tps.push(Math.round((isBuy ? signal.entry + slDist * mult : signal.entry - slDist * mult) * 100) / 100);
    }
  }

  const splits = tps.length >= 4
    ? [{p:0.40,tp:tps[0]},{p:0.25,tp:tps[1]},{p:0.20,tp:tps[2]},{p:0.15,tp:tps[3]}]
    : [{p:1.0,tp:tps[0]||null}];
  const orders = splits.map(s => ({lots: Math.max(0.01, Math.floor(lots*s.p*100)/100), tp: s.tp})).filter(s => s.lots >= 0.01);

  const results = await Promise.allSettled(orders.map(async (order, i) => {
    const payload = { actionType, symbol: brokerSymbol, volume: order.lots, comment: `TG-Signal TP${i+1}` };
    if (signal.sl) payload.stopLoss = signal.sl;
    if (order.tp) payload.takeProfit = order.tp;
    for (let a = 0; a < 2; a++) {
      try {
        const r = await (await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, {
          method: "POST", headers: { "auth-token": METAAPI_TOKEN, "Content-Type": "application/json" },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(10000),
        })).json();
        if (r.numericCode === 0 || r.stringCode === "TRADE_RETCODE_DONE" || r.stringCode === "ERR_NO_ERROR") return { ok: true };
        if (a === 0) await new Promise(r => setTimeout(r, 300));
      } catch {}
    }
    return { ok: false };
  }));
  return results.filter(r => r.status === "fulfilled" && r.value.ok).length;
}

// ── CONNECT + AUTO-RECOVERY ──
async function connectAndListen() {
  // Get session from DB
  const sess = await (await fetch(`${SB_URL}/rest/v1/telegram_sessions?select=session_string,status&status=eq.connected&limit=1`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  })).json();
  if (!sess[0]?.session_string) { console.log("❌ Keine Telegram-Session. Bitte im Dashboard verbinden."); return false; }

  // Get channel→account mapping
  const channels_db = await (await fetch(`${SB_URL}/rest/v1/telegram_active_channels?select=channel_id,channel_name,settings`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  })).json();
  const channelAccountMap = {};
  for (const ch of (channels_db || [])) {
    const linkedId = ch.settings?.linkedAccountId;
    if (linkedId) {
      const acc = await (await fetch(`${SB_URL}/rest/v1/slave_accounts?select=metaapi_account_id&id=eq.${linkedId}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      })).json();
      if (acc[0]) channelAccountMap[ch.channel_id] = { metaApiId: acc[0].metaapi_account_id, name: ch.channel_name };
    }
  }

  const client = new TelegramClient(new StringSession(sess[0].session_string), TG_API_ID, TG_API_HASH, {
    connectionRetries: 3, timeout: 30, retryDelay: 5000,
  });

  try {
    await client.connect();
  } catch (e) {
    console.log(`❌ Telegram Connect Fehler: ${e.message}`);
    if (e.message?.includes("AUTH_KEY_DUPLICATED")) {
      console.log("⏳ Session blockiert — warte 5 Minuten...");
      await new Promise(r => setTimeout(r, 5 * 60 * 1000));
    }
    return false;
  }

  console.log("✅ Telegram verbunden!");

  // Find channels
  const dialogs = await client.getDialogs({ limit: 300 });
  for (const d of dialogs) {
    const e = d.entity;
    if (!e || e.className !== "Channel") continue;
    const fullId = `-100${e.id?.value?.toString() || e.id?.toString() || ""}`;
    if (CHANNELS[fullId]) {
      const acc = channelAccountMap[fullId];
      console.log(`  📢 ${CHANNELS[fullId]} → ${acc ? "Account " + acc.metaApiId.slice(0, 8) : "KEIN ACCOUNT"}`);
    }
  }
  console.log("⚡ LIVE — Millisekunden-Modus!\n");

  // ── Message Handler ──
  client.addEventHandler(async (event) => {
    const message = event.message;
    if (!message?.message) return;
    const chatId = message.chatId?.value?.toString() || message.chatId?.toString() || "";
    const fullChatId = `-100${chatId}`;
    if (!CHANNELS[fullChatId]) return;

    const text = message.message;
    const channelName = CHANNELS[fullChatId];
    if (!isLikelySignal(text)) return;

    const signal = parseSignal(text);
    if (!signal) return;

    const ts = new Date().toLocaleTimeString("de-DE");
    console.log(`\n[${ts}] ⚡ ${signal.action} ${signal.symbol} | ${channelName}`);
    console.log(`   Entry:${signal.entry || "Market"} SL:${signal.sl || "—"} TP:${signal.tps?.join(",") || "auto"}`);

    const acc = channelAccountMap[fullChatId];
    if (!acc) { console.log("   ❌ Kein Account verknüpft!"); return; }

    // ── Engine Signal Scoring ──
    const score = scoreSignal(signal);
    const tiltMult = getAntiTiltMultiplier();
    console.log(`   📊 Score: ${score}/100 | Tilt: ×${tiltMult}`);

    if (tiltMult === 0) {
      console.log("   🛑 Anti-Tilt: Paused — skipping trade");
      return;
    }
    if (score < 40) {
      console.log(`   ⛔ Score too low (${score}<40) — skipping trade`);
      return;
    }

    // Adjust lot multiplier based on score + tilt
    const lotMultiplier = (score / 100) * tiltMult;
    signal._lotMultiplier = lotMultiplier;

    const start = Date.now();
    const brokerSym = await getBrokerSymbol(acc.metaApiId, signal.symbol);
    const executed = await placeTrade(acc.metaApiId, signal, brokerSym);
    console.log(`   ${executed > 0 ? "🎯" : "❌"} ${executed} Order(s) in ${Date.now() - start}ms (${brokerSym}) [lots×${lotMultiplier.toFixed(2)}]`);
  }, new NewMessage({}));

  // Heartbeat
  const hb = setInterval(() => {
    process.stdout.write(`\r[${new Date().toLocaleTimeString("de-DE")}] 💚 LIVE`);
  }, 30000);

  // Wait for disconnect
  return new Promise((resolve) => {
    client.addEventHandler(() => {}, { /* keep alive */ });
    // If connection drops, cleanup and signal reconnect
    const checkInterval = setInterval(async () => {
      try {
        if (!client.connected) {
          console.log("\n⚠️  Verbindung verloren — Reconnect...");
          clearInterval(checkInterval);
          clearInterval(hb);
          resolve(false);
        }
      } catch { clearInterval(checkInterval); clearInterval(hb); resolve(false); }
    }, 30000);
  });
}

// ── Main Loop mit Auto-Recovery ──
async function main() {
  if (!SB_KEY) { console.error("❌ SUPABASE_SERVICE_KEY fehlt!"); process.exit(1); }
  if (!METAAPI_TOKEN) { console.error("❌ METAAPI_TOKEN fehlt!"); process.exit(1); }

  console.log("🚀 GoldFoundry Signal Bot v4");
  console.log("═══════════════════════════════════════");
  console.log("  EINZIGE Telegram-Verbindung (kein Conflict!)");
  console.log("  Trades DIREKT via MetaApi (Millisekunden)");
  console.log("  Auto-Recovery bei Disconnect");
  console.log("═══════════════════════════════════════\n");

  while (true) {
    const success = await connectAndListen();
    if (!success) {
      console.log("🔄 Reconnect in 60 Sekunden...\n");
      await new Promise(r => setTimeout(r, 60000));
    }
  }
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
