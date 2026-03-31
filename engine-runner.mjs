#!/usr/bin/env node
/**
 * GoldFoundry Engine Runner v2 — ALL BUGS FIXED
 * 13 Strategien auf ALLEN Accounts alle 30 Sekunden
 * DCA, Recovery, Trail, Grid, Scoring, Anti-Tilt, Pyramiding,
 * Re-Entry, Time Decay, Volume, Correlation, Weekend
 */
import { readFileSync } from "fs";
import { join } from "path";

let envContent = "";
try { envContent = readFileSync("C:\\signal-bot\\.env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(".env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(join(process.cwd(), ".env.local"), "utf8"); } catch {}
const getEnv = (k, fb = "") => { const m = envContent.match(new RegExp(`${k}=(.+)`)); return m ? m[1].trim() : (process.env[k] || fb); };

let CRON_SECRET = getEnv("CRON_SECRET");
if (!CRON_SECRET || CRON_SECRET === "placeholder-cron-secret-change-me") CRON_SECRET = "goldfoundry-cron-secret-2024";
console.log(`  CRON_SECRET: ${CRON_SECRET.slice(0, 10)}...`);
const SIGNAL_URL = "https://goldfoundry.de/api/cron/telegram-signals";
const TICK_URL = "https://goldfoundry.de/api/cron/engine-tick";
const POS_MGR_URL = "https://goldfoundry.de/api/cron/position-manager";
const RE_ENTRY_URL = "https://goldfoundry.de/api/cron/re-entry";
const TP1_RELOAD_URL = "https://goldfoundry.de/api/cron/tp1-reload";
const INTERVAL = 30_000;

let tickCount = 0;
let totalMods = 0;
let consecutiveErrors = 0;

async function safeFetch(url, label) {
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(120000),
    });
    if (!r.ok) {
      console.log(`  [${label}] HTTP ${r.status}`);
      return null;
    }
    return await r.json();
  } catch (e) {
    console.log(`  [${label}] ${(e.message || "").slice(0, 50)}`);
    return null;
  }
}

async function tick() {
  tickCount++;
  const ts = new Date().toLocaleTimeString("de-DE");

  try {
    // 1. Telegram Signals
    let executed = 0;
    const ds = await safeFetch(SIGNAL_URL, "SIGNALS");
    if (ds) {
      for (const ch of (ds.results || [])) {
        for (const s of (ch.signals || [])) {
          if (s.success) { executed++; totalMods++; }
        }
      }
    }

    // 2. Engine Tick (13 Strategien)
    const d1 = await safeFetch(TICK_URL, "ENGINE");

    // 3. Position Manager (Breakeven, Trailing, Reversal)
    const d2 = await safeFetch(POS_MGR_URL, "POS-MGR");
    const mods = d2?.modifications?.length || 0;
    totalMods += mods;

    // 4. TP1 Reload Check (jeden Tick — muss schnell reagieren wenn Preis zurueck am Entry)
    const d3 = await safeFetch(TP1_RELOAD_URL, "RELOAD");
    if (d3?.reloads?.length > 0) {
      for (const re of d3.reloads) {
        console.log(`\n[${ts}] RELOAD: ${re.direction} ${re.symbol} @ ${re.entry} (${re.placed}/4 Orders) | ${re.account}`);
      }
      totalMods += d3.reloads.length;
    }

    // FIX #6: Immer loggen bei Aktionen, sonst alle 10 Min
    if (executed > 0) {
      console.log(`\n[${ts}] ${executed} TRADE(S) GESETZT! | Tick #${tickCount}`);
    }
    if (mods > 0) {
      console.log(`[${ts}] ${mods} Modifikation(en) | Tick #${tickCount}`);
      for (const m of (d2.modifications || [])) {
        console.log(`  ${m.action}: ${m.symbol || ""} ${m.posId?.slice(0, 8) || ""}`);
      }
    } else if (tickCount % 20 === 0) {
      console.log(`[${ts}] OK | ${d1?.ticked || 0} Accounts | ${totalMods} Mods total | Tick #${tickCount}`);
    }

    consecutiveErrors = 0;
  } catch (e) {
    consecutiveErrors++;
    // FIX #6: ALLE Fehler loggen
    console.log(`[${ts}] [ERR] Tick #${tickCount}: ${(e.message || "").slice(0, 60)}`);

    if (consecutiveErrors >= 10) {
      console.log(`[${ts}] [ERR] 10+ Fehler in Folge, warte 60s...`);
      await new Promise(r => setTimeout(r, 60000));
      consecutiveErrors = 0;
    }
  }
}

// ── Auto-Restart Wrapper (kein Interval-Leak!) ──
let tickInterval = null;

function start() {
  console.log("GoldFoundry Engine Runner v2");
  console.log("=".repeat(40));
  console.log("  13 Strategien - Alle 30 Sekunden - Alle Accounts");
  console.log("  DCA | Recovery | Trail | Pyramid | Anti-Tilt | Time Decay");
  console.log("=".repeat(40) + "\n");

  // Alten Interval stoppen falls vorhanden (verhindert Duplikate!)
  if (tickInterval) clearInterval(tickInterval);
  tick();
  tickInterval = setInterval(tick, INTERVAL);
}

start();

process.on("unhandledRejection", (err) => {
  console.error(`[WARN] Unhandled rejection: ${(err?.message || String(err)).slice(0, 80)}`);
});

process.on("uncaughtException", (err) => {
  console.error(`[FATAL] ${err.message}`);
  console.log("[RESTART] Neustart in 10s...");
  // Alten Interval stoppen BEVOR neu gestartet wird
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = null;
  setTimeout(() => {
    start();
  }, 10000);
});
