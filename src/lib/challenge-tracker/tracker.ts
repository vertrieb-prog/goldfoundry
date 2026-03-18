// ═══════════════════════════════════════════════════════════════
// src/lib/challenge-tracker/tracker.ts — Challenge/Prop Firm Tracker
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { RISK_THRESHOLDS } from "@/lib/config";

export interface ChallengeProgress {
    accountId: string;
    broker: string;
    phase: "challenge" | "verification" | "funded";
    targetProfit: number;
    currentProfit: number;
    maxDrawdown: number;
    currentDrawdown: number;
    daysTotal: number;
    daysTraded: number;
    daysRemaining: number;
    dailyBudget: number;
    status: "on_track" | "warning" | "danger" | "passed" | "failed";
}

// ── Get Challenge Progress ──────────────────────────────────
export function getChallengeProgress(opts: {
    balance: number;
    equity: number;
    startBalance: number;
    targetPercent: number;
    maxDDPercent: number;
    startDate: string;
    endDate: string;
}): ChallengeProgress {
    const now = new Date();
    const start = new Date(opts.startDate);
    const end = new Date(opts.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const daysPassed = Math.ceil((now.getTime() - start.getTime()) / 86400000);
    const daysRemaining = Math.max(0, totalDays - daysPassed);

    const currentProfit = ((opts.balance - opts.startBalance) / opts.startBalance) * 100;
    const targetProfit = opts.targetPercent;
    const currentDrawdown = ((opts.startBalance - Math.min(opts.equity, opts.balance)) / opts.startBalance) * 100;
    const remainingProfit = targetProfit - currentProfit;
    const dailyBudget = daysRemaining > 0 ? remainingProfit / daysRemaining : 0;

    let status: ChallengeProgress["status"] = "on_track";
    if (currentDrawdown >= opts.maxDDPercent) status = "failed";
    else if (currentProfit >= targetProfit) status = "passed";
    else if (currentDrawdown >= opts.maxDDPercent * 0.7) status = "danger";
    else if (dailyBudget > 2) status = "warning";

    return {
        accountId: "",
        broker: "",
        phase: "challenge",
        targetProfit,
        currentProfit: Math.round(currentProfit * 100) / 100,
        maxDrawdown: opts.maxDDPercent,
        currentDrawdown: Math.round(currentDrawdown * 100) / 100,
        daysTotal: totalDays,
        daysTraded: daysPassed,
        daysRemaining,
        dailyBudget: Math.round(dailyBudget * 100) / 100,
        status,
    };
}

// ── Calculate Daily Budget ──────────────────────────────────
export function calculateDailyBudget(remainingProfit: number, daysRemaining: number): number {
    if (daysRemaining <= 0) return 0;
    return Math.round((remainingProfit / daysRemaining) * 100) / 100;
}

// ── Get Recommendation ──────────────────────────────────────
export function getRecommendation(progress: ChallengeProgress): string {
    if (progress.status === "failed") return "Challenge gescheitert. DD-Limit überschritten. Neuen Start planen.";
    if (progress.status === "passed") return "Glückwunsch! Challenge bestanden! Warte auf Verification.";
    if (progress.status === "danger") return "⚠️ VORSICHT: DD nähert sich dem Limit. Reduziere Lotgröße um 50%. Nur A+ Setups traden.";
    if (progress.status === "warning") return "⚡ Du brauchst " + progress.dailyBudget.toFixed(1) + "% pro Tag. Fokussiere dich auf London Session.";
    if (progress.daysRemaining > progress.daysTotal * 0.7) return "Guter Start! Bleib konservativ. Konsistenz > Geschwindigkeit.";
    return "Du bist auf Kurs. Weiter so! Der Daily Budget liegt bei " + progress.dailyBudget.toFixed(2) + "%";
}

// ── Save Progress ───────────────────────────────────────────
export async function saveChallengeProgress(userId: string, progress: ChallengeProgress) {
    await supabaseAdmin.from("challenge_configs").upsert({
        user_id: userId,
        account_id: progress.accountId,
        broker: progress.broker,
        phase: progress.phase,
        target_profit: progress.targetProfit,
        current_profit: progress.currentProfit,
        max_drawdown: progress.maxDrawdown,
        current_drawdown: progress.currentDrawdown,
        days_total: progress.daysTotal,
        days_traded: progress.daysTraded,
        status: progress.status,
        updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,account_id" });
}
