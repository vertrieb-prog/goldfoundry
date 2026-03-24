export const dynamic = "force-dynamic";
// src/app/api/admin/overview/route.ts — Admin Dashboard Stats (comprehensive)
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const db = createSupabaseAdmin();
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86400000).toISOString();
  const monthAgo = new Date(now - 30 * 86400000).toISOString();

  // Parallel queries — each wrapped in safeQuery
  const [users, accounts, masters, tradesCount, settlements, telegramSignals,
    telegramChannels, copierLogs, payments, affiliateProfiles, funnelLeads,
    forgePoints, recentUsers, recentSignals] = await Promise.all([
    safeQuery(() => db.from("profiles").select("id, email, subscription_tier, subscription_active, created_at"), { data: [] }),
    safeQuery(() => db.from("slave_accounts").select("id, user_id, account_name, account_type, copier_active, current_equity, total_profit, total_trades, broker_name, platform, mt_login, firm_profile, last_sync, win_rate, created_at"), { data: [] }),
    safeQuery(() => db.from("master_accounts").select("id, active, name"), { data: [] }),
    safeQuery(() => db.from("trades").select("id", { count: "exact", head: true }), { count: 0 }),
    safeQuery(() => db.from("profit_settlements").select("platform_fee, trader_payout, status, gross_profit"), { data: [] }),
    safeQuery(() => db.from("telegram_signals").select("id, channel_id, status, parsed, created_at").order("created_at", { ascending: false }).limit(500), { data: [] }),
    safeQuery(() => db.from("telegram_active_channels").select("id, channel_name, channel_id, status, signals_received, signals_executed"), { data: [] }),
    safeQuery(() => db.from("copier_log").select("action, created_at", { count: "exact", head: true }), { count: 0 }),
    safeQuery(() => db.from("crypto_payments").select("id, amount_usd, status, plan, created_at"), { data: [] }),
    safeQuery(() => db.from("affiliate_profiles").select("id, status, tier, total_earned, active_referrals"), { data: [] }),
    safeQuery(() => db.from("funnel_leads").select("id, status, created_at"), { data: [] }),
    safeQuery(() => db.from("forge_points").select("user_id, balance, total_earned"), { data: [] }),
    safeQuery(() => db.from("profiles").select("id, email, full_name, created_at, subscription_tier").order("created_at", { ascending: false }).limit(10), { data: [] }),
    safeQuery(() => db.from("telegram_signals").select("id, channel_id, status, parsed, created_at").order("created_at", { ascending: false }).limit(10), { data: [] }),
  ]);

  const allUsers: any[] = users.data ?? [];
  const allAccounts: any[] = accounts.data ?? [];
  const allMasters: any[] = masters.data ?? [];
  const allSignals: any[] = telegramSignals.data ?? [];
  const allChannels: any[] = telegramChannels.data ?? [];
  const allPayments: any[] = payments.data ?? [];
  const allSettlements: any[] = settlements.data ?? [];
  const allAffiliates: any[] = affiliateProfiles.data ?? [];
  const allLeads: any[] = funnelLeads.data ?? [];
  const allFP: any[] = forgePoints.data ?? [];

  // ── User stats
  const usersWithAccounts = new Set(allAccounts.map(a => a.user_id)).size;
  const conversionRate = allUsers.length > 0 ? Math.round((usersWithAccounts / allUsers.length) * 100) : 0;

  // ── Broker distribution
  const brokerMap: Record<string, number> = {};
  const platformMap: Record<string, number> = {};
  allAccounts.forEach((a: any) => {
    const b = a.broker_name || a.firm_profile || "Unknown";
    brokerMap[b] = (brokerMap[b] || 0) + 1;
    const p = (a.platform || "mt5").toUpperCase();
    platformMap[p] = (platformMap[p] || 0) + 1;
  });

  // ── Telegram signal stats
  const signalsByStatus: Record<string, number> = {};
  allSignals.forEach((s: any) => { signalsByStatus[s.status] = (signalsByStatus[s.status] || 0) + 1; });

  const channelSignals: Record<string, number> = {};
  allSignals.forEach((s: any) => { channelSignals[s.channel_id] = (channelSignals[s.channel_id] || 0) + 1; });
  const topChannels = Object.entries(channelSignals)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, count]) => {
      const ch = allChannels.find((c: any) => c.channel_id === id);
      return { name: ch?.channel_name || id, count };
    });

  // ── Revenue
  const completedPayments = allPayments.filter((p: any) => p.status === "completed");
  const totalRevenue = completedPayments.reduce((s: number, p: any) => s + Number(p.amount_usd || 0), 0);
  const platformFees = allSettlements.filter((s: any) => s.status === "completed")
    .reduce((s: number, x: any) => s + Number(x.platform_fee ?? 0), 0);

  // ── Equity & profit
  const totalEquity = allAccounts.reduce((s: number, a: any) => s + Number(a.current_equity ?? 0), 0);
  const totalProfit = allAccounts.reduce((s: number, a: any) => s + Number(a.total_profit ?? 0), 0);

  // ── Account details (for table)
  const accountDetails = allAccounts.slice(0, 50).map((a: any) => {
    const u = allUsers.find((u: any) => u.id === a.user_id);
    return {
      email: u?.email || "—", accountName: a.account_name || a.firm_profile,
      broker: a.broker_name || a.firm_profile, login: a.mt_login,
      platform: a.platform, equity: Number(a.current_equity ?? 0),
      profit: Number(a.total_profit ?? 0), trades: a.total_trades ?? 0,
      winRate: Number(a.win_rate ?? 0), copierActive: a.copier_active,
      type: a.account_type, lastSync: a.last_sync,
    };
  });

  return NextResponse.json({
    users: {
      total: allUsers.length,
      paying: allUsers.filter(u => u.subscription_active).length,
      free: allUsers.filter(u => !u.subscription_active).length,
      thisWeek: allUsers.filter(u => u.created_at > weekAgo).length,
      thisMonth: allUsers.filter(u => u.created_at > monthAgo).length,
      conversionRate,
      tiers: { free: allUsers.filter(u => u.subscription_tier === "free").length,
        copier: allUsers.filter(u => u.subscription_tier === "copier").length,
        pro: allUsers.filter(u => u.subscription_tier === "pro").length },
    },
    accounts: {
      total: allAccounts.length, copier: allAccounts.filter(a => a.account_type === "copier").length,
      tracking: allAccounts.filter(a => a.account_type === "tracking").length,
      copierActive: allAccounts.filter(a => a.copier_active).length,
    },
    masters: { total: allMasters.length, active: allMasters.filter(m => m.active).length, names: allMasters.map(m => m.name) },
    financials: {
      totalEquity: Math.round(totalEquity), totalProfit: Math.round(totalProfit),
      platformFees: Math.round(platformFees), totalRevenue: Math.round(totalRevenue),
      totalTrades: tradesCount.count ?? 0,
    },
    brokers: brokerMap, platforms: platformMap,
    telegram: {
      totalSignals: allSignals.length, byStatus: signalsByStatus,
      topChannels, activeChannels: allChannels.filter((c: any) => c.status === "active").length,
      totalChannels: allChannels.length,
    },
    affiliates: {
      total: allAffiliates.length, approved: allAffiliates.filter(a => a.status === "approved").length,
      totalEarned: allAffiliates.reduce((s: number, a: any) => s + Number(a.total_earned ?? 0), 0),
    },
    funnel: {
      total: allLeads.length, converted: allLeads.filter(l => l.status === "converted").length,
      thisMonth: allLeads.filter(l => l.created_at > monthAgo).length,
    },
    forgePoints: {
      totalBalance: allFP.reduce((s: number, f: any) => s + Number(f.balance ?? 0), 0),
      totalEarned: allFP.reduce((s: number, f: any) => s + Number(f.total_earned ?? 0), 0),
      holders: allFP.length,
    },
    accountDetails,
    recentUsers: (recentUsers.data ?? []).map((u: any) => ({
      email: u.email, name: u.full_name, tier: u.subscription_tier, created: u.created_at,
    })),
    recentSignals: (recentSignals.data ?? []).map((s: any) => ({
      channel: s.channel_id, status: s.status, symbol: s.parsed?.symbol, created: s.created_at,
    })),
  });
}
