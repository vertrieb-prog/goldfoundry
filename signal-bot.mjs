#!/usr/bin/env node
/**
 * GoldFoundry REALTIME Signal Bot v2
 * Telegram WebSocket → Regex Parse → MetaApi Trade → Millisekunden
 * KEIN Umweg über Vercel — Trades werden DIREKT gesetzt
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

// ── Regex Parser (DIREKT, kein AI) ──
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

// ── MetaApi Trade ──
async function placeTrade(accountId, signal, brokerSymbol) {
  const action = signal.action === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";

  // Get balance for lot calc
  let balance = 10000;
  try {
    const info = await (await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/account-information`, {
      headers: { "auth-token": METAAPI_TOKEN }, signal: AbortSignal.timeout(8000),
    })).json();
    balance = info.equity || info.balance || 10000;
  } catch {}

  // Lot calc
  let lots = 0.01;
  if (signal.sl && signal.entry) {
    const slDist = Math.abs(signal.entry - signal.sl);
    const isGold = /xau|gold/i.test(signal.symbol);
    const riskPerLot = slDist * (isGold ? 100 : 100000);
    lots = Math.max(0.01, Math.min(Math.floor((balance * 0.01 / riskPerLot) * 100) / 100, isGold ? 2 : 5));
  }

  // Auto TPs
  const tps = [...(signal.tps || [])];
  if (signal.sl && signal.entry) {
    const slDist = Math.abs(signal.entry - signal.sl);
    const isBuy = signal.action === "BUY";
    while (tps.length < 4) {
      const mult = [1.5, 2.5, 3.5, 5][tps.length];
      tps.push(Math.round((isBuy ? signal.entry + slDist * mult : signal.entry - slDist * mult) * 100) / 100);
    }
  }

  // 4-Split parallel
  const splits = tps.length >= 4
    ? [{ pct: 0.40, tp: tps[0] }, { pct: 0.25, tp: tps[1] }, { pct: 0.20, tp: tps[2] }, { pct: 0.15, tp: tps[3] }]
    : [{ pct: 1.0, tp: tps[0] || null }];

  const orders = splits.map(s => ({ lots: Math.max(0.01, Math.floor(lots * s.pct * 100) / 100), tp: s.tp })).filter(s => s.lots >= 0.01);

  const results = await Promise.allSettled(orders.map(async (order, i) => {
    const payload = { actionType: action, symbol: brokerSymbol, volume: order.lots, comment: `TG-Signal TP${i + 1}` };
    if (signal.sl) payload.stopLoss = signal.sl;
    if (order.tp) payload.takeProfit = order.tp;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await (await fetch(`${CLIENT_BASE}/users/current/accounts/${accountId}/trade`, {
          method: "POST", headers: { "auth-token": METAAPI_TOKEN, "Content-Type": "application/json" },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(10000),
        })).json();
        if (r.numericCode === 0 || r.stringCode === "TRADE_RETCODE_DONE" || r.stringCode === "ERR_NO_ERROR") return { ok: true, id: r.orderId };
        if (attempt === 0) await new Promise(r => setTimeout(r, 300));
      } catch {}
    }
    return { ok: false };
  }));

  return results.filter(r => r.status === "fulfilled" && r.value.ok).length;
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
      const exact = names.find(n => n === symbol);
      const pro = names.find(n => n === symbol + ".pro");
      const found = exact || pro || names.find(n => n.startsWith(symbol));
      if (found) { symbolCache.set(key, found); return found; }
    }
  } catch {}
  symbolCache.set(key, symbol);
  return symbol;
}

// ── Main ──
async function main() {
  if (!SB_KEY) { console.error("❌ SUPABASE_SERVICE_KEY fehlt!"); process.exit(1); }
  if (!METAAPI_TOKEN) { console.error("❌ METAAPI_TOKEN fehlt!"); process.exit(1); }

  // Get Telegram session
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
      // Get MetaApi account ID
      const acc = await (await fetch(`${SB_URL}/rest/v1/slave_accounts?select=metaapi_account_id&id=eq.${linkedId}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      })).json();
      if (acc[0]) channelAccountMap[ch.channel_id] = { metaApiId: acc[0].metaapi_account_id, name: ch.channel_name };
    }
  }

  const client = new TelegramClient(new StringSession(sess[0].session_string), TG_API_ID, TG_API_HASH, { connectionRetries: 5, timeout: 30 });
  await client.connect();

  console.log("🚀 GoldFoundry REALTIME Signal Bot v2");
  console.log("═══════════════════════════════════════");
  console.log("  DIREKTE Trade-Ausführung (kein Vercel Umweg!)");

  const dialogs = await client.getDialogs({ limit: 300 });
  for (const d of dialogs) {
    const e = d.entity;
    if (!e || e.className !== "Channel") continue;
    const fullId = `-100${e.id?.value?.toString() || e.id?.toString() || ""}`;
    if (CHANNELS[fullId]) {
      const acc = channelAccountMap[fullId];
      console.log(`  📢 ${CHANNELS[fullId]} → ${acc ? acc.metaApiId.slice(0, 8) + "..." : "KEIN ACCOUNT!"}`);
    }
  }
  console.log("═══════════════════════════════════════\n⚡ LIVE — Warte auf Signale...\n");

  // ── REALTIME Handler ──
  client.addEventHandler(async (event) => {
    const message = event.message;
    if (!message?.message) return;
    const chatId = message.chatId?.value?.toString() || message.chatId?.toString() || "";
    const fullChatId = `-100${chatId}`;
    if (!CHANNELS[fullChatId]) return;

    const text = message.message;
    const ts = new Date().toLocaleTimeString("de-DE");
    const channelName = CHANNELS[fullChatId];

    if (!isLikelySignal(text)) return;

    const signal = parseSignal(text);
    if (!signal) { console.log(`[${ts}] 💬 ${channelName}: Kein Signal erkannt`); return; }

    console.log(`\n[${ts}] ⚡ ${signal.action} ${signal.symbol} | ${channelName}`);
    console.log(`   "${text.slice(0, 100).replace(/\n/g, " ")}"`);
    console.log(`   Entry:${signal.entry || "Market"} SL:${signal.sl || "—"} TP:${signal.tps?.join(",") || "auto"}`);

    // Find account for this channel
    const acc = channelAccountMap[fullChatId];
    if (!acc) { console.log(`   ❌ Kein Account verknüpft!`); return; }

    const start = Date.now();
    const brokerSym = await getBrokerSymbol(acc.metaApiId, signal.symbol);
    const executed = await placeTrade(acc.metaApiId, signal, brokerSym);
    const ms = Date.now() - start;

    if (executed > 0) {
      console.log(`   🎯 ${executed} ORDER(S) GESETZT in ${ms}ms! (${brokerSym})`);
    } else {
      console.log(`   ❌ Trade fehlgeschlagen (${ms}ms)`);
    }
  }, new NewMessage({}));

  // Heartbeat
  setInterval(() => { process.stdout.write(`\r[${new Date().toLocaleTimeString("de-DE")}] 💚 LIVE`); }, 30000);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
