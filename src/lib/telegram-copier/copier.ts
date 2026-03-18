// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/copier.ts — Telegram Signal Copier
// ═══════════════════════════════════════════════════════════════

import { cachedCall, PROMPTS } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { createSupabaseAdmin } from "@/lib/supabase/server";

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

// ── Log Parsed Signal (passt zum DB-Schema aus 005-session-additions.sql) ──
export async function logSignal(channelId: string, signal: ParsedSignal, rawMessage: string, messageId?: number) {
    const db = createSupabaseAdmin();
    await db.from("telegram_signals").insert({
        channel_id: channelId,
        message_id: messageId ?? null,
        raw_message: rawMessage.slice(0, 2000),
        parsed: signal,                    // Ganzes ParsedSignal als JSONB
        status: signal.action === "UNKNOWN" ? "parsed" : "parsed",
    });

    // Channel-Statistik aktualisieren
    if (signal.action !== "UNKNOWN") {
        await db.from("telegram_channels")
            .update({
                last_signal_at: new Date().toISOString(),
                total_signals: undefined, // Wird via DB-Trigger oder manuell aktualisiert
            })
            .eq("channel_id", channelId);

        // total_signals inkrementieren
        await db.rpc("increment_channel_signals", { p_channel_id: channelId }).catch(() => {
            // Fallback: Manuell updaten wenn RPC nicht existiert
            db.from("telegram_channels")
                .update({ updated_at: new Date().toISOString() })
                .eq("channel_id", channelId);
        });
    }
}

// ── Channel Statistics ──────────────────────────────────────
export async function getChannelStats(channelId: string) {
    const db = createSupabaseAdmin();
    const { data } = await db
        .from("telegram_signals")
        .select("parsed, status, created_at")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(100);

    if (!data?.length) return null;

    const signals = data.filter(s => {
        const p = s.parsed as ParsedSignal | null;
        return p && p.action !== "UNKNOWN";
    });

    const parsedSignals = signals.map(s => s.parsed as ParsedSignal);
    const avgConfidence = parsedSignals.reduce((a, s) => a + (s.confidence || 0), 0) / (parsedSignals.length || 1);

    const executed = data.filter(s => s.status === "executed").length;
    const blocked = data.filter(s => s.status === "blocked").length;

    return {
        totalSignals: data.length,
        validSignals: signals.length,
        executedSignals: executed,
        blockedSignals: blocked,
        parseRate: (signals.length / data.length) * 100,
        avgConfidence,
        topSymbols: [...new Set(parsedSignals.map(s => s.symbol).filter(Boolean))].slice(0, 5),
    };
}
