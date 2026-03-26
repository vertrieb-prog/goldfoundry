#!/usr/bin/env node
/**
 * GoldFoundry Signal Poller — läuft lokal alle 2 Minuten
 * Start: node cron-poller.mjs
 * Stop: Ctrl+C
 */
const URL = "https://goldfoundry.de/api/cron/trigger-all";
const SECRET = "goldfoundry-cron-secret-2024";
const INTERVAL = 2 * 60 * 1000; // 2 Minuten

async function poll() {
  const ts = new Date().toLocaleTimeString("de-DE");
  try {
    const r = await fetch(URL, {
      headers: { Authorization: `Bearer ${SECRET}` },
      signal: AbortSignal.timeout(120000),
    });
    const d = await r.json();

    // Signals
    const sigs = d.signals?.results || [];
    let executed = 0, blocked = 0;
    for (const ch of sigs) {
      for (const s of (ch.signals || [])) {
        if (s.success) executed++;
        else if (s.error) blocked++;
      }
    }

    // Position Manager
    const mods = d.positions?.modifications?.length || 0;

    // Equity
    const eq = d.equity?.results || [];

    if (executed > 0) {
      console.log(`[${ts}] 🎯 ${executed} TRADE(S) GESETZT! | ${mods} SL-Updates | ${blocked} blocked`);
    } else if (mods > 0) {
      console.log(`[${ts}] 📊 ${mods} SL-Updates | Keine neuen Signale`);
    } else {
      process.stdout.write(`[${ts}] ⏳ Keine Signale\r`);
    }
  } catch (e) {
    console.log(`[${ts}] ❌ ${e.message?.slice(0, 60)}`);
  }
}

console.log("🚀 GoldFoundry Signal Poller gestartet (alle 2 Min)");
console.log("   URL: " + URL);
console.log("   Stop: Ctrl+C\n");

poll(); // Sofort einmal
setInterval(poll, INTERVAL);
