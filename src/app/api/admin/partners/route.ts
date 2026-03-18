export const dynamic = "force-dynamic";
// src/app/api/admin/partners/route.ts — Admin: List all partners with stats
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
  const rank = searchParams.get("rank");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sort") ?? "created_at";
  const order = searchParams.get("order") === "asc" ? true : false;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = (page - 1) * limit;

  // Fetch partners (profiles with partner role or affiliate data)
  let partnersQuery = db
    .from("profiles")
    .select("id, email, full_name, role, partner_rank, fp_balance, created_at, avatar_url, subscription_tier")
    .in("role", ["partner", "admin"])
    .order(sortBy, { ascending: order })
    .range(offset, offset + limit - 1);

  if (rank) {
    partnersQuery = partnersQuery.eq("partner_rank", rank);
  }
  if (search) {
    partnersQuery = partnersQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: partners, error: partnersError } = await partnersQuery;
  if (partnersError) return NextResponse.json({ error: partnersError.message }, { status: 500 });

  const partnerIds = (partners ?? []).map((p: any) => p.id);
  if (partnerIds.length === 0) {
    return NextResponse.json({ partners: [], total: 0 });
  }

  // Fetch related stats in parallel
  const [referralsRes, commissionsRes, payoutsRes] = await Promise.all([
    db.from("referrals").select("referrer_id, referred_id, created_at").in("referrer_id", partnerIds),
    db.from("commissions").select("partner_id, amount, created_at, status").in("partner_id", partnerIds),
    db.from("payouts").select("partner_id, amount, status").in("partner_id", partnerIds),
  ]);

  const referrals = referralsRes.data ?? [];
  const commissions = commissionsRes.data ?? [];
  const payouts = payoutsRes.data ?? [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const enriched = (partners ?? []).map((p: any) => {
    const myReferrals = referrals.filter((r: any) => r.referrer_id === p.id);
    const myCommissions = commissions.filter((c: any) => c.partner_id === p.id);
    const monthlyCommissions = myCommissions.filter(
      (c: any) => new Date(c.created_at) >= monthStart && c.status === "paid"
    );
    const monthlyRevenue = monthlyCommissions.reduce((s: number, c: any) => s + Number(c.amount ?? 0), 0);
    const totalEarned = myCommissions
      .filter((c: any) => c.status === "paid")
      .reduce((s: number, c: any) => s + Number(c.amount ?? 0), 0);

    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      rank: p.partner_rank ?? "starter",
      fp_balance: p.fp_balance ?? 0,
      subscription_tier: p.subscription_tier,
      network_size: myReferrals.length,
      monthly_revenue: Math.round(monthlyRevenue * 100) / 100,
      total_earned: Math.round(totalEarned * 100) / 100,
      total_payouts: payouts.filter((po: any) => po.partner_id === p.id).length,
      joined: p.created_at,
    };
  });

  return NextResponse.json({ partners: enriched, total: enriched.length, page, limit });
}
