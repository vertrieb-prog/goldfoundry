// ═══════════════════════════════════════════════════════════════
// src/lib/mlm/builder-packs.ts — Builder Pack System
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import { BUILDER_PACKS } from "@/lib/config";
import { randomBytes } from "crypto";

export type PackType = keyof typeof BUILDER_PACKS;

// ── Purchase Builder Pack ───────────────────────────────────
export async function purchaseBuilderPack(buyerId: string, packType: PackType) {
    const pack = BUILDER_PACKS[packType];
    if (!pack) throw new Error("Ungültiger Pack-Typ");

    const codes: string[] = [];
    for (let i = 0; i < pack.quantity; i++) {
        codes.push(generateInviteCode());
    }

    const { data, error } = await supabaseAdmin.from("builder_packs").insert({
        buyer_id: buyerId,
        pack_type: packType,
        quantity: pack.quantity,
        price: pack.price,
        codes,
        redeemed_count: 0,
        created_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    // Create invite codes
    for (const code of codes) {
        await supabaseAdmin.from("invite_codes").insert({
            code,
            sponsor_id: buyerId,
            redeemed_by: null,
            expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
        });
    }

    return { packId: data?.id, codes };
}

// ── Redeem Invite Code ──────────────────────────────────────
export async function redeemInviteCode(code: string, userId: string): Promise<{ success: boolean; sponsorId?: string; error?: string }> {
    const { data: invite } = await supabaseAdmin
        .from("invite_codes")
        .select("*")
        .eq("code", code)
        .single();

    if (!invite) return { success: false, error: "Code nicht gefunden" };
    if (invite.redeemed_by) return { success: false, error: "Code bereits eingelöst" };
    if (new Date(invite.expires_at) < new Date()) return { success: false, error: "Code abgelaufen" };

    // Redeem code
    await supabaseAdmin.from("invite_codes").update({
        redeemed_by: userId,
        redeemed_at: new Date().toISOString(),
    }).eq("code", code);

    // Update pack redeemed count
    const { data: pack } = await supabaseAdmin
        .from("builder_packs")
        .select("id, redeemed_count, quantity")
        .eq("buyer_id", invite.sponsor_id)
        .contains("codes", [code])
        .single();

    if (pack) {
        await supabaseAdmin.from("builder_packs").update({
            redeemed_count: (pack.redeemed_count || 0) + 1,
        }).eq("id", pack.id);

        // FP credit for sponsor: only when 60%+ redeemed AND paid
        const newRedeemed = (pack.redeemed_count || 0) + 1;
        if (newRedeemed >= Math.ceil(pack.quantity * 0.6)) {
            await creditFastStartBonus(invite.sponsor_id, code);
        }
    }

    return { success: true, sponsorId: invite.sponsor_id };
}

async function creditFastStartBonus(sponsorId: string, code: string) {
    // Check if already credited
    const { data: existing } = await supabaseAdmin
        .from("fp_transactions")
        .select("id")
        .eq("user_id", sponsorId)
        .eq("type", "fast_start_pack")
        .limit(1);

    if (existing && existing.length > 0) return;

    await supabaseAdmin.from("fp_transactions").insert({
        user_id: sponsorId,
        amount: 500,
        type: "fast_start_pack",
        description: "Builder Pack Fast Start Bonus (60%+ eingelöst)",
        vested: false,
    });
}

function generateInviteCode(): string {
    return "GF-" + randomBytes(4).toString("hex").toUpperCase();
}

// ── Get Pack Stats ──────────────────────────────────────────
export async function getPackStats(userId: string) {
    const { data } = await supabaseAdmin
        .from("builder_packs")
        .select("*")
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false });

    return (data || []).map((p: any) => ({
        id: p.id,
        type: p.pack_type,
        quantity: p.quantity,
        redeemed: p.redeemed_count || 0,
        remaining: p.quantity - (p.redeemed_count || 0),
        codes: p.codes || [],
        price: p.price,
        createdAt: p.created_at,
    }));
}
