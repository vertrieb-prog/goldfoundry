#!/usr/bin/env node
/**
 * GoldFoundry Signal Bot v3 — KEIN Telegram Session Conflict
 * Pollt Vercel trigger-all alle 30 Sekunden + setzt Trades DIREKT via MetaApi
 * Kein GramJS, keine Telegram Session → KEIN AUTH_KEY_DUPLICATED
 */
import { readFileSync } from "fs";
import { join } from "path";

// ── Config ──
let envContent = "";
try { envContent = readFileSync("C:\\signal-bot\\.env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(".env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(join(process.cwd(), ".env.local"), "utf8"); } catch {}
const getEnv = (k, fb = "") => { const m = envContent.match(new RegExp(`${k}=(.+)`)); return m ? m[1].trim() : (process.env[k] || fb); };

const CRON_SECRET = getEnv("CRON_SECRET", "goldfoundry-cron-secret-2024");
const CRON_URL = "https://goldfoundry.de/api/cron/trigger-all";
const POLL_INTERVAL = 30_000; // 30 Sekunden

let pollCount = 0;
let totalExecuted = 0;

async function poll() {
  pollCount++;
  const ts = new Date().toLocaleTimeString("de-DE");
  try {
    const r = await fetch(CRON_URL, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(120000),
    });
    const data = await r.json();

    // Parse results
    const sigData = data.results?.["telegram-signals"]?.data || {};
    const channels = sigData.results || [];
    let executed = 0, blocked = 0, signals = 0;
    for (const ch of (Array.isArray(channels) ? channels : [])) {
      for (const s of (ch.signals || [])) {
        signals++;
        if (s.success) { executed++; totalExecuted++; }
        else if (s.error) blocked++;
      }
    }

    // Position Manager
    const mods = data.results?.["position-manager"]?.data?.modifications?.length || 0;

    if (executed > 0) {
      console.log(`\n[${ts}] 🎯 ${executed} TRADE(S) GESETZT! | ${mods} SL-Updates | Poll #${pollCount}`);
    } else if (mods > 0) {
      console.log(`[${ts}] 📊 ${mods} SL-Updates | Poll #${pollCount}`);
    } else if (signals > 0) {
      console.log(`[${ts}] ⏳ ${signals} Signale (${blocked} blocked) | Poll #${pollCount}`);
    } else {
      // Nur alle 10 Polls loggen wenn nichts passiert
      if (pollCount % 10 === 0) {
        process.stdout.write(`\r[${ts}] 💚 LIVE | ${totalExecuted} Trades total | Poll #${pollCount}`);
      }
    }
  } catch (e) {
    console.log(`[${ts}] ❌ ${e.message?.slice(0, 50)} | Retry in 30s`);
  }
}

console.log("🚀 GoldFoundry Signal Bot v3");
console.log("═══════════════════════════════════════");
console.log(`  Mode: HTTP Poll (alle ${POLL_INTERVAL / 1000}s)`);
console.log("  Kein Telegram Session Conflict!");
console.log("  Triggers: Signals + Position Manager + Equity Sync");
console.log("═══════════════════════════════════════\n");
console.log("⚡ LIVE — Polling gestartet...\n");

// Sofort einmal
poll();
// Dann alle 30s
setInterval(poll, POLL_INTERVAL);
