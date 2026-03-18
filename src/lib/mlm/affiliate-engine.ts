// src/lib/mlm/affiliate-engine.ts
// ============================================================
// GOLD FOUNDRY — Complete Affiliate / MLM Engine
// Click Tracking, Conversions, Tiers, Payouts, Structure
// ============================================================

import { createSupabaseAdmin } from "@/lib/supabase/server";

const log = (msg: string, data?: any) =>
  console.log(`[${new Date().toISOString()}] [AFFILIATE] ${msg}`, data ?? "");

// ── Subscription Prices ───────────────────────────────────────
const TIER_PRICES: Record<string, number> = {
  free: 0, analyzer: 9, copier: 29, pro: 79, provider: 149,
};

// ══════════════════════════════════════════════════════════════
// AFFILIATE PROFILE
// ══════════════════════════════════════════════════════════════

export async function applyAsAffiliate(userId: string, partnerType: string, payoutMethod: string, payoutDetails: any) {
  const db = createSupabaseAdmin();

  const { data: profile } = await db.from("profiles").select("referral_code").eq("id", userId).single();

  const { data, error } = await db.from("affiliate_profiles").insert({
    user_id: userId,
    partner_type: partnerType,
    payout_method: payoutMethod,
    payout_details: payoutDetails,
    custom_slug: profile?.referral_code, // Default: use their referral code
    status: "approved", // Auto-approve for now. Change to "pending" for manual review.
    approved_at: new Date().toISOString(),
  }).select().single();

  if (error) throw error;

  // Create default affiliate link
  await db.from("affiliate_links").insert({
    affiliate_id: data.id,
    slug: profile?.referral_code ?? data.id.slice(0, 8),
    destination_url: "/",
    campaign_name: "Default Link",
  });

  log(`Neuer Affiliate: ${userId} als ${partnerType}`);
  return data;
}

export async function getAffiliateProfile(userId: string) {
  const db = createSupabaseAdmin();
  const { data } = await db.from("affiliate_profiles").select("*, affiliate_tiers(*)").eq("user_id", userId).single();
  return data;
}

// ══════════════════════════════════════════════════════════════
// CLICK TRACKING
// ══════════════════════════════════════════════════════════════

export async function trackClick(data: {
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  refererUrl?: string;
  landingUrl?: string;
}) {
  const db = createSupabaseAdmin();

  // Find affiliate by referral code
  const { data: profile } = await db.from("profiles")
    .select("id, referral_code").eq("referral_code", data.referralCode).single();
  if (!profile) return null;

  const { data: affProfile } = await db.from("affiliate_profiles")
    .select("id").eq("user_id", profile.id).single();
  if (!affProfile) return null;

  // Detect device
  const ua = data.userAgent?.toLowerCase() ?? "";
  const device = /mobile|android|iphone/.test(ua) ? "mobile" : /tablet|ipad/.test(ua) ? "tablet" : "desktop";

  // Store click
  const { data: click } = await db.from("affiliate_clicks").insert({
    affiliate_id: affProfile.id,
    referral_code: data.referralCode,
    ip_address: data.ipAddress,
    user_agent: data.userAgent,
    referer_url: data.refererUrl,
    landing_url: data.landingUrl,
    device,
  }).select().single();

  // Update stats
  await db.rpc("increment_affiliate_stat", { aff_id: affProfile.id, stat: "total_clicks" })
    .catch((err) => {
      log("increment_affiliate_stat fehlgeschlagen", err);
    });

  return click;
}

// ══════════════════════════════════════════════════════════════
// CONVERSION TRACKING
// ══════════════════════════════════════════════════════════════

export async function trackConversion(data: {
  referredUserId: string;
  eventType: string;
  subscriptionTier?: string;
  paymentAmount?: number;
}) {
  const db = createSupabaseAdmin();

  // Idempotency: Check if this conversion was already tracked
  const { data: existingConversion } = await db.from("affiliate_conversions")
    .select("id")
    .eq("referred_user_id", data.referredUserId)
    .eq("event_type", data.eventType)
    .eq("commission_level", 1) // Only check L1 as proxy for all levels
    .limit(1)
    .single();

  if (existingConversion) {
    log(`Duplikat-Conversion ignoriert: ${data.eventType} für User ${data.referredUserId}`);
    return null;
  }

  // Find who referred this user
  const { data: referredProfile } = await db.from("profiles")
    .select("id, referred_by").eq("id", data.referredUserId).single();
  if (!referredProfile?.referred_by) return null; // Not referred

  // Walk up the chain — up to 3 levels
  const commissions: Array<{ affiliateId: string; level: number; rate: number; amount: number }> = [];
  let currentReferrerId = referredProfile.referred_by;
  let level = 1;

  while (currentReferrerId && level <= 3) {
    const { data: affProfile } = await db.from("affiliate_profiles")
      .select("*, affiliate_tiers(*)")
      .eq("user_id", currentReferrerId).single();

    if (!affProfile || affProfile.status !== "approved") break;

    // Get rates (custom or tier-based)
    const tierData = await getTierRates(affProfile);
    const rate = level === 1 ? tierData.l1 : level === 2 ? tierData.l2 : tierData.l3;

    const paymentAmount = data.paymentAmount ?? TIER_PRICES[data.subscriptionTier ?? "free"] ?? 0;
    let commissionAmount = paymentAmount * rate;

    // First-month bonus for level 1
    if (level === 1 && data.eventType === "first_payment") {
      commissionAmount += paymentAmount * tierData.firstMonthBonus;
    }

    if (commissionAmount > 0) {
      // Store conversion
      await db.from("affiliate_conversions").insert({
        affiliate_id: affProfile.id,
        referred_user_id: data.referredUserId,
        event_type: data.eventType,
        subscription_tier: data.subscriptionTier,
        payment_amount: paymentAmount,
        commission_amount: Math.round(commissionAmount * 100) / 100,
        commission_level: level,
        commission_rate: rate,
      });

      commissions.push({
        affiliateId: affProfile.id,
        level,
        rate,
        amount: Math.round(commissionAmount * 100) / 100,
      });

      // Update affiliate stats
      await db.from("affiliate_profiles").update({
        total_earned: Number(affProfile.total_earned) + commissionAmount,
        current_balance: Number(affProfile.current_balance) + commissionAmount,
        total_conversions: data.eventType === "first_payment"
          ? Number(affProfile.total_conversions) + 1 : Number(affProfile.total_conversions),
        total_signups: data.eventType === "signup"
          ? Number(affProfile.total_signups) + 1 : Number(affProfile.total_signups),
        updated_at: new Date().toISOString(),
      }).eq("id", affProfile.id);

      // Check tier upgrade
      await checkTierUpgrade(affProfile.id);
    }

    // Move up the chain
    const { data: nextProfile } = await db.from("profiles")
      .select("referred_by").eq("id", currentReferrerId).single();
    currentReferrerId = nextProfile?.referred_by;
    level++;
  }

  log(`Conversion: ${data.eventType} für User ${data.referredUserId}, ${commissions.length} Provisionen verteilt`);

  // INSTANT NOTIFICATIONS for each commission recipient
  try {
    const { notifyReferralConverted } = await import("./affiliate-notifications");
    for (const comm of commissions) {
      const { data: affData } = await db.from("affiliate_profiles")
        .select("user_id, current_balance, profiles(email, full_name)")
        .eq("id", comm.affiliateId).single();
      if (affData) {
        const { data: referredUser } = await db.from("profiles")
          .select("full_name, email").eq("id", data.referredUserId).single();
        await notifyReferralConverted(
          (affData.profiles as any)?.email,
          (affData.profiles as any)?.full_name ?? "Partner",
          referredUser?.full_name ?? referredUser?.email?.split("@")[0] ?? "Neuer User",
          data.subscriptionTier ?? "copier",
          comm.amount,
          Number(affData.current_balance),
          comm.level
        );
      }
    }
  } catch { /* Notification is optional */ }

  return commissions;
}

async function getTierRates(affProfile: any) {
  const db = createSupabaseAdmin();
  const { data: tier } = await db.from("affiliate_tiers").select("*").eq("tier", affProfile.tier).single();

  const isTrader = affProfile.partner_type === "trader";

  return {
    l1: affProfile.custom_l1_rate ?? (isTrader ? tier?.l1_rate_trader : tier?.l1_rate_affiliate) ?? 0.15,
    l2: affProfile.custom_l2_rate ?? (isTrader ? tier?.l2_rate_trader : tier?.l2_rate_affiliate) ?? 0.05,
    l3: affProfile.custom_l3_rate ?? (isTrader ? tier?.l3_rate_trader : tier?.l3_rate_affiliate) ?? 0.025,
    firstMonthBonus: tier?.first_month_bonus ?? 0.25,
  };
}

// ══════════════════════════════════════════════════════════════
// TIER AUTO-UPGRADE
// ══════════════════════════════════════════════════════════════

async function checkTierUpgrade(affiliateId: string) {
  const db = createSupabaseAdmin();

  const { data: aff } = await db.from("affiliate_profiles").select("*").eq("id", affiliateId).single();
  if (!aff) return;

  // Count active referrals (users with active subscription)
  const { count: activeRefs } = await db.from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", aff.user_id)
    .eq("subscription_active", true);

  // Monthly revenue (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: recentConversions } = await db.from("affiliate_conversions")
    .select("commission_amount")
    .eq("affiliate_id", affiliateId)
    .gte("created_at", thirtyDaysAgo);

  const monthlyRevenue = (recentConversions ?? []).reduce((s, c) => s + Number(c.commission_amount), 0);

  // Check tier thresholds
  const { data: tiers } = await db.from("affiliate_tiers")
    .select("*")
    .order("min_active_referrals", { ascending: false });

  let newTier = "bronze";
  for (const tier of tiers ?? []) {
    if ((activeRefs ?? 0) >= tier.min_active_referrals && monthlyRevenue >= Number(tier.min_monthly_revenue)) {
      newTier = tier.tier;
      break;
    }
  }

  if (newTier !== aff.tier) {
    const oldTier = aff.tier;
    await db.from("affiliate_profiles").update({
      tier: newTier,
      active_referrals: activeRefs ?? 0,
      updated_at: new Date().toISOString(),
    }).eq("id", affiliateId);

    log(`Tier Upgrade: ${aff.user_id} von ${oldTier} → ${newTier}`);

    // INSTANT NOTIFICATION
    try {
      const { notifyTierUpgrade } = await import("./affiliate-notifications");
      const { data: profile } = await db.from("profiles")
        .select("email, full_name").eq("id", aff.user_id).single();
      const newRates = await getTierRates({ ...aff, tier: newTier });
      if (profile) {
        await notifyTierUpgrade(
          profile.email,
          profile.full_name ?? "Partner",
          oldTier,
          newTier,
          newRates.l1,
          activeRefs ?? 0
        );
      }
    } catch { /* Notification optional */ }
  }
}

// ══════════════════════════════════════════════════════════════
// REFERRAL STRUCTURE (3-Level Baum)
// ══════════════════════════════════════════════════════════════

export interface AffiliateNode {
  userId: string;
  name: string;
  email: string;
  tier: string;
  subscriptionActive: boolean;
  monthlyValue: number;
  commission: number;
  level: number;
  joinedAt: string;
  children: AffiliateNode[];
}

export async function getFullStructure(userId: string): Promise<{
  tree: AffiliateNode[];
  stats: { l1Count: number; l2Count: number; l3Count: number; totalActive: number; monthlyRevenue: number };
}> {
  const db = createSupabaseAdmin();

  async function buildLevel(parentId: string, level: number): Promise<AffiliateNode[]> {
    if (level > 3) return [];

    const { data: refs } = await db.from("profiles")
      .select("id, email, full_name, subscription_tier, subscription_active, created_at")
      .eq("referred_by", parentId);

    if (!refs?.length) return [];

    const nodes: AffiliateNode[] = [];
    for (const ref of refs) {
      const monthlyValue = TIER_PRICES[ref.subscription_tier] ?? 0;
      const children = await buildLevel(ref.id, level + 1);

      nodes.push({
        userId: ref.id,
        name: ref.full_name ?? ref.email.split("@")[0],
        email: ref.email,
        tier: ref.subscription_tier,
        subscriptionActive: ref.subscription_active,
        monthlyValue,
        commission: 0, // Calculated on frontend based on rates
        level,
        joinedAt: ref.created_at,
        children,
      });
    }

    return nodes;
  }

  const tree = await buildLevel(userId, 1);

  // Count stats
  let l1Count = 0, l2Count = 0, l3Count = 0, totalActive = 0, monthlyRevenue = 0;
  function countNodes(nodes: AffiliateNode[], lvl: number) {
    for (const n of nodes) {
      if (lvl === 1) l1Count++;
      else if (lvl === 2) l2Count++;
      else if (lvl === 3) l3Count++;
      if (n.subscriptionActive) { totalActive++; monthlyRevenue += n.monthlyValue; }
      countNodes(n.children, lvl + 1);
    }
  }
  countNodes(tree, 1);

  return { tree, stats: { l1Count, l2Count, l3Count, totalActive, monthlyRevenue } };
}

// ══════════════════════════════════════════════════════════════
// PAYOUTS
// ══════════════════════════════════════════════════════════════

export async function requestPayout(affiliateId: string, amount: number) {
  const db = createSupabaseAdmin();

  if (!amount || amount <= 0) throw new Error("Ungültiger Betrag");

  const { data: aff } = await db.from("affiliate_profiles").select("*").eq("id", affiliateId).single();
  if (!aff) throw new Error("Affiliate nicht gefunden");
  if (amount > Number(aff.current_balance)) throw new Error("Guthaben nicht ausreichend");
  if (Number(aff.current_balance) < amount) throw new Error(`Balance nur €${aff.current_balance}. Angefragt: €${amount}`);
  if (amount < Number(aff.minimum_payout)) throw new Error(`Minimum: €${aff.minimum_payout}`);
  if (!aff.payout_method) throw new Error("Keine Auszahlungsmethode hinterlegt");

  // Check for duplicate payout requests (within 60 seconds)
  const { data: recentPayout } = await db.from("affiliate_payouts")
    .select("id")
    .eq("affiliate_id", affiliateId)
    .eq("amount", amount)
    .in("status", ["pending", "processing"])
    .gte("created_at", new Date(Date.now() - 60_000).toISOString())
    .limit(1)
    .single();

  if (recentPayout) throw new Error("Auszahlung wird bereits verarbeitet. Bitte warte einen Moment.");

  // Step 1: Reserve balance FIRST (atomic decrement via re-read)
  const newBalance = Number(aff.current_balance) - amount;
  if (newBalance < 0) throw new Error("Insufficient balance");

  const { data: balanceUpdate, error: balanceError } = await db.from("affiliate_profiles").update({
    current_balance: newBalance,
    updated_at: new Date().toISOString(),
  }).eq("id", affiliateId).gte("current_balance", amount).select("id").single(); // Conditional update prevents negative

  if (balanceError || !balanceUpdate) {
    throw new Error("Balance konnte nicht reserviert werden — möglicherweise wurde sie zwischenzeitlich reduziert.");
  }

  // Step 2: Create payout record AFTER balance is reserved
  const { data: payout, error } = await db.from("affiliate_payouts").insert({
    affiliate_id: affiliateId,
    amount,
    method: aff.payout_method,
    payout_details: aff.payout_details,
    status: "pending",
  }).select().single();

  if (error) {
    // Rollback: refund balance if payout insert fails
    await db.from("affiliate_profiles").update({
      current_balance: Number(aff.current_balance),
      updated_at: new Date().toISOString(),
    }).eq("id", affiliateId);
    throw error;
  }

  log(`Payout angefragt: €${amount} von ${aff.user_id}`);
  return payout;
}

export async function processPayout(payoutId: string, action: "approve" | "reject", processedBy: string, rejectionReason?: string) {
  const db = createSupabaseAdmin();
  const { data: payout } = await db.from("affiliate_payouts").select("*").eq("id", payoutId).single();
  if (!payout) throw new Error("Payout nicht gefunden");

  if (action === "approve") {
    await db.from("affiliate_payouts").update({
      status: "completed",
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
    }).eq("id", payoutId);

    await db.from("affiliate_profiles").update({
      total_paid: Number((await db.from("affiliate_profiles").select("total_paid").eq("id", payout.affiliate_id).single()).data?.total_paid ?? 0) + Number(payout.amount),
    }).eq("id", payout.affiliate_id);
  } else {
    // Reject: refund to balance
    await db.from("affiliate_payouts").update({
      status: "rejected",
      rejection_reason: rejectionReason,
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
    }).eq("id", payoutId);

    const { data: aff2 } = await db.from("affiliate_profiles").select("current_balance").eq("id", payout.affiliate_id).single();
    await db.from("affiliate_profiles").update({
      current_balance: Number(aff2?.current_balance ?? 0) + Number(payout.amount),
    }).eq("id", payout.affiliate_id);
  }

  // NOTIFY AFFILIATE about payout result
  try {
    const { notifyPayoutProcessed } = await import("./affiliate-notifications");
    const { data: affProfile } = await db.from("affiliate_profiles")
      .select("user_id, payout_method, profiles(email, full_name)")
      .eq("id", payout.affiliate_id).single();
    if (affProfile) {
      await notifyPayoutProcessed(
        (affProfile.profiles as any)?.email,
        (affProfile.profiles as any)?.full_name ?? "Partner",
        Number(payout.amount),
        affProfile.payout_method ?? "usdt",
        action === "approve" ? "completed" : "rejected",
        rejectionReason
      );
    }
  } catch { /* Notification optional */ }
}

// ══════════════════════════════════════════════════════════════
// AFFILIATE DASHBOARD DATA
// ══════════════════════════════════════════════════════════════

export async function getAffiliateDashboard(userId: string) {
  const db = createSupabaseAdmin();

  const { data: aff } = await db.from("affiliate_profiles").select("*").eq("user_id", userId).single();
  if (!aff) return null;

  // Tier info
  const { data: tierInfo } = await db.from("affiliate_tiers").select("*").eq("tier", aff.tier).single();

  // Recent conversions
  const { data: recentConversions } = await db.from("affiliate_conversions")
    .select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }).limit(20);

  // Recent clicks (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: weekClicks } = await db.from("affiliate_clicks")
    .select("*", { count: "exact", head: true }).eq("affiliate_id", aff.id).gte("created_at", sevenDaysAgo);

  // Clicks per day (last 30 days)
  const { data: clicksByDay } = await db.from("affiliate_clicks")
    .select("created_at").eq("affiliate_id", aff.id)
    .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

  const clicksPerDay: Record<string, number> = {};
  for (const c of clicksByDay ?? []) {
    const day = c.created_at.split("T")[0];
    clicksPerDay[day] = (clicksPerDay[day] ?? 0) + 1;
  }

  // Pending payouts
  const { data: pendingPayouts } = await db.from("affiliate_payouts")
    .select("*").eq("affiliate_id", aff.id).eq("status", "pending");

  // Links
  const { data: links } = await db.from("affiliate_links")
    .select("*").eq("affiliate_id", aff.id).order("clicks", { ascending: false });

  // Structure
  const structure = await getFullStructure(userId);

  // Conversion rate
  const conversionRate = aff.total_clicks > 0
    ? ((aff.total_signups / aff.total_clicks) * 100).toFixed(1)
    : "0";

  return {
    profile: {
      status: aff.status,
      partnerType: aff.partner_type,
      tier: aff.tier,
      tierInfo,
      customSlug: aff.custom_slug,
    },
    stats: {
      totalClicks: aff.total_clicks,
      weekClicks: weekClicks ?? 0,
      totalSignups: aff.total_signups,
      totalConversions: aff.total_conversions,
      conversionRate,
      activeReferrals: aff.active_referrals,
      totalEarned: Number(aff.total_earned),
      totalPaid: Number(aff.total_paid),
      currentBalance: Number(aff.current_balance),
    },
    clicksPerDay,
    recentConversions: recentConversions ?? [],
    pendingPayouts: pendingPayouts ?? [],
    links: links ?? [],
    structure,
  };
}
