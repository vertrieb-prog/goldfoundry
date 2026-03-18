// ═══════════════════════════════════════════════════════════════
// src/lib/mlm/commission-engine.ts — Unilevel Commission Engine
// 50% Revenue, Compression bei 30d inaktiv
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { PARTNER_TIERS } from "@/lib/config";
import { getUpline } from "./network-engine";

export interface CommissionResult {
    partnerId: string;
    level: number;
    amount: number;
    percentage: number;
    fromUserId: string;
    type: "unilevel" | "first_month";
}

// ── Calculate Monthly Commissions ───────────────────────────
export async function calculateMonthlyCommissions(month: string): Promise<CommissionResult[]> {
    const results: CommissionResult[] = [];

    // Get all active subscriptions for the month
    const { data: subscriptions } = await supabaseAdmin
        .from("subscriptions")
        .select("user_id, plan, price, created_at")
        .eq("status", "active");

    if (!subscriptions) return results;

    for (const sub of subscriptions) {
        const revenue = sub.price * 0.5; // 50% revenue share
        const isFirstMonth = isWithinFirstMonth(sub.created_at, month);
        const upline = await getUpline(sub.user_id);

        let currentLevel = 0;
        for (const ancestor of upline) {
            currentLevel++;

            // Check if ancestor is active (compression: skip inactive > 30d)
            const isActive = await isPartnerActive(ancestor.ancestor_id);
            if (!isActive) continue; // Compression: skip to next level

            // Get partner tier
            const tier = await getPartnerTier(ancestor.ancestor_id);
            const rates = getCommissionRates(tier);

            if (currentLevel <= rates.length && rates[currentLevel - 1] > 0) {
                let amount = revenue * (rates[currentLevel - 1] / 100);

                // First month: commission on discounted price
                if (isFirstMonth) {
                    amount = (sub.price * 0.2) * 0.5 * (rates[currentLevel - 1] / 100);
                }

                results.push({
                    partnerId: ancestor.ancestor_id,
                    level: currentLevel,
                    amount: Math.round(amount * 100) / 100,
                    percentage: rates[currentLevel - 1],
                    fromUserId: sub.user_id,
                    type: isFirstMonth ? "first_month" : "unilevel",
                });
            }
        }
    }

    return results;
}

function getCommissionRates(tier: string): number[] {
    const tiers: Record<string, number[]> = {
        bronze: [30],
        silber: [35, 10],
        gold: [40, 12, 5],
        diamond: [50, 15, 8, 5, 3],
        crown: [50, 15, 8, 5, 3, 2, 1],
        legendary: [50, 15, 8, 5, 3, 2, 1],
    };
    return tiers[tier] || [30];
}

async function isPartnerActive(userId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
        .from("profiles")
        .select("last_login")
        .eq("id", userId)
        .single();

    if (!data?.last_login) return false;
    const daysSince = (Date.now() - new Date(data.last_login).getTime()) / 86400000;
    return daysSince <= 30;
}

async function getPartnerTier(userId: string): Promise<string> {
    const { data } = await supabaseAdmin
        .from("profiles")
        .select("partner_tier")
        .eq("id", userId)
        .single();
    return data?.partner_tier || "bronze";
}

function isWithinFirstMonth(createdAt: string, month: string): boolean {
    const created = new Date(createdAt);
    const monthDate = new Date(month + "-01");
    const diff = (monthDate.getTime() - created.getTime()) / 86400000;
    return diff >= 0 && diff <= 30;
}

// ── Save Commissions ────────────────────────────────────────
export async function saveCommissions(results: CommissionResult[], month: string) {
    if (!results.length) return;
    await supabaseAdmin.from("commission_log").insert(
        results.map(r => ({
            partner_id: r.partnerId,
            level: r.level,
            amount: r.amount,
            percentage: r.percentage,
            from_user_id: r.fromUserId,
            type: r.type,
            month,
            created_at: new Date().toISOString(),
        }))
    );
}
