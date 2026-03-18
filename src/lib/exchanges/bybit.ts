// ═══════════════════════════════════════════════════════════════
// src/lib/exchanges/bybit.ts — Bybit exchange connector
// ═══════════════════════════════════════════════════════════════

import { ExchangeConnector } from "@/lib/exchanges/exchange-connector";

interface BybitConfig {
  apiKey: string;
  secret: string;
  testnet?: boolean;
}

const BASE_URL = "https://api.bybit.com";
const TESTNET_URL = "https://api-testnet.bybit.com";

export class BybitConnector implements ExchangeConnector {
  name = "Bybit";
  private config: BybitConfig | null = null;

  private get baseUrl(): string {
    return this.config?.testnet ? TESTNET_URL : BASE_URL;
  }

  async connect(apiKey: string, secret: string): Promise<boolean> {
    this.config = { apiKey, secret };
    // TODO: Verify credentials with /v5/account/wallet-balance
    return true;
  }

  async getBalance(): Promise<{ total: number; available: number; currency: string }> {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: GET /v5/account/wallet-balance
    return { total: 0, available: 0, currency: "USDT" };
  }

  async getPositions(): Promise<
    Array<{ symbol: string; side: string; size: number; entryPrice: number; pnl: number }>
  > {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: GET /v5/position/list
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
    // TODO: POST /v5/order/create
    console.log(`[Bybit] placeOrder: ${opts.side} ${opts.size} ${opts.symbol}`);
    return { orderId: "", success: false };
  }

  async closePosition(symbol: string, size?: number): Promise<boolean> {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: Close via opposite market order
    console.log(`[Bybit] closePosition: ${symbol} size=${size ?? "all"}`);
    return false;
  }
}

export function createBybitConnector(): ExchangeConnector {
  return new BybitConnector();
}
