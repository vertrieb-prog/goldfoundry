// ═══════════════════════════════════════════════════════════════
// src/lib/points/forge-points.ts — FORGE Points Core
// 1 FP = €0.10, 3-Month Vesting
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { FORGE_POINTS } from "@/lib/config";

// ── Credit FP ───────────────────────────────────────────────
export async function creditFP(userId: string, amount: number, type: string, description: string) {
    await supabaseAdmin.from("fp_transactions").insert({
        user_id: userId,
        amount,
        type,
        description,
        vested: false,
        created_at: new Date().toISOString(),
    });

    // Update balance
    await updateBalance(userId);
}

// ── Debit FP ────────────────────────────────────────────────
export async function debitFP(userId: string, amount: number, type: string, description: string) {
    await creditFP(userId, -amount, type, description);
}

// ── Get Balance ─────────────────────────────────────────────
export async function getBalance(userId: string): Promise<{
    total: number;
    vested: number;
    locked: number;
    level: number;
    eurValue: number;
    streak: number;
}> {
    const { data } = await supabaseAdmin
        .from("fp_transactions")
        .select("amount, vested, created_at")
        .eq("user_id", userId);

    const transactions = data || [];
    const vestingDate = new Date(Date.now() - FORGE_POINTS.vestingMonths * 30 * 86400000);

    let total = 0;
    let vested = 0;

    for (const t of transactions) {
        total += t.amount;
        if (t.vested || new Date(t.created_at) < vestingDate) {
            vested += t.amount;
        }
    }

    const locked = Math.max(0, total - vested);
    const level = calculateLevel(total);

    // Get streak
    const { data: profile } = await supabaseAdmin
        .from("forge_points")
        .select("streak")
        .eq("user_id", userId)
        .single();

    return {
        total: Math.max(0, total),
        vested: Math.max(0, vested),
        locked: Math.max(0, locked),
        level,
        eurValue: Math.max(0, vested) * FORGE_POINTS.valuePerFP,
        streak: profile?.streak || 0,
    };
}

function calculateLevel(totalFP: number): number {
    if (totalFP >= 100000) return 10;
    if (totalFP >= 50000) return 9;
    if (totalFP >= 25000) return 8;
    if (totalFP >= 10000) return 7;
    if (totalFP >= 5000) return 6;
    if (totalFP >= 2500) return 5;
    if (totalFP >= 1000) return 4;
    if (totalFP >= 500) return 3;
    if (totalFP >= 100) return 2;
    return 1;
}

// ── Update Balance Table ────────────────────────────────────
async function updateBalance(userId: string) {
    const balance = await getBalance(userId);
    await supabaseAdmin.from("forge_points").upsert({
        user_id: userId,
        balance: balance.total,
        locked: balance.locked,
        total_earned: balance.total,
        level: balance.level,
        updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
}

// ── Vest Transactions ───────────────────────────────────────
export async function vestTransactions() {
    const vestingDate = new Date(Date.now() - FORGE_POINTS.vestingMonths * 30 * 86400000);
    await supabaseAdmin
        .from("fp_transactions")
        .update({ vested: true })
        .eq("vested", false)
        .lt("created_at", vestingDate.toISOString());
}
