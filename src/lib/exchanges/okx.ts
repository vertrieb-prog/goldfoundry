// ═══════════════════════════════════════════════════════════════
// src/lib/exchanges/okx.ts — OKX exchange connector
// ═══════════════════════════════════════════════════════════════

import { ExchangeConnector } from "@/lib/exchanges/exchange-connector";

interface OKXConfig {
  apiKey: string;
  secret: string;
  passphrase?: string;
}

const BASE_URL = "https://www.okx.com";

export class OKXConnector implements ExchangeConnector {
  name = "OKX";
  private config: OKXConfig | null = null;

  async connect(apiKey: string, secret: string): Promise<boolean> {
    this.config = { apiKey, secret };
    // TODO: Verify credentials with /api/v5/account/balance
    return true;
  }

  async getBalance(): Promise<{ total: number; available: number; currency: string }> {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: GET /api/v5/account/balance
    return { total: 0, available: 0, currency: "USDT" };
  }

  async getPositions(): Promise<
    Array<{ symbol: string; side: string; size: number; entryPrice: number; pnl: number }>
  > {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: GET /api/v5/account/positions
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
    // TODO: POST /api/v5/trade/order
    console.log(`[OKX] placeOrder: ${opts.side} ${opts.size} ${opts.symbol}`);
    return { orderId: "", success: false };
  }

  async closePosition(symbol: string, size?: number): Promise<boolean> {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: POST /api/v5/trade/close-position
    console.log(`[OKX] closePosition: ${symbol} size=${size ?? "all"}`);
    return false;
  }
}

export function createOKXConnector(): ExchangeConnector {
  return new OKXConnector();
}
