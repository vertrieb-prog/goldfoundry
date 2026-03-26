#!/usr/bin/env node
/**
 * GoldFoundry REALTIME Signal Bot
 * Verbindet sich direkt mit Telegram WebSocket — Trades in Millisekunden
 * Start: node signal-bot.mjs
 */
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";

// ── Config ──
const CONFIG = {
  TG_API_ID: 27346428,
  TG_API_HASH: "474624b94fcf276b0f787d2061b1aa09",
  SB_URL: "https://exgmqztwuvwlncrmgmhq.supabase.co",
  CRON_URL: "https://goldfoundry.de/api/cron/trigger-all",
  CRON_SECRET: "goldfoundry-cron-secret-2024",
  CHANNELS: {
    "-1002568714747": "THE TRADING PHENEX",
    "-1002359719499": "Elite Channel",
  },
};

// ── Get secrets from Supabase ──
async function getSecrets() {
  const fs = await import("fs");
  const path = await import("path");
  // Try multiple locations for .env.local
  const envPaths = [".env.local", "C:\\signal-bot\\.env.local", path.join(process.cwd(), ".env.local")];
  let envLocal = "";
  for (const p of envPaths) {
    try { envLocal = fs.readFileSync(p, "utf8"); break; } catch {}
  }
  if (!envLocal) { console.error("❌ .env.local nicht gefunden!"); process.exit(1); }
  const sbKey = envLocal.match(/SUPABASE_SERVICE_KEY=(.+)/)?.[1]?.trim();

  // Get Telegram session
  const r = await fetch(`${CONFIG.SB_URL}/rest/v1/telegram_sessions?select=session_string&status=eq.connected&limit=1`, {
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
  });
  const sessions = await r.json();
  return { sbKey, sessionString: sessions[0]?.session_string };
}

// ── Signal Detection (same as server) ──
function isLikelySignal(text) {
  const lower = text.toLowerCase();
  const keywords = ["buy", "sell", "long", "short", "signal alert", "re-entry", "reentry", "entry", "tp", "sl", "stop loss", "take profit"];
  return keywords.some(kw => lower.includes(kw));
}

// ── Main ──
async function main() {
  console.log("🚀 GoldFoundry REALTIME Signal Bot");
  console.log("═══════════════════════════════════════\n");

  const { sessionString } = await getSecrets();
  if (!sessionString) { console.error("❌ Keine Telegram-Session gefunden!"); return; }

  // Connect to Telegram
  const client = new TelegramClient(
    new StringSession(sessionString),
    CONFIG.TG_API_ID, CONFIG.TG_API_HASH,
    { connectionRetries: 5, timeout: 30 }
  );
  await client.connect();
  console.log("✅ Telegram verbunden\n");

  // Get channel entities
  const dialogs = await client.getDialogs({ limit: 300 });
  const channelEntities = new Map();

  for (const d of dialogs) {
    const e = d.entity;
    if (!e || e.className !== "Channel") continue;
    const rawId = e.id?.value?.toString() || e.id?.toString() || "";
    const fullId = `-100${rawId}`;
    if (CONFIG.CHANNELS[fullId]) {
      channelEntities.set(fullId, e);
      console.log(`📢 ${CONFIG.CHANNELS[fullId]} (${fullId}) — LIVE`);
    }
  }

  if (channelEntities.size === 0) {
    console.error("❌ Keine Channels gefunden!");
    return;
  }

  console.log(`\n⚡ Warte auf Signale... (${channelEntities.size} Channels)\n`);

  // ── REALTIME Event Handler ──
  client.addEventHandler(async (event) => {
    const message = event.message;
    if (!message?.message) return;

    // Find which channel
    const chatId = message.chatId?.value?.toString() || message.chatId?.toString() || "";
    const fullChatId = `-100${chatId}`;
    const channelName = CONFIG.CHANNELS[fullChatId];
    if (!channelName) return;

    const text = message.message;
    const ts = new Date().toLocaleTimeString("de-DE");

    // Quick filter
    if (!isLikelySignal(text)) {
      console.log(`[${ts}] 💬 ${channelName}: ${text.slice(0, 60).replace(/\n/g, " ")}...`);
      return;
    }

    // SIGNAL DETECTED!
    console.log(`\n[${ts}] ⚡ SIGNAL! ${channelName}`);
    console.log(`   "${text.slice(0, 120).replace(/\n/g, " ")}"`);
    console.log(`   Triggere Trade-Execution...`);

    const start = Date.now();

    try {
      // Trigger the cron immediately
      const r = await fetch(CONFIG.CRON_URL, {
        headers: { Authorization: `Bearer ${CONFIG.CRON_SECRET}` },
        signal: AbortSignal.timeout(120000),
      });
      const data = await r.json();

      const elapsed = Date.now() - start;

      // Check results
      const results = data.signals?.results || [];
      let executed = 0;
      for (const ch of results) {
        for (const s of (ch.signals || [])) {
          if (s.success) executed++;
        }
      }

      if (executed > 0) {
        console.log(`   🎯 ${executed} TRADE(S) GESETZT in ${elapsed}ms!`);
      } else {
        console.log(`   ⏳ Signal verarbeitet (${elapsed}ms) — kein Trade (Slippage/Filter)`);
      }
    } catch (e) {
      console.log(`   ❌ Fehler: ${e.message?.slice(0, 60)}`);
    }
    console.log();
  }, new NewMessage({}));

  // Keep alive
  console.log("Bot läuft. Ctrl+C zum Stoppen.\n");

  // Heartbeat
  setInterval(() => {
    const ts = new Date().toLocaleTimeString("de-DE");
    process.stdout.write(`\r[${ts}] 💚 Listening...`);
  }, 30000);
}

main().catch(e => console.error("Fatal:", e.message));
