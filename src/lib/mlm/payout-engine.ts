// ═══════════════════════════════════════════════════════════════
// src/lib/mlm/payout-engine.ts — Payout Processing
// Min 5000 FP, KYC only at payout, Auto-Approve
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { FORGE_POINTS } from "@/lib/config";

export interface PayoutRequest {
    userId: string;
    amountFP: number;
    amountEUR: number;
    method: "bank" | "crypto" | "paypal";
    walletOrIban: string;
    status: "pending" | "approved" | "rejected" | "paid";
}

// ── Request Payout ──────────────────────────────────────────
export async function requestPayout(userId: string, amountFP: number, method: string, walletOrIban: string): Promise<{ success: boolean; error?: string }> {
    // Check minimum
    if (amountFP < FORGE_POINTS.minPayout) {
        return { success: false, error: `Minimum ${FORGE_POINTS.minPayout} FP (${FORGE_POINTS.minPayout * FORGE_POINTS.valuePerFP}€) erforderlich` };
    }

    // Check KYC
    const { data: kyc } = await supabaseAdmin
        .from("partner_kyc")
        .select("status")
        .eq("user_id", userId)
        .single();

    if (!kyc || kyc.status !== "approved") {
        return { success: false, error: "KYC erforderlich. Bitte verifiziere zuerst deine Identität." };
    }

    // Check vested balance
    const balance = await getVestedBalance(userId);
    if (balance < amountFP) {
        return { success: false, error: `Nicht genug verfügbares Guthaben. Vested: ${balance} FP` };
    }

    const amountEUR = amountFP * FORGE_POINTS.valuePerFP;

    // Create payout request
    const { error } = await supabaseAdmin.from("fp_payouts").insert({
        user_id: userId,
        amount_fp: amountFP,
        amount_eur: amountEUR,
        method,
        wallet: walletOrIban,
        status: "pending",
        created_at: new Date().toISOString(),
    });

    if (error) return { success: false, error: error.message };

    // Debit FP
    await supabaseAdmin.from("fp_transactions").insert({
        user_id: userId,
        amount: -amountFP,
        type: "payout",
        description: `Auszahlung: ${amountEUR.toFixed(2)}€ via ${method}`,
        vested: true,
    });

    return { success: true };
}

// ── Get Vested Balance ──────────────────────────────────────
export async function getVestedBalance(userId: string): Promise<number> {
    const vestingDate = new Date(Date.now() - FORGE_POINTS.vestingMonths * 30 * 86400000);

    const { data } = await supabaseAdmin
        .from("fp_transactions")
        .select("amount")
        .eq("user_id", userId)
        .or(`vested.eq.true,created_at.lt.${vestingDate.toISOString()}`);

    return (data || []).reduce((a: number, t: any) => a + (t.amount || 0), 0);
}

// ── Admin: Approve/Reject Payout ────────────────────────────
export async function processPayoutAdmin(payoutId: string, action: "approved" | "rejected", txHash?: string) {
    const update: any = { status: action, processed_at: new Date().toISOString() };
    if (txHash) update.tx_hash = txHash;

    if (action === "rejected") {
        // Refund FP
        const { data: payout } = await supabaseAdmin
            .from("fp_payouts")
            .select("user_id, amount_fp")
            .eq("id", payoutId)
            .single();

        if (payout) {
            await supabaseAdmin.from("fp_transactions").insert({
                user_id: payout.user_id,
                amount: payout.amount_fp,
                type: "payout_refund",
                description: "Auszahlung abgelehnt — Rückbuchung",
                vested: true,
            });
        }
    }

    await supabaseAdmin.from("fp_payouts").update(update).eq("id", payoutId);
}

// ── Get Pending Payouts (Admin) ─────────────────────────────
export async function getPendingPayouts() {
    const { data } = await supabaseAdmin
        .from("fp_payouts")
        .select("*, profiles(email, full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
    return data || [];
}
