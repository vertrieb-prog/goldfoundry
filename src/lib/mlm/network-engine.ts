// ═══════════════════════════════════════════════════════════════
// src/lib/mlm/network-engine.ts — Network Tree (Closure Table)
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

// ── Add to Network (Closure Table) ──────────────────────────
export async function addToNetwork(sponsorId: string, newUserId: string) {
    // Insert self-reference
    await supabaseAdmin.from("network_tree").insert({
        ancestor_id: newUserId,
        descendant_id: newUserId,
        depth: 0,
    });

    // Get all ancestors of sponsor
    const { data: ancestors } = await supabaseAdmin
        .from("network_tree")
        .select("ancestor_id, depth")
        .eq("descendant_id", sponsorId);

    if (ancestors) {
        const rows = ancestors.map(a => ({
            ancestor_id: a.ancestor_id,
            descendant_id: newUserId,
            depth: a.depth + 1,
        }));
        if (rows.length > 0) {
            await supabaseAdmin.from("network_tree").insert(rows);
        }
    }

    // Also insert direct sponsor link
    await supabaseAdmin.from("network_tree").upsert({
        ancestor_id: sponsorId,
        descendant_id: newUserId,
        depth: 1,
    }, { onConflict: "ancestor_id,descendant_id" });
}

// ── Get Network for User ────────────────────────────────────
export async function getNetwork(userId: string, maxDepth: number = 10) {
    const { data } = await supabaseAdmin
        .from("network_tree")
        .select("descendant_id, depth")
        .eq("ancestor_id", userId)
        .gt("depth", 0)
        .lte("depth", maxDepth)
        .order("depth", { ascending: true });

    return data || [];
}

// ── Get Direct Referrals ────────────────────────────────────
export async function getDirectReferrals(userId: string) {
    const { data } = await supabaseAdmin
        .from("network_tree")
        .select("descendant_id")
        .eq("ancestor_id", userId)
        .eq("depth", 1);

    return (data || []).map(d => d.descendant_id);
}

// ── Get Network Stats ───────────────────────────────────────
export async function getNetworkStats(userId: string) {
    const network = await getNetwork(userId);
    const byLevel: Record<number, number> = {};

    for (const n of network) {
        byLevel[n.depth] = (byLevel[n.depth] || 0) + 1;
    }

    return {
        totalTeamSize: network.length,
        directReferrals: byLevel[1] || 0,
        levelBreakdown: byLevel,
        maxDepth: Math.max(...Object.keys(byLevel).map(Number), 0),
    };
}

// ── Get Upline ──────────────────────────────────────────────
export async function getUpline(userId: string) {
    const { data } = await supabaseAdmin
        .from("network_tree")
        .select("ancestor_id, depth")
        .eq("descendant_id", userId)
        .gt("depth", 0)
        .order("depth", { ascending: true });

    return data || [];
}
