// ═══════════════════════════════════════════════════════════════
// src/lib/crm/lead-manager.ts — CRM Lead Manager
// Lead Scoring, Churn Detection, Email Sequences
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";

export interface Lead {
    id: string;
    email: string;
    score: number;
    status: "new" | "warm" | "hot" | "converted" | "churned";
    source: string;
    lastActivity: string;
    actions: string[];
}

// ── Lead Scoring ────────────────────────────────────────────
export function calculateLeadScore(actions: Array<{ type: string; timestamp: string }>): number {
    let score = 0;
    const weights: Record<string, number> = {
        page_view: 1,
        pricing_view: 5,
        signup: 10,
        demo_start: 15,
        chat_message: 8,
        tool_use: 3,
        leaderboard_view: 4,
        return_visit: 7,
        referral_click: 12,
        trial_start: 20,
    };

    for (const action of actions) {
        score += weights[action.type] || 1;
        // Recency bonus: actions in last 24h get 2x
        const hoursSince = (Date.now() - new Date(action.timestamp).getTime()) / 3600000;
        if (hoursSince < 24) score += weights[action.type] || 1;
    }
    return Math.min(100, score);
}

// ── Churn Detection ─────────────────────────────────────────
export function detectChurnRisk(opts: {
    lastLogin: string;
    tradeCount30d: number;
    loginCount30d: number;
    subscriptionAge: number; // days
}): { risk: "low" | "medium" | "high" | "critical"; score: number; reasons: string[] } {
    const reasons: string[] = [];
    let riskScore = 0;
    const daysSinceLogin = (Date.now() - new Date(opts.lastLogin).getTime()) / 86400000;

    if (daysSinceLogin > 14) { riskScore += 30; reasons.push("Kein Login seit 14+ Tagen"); }
    if (daysSinceLogin > 7) { riskScore += 15; reasons.push("Kein Login seit 7+ Tagen"); }
    if (opts.tradeCount30d === 0) { riskScore += 25; reasons.push("Keine Trades in 30 Tagen"); }
    if (opts.tradeCount30d < 5) { riskScore += 10; reasons.push("Wenige Trades"); }
    if (opts.loginCount30d < 3) { riskScore += 20; reasons.push("Kaum Logins"); }
    if (opts.subscriptionAge < 30) { riskScore += 10; reasons.push("Neuer Kunde (<30d)"); }

    const risk = riskScore >= 60 ? "critical" : riskScore >= 40 ? "high" : riskScore >= 20 ? "medium" : "low";
    return { risk, score: Math.min(100, riskScore), reasons };
}

// ── Email Sequences ─────────────────────────────────────────
export const EMAIL_SEQUENCES = {
    welcome: [
        { delay: 0, subject: "Willkommen bei Gold Foundry! 🏆", template: "welcome" },
        { delay: 1, subject: "Dein Smart Copier Setup (2 Min)", template: "setup-guide" },
        { delay: 3, subject: "So holst du das Maximum raus", template: "tips" },
        { delay: 7, subject: "Deine erste Woche — wie läuft's?", template: "checkin" },
    ],
    winback: [
        { delay: 0, subject: "Wir vermissen dich! 💛", template: "winback-1" },
        { delay: 3, subject: "Neu: Features die du verpasst hast", template: "winback-2" },
        { delay: 7, subject: "Letzte Chance: 50% Rabatt", template: "winback-offer" },
    ],
    upgrade: [
        { delay: 0, subject: "Du bist bereit für mehr", template: "upgrade-1" },
        { delay: 2, subject: "Signal Pro: Was andere Kunden sagen", template: "upgrade-social" },
        { delay: 5, subject: "80% Rabatt im ersten Monat", template: "upgrade-offer" },
    ],
    partner: [
        { delay: 0, subject: "Partner-Programm: Verdiene bis zu 50%", template: "partner-intro" },
        { delay: 2, subject: "Dein Fast Start Plan", template: "partner-faststart" },
        { delay: 7, subject: "Deine ersten 3 Empfehlungen", template: "partner-tips" },
    ],
};

// ── Get Churn Candidates ────────────────────────────────────
export async function getChurnCandidates() {
    const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, email, last_login, created_at")
        .lt("last_login", new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(50);

    return (data || []).map(u => ({
        id: u.id,
        email: u.email,
        churn: detectChurnRisk({
            lastLogin: u.last_login,
            tradeCount30d: 0, // TODO: fetch from trade_log
            loginCount30d: 0,
            subscriptionAge: (Date.now() - new Date(u.created_at).getTime()) / 86400000,
        }),
    }));
}

// ── Generate Winback Message ────────────────────────────────
export async function generateWinbackMessage(userName: string, daysSinceLogin: number): Promise<string> {
    return cachedCall({
        prompt: "Erstelle eine freundliche Winback-Nachricht für Gold Foundry. Kurz, persönlich, nicht aufdringlich. Max 100 Wörter. Deutsch.",
        message: `Name: ${userName}, Letzer Login vor ${daysSinceLogin} Tagen`,
        model: MODELS.fast,
        maxTokens: 200,
    });
}
