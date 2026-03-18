// ═══════════════════════════════════════════════════════════════
// src/lib/mlm/matching-engine.ts — Matching Bonus Engine
// Gold 10%, Diamond 20/10/5%, Crown 25/15/10/5%
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getDirectReferrals } from "./network-engine";

interface MatchingBonus {
    partnerId: string;
    matchedPartnerId: string;
    amount: number;
    percentage: number;
    generation: number;
    month: string;
}

const MATCHING_RATES: Record<string, number[]> = {
    starter: [],
    bronze: [],
    silber: [],
    gold: [10],                     // 10% on L1
    diamond: [20, 10, 5],           // 20/10/5% on L1-L3
    crown: [25, 15, 10, 5],         // 25/15/10/5% on L1-L4
    legendary: [25, 15, 10, 5],
};

// ── Calculate Matching Bonuses ──────────────────────────────
export async function calculateMatchingBonuses(month: string): Promise<MatchingBonus[]> {
    const results: MatchingBonus[] = [];

    // Get all partners with Gold+ tier
    const { data: partners } = await supabaseAdmin
        .from("profiles")
        .select("id, partner_tier")
        .in("partner_tier", ["gold", "diamond", "crown", "legendary"]);

    if (!partners) return results;

    for (const partner of partners) {
        const rates = MATCHING_RATES[partner.partner_tier] || [];
        if (rates.length === 0) continue;

        // Only for OWN new referrals
        const directRefs = await getDirectReferrals(partner.id);

        for (const refId of directRefs) {
            // Get this ref's commission earnings for the month
            const { data: refCommissions } = await supabaseAdmin
                .from("commission_log")
                .select("amount")
                .eq("partner_id", refId)
                .eq("month", month);

            const totalRefEarnings = (refCommissions || []).reduce((a: number, c: any) => a + (c.amount || 0), 0);

            if (totalRefEarnings > 0 && rates[0] > 0) {
                results.push({
                    partnerId: partner.id,
                    matchedPartnerId: refId,
                    amount: Math.round(totalRefEarnings * (rates[0] / 100) * 100) / 100,
                    percentage: rates[0],
                    generation: 1,
                    month,
                });
            }
        }
    }

    return results;
}

// ── Save Matching Bonuses ───────────────────────────────────
export async function saveMatchingBonuses(bonuses: MatchingBonus[]) {
    if (!bonuses.length) return;
    await supabaseAdmin.from("matching_bonus_log").insert(
        bonuses.map(b => ({
            partner_id: b.partnerId,
            matched_partner_id: b.matchedPartnerId,
            amount: b.amount,
            percentage: b.percentage,
            generation: b.generation,
            month: b.month,
            created_at: new Date().toISOString(),
        }))
    );
}
