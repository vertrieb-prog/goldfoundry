#!/usr/bin/env node
/**
 * GoldFoundry Signal Bot v5 — HYBRID
 * Pollt Vercel telegram-signals alle 30s (Vercel nutzt Telegram kurz)
 * + Trades DIREKT via MetaApi wenn Signal erkannt
 * KEIN GramJS auf dem Server = KEIN builder.resolve Bug
 */
import { readFileSync } from "fs";
import { join } from "path";

let envContent = "";
try { envContent = readFileSync("C:\\signal-bot\\.env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(".env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(join(process.cwd(), ".env.local"), "utf8"); } catch {}
const getEnv = (k, fb = "") => { const m = envContent.match(new RegExp(`${k}=(.+)`)); return m ? m[1].trim() : (process.env[k] || fb); };

const CRON_SECRET = getEnv("CRON_SECRET", "goldfoundry-cron-secret-2024");
const SIGNAL_URL = "https://goldfoundry.de/api/cron/telegram-signals";
const POS_URL = "https://goldfoundry.de/api/cron/position-manager";
const INTERVAL = 30_000;

let pollCount = 0;
let totalExecuted = 0;

async function poll() {
  pollCount++;
  const ts = new Date().toLocaleTimeString("de-DE");
  try {
    // 1. Telegram Signals (Vercel verbindet kurz zu Telegram, kein Conflict)
    const r1 = await fetch(SIGNAL_URL, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(120000),
    });
    const d1 = await r1.json();

    let executed = 0, blocked = 0;
    for (const ch of (d1.results || [])) {
      for (const s of (ch.signals || [])) {
        if (s.success) { executed++; totalExecuted++; }
        else if (s.error) blocked++;
      }
    }

    // 2. Position Manager (alle 2. Runde)
    let mods = 0;
    if (pollCount % 2 === 0) {
      try {
        const r2 = await fetch(POS_URL, {
          headers: { Authorization: `Bearer ${CRON_SECRET}` },
          signal: AbortSignal.timeout(60000),
        });
        const d2 = await r2.json();
        mods = d2.modifications?.length || 0;
      } catch {}
    }

    if (executed > 0) {
      console.log(`\n[${ts}] 🎯 ${executed} TRADE(S) GESETZT! | ${mods} SL-Updates | Total: ${totalExecuted}`);
    } else if (mods > 0) {
      console.log(`[${ts}] 📊 ${mods} SL-Updates`);
    } else if (pollCount % 20 === 0) {
      console.log(`[${ts}] 💚 OK | ${totalExecuted} Trades total | Poll #${pollCount}`);
    }
  } catch (e) {
    if (pollCount % 5 === 0) console.log(`[${ts}] ❌ ${e.message?.slice(0, 40)}`);
  }
}

console.log("🚀 GoldFoundry Signal Bot v5 (Hybrid)");
console.log("═══════════════════════════════════════");
console.log("  Signals: Vercel Telegram (alle 30s)");
console.log("  Trades: Direkt MetaApi");
console.log("  Position Mgr: Alle 60s");
console.log("═══════════════════════════════════════\n");

poll();
setInterval(poll, INTERVAL);
