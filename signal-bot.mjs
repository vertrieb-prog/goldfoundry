#!/usr/bin/env node
/**
 * GoldFoundry Signal Bot v6 — FAST POLL
 * Pollt Telegram alle 1 Sekunde via getMessages (KEIN EventHandler)
 * Umgeht den GramJS builder.resolve Bug komplett
 * ~1 Sekunde Delay statt 30s
 */
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
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
const POLL_MS = 1000; // 1 Sekunde

// ── Symbol Map + Parser ──
const SYMBOL_MAP = {gold:"XAUUSD",xau:"XAUUSD",xauusd:"XAUUSD",silver:"XAGUSD",xagusd:"XAGUSD",eurusd:"EURUSD",gbpusd:"GBPUSD",usdjpy:"USDJPY",usdcad:"USDCAD",usdchf:"USDCHF",audusd:"AUDUSD",nzdusd:"NZDUSD",eurgbp:"EURGBP",audnzd:"AUDNZD",gbpjpy:"GBPJPY",eurjpy:"EURJPY",btcusd:"BTCUSD",us500:"US500",nas100:"NAS100"};
const SYM_PATTERN = Object.keys(SYMBOL_MAP).sort((a, b) => b.length - a.length).join("|");

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

// ── Place Trade ──
async function placeTrade(accountId, signal, brokerSymbol) {
  const isBuy = signal.action === "BUY";
  const isGold = /xau|gold/i.test(brokerSymbol);

  // Auto-SL
  if (!signal.sl) {
    let price = signal.entry;
    if (!price) {
      try {
        const tick = await (await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/symbols/${brokerSymbol}/current-price`, {
          headers: { "auth-token": METAAPI_TOKEN }, signal: AbortSignal.timeout(8000),
        })).json();
        price = tick.bid || tick.ask || 0;
      } catch {}
    }
    if (price) {
      const slDist = isGold ? 10 : /jpy/i.test(brokerSymbol) ? 0.30 : 0.0030;
      signal.sl = Math.round((isBuy ? price - slDist : price + slDist) * 100) / 100;
      signal.entry = signal.entry || price;
      console.log(`   🛡️ Auto-SL: ${signal.sl}`);
    }
  }

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
    lots = Math.max(0.01, Math.min(Math.floor((balance * 0.01 / (slDist * (isGold ? 100 : 100000))) * 100) / 100, isGold ? 2 : 5));
  }

  const tps = [...(signal.tps || [])];
  if (signal.sl && signal.entry) {
    const slDist = Math.abs(signal.entry - signal.sl);
    while (tps.length < 4) {
      const mult = [1.5, 2.5, 3.5, 5][tps.length];
      tps.push(Math.round((isBuy ? signal.entry + slDist * mult : signal.entry - slDist * mult) * 100) / 100);
    }
  }

  const actionType = isBuy ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";
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

// ── Main ──
async function main() {
  if (!SB_KEY || !METAAPI_TOKEN) { console.error("❌ ENV fehlt!"); process.exit(1); }

  // Get session
  const sess = await (await fetch(`${SB_URL}/rest/v1/telegram_sessions?select=session_string&status=eq.connected&limit=1`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  })).json();
  if (!sess[0]?.session_string) { console.error("❌ Keine Telegram-Session!"); process.exit(1); }

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

  // Connect
  const client = new TelegramClient(new StringSession(sess[0].session_string), TG_API_ID, TG_API_HASH, { connectionRetries: 5, timeout: 30 });
  await client.connect();

  // Find channel entities
  const dialogs = await client.getDialogs({ limit: 300 });
  const channelEntities = {};
  const CHANNELS = { "-1002568714747": "THE TRADING PHENEX", "-1002359719499": "Elite Channel" };

  for (const d of dialogs) {
    const e = d.entity;
    if (!e || e.className !== "Channel") continue;
    const fullId = `-100${e.id?.value?.toString() || e.id?.toString() || ""}`;
    if (CHANNELS[fullId]) {
      channelEntities[fullId] = e;
      const acc = channelAccountMap[fullId];
      console.log(`  📢 ${CHANNELS[fullId]} → ${acc ? acc.metaApiId.slice(0, 8) : "KEIN ACCOUNT"}`);
    }
  }

  console.log("\n🚀 GoldFoundry Signal Bot v6 — FAST POLL");
  console.log(`  Polling alle ${POLL_MS}ms (${Object.keys(channelEntities).length} Channels)`);
  console.log("  KEIN EventHandler — getMessages() Loop\n");

  // Track last seen message ID per channel
  const lastMsgId = {};
  // Initialize with current last message
  for (const [chId, entity] of Object.entries(channelEntities)) {
    try {
      const msgs = await client.getMessages(entity, { limit: 1 });
      if (msgs[0]) lastMsgId[chId] = msgs[0].id;
    } catch {}
  }
  console.log("⚡ LIVE — warte auf Signale...\n");

  // ── FAST POLL LOOP ──
  let pollCount = 0;
  setInterval(async () => {
    pollCount++;
    for (const [chId, entity] of Object.entries(channelEntities)) {
      try {
        const msgs = await client.getMessages(entity, { limit: 3 });
        for (const msg of msgs) {
          if (!msg.message || msg.id <= (lastMsgId[chId] || 0)) continue;
          lastMsgId[chId] = msg.id;

          const text = msg.message;
          const channelName = CHANNELS[chId];

          if (!isLikelySignal(text)) {
            if (text.length > 10) console.log(`[${new Date().toLocaleTimeString("de-DE")}] 💬 ${channelName}: ${text.slice(0, 60).replace(/\n/g, " ")}`);
            continue;
          }

          const signal = parseSignal(text);
          if (!signal) continue;

          const ts = new Date().toLocaleTimeString("de-DE");
          console.log(`\n[${ts}] ⚡ ${signal.action} ${signal.symbol} | ${channelName}`);
          console.log(`   Entry:${signal.entry || "Market"} SL:${signal.sl || "auto"} TP:${signal.tps?.join(",") || "auto"}`);

          const acc = channelAccountMap[chId];
          if (!acc) { console.log("   ❌ Kein Account verknüpft!"); continue; }

          const start = Date.now();
          const brokerSym = await getBrokerSymbol(acc.metaApiId, signal.symbol);
          const executed = await placeTrade(acc.metaApiId, signal, brokerSym);
          console.log(`   ${executed > 0 ? "🎯" : "❌"} ${executed} Order(s) in ${Date.now() - start}ms (${brokerSym})`);
        }
      } catch {}
    }
    if (pollCount % 60 === 0) {
      process.stdout.write(`\r[${new Date().toLocaleTimeString("de-DE")}] 💚 LIVE | Poll #${pollCount}`);
    }
  }, POLL_MS);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
