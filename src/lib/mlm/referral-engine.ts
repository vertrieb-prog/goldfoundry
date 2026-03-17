// src/lib/mlm/referral-engine.ts
// ============================================================
// GOLD FOUNDRY MLM — 3-Level Referral Commission Engine
// Trader Partner: L1 30%, L2 10%, L3 5%
// Affiliate: L1 15% recurring + 25% first month, L2 5%, L3 2.5%
// ============================================================

import { createSupabaseAdmin } from "@/lib/supabase/server";

const COMMISSION_RATES = {
  trader: { l1: 0.30, l2: 0.10, l3: 0.05 },
  affiliate: { l1: 0.15, l2: 0.05, l3: 0.025 },
  firstMonth: 0.25, // Extra bonus for first month (affiliate only)
};

export interface ReferralTree {
  userId: string;
  email: string;
  name: string;
  level: number;
  subscriptionTier: string;
  monthlyRevenue: number;
  commission: number;
  children: ReferralTree[];
}

// ── Get Referral Structure (3 Levels Deep) ────────────────────
export async function getReferralStructure(userId: string): Promise<ReferralTree> {
  const db = createSupabaseAdmin();

  async function buildTree(parentId: string, level: number): Promise<ReferralTree[]> {
    if (level > 3) return [];

    const { data: referrals } = await db
      .from("profiles")
      .select("id, email, full_name, subscription_tier, role")
      .eq("referred_by", parentId);

    if (!referrals?.length) return [];

    const tierPrices: Record<string, number> = {
      free: 0, analyzer: 9, copier: 29, pro: 79, provider: 149,
    };

    const tree: ReferralTree[] = [];
    for (const ref of referrals) {
      const revenue = tierPrices[ref.subscription_tier] ?? 0;
      const role = ref.role === "trader" ? "trader" : "affiliate";
      const rates = COMMISSION_RATES[role];
      const rate = level === 1 ? rates.l1 : level === 2 ? rates.l2 : rates.l3;

      const children = await buildTree(ref.id, level + 1);
      tree.push({
        userId: ref.id,
        email: ref.email,
        name: ref.full_name ?? ref.email,
        level,
        subscriptionTier: ref.subscription_tier,
        monthlyRevenue: revenue,
        commission: revenue * rate,
        children,
      });
    }
    return tree;
  }

  const { data: profile } = await db.from("profiles").select("*").eq("id", userId).single();
  const children = await buildTree(userId, 1);

  return {
    userId,
    email: profile?.email ?? "",
    name: profile?.full_name ?? "",
    level: 0,
    subscriptionTier: profile?.subscription_tier ?? "free",
    monthlyRevenue: 0,
    commission: 0,
    children,
  };
}

// ── Calculate Monthly Commissions ─────────────────────────────
export async function calculateMonthlyCommissions(
  periodStart: Date,
  periodEnd: Date
): Promise<{ earnerId: string; amount: number; sourceUserId: string; level: number }[]> {
  const db = createSupabaseAdmin();
  const earnings: any[] = [];

  // Get all users with referrals
  const { data: profiles } = await db.from("profiles").select("*").not("referred_by", "is", null);

  if (!profiles?.length) return [];

  const tierPrices: Record<string, number> = {
    free: 0, analyzer: 9, copier: 29, pro: 79, provider: 149,
  };

  for (const profile of profiles) {
    const revenue = tierPrices[profile.subscription_tier] ?? 0;
    if (revenue === 0) continue;

    // Walk up the referral chain (3 levels)
    let currentReferrer = profile.referred_by;
    let level = 1;

    while (currentReferrer && level <= 3) {
      const { data: referrer } = await db
        .from("profiles")
        .select("id, referred_by, role")
        .eq("id", currentReferrer)
        .single();

      if (!referrer) break;

      const role = referrer.role === "trader" ? "trader" : "affiliate";
      const rates = COMMISSION_RATES[role];
      const rate = level === 1 ? rates.l1 : level === 2 ? rates.l2 : rates.l3;
      const commission = revenue * rate;

      if (commission > 0) {
        earnings.push({
          earnerId: referrer.id,
          amount: Math.round(commission * 100) / 100,
          sourceUserId: profile.id,
          level,
        });
      }

      currentReferrer = referrer.referred_by;
      level++;
    }
  }

  // Store earnings
  if (earnings.length > 0) {
    await db.from("referral_earnings").insert(
      earnings.map(e => ({
        earner_id: e.earnerId,
        source_user_id: e.sourceUserId,
        level: e.level,
        amount: e.amount,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
      }))
    );
  }

  return earnings;
}

// ── Get User Earnings Summary ─────────────────────────────────
export async function getUserEarnings(userId: string) {
  const db = createSupabaseAdmin();

  const { data: earnings } = await db
    .from("referral_earnings")
    .select("*")
    .eq("earner_id", userId)
    .order("created_at", { ascending: false });

  const total = (earnings ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const unpaid = (earnings ?? []).filter(e => !e.paid).reduce((s, e) => s + Number(e.amount), 0);
  const paid = (earnings ?? []).filter(e => e.paid).reduce((s, e) => s + Number(e.amount), 0);

  const byLevel = {
    l1: (earnings ?? []).filter(e => e.level === 1).reduce((s, e) => s + Number(e.amount), 0),
    l2: (earnings ?? []).filter(e => e.level === 2).reduce((s, e) => s + Number(e.amount), 0),
    l3: (earnings ?? []).filter(e => e.level === 3).reduce((s, e) => s + Number(e.amount), 0),
  };

  return { total, unpaid, paid, byLevel, history: earnings ?? [] };
}
