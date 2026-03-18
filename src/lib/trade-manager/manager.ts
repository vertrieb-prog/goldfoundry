// ═══════════════════════════════════════════════════════════════
// src/lib/trade-manager/manager.ts — Trade Signal Processing
// Nutzt die zentrale Risk Engine für Lot-Berechnung
// ═══════════════════════════════════════════════════════════════

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { RISK_THRESHOLDS, MOMENTUM_SCALING } from "@/lib/config";
import { calculateCopyLots } from "@/lib/copier/risk-engine";

export interface TradeSignal {
    symbol: string;
    action: "BUY" | "SELL";
    entryPrice: number | null;
    stopLoss: number;
    takeProfits: number[];
    confidence: number;
    source: string;
}

export interface RiskCheckResult {
    approved: boolean;
    lotSize: number;
    reason: string;
    riskPercent: number;
    ddRemaining: number;
}

// ── Pip-Size (konsistent mit risk-engine.ts) ─────────────────
function getPipSize(symbol: string): number {
    if (symbol.includes("JPY")) return 0.01;
    if (symbol === "XAUUSD") return 0.01;
    if (symbol === "XAGUSD") return 0.001;
    return 0.0001;
}

// ── Risk Check ──────────────────────────────────────────────
export function checkRisk(opts: {
    signal: TradeSignal;
    balance: number;
    equity: number;
    openTrades: number;
    dailyLoss: number;
    consecutiveWins: number;
    brokerType: keyof typeof RISK_THRESHOLDS;
}): RiskCheckResult {
    const thresholds = RISK_THRESHOLDS[opts.brokerType] || RISK_THRESHOLDS.standard;
    const currentDD = ((opts.balance - opts.equity) / opts.balance) * 100;

    if (currentDD >= (thresholds.ddKillSwitch || 10)) {
        return { approved: false, lotSize: 0, reason: "Kill Switch: DD zu hoch", riskPercent: 0, ddRemaining: 0 };
    }

    if (opts.dailyLoss >= (thresholds.maxDailyLoss || 5)) {
        return { approved: false, lotSize: 0, reason: "Tägliches Verlustlimit erreicht", riskPercent: 0, ddRemaining: thresholds.ddPause - currentDD };
    }

    if (opts.openTrades >= (thresholds.maxOpenTrades || 10)) {
        return { approved: false, lotSize: 0, reason: "Max offene Trades erreicht", riskPercent: 0, ddRemaining: thresholds.ddPause - currentDD };
    }

    let riskPercent: number = MOMENTUM_SCALING.baseRisk;
    if (opts.consecutiveWins > 0) {
        riskPercent = Math.min(
            MOMENTUM_SCALING.baseRisk * MOMENTUM_SCALING.maxMultiplier,
            MOMENTUM_SCALING.baseRisk + (opts.consecutiveWins * MOMENTUM_SCALING.winIncrement)
        );
    }

    if (currentDD >= thresholds.ddReduceLots) {
        riskPercent *= 0.5;
    }

    // Lot-Berechnung über zentrale Risk Engine
    const entryPrice = opts.signal.entryPrice || 0;
    const firmProfile = opts.brokerType === "tegas" ? "tegas_24x" : "tag_12x";
    const stopPips = entryPrice > 0
        ? Math.abs(entryPrice - opts.signal.stopLoss) / getPipSize(opts.signal.symbol)
        : 0;

    const lotSize = entryPrice > 0
        ? calculateCopyLots(0.01, stopPips, opts.equity, firmProfile, riskPercent, opts.signal.symbol)
        : 0.01;

    return {
        approved: true,
        lotSize,
        reason: "Trade genehmigt",
        riskPercent,
        ddRemaining: thresholds.ddPause - currentDD,
    };
}

// ── Execute Trade (via MetaAPI) ─────────────────────────────
export async function executeTrade(opts: {
    accountId: string;
    signal: TradeSignal;
    lotSize: number;
    userId: string;
}): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
        const db = createSupabaseAdmin();

        const { data, error } = await db.from("trade_log").insert({
            user_id: opts.userId,
            account_id: opts.accountId,
            symbol: opts.signal.symbol,
            action: opts.signal.action,
            lot_size: opts.lotSize,
            entry_price: opts.signal.entryPrice,
            stop_loss: opts.signal.stopLoss,
            take_profits: opts.signal.takeProfits,
            confidence: opts.signal.confidence,
            source: opts.signal.source,
            status: "pending",
        }).select().single();

        if (error) throw error;

        const token = process.env.METAAPI_TOKEN;
        if (token) {
            const { default: MetaApi } = await import("metaapi.cloud-sdk");
            const api = new MetaApi(token);
            const account = await api.metatraderAccountApi.getAccount(opts.accountId);
            const conn = account.getRPCConnection();
            await conn.connect();
            await conn.waitSynchronized();

            const method = opts.signal.action === "BUY" ? "createMarketBuyOrder" : "createMarketSellOrder";
            const result = await conn[method](
                opts.signal.symbol,
                opts.lotSize,
                opts.signal.stopLoss,
                opts.signal.takeProfits[0] || undefined,
                { comment: `GF-${opts.signal.source}` }
            );

            await db.from("trade_log")
                .update({ status: "executed", order_id: result.orderId })
                .eq("id", data?.id);

            return { success: true, orderId: result.orderId };
        }

        return { success: true, orderId: data?.id };
    } catch (err: any) {
        console.error("[TradeManager] Execute error:", err);
        return { success: false, error: err.message };
    }
}
