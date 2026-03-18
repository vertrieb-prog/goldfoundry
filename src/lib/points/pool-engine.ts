// ═══════════════════════════════════════════════════════════════
// src/lib/points/pool-engine.ts — Performance Pool (5%, Gold+ qualifies)
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { FORGE_POINTS } from "@/lib/config";
import { creditFP } from "./forge-points";

// ── Calculate Pool Distribution ─────────────────────────────
export async function distributePool(month: string) {
    // Get total revenue for month
    const { data: revenue } = await supabaseAdmin
        .from("subscriptions")
        .select("price")
        .eq("status", "active");

    const totalRevenue = (revenue || []).reduce((a: number, s: any) => a + (s.price || 0), 0);
    const poolAmount = totalRevenue * (FORGE_POINTS.poolPercentage / 100);
    const poolFP = Math.floor(poolAmount / FORGE_POINTS.valuePerFP);

    // Get qualifying partners (Gold+)
    const { data: qualifiedPartners } = await supabaseAdmin
        .from("profiles")
        .select("id, partner_tier")
        .in("partner_tier", ["gold", "diamond", "crown", "legendary"]);

    if (!qualifiedPartners?.length || poolFP <= 0) return { poolFP: 0, distributed: 0, partners: 0 };

    // Weight by tier
    const weights: Record<string, number> = { gold: 1, diamond: 2, crown: 4, legendary: 8 };
    const totalWeight = qualifiedPartners.reduce((a, p) => a + (weights[p.partner_tier] || 1), 0);

    let distributed = 0;
    for (const partner of qualifiedPartners) {
        const weight = weights[partner.partner_tier] || 1;
        const share = Math.floor(poolFP * (weight / totalWeight));
        if (share > 0) {
            await creditFP(partner.id, share, "pool_distribution", `Performance Pool ${month}: ${share} FP`);
            distributed += share;
        }
    }

    // Log pool distribution
    await supabaseAdmin.from("performance_pool").insert({
        month,
        total_revenue: totalRevenue,
        pool_amount: poolAmount,
        pool_fp: poolFP,
        distributed_fp: distributed,
        qualified_partners: qualifiedPartners.length,
        created_at: new Date().toISOString(),
    });

    return { poolFP, distributed, partners: qualifiedPartners.length };
}
