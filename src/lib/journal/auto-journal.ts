// ═══════════════════════════════════════════════════════════════
// src/lib/journal/auto-journal.ts — AI-Powered Trade Journal
// ═══════════════════════════════════════════════════════════════

import { cachedCall } from "@/lib/ai/cached-client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MODELS } from "@/lib/config";

export interface JournalEntry {
    tradeId: string;
    userId: string;
    symbol: string;
    direction: "BUY" | "SELL";
    profit: number;
    rMultiple: number;
    duration: number; // minutes
    session: string;
    aiComment: string;
    tags: string[];
    emotion: "confident" | "fearful" | "greedy" | "neutral" | "frustrated";
    createdAt: string;
}

// ── Auto-Generate Journal Entry on Trade Close ──────────────
export async function onTradeClose(trade: {
    id: string;
    userId: string;
    symbol: string;
    direction: string;
    openPrice: number;
    closePrice: number;
    stopLoss: number;
    profit: number;
    openTime: string;
    closeTime: string;
    lots: number;
}): Promise<JournalEntry> {
    const duration = (new Date(trade.closeTime).getTime() - new Date(trade.openTime).getTime()) / 60000;
    const hour = new Date(trade.openTime).getUTCHours();
    const session = hour < 8 ? "Asian" : hour < 14 ? "London" : hour < 21 ? "NewYork" : "Asian";

    const risk = Math.abs(trade.openPrice - trade.stopLoss);
    const rMultiple = risk > 0 ? trade.profit / (risk * trade.lots * 100000) : 0;

    let aiComment = "";
    try {
        aiComment = await cachedCall({
            prompt: "Du bist FORGE Mentor. Kommentiere diesen Trade kurz (max 60 Wörter). Lob bei Gewinn, konstruktive Analyse bei Verlust. Deutsch, direkt, kein Zuckerguss.",
            message: `${trade.symbol} ${trade.direction} | Profit: ${trade.profit.toFixed(2)}€ | R: ${rMultiple.toFixed(1)} | Dauer: ${Math.round(duration)}min | Session: ${session}`,
            model: MODELS.fast,
            maxTokens: 120,
        });
    } catch { aiComment = trade.profit > 0 ? "Solider Trade. Weiter so!" : "Analysiere den Einstieg nochmal."; }

    const entry: JournalEntry = {
        tradeId: trade.id,
        userId: trade.userId,
        symbol: trade.symbol,
        direction: trade.direction as "BUY" | "SELL",
        profit: trade.profit,
        rMultiple: Math.round(rMultiple * 10) / 10,
        duration: Math.round(duration),
        session,
        aiComment,
        tags: autoTag(trade.symbol, session, rMultiple, duration),
        emotion: "neutral",
        createdAt: new Date().toISOString(),
    };

    await saveJournalEntry(entry);
    return entry;
}

function autoTag(symbol: string, session: string, rMultiple: number, duration: number): string[] {
    const tags: string[] = [session.toLowerCase()];
    if (symbol.includes("XAU")) tags.push("gold");
    if (symbol.includes("BTC") || symbol.includes("ETH")) tags.push("crypto");
    if (rMultiple >= 2) tags.push("home-run");
    if (rMultiple >= 1) tags.push("winner");
    if (rMultiple < 0) tags.push("loss");
    if (duration < 15) tags.push("scalp");
    if (duration > 240) tags.push("swing");
    return tags;
}

// ── Get Daily Journal ───────────────────────────────────────
export async function getDailyJournal(userId: string, date: string) {
    const { data } = await supabaseAdmin
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", `${date}T00:00:00`)
        .lt("created_at", `${date}T23:59:59`)
        .order("created_at", { ascending: true });

    const entries = data || [];
    const totalProfit = entries.reduce((a: number, e: any) => a + (e.profit || 0), 0);
    const wins = entries.filter((e: any) => e.profit > 0).length;

    return { entries, totalProfit, wins, losses: entries.length - wins, winRate: entries.length > 0 ? (wins / entries.length) * 100 : 0 };
}

// ── Get Weekly Patterns ─────────────────────────────────────
export async function getWeeklyPatterns(userId: string) {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data } = await supabaseAdmin
        .from("journal_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", weekAgo);

    const entries = data || [];
    const bySession: Record<string, { wins: number; losses: number; profit: number }> = {};
    const bySymbol: Record<string, { wins: number; losses: number; profit: number }> = {};

    for (const e of entries) {
        const s = e.session || "unknown";
        if (!bySession[s]) bySession[s] = { wins: 0, losses: 0, profit: 0 };
        if (e.profit > 0) bySession[s].wins++; else bySession[s].losses++;
        bySession[s].profit += e.profit || 0;

        const sym = e.symbol || "unknown";
        if (!bySymbol[sym]) bySymbol[sym] = { wins: 0, losses: 0, profit: 0 };
        if (e.profit > 0) bySymbol[sym].wins++; else bySymbol[sym].losses++;
        bySymbol[sym].profit += e.profit || 0;
    }

    return { bySession, bySymbol, totalTrades: entries.length };
}

async function saveJournalEntry(entry: JournalEntry) {
    await supabaseAdmin.from("journal_entries").insert({
        trade_id: entry.tradeId,
        user_id: entry.userId,
        symbol: entry.symbol,
        direction: entry.direction,
        profit: entry.profit,
        r_multiple: entry.rMultiple,
        duration_minutes: entry.duration,
        session: entry.session,
        ai_comment: entry.aiComment,
        tags: entry.tags,
        emotion: entry.emotion,
        created_at: entry.createdAt,
    });
}
