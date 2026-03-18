// ═══════════════════════════════════════════════════════════════
// src/lib/exchanges/bitget.ts — Bitget exchange connector
// ═══════════════════════════════════════════════════════════════

import { ExchangeConnector } from "@/lib/exchanges/exchange-connector";

interface BitgetConfig {
  apiKey: string;
  secret: string;
  passphrase?: string;
}

const BASE_URL = "https://api.bitget.com";

export class BitgetConnector implements ExchangeConnector {
  name = "Bitget";
  private config: BitgetConfig | null = null;

  async connect(apiKey: string, secret: string): Promise<boolean> {
    this.config = { apiKey, secret };
    // TODO: Verify credentials with /api/v2/account/info
    return true;
  }

  async getBalance(): Promise<{ total: number; available: number; currency: string }> {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: GET /api/v2/mix/account/account
    return { total: 0, available: 0, currency: "USDT" };
  }

  async getPositions(): Promise<
    Array<{ symbol: string; side: string; size: number; entryPrice: number; pnl: number }>
  > {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: GET /api/v2/mix/position/all-position
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
    // TODO: POST /api/v2/mix/order/place-order
    console.log(`[Bitget] placeOrder: ${opts.side} ${opts.size} ${opts.symbol}`);
    return { orderId: "", success: false };
  }

  async closePosition(symbol: string, size?: number): Promise<boolean> {
    if (!this.config) throw new Error("Nicht verbunden");
    // TODO: Close via opposite market order
    console.log(`[Bitget] closePosition: ${symbol} size=${size ?? "all"}`);
    return false;
  }
}

export function createBitgetConnector(): ExchangeConnector {
  return new BitgetConnector();
}
