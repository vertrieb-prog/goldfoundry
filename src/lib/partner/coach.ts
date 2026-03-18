// ═══════════════════════════════════════════════════════════════
// src/lib/partner/coach.ts — AI Partner Coach (FORGE Mentor)
// ═══════════════════════════════════════════════════════════════

import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";

export async function getCoachTip(context: { rank: string; referrals: number; fpBalance: number; streak: number }): Promise<string> {
    return cachedCall({
        prompt: "Du bist der FORGE Partner Coach. Gib personalisierte Tipps für Partner-Wachstum. Max 80 Wörter. Deutsch, motivierend, konkret.",
        message: `Rang: ${context.rank}, Referrals: ${context.referrals}, FP: ${context.fpBalance}, Streak: ${context.streak} Tage`,
        model: MODELS.fast,
        maxTokens: 150,
    });
}

export async function analyzeNetwork(stats: { directRefs: number; teamSize: number; activeRate: number }): Promise<string> {
    return cachedCall({
        prompt: "Analysiere das Partner-Netzwerk und gib konkrete Wachstumstipps. Max 100 Wörter. Deutsch.",
        message: `Direkte Refs: ${stats.directRefs}, Team: ${stats.teamSize}, Aktivitätsrate: ${stats.activeRate}%`,
        model: MODELS.fast,
        maxTokens: 200,
    });
}
