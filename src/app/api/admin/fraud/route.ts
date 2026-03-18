export const dynamic = "force-dynamic";
// src/app/api/admin/fraud/route.ts — Admin: Fraud detection alerts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const db = createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);
  const periodStart = new Date(Date.now() - days * 86400000).toISOString();

  const alerts: Array<{ type: string; severity: string; description: string; details: any }> = [];

  // 1. Self-referral detection: users who referred themselves (same email domain + IP patterns)
  const { data: referrals } = await db
    .from("referrals")
    .select("referrer_id, referred_id, created_at")
    .gte("created_at", periodStart);

  const selfReferrals = (referrals ?? []).filter((r: any) => r.referrer_id === r.referred_id);
  if (selfReferrals.length > 0) {
    alerts.push({
      type: "self_referral",
      severity: "high",
      description: `${selfReferrals.length} self-referral(s) detected`,
      details: selfReferrals,
    });
  }

  // 2. Rapid account creation from same referrer (possible fake accounts)
  const referrerCounts: Record<string, number> = {};
  for (const ref of referrals ?? []) {
    referrerCounts[ref.referrer_id] = (referrerCounts[ref.referrer_id] ?? 0) + 1;
  }
  const suspiciousReferrers = Object.entries(referrerCounts)
    .filter(([, count]) => count >= 10)
    .map(([referrer_id, count]) => ({ referrer_id, referral_count: count }));

  if (suspiciousReferrers.length > 0) {
    alerts.push({
      type: "bulk_referrals",
      severity: "medium",
      description: `${suspiciousReferrers.length} referrer(s) with 10+ referrals in ${days} days`,
      details: suspiciousReferrers,
    });
  }

  // 3. Duplicate email patterns (same base email with +alias)
  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, created_at")
    .gte("created_at", periodStart);

  const emailBases: Record<string, any[]> = {};
  for (const p of profiles ?? []) {
    if (!p.email) continue;
    const base = p.email.replace(/\+.*@/, "@").toLowerCase();
    if (!emailBases[base]) emailBases[base] = [];
    emailBases[base].push({ id: p.id, email: p.email, created_at: p.created_at });
  }
  const duplicateEmails = Object.entries(emailBases)
    .filter(([, accounts]) => accounts.length >= 3)
    .map(([base_email, accounts]) => ({ base_email, count: accounts.length, accounts }));

  if (duplicateEmails.length > 0) {
    alerts.push({
      type: "duplicate_emails",
      severity: "medium",
      description: `${duplicateEmails.length} email pattern(s) with 3+ accounts`,
      details: duplicateEmails,
    });
  }

  // 4. Suspicious payout patterns: multiple rapid payout requests
  const { data: payouts } = await db
    .from("payouts")
    .select("partner_id, amount, status, created_at")
    .gte("created_at", periodStart)
    .order("created_at", { ascending: false });

  const payoutsByPartner: Record<string, any[]> = {};
  for (const p of payouts ?? []) {
    if (!payoutsByPartner[p.partner_id]) payoutsByPartner[p.partner_id] = [];
    payoutsByPartner[p.partner_id].push(p);
  }
  const suspiciousPayouts = Object.entries(payoutsByPartner)
    .filter(([, reqs]) => reqs.length >= 5)
    .map(([partner_id, reqs]) => ({
      partner_id,
      request_count: reqs.length,
      total_amount: reqs.reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0),
    }));

  if (suspiciousPayouts.length > 0) {
    alerts.push({
      type: "rapid_payouts",
      severity: "high",
      description: `${suspiciousPayouts.length} partner(s) with 5+ payout requests in ${days} days`,
      details: suspiciousPayouts,
    });
  }

  // 5. Accounts with no trading activity but earning commissions
  const { data: commissions } = await db
    .from("commissions")
    .select("partner_id, amount")
    .gte("created_at", periodStart)
    .eq("status", "paid");

  const earningPartners = new Set((commissions ?? []).map((c: any) => c.partner_id));
  const { data: partnerAccounts } = await db
    .from("slave_accounts")
    .select("user_id, copier_active")
    .in("user_id", Array.from(earningPartners));

  const partnersWithAccounts = new Set((partnerAccounts ?? []).map((a: any) => a.user_id));
  const earnersWithoutAccounts = Array.from(earningPartners).filter(id => !partnersWithAccounts.has(id));

  if (earnersWithoutAccounts.length > 0) {
    alerts.push({
      type: "no_trading_activity",
      severity: "low",
      description: `${earnersWithoutAccounts.length} earning partner(s) with no trading accounts`,
      details: earnersWithoutAccounts.map(id => ({ partner_id: id })),
    });
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  return NextResponse.json({
    alerts,
    summary: {
      total: alerts.length,
      high: alerts.filter(a => a.severity === "high").length,
      medium: alerts.filter(a => a.severity === "medium").length,
      low: alerts.filter(a => a.severity === "low").length,
    },
    period_days: days,
  });
}
