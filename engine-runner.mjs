#!/usr/bin/env node
/**
 * GoldFoundry Engine Runner — Volle Strategy Engine v3 alle 30 Sekunden
 * 13 Strategien auf ALLEN Accounts: DCA, Recovery, Trail, Grid, Scoring,
 * Anti-Tilt, Pyramiding, Re-Entry, Time Decay, Volume, Correlation, Weekend
 */
import { readFileSync } from "fs";
import { join } from "path";

let envContent = "";
try { envContent = readFileSync("C:\\signal-bot\\.env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(".env.local", "utf8"); } catch {}
if (!envContent) try { envContent = readFileSync(join(process.cwd(), ".env.local"), "utf8"); } catch {}
const getEnv = (k, fb = "") => { const m = envContent.match(new RegExp(`${k}=(.+)`)); return m ? m[1].trim() : (process.env[k] || fb); };

const CRON_SECRET = getEnv("CRON_SECRET", "goldfoundry-cron-secret-2024");
const TICK_URL = "https://goldfoundry.de/api/cron/engine-tick";
const POS_MGR_URL = "https://goldfoundry.de/api/cron/position-manager";
const INTERVAL = 30_000; // 30 Sekunden

let tickCount = 0;
let totalMods = 0;

async function tick() {
  tickCount++;
  const ts = new Date().toLocaleTimeString("de-DE");
  try {
    // 1. Engine Tick (alle 13 Strategien)
    const r1 = await fetch(TICK_URL, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(60000),
    });
    const d1 = await r1.json();

    // 2. Position Manager (DCA, Trailing, Pyramiding, Time Decay, Trend)
    const r2 = await fetch(POS_MGR_URL, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(60000),
    });
    const d2 = await r2.json();
    const mods = d2.modifications?.length || 0;
    totalMods += mods;

    if (mods > 0) {
      console.log(`[${ts}] ⚡ ${mods} Modifikation(en) | Tick #${tickCount}`);
      for (const m of (d2.modifications || [])) {
        console.log(`  ${m.action}: ${m.symbol || ""} ${m.posId?.slice(0, 8) || ""}`);
      }
    } else if (tickCount % 20 === 0) {
      // Nur alle 10 Min loggen wenn nichts passiert
      console.log(`[${ts}] 💚 Engine OK | ${d1.ticked || 0} Accounts | ${totalMods} Mods total | Tick #${tickCount}`);
    }
  } catch (e) {
    if (tickCount % 10 === 0) console.log(`[${ts}] ❌ ${e.message?.slice(0, 40)}`);
  }
}

console.log("🔥 GoldFoundry Engine Runner");
console.log("═══════════════════════════════════════");
console.log("  13 Strategien · Alle 30 Sekunden · Alle Accounts");
console.log("  DCA · Recovery · Trail · Pyramid · Anti-Tilt · Time Decay");
console.log("═══════════════════════════════════════\n");

tick();
setInterval(tick, INTERVAL);
