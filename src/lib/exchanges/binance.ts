// ═══════════════════════════════════════════════════════════════
// src/lib/exchanges/binance.ts — Binance exchange connector
// ═══════════════════════════════════════════════════════════════

import { ExchangeConnector } from "@/lib/exchanges/exchange-connector";

interface BinanceConfig {
  apiKey: string;
  secret: string;
  testnet?: boolean;
}

const BASE_URL = "https://fapi.binance.com";
const TESTNET_URL = "https://testnet.binancefuture.com";

export class BinanceConnector implements ExchangeConnector {
  name = "Binance";
  private config: BinanceConfig | null = null;

  private get baseUrl(): string {
    return this.config?.testnet ? TESTNET_URL : BASE_URL;
  }

  async connect(apiKey: string, secret: string): Promise<boolean> {
    this.config = { apiKey, secret };
    // TODO: Verify credentials with /fapi/v1/account
    return true;
  }

  async getBalance(): Promise<{ total: number; available: number; currency: string }> {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: GET /fapi/v2/balance
    return { total: 0, available: 0, currency: "USDT" };
  }

  async getPositions(): Promise<
    Array<{ symbol: string; side: string; size: number; entryPrice: number; pnl: number }>
  > {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: GET /fapi/v2/positionRisk
    return [];
  }

  async placeOrder(opts: {
    symbol: string;
    side: "buy" | "sell";
    type: "market" | "limit";
    size: number;
    price?: number;
    sl?: number;
    tp?: number;
  }): Promise<{ orderId: string; success: boolean }> {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: POST /fapi/v1/order
    console.log(`[Binance] placeOrder: ${opts.side} ${opts.size} ${opts.symbol}`);
    return { orderId: "", success: false };
  }

  async closePosition(symbol: string, size?: number): Promise<boolean> {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: Close via opposite market order
    console.log(`[Binance] closePosition: ${symbol} size=${size ?? "all"}`);
    return false;
  }
}

export function createBinanceConnector(): ExchangeConnector {
  return new BinanceConnector();
}
