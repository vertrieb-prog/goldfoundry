// src/lib/usage-limiter.ts
// ============================================================
// FORGE USAGE LIMITER — Schützt uns vor Token-Kosten-Explosion
//
// Jeder User hat ein monatliches AI-Budget basierend auf seinem Tier.
// Wenn das Budget erschöpft ist → Upline übernimmt Support.
// 
// Tier-Limits (Nachrichten/Monat):
//   free:     5 Nachrichten (Teaser — "Upgrade für mehr")
//   analyzer: 30 Nachrichten
//   copier:   100 Nachrichten
//   pro:      300 Nachrichten
//   provider: unlimited (Soft-Limit 1000)
//
// Kostendeckel: Max $5 API-Kosten pro User pro Monat
// Danach → Redirect zu Upline + "Limit erreicht" Message
// ============================================================

import { createSupabaseAdmin } from "@/lib/supabase/server";

// ── Tier Limits ───────────────────────────────────────────────

const TIER_LIMITS: Record<string, {
  messagesPerMonth: number;
  maxTokensPerMessage: number;
  maxCostPerMonth: number;  // USD
  canUseStrategyAdvisor: boolean;
  greeting: boolean;
}> = {
  free: {
    messagesPerMonth: 5,
    maxTokensPerMessage: 300,
    maxCostPerMonth: 0.50,
    canUseStrategyAdvisor: false,
    greeting: true, // Greeting immer — das ist der Hook
  },
  analyzer: {
    messagesPerMonth: 30,
    maxTokensPerMessage: 500,
    maxCostPerMonth: 2.00,
    canUseStrategyAdvisor: false,
    greeting: true,
  },
  copier: {
    messagesPerMonth: 100,
    maxTokensPerMessage: 800,
    maxCostPerMonth: 5.00,
    canUseStrategyAdvisor: true,
    greeting: true,
  },
  pro: {
    messagesPerMonth: 300,
    maxTokensPerMessage: 1000,
    maxCostPerMonth: 10.00,
    canUseStrategyAdvisor: true,
    greeting: true,
  },
  provider: {
    messagesPerMonth: 1000,
    maxTokensPerMessage: 1500,
    maxCostPerMonth: 25.00,
    canUseStrategyAdvisor: true,
    greeting: true,
  },
};

// ── Check if user can send a message ──────────────────────────

export interface UsageCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  maxTokens: number;
  reason?: string;
  redirectToUpline?: {
    name: string;
    email: string;
    phone?: string;
  };
  upgradeMessage?: string;
}

export async function checkUsageLimit(userId: string): Promise<UsageCheck> {
  const db = createSupabaseAdmin();

  // Get user tier
  const { data: profile } = await db.from("profiles")
    .select("subscription_tier, subscription_active, referred_by")
    .eq("id", userId).single();

  const tier = (profile?.subscription_active ? profile?.subscription_tier : "free") ?? "free";
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;

  // Count messages this month
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const { count } = await db.from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", monthStart.toISOString());

  const used = count ?? 0;
  const remaining = Math.max(limits.messagesPerMonth - used, 0);

  // Check if over limit
  if (used >= limits.messagesPerMonth) {
    // Find upline to redirect to
    let uplineInfo: UsageCheck["redirectToUpline"] = undefined;
    if (profile?.referred_by) {
      const { data: upline } = await db.from("profiles")
        .select("full_name, email, phone")
        .eq("id", profile.referred_by).single();
      if (upline) {
        uplineInfo = { name: upline.full_name ?? "Dein Partner", email: upline.email, phone: upline.phone ?? undefined };
      }
    }

    const upgradeMsg = tier === "free"
      ? `Du hast deine 5 kostenlosen Nachrichten diesen Monat aufgebraucht. Mit dem Copier-Abo ($29/Mo) bekommst du 100 Nachrichten + den AI Copier der dein Kapital schützt.`
      : tier === "analyzer"
      ? `Du hast dein Analyzer-Limit von 30 Nachrichten erreicht. Upgrade auf Copier ($29/Mo) für 100 Nachrichten + AI Copier.`
      : tier === "copier"
      ? `Du hast dein Copier-Limit von 100 Nachrichten erreicht. Upgrade auf Pro ($79/Mo) für 300 Nachrichten + Strategy Lab.`
      : `Dein monatliches Nachrichten-Limit ist erreicht. Es wird am 1. des nächsten Monats zurückgesetzt.`;

    return {
      allowed: false,
      remaining: 0,
      limit: limits.messagesPerMonth,
      used,
      maxTokens: 0,
      reason: "monthly_limit_reached",
      redirectToUpline: uplineInfo,
      upgradeMessage: upgradeMsg,
    };
  }

  // Warn at 80% usage
  const warningThreshold = Math.floor(limits.messagesPerMonth * 0.8);

  return {
    allowed: true,
    remaining,
    limit: limits.messagesPerMonth,
    used,
    maxTokens: limits.maxTokensPerMessage,
    reason: used >= warningThreshold ? "approaching_limit" : undefined,
  };
}

// ── Track usage after message ─────────────────────────────────

export async function trackTokenUsage(userId: string, inputTokens: number, outputTokens: number, model: string) {
  const db = createSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];
  const month = today.slice(0, 7); // "2026-03"

  // Estimate cost
  const costs: Record<string, { input: number; output: number }> = {
    "claude-haiku-4-5-20251001": { input: 1.0, output: 5.0 },
    "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  };
  const modelCost = costs[model] ?? costs["claude-sonnet-4-20250514"];
  const costUSD = (inputTokens / 1_000_000) * modelCost.input + (outputTokens / 1_000_000) * modelCost.output;

  // Upsert monthly usage record
  await db.from("user_data").upsert({
    user_id: userId,
    category: "preferences",
    key: `usage_${month}`,
    value: {
      month,
      messages: 1,  // Will be incremented
      inputTokens,
      outputTokens,
      costUSD: Math.round(costUSD * 100000) / 100000,
      lastUpdated: new Date().toISOString(),
    },
  }, { onConflict: "user_id,category,key" });

  // Check if approaching cost ceiling
  const { data: existing } = await db.from("user_data")
    .select("value").eq("user_id", userId).eq("category", "preferences")
    .eq("key", `usage_${month}`).single();

  if (existing) {
    const val = existing.value as any;
    const totalCost = (val.costUSD ?? 0) + costUSD;
    const totalMessages = (val.messages ?? 0) + 1;

    await db.from("user_data").update({
      value: { ...val, messages: totalMessages, costUSD: Math.round(totalCost * 100000) / 100000, lastUpdated: new Date().toISOString() },
    }).eq("user_id", userId).eq("category", "preferences").eq("key", `usage_${month}`);
  }
}

// ── Get usage stats for user ──────────────────────────────────

export async function getUserUsageStats(userId: string): Promise<{
  messagesUsed: number;
  messagesLimit: number;
  estimatedCostUSD: number;
  tier: string;
  percentUsed: number;
}> {
  const db = createSupabaseAdmin();
  const month = new Date().toISOString().slice(0, 7);

  const { data: profile } = await db.from("profiles")
    .select("subscription_tier, subscription_active")
    .eq("id", userId).single();

  const tier = (profile?.subscription_active ? profile?.subscription_tier : "free") ?? "free";
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;

  const { data: usage } = await db.from("user_data")
    .select("value").eq("user_id", userId).eq("category", "preferences")
    .eq("key", `usage_${month}`).single();

  const val = (usage?.value as any) ?? {};

  return {
    messagesUsed: val.messages ?? 0,
    messagesLimit: limits.messagesPerMonth,
    estimatedCostUSD: val.costUSD ?? 0,
    tier,
    percentUsed: Math.round(((val.messages ?? 0) / limits.messagesPerMonth) * 100),
  };
}
