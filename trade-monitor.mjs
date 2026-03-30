#!/usr/bin/env node
/**
 * GoldFoundry TRADE MONITOR v1
 * Real-Time SynchronizationListener + Health Check
 * Start: npx tsx trade-monitor.mjs
 * PM2:   pm2 start trade-monitor.mjs --interpreter="npx" --interpreter-args="tsx" --name gf-trade-monitor
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

// ── Account Pairs: Signal (READ ONLY) → Copy (WRITE) ──
const COPY_PAIRS = [
  { signal: "707f3173-572e-4002-9e8a-21b864525d30", copy: "66d8fe15-368b-4e3c-8c6c-ed32bea5b56b", name: "RoboForex #1 → TagMarket Copy-Demo" },
  { signal: "58934470-695b-404b-bcad-8c406fd7d04d", copy: "02f08a16-ae02-40f4-9195-2c62ec52e8eb", name: "RoboForex #2 → TagMarket Copy-Demo 2" },
];

// ── Dynamic Import Helper (.ts via tsx, fallback .js) ──
async function importModule(basePath) {
  try { return await import(basePath + ".ts"); } catch {}
  try { return await import(basePath + ".js"); } catch {}
  throw new Error(`Cannot import ${basePath}(.ts|.js)`);
}

// ── Start ──
async function start() {
  console.log("GoldFoundry TRADE MONITOR v1");
  console.log("=".repeat(40));
  console.log("  Mode: Real-Time SynchronizationListener");
  console.log("  Fallback: 5s REST Polling");
  console.log("  Health Check: every 60s");
  for (const p of COPY_PAIRS) console.log(`  ${p.name}`);
  console.log("=".repeat(40) + "\n");

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SB_URL, SB_KEY);

  const { TradeMonitor } = await importModule("./src/lib/trade-monitor");
  const { CopyHealthCheck } = await importModule("./src/lib/copy-health-check");

  const monitor = new TradeMonitor(METAAPI_TOKEN, COPY_PAIRS, supabase);
  const healthCheck = new CopyHealthCheck(METAAPI_TOKEN, COPY_PAIRS, supabase);

  // Start both
  await monitor.start();
  healthCheck.start(60000);

  console.log("\n[LIVE] Trade Monitor + Health Check aktiv!\n");

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n[SHUTDOWN] Stopping...");
    await monitor.stop();
    healthCheck.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Heartbeat
  setInterval(() => {
    const ts = new Date().toLocaleTimeString("de-DE");
    process.stdout.write(`\r[${ts}] Monitor OK`);
  }, 30000);
}

// ── Auto-Restart Wrapper ──
start().catch(e => {
  console.error(`[FATAL] ${e.message}`);
  console.log("[RESTART] Neustart in 10s...");
  setTimeout(() => {
    start().catch(() => process.exit(1));
  }, 10000);
});

// Unhandled rejections abfangen statt crashen
process.on("unhandledRejection", (err) => {
  console.error(`[WARN] Unhandled rejection: ${(err?.message || String(err)).slice(0, 80)}`);
});
