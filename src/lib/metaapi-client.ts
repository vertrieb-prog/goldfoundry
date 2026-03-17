// ============================================================
// src/lib/metaapi-client.ts — MetaApi Verbindung & Datenabruf
// ============================================================
//
// Dieses Modul kapselt die gesamte MetaApi-Kommunikation.
// Es wird sowohl vom Cron-Job als auch vom manuellen Skript genutzt.
//
// Docs: https://metaapi.cloud/docs/client/
// ============================================================

import type { Trade, TradingSummary, AccountInfo } from "@/types/trading";

// ── Logger-Hilfsfunktion ──────────────────────────────────────
function log(level: "INFO" | "WARN" | "ERROR", message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [MetaApiClient] [${level}]`;
  if (data) {
    console.log(`${prefix} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} ${message}`);
  }
}

// ── Hauptklasse ───────────────────────────────────────────────
export class MetaApiClient {
  private api: any;
  private accountId: string;

  constructor(token: string, accountId: string) {
    // MetaApi SDK initialisieren (dynamic require to avoid SSR window error)
    const MetaApi = require("metaapi.cloud-sdk").default;
    this.api = new MetaApi(token, {
      retryOpts: {
        retries: 3,
        minDelayInSeconds: 1,
        maxDelayInSeconds: 10,
      },
    });
    this.accountId = accountId;
    log("INFO", `Client initialisiert für Account: ${accountId}`);
  }

  /**
   * Verbindet sich mit dem MetaTrader-Konto und wartet,
   * bis die Verbindung synchronisiert ist.
   */
  async connect(): Promise<AccountInfo> {
    log("INFO", "Verbinde mit MetaTrader-Konto...");

    try {
      const account = await this.api.metatraderAccountApi.getAccount(this.accountId);

      // Sicherstellen, dass der Account deployed ist
      if (account.state !== "DEPLOYED") {
        log("INFO", `Account-Status: ${account.state} — deploye jetzt...`);
        await account.deploy();
      }

      // Warten bis verbunden
      log("INFO", "Warte auf Verbindung & Synchronisierung...");
      await account.waitConnected();

      // RPC-Verbindung herstellen
      const connection = account.getRPCConnection();
      await connection.connect();
      await connection.waitSynchronized();

      // Account-Info abrufen
      const info = await connection.getAccountInformation();

      const accountInfo: AccountInfo = {
        id: this.accountId,
        name: info.name ?? "Unbekannt",
        login: String(info.login),
        server: info.server ?? "Unbekannt",
        balance: info.balance,
        equity: info.equity,
        margin: info.margin,
        freeMargin: info.freeMargin,
        currency: info.currency,
        leverage: info.leverage,
        platform: info.platform?.includes("5") ? "mt5" : "mt4",
      };

      log("INFO", "Verbunden!", {
        login: accountInfo.login,
        server: accountInfo.server,
        balance: `${accountInfo.balance} ${accountInfo.currency}`,
      });

      return accountInfo;
    } catch (error) {
      log("ERROR", "Verbindungsfehler", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Ruft abgeschlossene Deals (Trades) aus der Historie ab.
   *
   * @param startTime  - Startzeitpunkt (Default: vor 24 Stunden)
   * @param endTime    - Endzeitpunkt (Default: jetzt)
   * @returns Array von normalisierten Trade-Objekten
   */
  async fetchTrades(
    startTime?: Date,
    endTime?: Date
  ): Promise<Trade[]> {
    const now = new Date();
    const start = startTime ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = endTime ?? now;

    log("INFO", `Rufe Trades ab: ${start.toISOString()} → ${end.toISOString()}`);

    try {
      const account = await this.api.metatraderAccountApi.getAccount(this.accountId);
      const connection = account.getRPCConnection();
      await connection.connect();
      await connection.waitSynchronized();

      // getDealsByTimeRange gibt uns alle abgeschlossenen Deals
      const deals: any[] = await connection.getDealsByTimeRange(start, end) as any;

      log("INFO", `${deals.length} Roh-Deals empfangen`);

      // Nur tatsächliche Trade-Deals filtern (keine Balance-Operationen etc.)
      const tradingDeals = deals.filter(
        (deal: any) =>
          deal.entryType === "DEAL_ENTRY_OUT" ||
          deal.entryType === "DEAL_ENTRY_INOUT"
      );

      log("INFO", `${tradingDeals.length} abgeschlossene Trades nach Filter`);

      // In unser normalisiertes Format umwandeln
      const trades: Trade[] = tradingDeals.map((deal: any) => ({
        id: deal.id ?? deal.positionId ?? "unknown",
        symbol: deal.symbol ?? "UNKNOWN",
        type: deal.type ?? "DEAL_TYPE_BUY",
        volume: deal.volume ?? 0,
        openPrice: deal.price ?? 0,
        closePrice: deal.price ?? 0,
        profit: deal.profit ?? 0,
        swap: deal.swap ?? 0,
        commission: deal.commission ?? 0,
        netProfit: (deal.profit ?? 0) + (deal.swap ?? 0) + (deal.commission ?? 0),
        openTime: deal.time ? new Date(deal.time).toISOString() : new Date().toISOString(),
        closeTime: deal.time ? new Date(deal.time).toISOString() : new Date().toISOString(),
        magic: deal.magic ?? 0,
        comment: deal.comment ?? "",
      }));

      return trades;
    } catch (error) {
      log("ERROR", "Fehler beim Abrufen der Trades", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Berechnet eine Zusammenfassung aus einem Array von Trades.
   * Reine Funktion — benötigt keine API-Verbindung.
   */
  static computeSummary(trades: Trade[], periodStart: Date, periodEnd: Date): TradingSummary {
    const winners = trades.filter((t) => t.netProfit > 0);
    const losers = trades.filter((t) => t.netProfit < 0);

    const totalProfit = winners.reduce((sum, t) => sum + t.netProfit, 0);
    const totalLoss = Math.abs(losers.reduce((sum, t) => sum + t.netProfit, 0));

    // Symbol-Breakdown berechnen
    const symbolBreakdown: Record<string, { count: number; profit: number }> = {};
    for (const trade of trades) {
      if (!symbolBreakdown[trade.symbol]) {
        symbolBreakdown[trade.symbol] = { count: 0, profit: 0 };
      }
      symbolBreakdown[trade.symbol].count++;
      symbolBreakdown[trade.symbol].profit += trade.netProfit;
    }

    // Bester und schlechtester Trade
    const sorted = [...trades].sort((a, b) => b.netProfit - a.netProfit);

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalTrades: trades.length,
      winningTrades: winners.length,
      losingTrades: losers.length,
      winRate: trades.length > 0 ? (winners.length / trades.length) * 100 : 0,
      totalProfit: round(totalProfit),
      totalLoss: round(totalLoss),
      netResult: round(totalProfit - totalLoss),
      bestTrade: sorted[0] ?? null,
      worstTrade: sorted[sorted.length - 1] ?? null,
      profitFactor: totalLoss > 0 ? round(totalProfit / totalLoss) : totalProfit > 0 ? Infinity : 0,
      averageProfit: trades.length > 0 ? round((totalProfit - totalLoss) / trades.length) : 0,
      symbolBreakdown,
    };
  }
}

/** Rundet auf 2 Dezimalstellen */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
