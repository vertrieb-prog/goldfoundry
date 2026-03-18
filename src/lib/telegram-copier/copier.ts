// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/copier.ts — Telegram Signal Copier
// ═══════════════════════════════════════════════════════════════

import { cachedCall, PROMPTS } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase-admin";

export interface ParsedSignal {
    action: "BUY" | "SELL" | "MODIFY" | "CLOSE" | "UNKNOWN";
    symbol: string | null;
    entryPrice: number | null;
    stopLoss: number | null;
    takeProfits: number[];
    isModification: boolean;
    isClose: boolean;
    closePartial: number | null;
    moveToBreakeven: boolean;
    confidence: number;
}

// ── Parse Signal via AI ─────────────────────────────────────
export async function parseSignal(message: string): Promise<ParsedSignal> {
    try {
        const result = await cachedCall({
            prompt: PROMPTS.signalParser,
            message: message.slice(0, 500),
            model: MODELS.fast,
            maxTokens: 200,
        });

        const cleaned = result.replace(/```json\n?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
            action: parsed.action || "UNKNOWN",
            symbol: parsed.symbol || null,
            entryPrice: parsed.entryPrice || null,
            stopLoss: parsed.stopLoss || null,
            takeProfits: parsed.takeProfits || [],
            isModification: !!parsed.isModification,
            isClose: !!parsed.isClose,
            closePartial: parsed.closePartial || null,
            moveToBreakeven: !!parsed.moveToBreakeven,
            confidence: parsed.confidence || 0,
        };
    } catch {
        return {
            action: "UNKNOWN", symbol: null, entryPrice: null, stopLoss: null,
            takeProfits: [], isModification: false, isClose: false,
            closePartial: null, moveToBreakeven: false, confidence: 0,
        };
    }
}

// ── Log Parsed Signal ───────────────────────────────────────
export async function logSignal(channelId: string, signal: ParsedSignal, rawMessage: string) {
    await supabaseAdmin.from("telegram_signals").insert({
        channel_id: channelId,
        action: signal.action,
        symbol: signal.symbol,
        entry_price: signal.entryPrice,
        stop_loss: signal.stopLoss,
        take_profits: signal.takeProfits,
        confidence: signal.confidence,
        raw_message: rawMessage.slice(0, 2000),
        parsed_at: new Date().toISOString(),
    });
}

// ── Channel Statistics ──────────────────────────────────────
export async function getChannelStats(channelId: string) {
    const { data } = await supabaseAdmin
        .from("telegram_signals")
        .select("action, symbol, confidence")
        .eq("channel_id", channelId)
        .order("parsed_at", { ascending: false })
        .limit(100);

    if (!data?.length) return null;

    const signals = data.filter(s => s.action !== "UNKNOWN");
    const avgConfidence = signals.reduce((a, s) => a + (s.confidence || 0), 0) / (signals.length || 1);

    return {
        totalSignals: data.length,
        validSignals: signals.length,
        parseRate: (signals.length / data.length) * 100,
        avgConfidence,
        topSymbols: [...new Set(signals.map(s => s.symbol).filter(Boolean))].slice(0, 5),
    };
}
