export const dynamic = "force-dynamic";
// src/app/api/affiliate/payouts/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { requestPayout, processPayout } from "@/lib/mlm/affiliate-engine";
import { NextResponse } from "next/server";

// GET — List my payouts
export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { data: aff } = await db.from("affiliate_profiles").select("id, current_balance, total_paid, total_earned, minimum_payout, payout_method")
    .eq("user_id", user.id).single();
  if (!aff) return NextResponse.json({ error: "Kein Affiliate" }, { status: 404 });

  const { data: payouts } = await db.from("affiliate_payouts").select("*")
    .eq("affiliate_id", aff.id).order("created_at", { ascending: false });

  return NextResponse.json({
    balance: Number(aff.current_balance),
    totalEarned: Number(aff.total_earned),
    totalPaid: Number(aff.total_paid),
    minimumPayout: Number(aff.minimum_payout),
    payoutMethod: aff.payout_method,
    payouts: payouts ?? [],
  });
}

// POST — Request a payout
export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { data: aff } = await db.from("affiliate_profiles").select("id").eq("user_id", user.id).single();
  if (!aff) return NextResponse.json({ error: "Kein Affiliate" }, { status: 404 });

  try {
    const { amount } = await request.json();
    const payout = await requestPayout(aff.id, amount);
    return NextResponse.json({ success: true, payout });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

// PATCH — Admin: approve or reject payout
export async function PATCH(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const { payoutId, action, rejectionReason } = await request.json();
    await processPayout(payoutId, action, user.id, rejectionReason);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
