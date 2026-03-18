// ═══════════════════════════════════════════════════════════════
// src/lib/partner/report-generator.ts — Partner performance reports
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

interface PartnerReport {
  partnerId: string;
  period: "daily" | "weekly" | "monthly";
  from: string;
  to: string;
  commissions: number;
  fpEarned: number;
  newReferrals: number;
  conversions: number;
  networkSize: number;
  topReferrer: string | null;
}

async function buildReport(
  partnerId: string,
  period: "daily" | "weekly" | "monthly",
  days: number
): Promise<PartnerReport> {
  const now = new Date();
  const from = new Date(now.getTime() - days * 86400000).toISOString();
  const to = now.toISOString();

  const [commRes, fpRes, refRes, netRes] = await Promise.all([
    supabaseAdmin
      .from("commissions")
      .select("amount")
      .eq("partner_id", partnerId)
      .gte("created_at", from),
    supabaseAdmin
      .from("fp_transactions")
      .select("amount")
      .eq("user_id", partnerId)
      .gte("created_at", from),
    supabaseAdmin
      .from("referrals")
      .select("id, converted, referrer_name")
      .eq("partner_id", partnerId)
      .gte("created_at", from),
    supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact" })
      .eq("partner_id", partnerId),
  ]);

  const commissions = (commRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
  const fpEarned = (fpRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
  const referrals = refRes.data ?? [];
  const conversions = referrals.filter((r) => r.converted).length;

  return {
    partnerId,
    period,
    from,
    to,
    commissions,
    fpEarned,
    newReferrals: referrals.length,
    conversions,
    networkSize: netRes.count ?? 0,
    topReferrer: referrals[0]?.referrer_name ?? null,
  };
}

export async function generateDailyReport(partnerId: string): Promise<PartnerReport> {
  return buildReport(partnerId, "daily", 1);
}

export async function generateWeeklyReport(partnerId: string): Promise<PartnerReport> {
  return buildReport(partnerId, "weekly", 7);
}

export async function generateMonthlyReport(partnerId: string): Promise<PartnerReport> {
  return buildReport(partnerId, "monthly", 30);
}
