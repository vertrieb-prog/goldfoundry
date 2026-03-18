// ═══════════════════════════════════════════════════════════════
// src/lib/exchanges/exchange-connector.ts — Exchange Interface
// ═══════════════════════════════════════════════════════════════

export interface ExchangeConnector {
    name: string;
    connect(apiKey: string, secret: string): Promise<boolean>;
    getBalance(): Promise<{ total: number; available: number; currency: string }>;
    getPositions(): Promise<Array<{ symbol: string; side: string; size: number; entryPrice: number; pnl: number }>>;
    placeOrder(opts: { symbol: string; side: "buy" | "sell"; type: "market" | "limit"; size: number; price?: number; sl?: number; tp?: number }): Promise<{ orderId: string; success: boolean }>;
    closePosition(symbol: string, size?: number): Promise<boolean>;
}

export function createExchangeConnector(exchange: string): ExchangeConnector {
    switch (exchange.toLowerCase()) {
        case "binance": return new BinanceConnector();
        case "bybit": return new BybitConnector();
        case "bitget": return new BitgetConnector();
        case "okx": return new OKXConnector();
        default: throw new Error(`Exchange ${exchange} nicht unterstützt`);
    }
}

// ── Base implementation ─────────────────────────────────────
class BaseConnector implements ExchangeConnector {
    name = "Base";
    protected apiKey = "";
    protected secret = "";

    async connect(apiKey: string, secret: string) {
        this.apiKey = apiKey;
        this.secret = secret;
        return true; // TODO: Verify credentials
    }
    async getBalance() { return { total: 0, available: 0, currency: "USDT" }; }
    async getPositions() { return []; }
    async placeOrder() { return { orderId: "", success: false }; }
    async closePosition() { return false; }
}

class BinanceConnector extends BaseConnector { name = "Binance"; }
class BybitConnector extends BaseConnector { name = "Bybit"; }
class BitgetConnector extends BaseConnector { name = "Bitget"; }
class OKXConnector extends BaseConnector { name = "OKX"; }
