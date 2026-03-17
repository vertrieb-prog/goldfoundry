export const dynamic = "force-dynamic";
// src/app/api/admin/overview/route.ts — Admin Dashboard Overview Stats
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const db = createSupabaseAdmin();

  const [users, accounts, masters, trades, settlements] = await Promise.all([
    db.from("profiles").select("id, subscription_tier, subscription_active, created_at"),
    db.from("slave_accounts").select("id, account_type, copier_active, current_equity, total_profit, created_at"),
    db.from("master_accounts").select("id, active, name"),
    db.from("trades").select("id", { count: "exact", head: true }),
    db.from("profit_settlements").select("platform_fee, trader_payout, status"),
  ]);

  const allUsers: any[] = users.data ?? [];
  const allAccounts: any[] = accounts.data ?? [];
  const allMasters: any[] = masters.data ?? [];

  const totalEquity = allAccounts.reduce((s: number, a: any) => s + Number(a.current_equity ?? 0), 0);
  const totalProfit = allAccounts.reduce((s: number, a: any) => s + Number(a.total_profit ?? 0), 0);
  const platformFees = (settlements.data ?? []).filter((s: any) => s.status === "completed").reduce((s: number, x: any) => s + Number(x.platform_fee ?? 0), 0);

  return NextResponse.json({
    users: {
      total: allUsers.length,
      paying: allUsers.filter(u => u.subscription_active).length,
      free: allUsers.filter(u => !u.subscription_active || u.subscription_tier === "free").length,
      thisMonth: allUsers.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 86400000)).length,
    },
    accounts: {
      total: allAccounts.length,
      copier: allAccounts.filter(a => a.account_type === "copier").length,
      tracking: allAccounts.filter(a => a.account_type === "tracking").length,
      copierActive: allAccounts.filter(a => a.copier_active).length,
    },
    masters: {
      total: allMasters.length,
      active: allMasters.filter(m => m.active).length,
      names: allMasters.map(m => m.name),
    },
    financials: {
      totalEquity: Math.round(totalEquity),
      totalProfit: Math.round(totalProfit),
      platformFees: Math.round(platformFees),
      totalTrades: trades.count ?? 0,
    },
  });
}
