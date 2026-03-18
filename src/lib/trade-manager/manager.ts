// ═══════════════════════════════════════════════════════════════
// src/lib/trade-manager/manager.ts — Trade Manager
// Receives signals, checks risk, calculates lots, executes
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { RISK_THRESHOLDS, MOMENTUM_SCALING } from "@/lib/config";

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

// ── Lot Size Calculator ─────────────────────────────────────
export function calculateLotSize(opts: {
    balance: number;
    riskPercent: number;
    entryPrice: number;
    stopLoss: number;
    symbol: string;
    leverage: number;
}): number {
    const pipValue = opts.symbol.includes("JPY") ? 0.01 : 0.0001;
    const slPips = Math.abs(opts.entryPrice - opts.stopLoss) / pipValue;
    if (slPips <= 0) return 0.01;

    const riskAmount = opts.balance * (opts.riskPercent / 100);
    const lotSize = riskAmount / (slPips * 10); // standard lot = 10 per pip
    return Math.max(0.01, Math.round(lotSize * 100) / 100);
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

    // Kill switch
    if (currentDD >= (thresholds.ddKillSwitch || 10)) {
        return { approved: false, lotSize: 0, reason: "Kill Switch: DD zu hoch", riskPercent: 0, ddRemaining: 0 };
    }

    // Max daily loss
    if (opts.dailyLoss >= (thresholds.maxDailyLoss || 5)) {
        return { approved: false, lotSize: 0, reason: "Tägliches Verlustlimit erreicht", riskPercent: 0, ddRemaining: thresholds.ddPause - currentDD };
    }

    // Max open trades
    if (opts.openTrades >= (thresholds.maxOpenTrades || 10)) {
        return { approved: false, lotSize: 0, reason: "Max offene Trades erreicht", riskPercent: 0, ddRemaining: thresholds.ddPause - currentDD };
    }

    // Momentum scaling
    let riskPercent = MOMENTUM_SCALING.baseRisk;
    if (opts.consecutiveWins > 0) {
        riskPercent = Math.min(
            MOMENTUM_SCALING.baseRisk * MOMENTUM_SCALING.maxMultiplier,
            MOMENTUM_SCALING.baseRisk + (opts.consecutiveWins * MOMENTUM_SCALING.winIncrement)
        );
    }

    // Reduce risk if near DD limit
    if (currentDD >= thresholds.ddReduceLots) {
        riskPercent *= 0.5;
    }

    const entryPrice = opts.signal.entryPrice || 0;
    const lotSize = entryPrice > 0 ? calculateLotSize({
        balance: opts.balance,
        riskPercent,
        entryPrice,
        stopLoss: opts.signal.stopLoss,
        symbol: opts.signal.symbol,
        leverage: 1,
    }) : 0.01;

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
        // Log trade to DB
        const { data, error } = await supabaseAdmin.from("trade_log").insert({
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

        // TODO: Execute via MetaAPI
        // const metaApi = await getMetaApiConnection(opts.accountId);
        // const result = await metaApi.createMarketOrder(...)

        return { success: true, orderId: data?.id };
    } catch (err: any) {
        console.error("[TradeManager] Execute error:", err);
        return { success: false, error: err.message };
    }
}
