export const dynamic = "force-dynamic";
// src/app/api/admin/analytics/route.ts — Admin: Platform analytics & growth metrics
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

  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 86400000).toISOString();
  const prevPeriodStart = new Date(now.getTime() - days * 2 * 86400000).toISOString();

  const [
    totalUsersRes,
    newUsersRes,
    prevNewUsersRes,
    activePartnersRes,
    settlementsRes,
    prevSettlementsRes,
    referralsRes,
    prevReferralsRes,
    subscriptionsRes,
    accountsRes,
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", periodStart),
    db.from("profiles").select("id", { count: "exact", head: true })
      .gte("created_at", prevPeriodStart).lt("created_at", periodStart),
    db.from("profiles").select("id", { count: "exact", head: true })
      .in("role", ["partner", "admin"]),
    db.from("profit_settlements").select("platform_fee, trader_payout, status")
      .eq("status", "completed").gte("created_at", periodStart),
    db.from("profit_settlements").select("platform_fee")
      .eq("status", "completed").gte("created_at", prevPeriodStart).lt("created_at", periodStart),
    db.from("referrals").select("id", { count: "exact", head: true }).gte("created_at", periodStart),
    db.from("referrals").select("id", { count: "exact", head: true })
      .gte("created_at", prevPeriodStart).lt("created_at", periodStart),
    db.from("profiles").select("subscription_tier, subscription_active"),
    db.from("slave_accounts").select("id, copier_active, account_type"),
  ]);

  const currentRevenue = (settlementsRes.data ?? [])
    .reduce((s: number, r: any) => s + Number(r.platform_fee ?? 0), 0);
  const prevRevenue = (prevSettlementsRes.data ?? [])
    .reduce((s: number, r: any) => s + Number(r.platform_fee ?? 0), 0);

  const currentNewUsers = newUsersRes.count ?? 0;
  const prevNewUsers = prevNewUsersRes.count ?? 0;
  const currentReferrals = referralsRes.count ?? 0;
  const prevReferrals = prevReferralsRes.count ?? 0;

  const growthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  };

  const allSubs = subscriptionsRes.data ?? [];
  const payingUsers = allSubs.filter((u: any) => u.subscription_active && u.subscription_tier !== "free");
  const allAccounts = accountsRes.data ?? [];

  // Conversion rate: paying / total users
  const conversionRate = allSubs.length > 0
    ? Math.round((payingUsers.length / allSubs.length) * 10000) / 100
    : 0;

  // Copier activation rate
  const copierAccounts = allAccounts.filter((a: any) => a.account_type === "copier");
  const activeCopiers = copierAccounts.filter((a: any) => a.copier_active);
  const copierActivationRate = copierAccounts.length > 0
    ? Math.round((activeCopiers.length / copierAccounts.length) * 10000) / 100
    : 0;

  return NextResponse.json({
    period: { days, start: periodStart, end: now.toISOString() },
    revenue: {
      current: Math.round(currentRevenue * 100) / 100,
      previous: Math.round(prevRevenue * 100) / 100,
      growth: growthRate(currentRevenue, prevRevenue),
    },
    users: {
      total: totalUsersRes.count ?? 0,
      new_this_period: currentNewUsers,
      user_growth: growthRate(currentNewUsers, prevNewUsers),
      active_partners: activePartnersRes.count ?? 0,
    },
    conversions: {
      paying_users: payingUsers.length,
      conversion_rate: conversionRate,
      copier_activation_rate: copierActivationRate,
      tier_breakdown: {
        free: allSubs.filter((u: any) => !u.subscription_active || u.subscription_tier === "free").length,
        starter: allSubs.filter((u: any) => u.subscription_tier === "starter" && u.subscription_active).length,
        pro: allSubs.filter((u: any) => u.subscription_tier === "pro" && u.subscription_active).length,
        elite: allSubs.filter((u: any) => u.subscription_tier === "elite" && u.subscription_active).length,
      },
    },
    referrals: {
      current: currentReferrals,
      previous: prevReferrals,
      growth: growthRate(currentReferrals, prevReferrals),
    },
    accounts: {
      total: allAccounts.length,
      copier: copierAccounts.length,
      copier_active: activeCopiers.length,
      tracking: allAccounts.filter((a: any) => a.account_type === "tracking").length,
    },
  });
}
