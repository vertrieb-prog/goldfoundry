#!/usr/bin/env npx tsx
// ============================================================
// scripts/fetch-trades.ts
// ============================================================
//
// Isoliertes CLI-Skript zum Testen der MetaApi-Verbindung.
//
// Nutzung:
//   npm run fetch-trades
//   -- oder --
//   npx tsx scripts/fetch-trades.ts
//
// Optionale Argumente:
//   --hours=48    (Standard: 24 — Zeitraum der Abfrage)
//
// Voraussetzung: .env.local muss META_API_TOKEN und
//                META_API_ACCOUNT_ID enthalten.
// ============================================================

import * as dotenv from "dotenv";
import * as path from "path";

// .env.local laden (relativ zum Projekt-Root)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { MetaApiClient } from "../src/lib/metaapi-client";
import { loadMetaApiConfig } from "../src/lib/config";
import type { Trade, TradingSummary } from "../src/types/trading";

// ── CLI-Argumente parsen ──────────────────────────────────────
function parseArgs(): { hours: number } {
  const hoursArg = process.argv.find((a) => a.startsWith("--hours="));
  const hours = hoursArg ? parseInt(hoursArg.split("=")[1], 10) : 24;
  return { hours: isNaN(hours) ? 24 : hours };
}

// ── Formatierungs-Hilfsfunktionen ─────────────────────────────
function formatCurrency(value: number, currency: string = "USD"): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)} ${currency}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function printSeparator(char: string = "─", length: number = 60): void {
  console.log(char.repeat(length));
}

function printHeader(title: string): void {
  console.log();
  printSeparator("═");
  console.log(`  ${title}`);
  printSeparator("═");
}

// ── Trade-Tabelle ausgeben ────────────────────────────────────
function printTrades(trades: Trade[], currency: string): void {
  if (trades.length === 0) {
    console.log("  Keine Trades im gewählten Zeitraum gefunden.");
    return;
  }

  // Tabellen-Header
  console.log(
    "  " +
      "Symbol".padEnd(12) +
      "Typ".padEnd(8) +
      "Lots".padEnd(8) +
      "Profit".padEnd(14) +
      "Swap".padEnd(10) +
      "Komm.".padEnd(10) +
      "Netto".padEnd(14) +
      "Magic"
  );
  printSeparator("─");

  for (const trade of trades) {
    const typeLabel = trade.type === "DEAL_TYPE_BUY" ? "BUY" : "SELL";
    console.log(
      "  " +
        trade.symbol.padEnd(12) +
        typeLabel.padEnd(8) +
        trade.volume.toFixed(2).padEnd(8) +
        formatCurrency(trade.profit, currency).padEnd(14) +
        formatCurrency(trade.swap, currency).padEnd(10) +
        formatCurrency(trade.commission, currency).padEnd(10) +
        formatCurrency(trade.netProfit, currency).padEnd(14) +
        String(trade.magic)
    );
  }
}

// ── Summary ausgeben ──────────────────────────────────────────
function printSummary(summary: TradingSummary, currency: string): void {
  printHeader("📊 TRADING-ZUSAMMENFASSUNG");

  console.log(`  Zeitraum:        ${summary.periodStart} → ${summary.periodEnd}`);
  console.log(`  Trades gesamt:   ${summary.totalTrades}`);
  console.log(`  Gewinner:        ${summary.winningTrades}`);
  console.log(`  Verlierer:       ${summary.losingTrades}`);
  console.log(`  Gewinnrate:      ${formatPercent(summary.winRate)}`);
  console.log();
  console.log(`  Bruttogewinn:    ${formatCurrency(summary.totalProfit, currency)}`);
  console.log(`  Bruttoverlust:   ${formatCurrency(-summary.totalLoss, currency)}`);
  console.log(`  Netto-Ergebnis:  ${formatCurrency(summary.netResult, currency)}`);
  console.log(`  Profit-Faktor:   ${summary.profitFactor === Infinity ? "∞" : summary.profitFactor.toFixed(2)}`);
  console.log(`  Ø pro Trade:     ${formatCurrency(summary.averageProfit, currency)}`);

  if (summary.bestTrade) {
    console.log();
    console.log(`  🏆 Bester Trade:      ${summary.bestTrade.symbol} → ${formatCurrency(summary.bestTrade.netProfit, currency)}`);
  }
  if (summary.worstTrade) {
    console.log(`  💀 Schlechtester:     ${summary.worstTrade.symbol} → ${formatCurrency(summary.worstTrade.netProfit, currency)}`);
  }

  // Symbol-Breakdown
  const symbols = Object.entries(summary.symbolBreakdown);
  if (symbols.length > 0) {
    console.log();
    console.log("  Symbol-Breakdown:");
    for (const [symbol, data] of symbols.sort((a, b) => b[1].profit - a[1].profit)) {
      console.log(
        `    ${symbol.padEnd(10)} ${String(data.count).padEnd(4)} Trades   ${formatCurrency(data.profit, currency)}`
      );
    }
  }
}

// ── Hauptfunktion ─────────────────────────────────────────────
async function main(): Promise<void> {
  const { hours } = parseArgs();

  printHeader("🚀 MetaTrader Trade-Fetcher");
  console.log(`  Zeitraum: Letzte ${hours} Stunden`);
  console.log(`  Gestartet: ${new Date().toISOString()}`);
  printSeparator();

  // 1) Config laden
  let config;
  try {
    config = loadMetaApiConfig();
    console.log("  ✅ Konfiguration geladen");
  } catch (error) {
    console.error("  ❌ Konfigurationsfehler:", (error as Error).message);
    console.error("     → Hast du die .env.local Datei mit echten Werten erstellt?");
    process.exit(1);
  }

  // 2) Client erstellen & verbinden
  const client = new MetaApiClient(config.token, config.accountId);

  let accountInfo;
  try {
    accountInfo = await client.connect();
    console.log(`  ✅ Verbunden: ${accountInfo.login}@${accountInfo.server}`);
    console.log(`  💰 Balance: ${accountInfo.balance.toFixed(2)} ${accountInfo.currency}`);
    console.log(`  📈 Equity:  ${accountInfo.equity.toFixed(2)} ${accountInfo.currency}`);
  } catch (error) {
    console.error("  ❌ Verbindung fehlgeschlagen:", (error as Error).message);
    process.exit(1);
  }

  // 3) Trades abrufen
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

  let trades;
  try {
    trades = await client.fetchTrades(startTime, endTime);
    console.log(`  ✅ ${trades.length} Trades abgerufen`);
  } catch (error) {
    console.error("  ❌ Trade-Abruf fehlgeschlagen:", (error as Error).message);
    process.exit(1);
  }

  // 4) Ergebnisse ausgeben
  printHeader("📋 TRADE-LISTE");
  printTrades(trades, accountInfo.currency);

  // 5) Summary berechnen & ausgeben
  const summary = MetaApiClient.computeSummary(trades, startTime, endTime);
  printSummary(summary, accountInfo.currency);

  printSeparator("═");
  console.log("  ✅ Fertig. Daten können jetzt in Supabase gespeichert werden.");
  printSeparator("═");
  console.log();
}

// ── Entry Point ───────────────────────────────────────────────
main().catch((error) => {
  console.error("\n❌ Unerwarteter Fehler:", error);
  process.exit(1);
});
