// ═══════════════════════════════════════════════════════════════
// src/lib/mlm/rank-engine.ts — 7 Ranks, Monthly Evaluation
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { RANK_REQUIREMENTS } from "@/lib/config";
import { getNetworkStats } from "./network-engine";

type RankKey = keyof typeof RANK_REQUIREMENTS;

export interface RankEvaluation {
    userId: string;
    currentRank: RankKey;
    qualifiedRank: RankKey;
    promoted: boolean;
    demoted: boolean;
    criteria: {
        refs: { required: number; actual: number; met: boolean };
        volume: { required: number; actual: number; met: boolean };
        teamSize: { required: number; actual: number; met: boolean };
        activeRefs: { required: number; actual: number; met: boolean };
    };
    bonus: number;
    gracePeriodDays: number;
}

// ── Evaluate Rank ───────────────────────────────────────────
export async function evaluateRank(userId: string): Promise<RankEvaluation> {
    const stats = await getNetworkStats(userId);
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("partner_tier, partner_volume, rank_grace_until")
        .eq("id", userId)
        .single();

    const currentRank = (profile?.partner_tier || "starter") as RankKey;
    const volume = profile?.partner_volume || 0;

    // Count active direct refs
    const { data: activeRefs } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .in("id", (await getDirectRefs(userId)))
        .gte("last_login", new Date(Date.now() - 30 * 86400000).toISOString());

    const activeRefCount = activeRefs?.length || 0;

    // Find highest qualifying rank
    const ranks = Object.entries(RANK_REQUIREMENTS) as [RankKey, typeof RANK_REQUIREMENTS[RankKey]][];
    let qualifiedRank: RankKey = "starter";

    for (const [key, req] of ranks) {
        const meetsCriteria =
            stats.directReferrals >= req.minRefs &&
            volume >= req.minVolume &&
            stats.totalTeamSize >= req.minTeamSize &&
            activeRefCount >= req.minActiveRefs;

        if (meetsCriteria) qualifiedRank = key;
    }

    const rankOrder: RankKey[] = ["starter", "bronze", "silber", "gold", "diamond", "crown", "legendary"];
    const currentIdx = rankOrder.indexOf(currentRank);
    const qualifiedIdx = rankOrder.indexOf(qualifiedRank);

    const promoted = qualifiedIdx > currentIdx;
    const demoted = qualifiedIdx < currentIdx;

    // Grace period: 90 days before demotion
    let gracePeriodDays = 0;
    if (demoted && profile?.rank_grace_until) {
        const graceEnd = new Date(profile.rank_grace_until);
        gracePeriodDays = Math.max(0, Math.ceil((graceEnd.getTime() - Date.now()) / 86400000));
    }

    const bonus = promoted ? RANK_REQUIREMENTS[qualifiedRank].bonus : 0;
    const req = RANK_REQUIREMENTS[qualifiedRank];

    return {
        userId,
        currentRank,
        qualifiedRank,
        promoted,
        demoted: demoted && gracePeriodDays <= 0,
        criteria: {
            refs: { required: req.minRefs, actual: stats.directReferrals, met: stats.directReferrals >= req.minRefs },
            volume: { required: req.minVolume, actual: volume, met: volume >= req.minVolume },
            teamSize: { required: req.minTeamSize, actual: stats.totalTeamSize, met: stats.totalTeamSize >= req.minTeamSize },
            activeRefs: { required: req.minActiveRefs, actual: activeRefCount, met: activeRefCount >= req.minActiveRefs },
        },
        bonus,
        gracePeriodDays,
    };
}

async function getDirectRefs(userId: string): Promise<string[]> {
    const { data } = await supabaseAdmin
        .from("network_tree")
        .select("descendant_id")
        .eq("ancestor_id", userId)
        .eq("depth", 1);
    return (data || []).map(d => d.descendant_id);
}

// ── Apply Rank Changes ──────────────────────────────────────
export async function applyRankChange(evaluation: RankEvaluation) {
    if (evaluation.promoted) {
        await supabaseAdmin.from("profiles").update({
            partner_tier: evaluation.qualifiedRank,
        }).eq("id", evaluation.userId);

        await supabaseAdmin.from("rank_history").insert({
            user_id: evaluation.userId,
            old_rank: evaluation.currentRank,
            new_rank: evaluation.qualifiedRank,
            bonus_fp: evaluation.bonus,
            created_at: new Date().toISOString(),
        });

        // Credit bonus FP
        if (evaluation.bonus > 0) {
            await supabaseAdmin.from("fp_transactions").insert({
                user_id: evaluation.userId,
                amount: evaluation.bonus,
                type: "rank_bonus",
                description: `Rank-Up Bonus: ${evaluation.qualifiedRank}`,
                vested: false,
            });
        }
    } else if (evaluation.demoted && evaluation.gracePeriodDays <= 0) {
        await supabaseAdmin.from("profiles").update({
            partner_tier: evaluation.qualifiedRank,
        }).eq("id", evaluation.userId);
    } else if (evaluation.demoted && evaluation.gracePeriodDays > 0) {
        // Set grace period if not already set
        const graceUntil = new Date(Date.now() + 90 * 86400000).toISOString();
        await supabaseAdmin.from("profiles").update({
            rank_grace_until: graceUntil,
        }).eq("id", evaluation.userId);
    }
}
