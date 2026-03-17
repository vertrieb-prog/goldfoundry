// ============================================================
// src/types/trading.ts — Zentrale Typdefinitionen
// ============================================================

/**
 * Ein einzelner abgeschlossener Trade aus MetaTrader.
 */
export interface Trade {
  /** Eindeutige Trade-ID aus MetaTrader */
  id: string;
  /** Trading-Paar, z.B. "EURUSD" */
  symbol: string;
  /** Handelsrichtung */
  type: "DEAL_TYPE_BUY" | "DEAL_TYPE_SELL";
  /** Lotgröße */
  volume: number;
  /** Eröffnungspreis */
  openPrice: number;
  /** Schlusskurs */
  closePrice: number;
  /** Gewinn/Verlust in Kontowährung */
  profit: number;
  /** Swap-Gebühren */
  swap: number;
  /** Kommissionen */
  commission: number;
  /** Netto-Ergebnis (profit + swap + commission) */
  netProfit: number;
  /** Zeitpunkt der Eröffnung */
  openTime: string;
  /** Zeitpunkt des Schlusses */
  closeTime: string;
  /** Magische Nummer (Bot-Identifier) */
  magic: number;
  /** Kommentar am Trade */
  comment: string;
}

/**
 * Zusammenfassung der Trading-Performance über einen Zeitraum.
 */
export interface TradingSummary {
  /** Zeitraum-Start (ISO) */
  periodStart: string;
  /** Zeitraum-Ende (ISO) */
  periodEnd: string;
  /** Gesamtanzahl der Trades */
  totalTrades: number;
  /** Davon profitabel */
  winningTrades: number;
  /** Davon Verlust */
  losingTrades: number;
  /** Gewinnrate in Prozent */
  winRate: number;
  /** Gesamtgewinn */
  totalProfit: number;
  /** Gesamtverlust */
  totalLoss: number;
  /** Netto-Ergebnis */
  netResult: number;
  /** Bester Trade */
  bestTrade: Trade | null;
  /** Schlechtester Trade */
  worstTrade: Trade | null;
  /** Profit-Faktor (Bruttogewinn / Bruttoverlust) */
  profitFactor: number;
  /** Durchschnittlicher Gewinn pro Trade */
  averageProfit: number;
  /** Gehandelte Symbole mit Häufigkeit */
  symbolBreakdown: Record<string, { count: number; profit: number }>;
}

/**
 * MetaTrader Konto-Informationen.
 */
export interface AccountInfo {
  id: string;
  name: string;
  login: string;
  server: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  leverage: number;
  platform: "mt4" | "mt5";
}
