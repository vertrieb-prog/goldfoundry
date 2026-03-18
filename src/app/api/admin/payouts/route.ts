export const dynamic = "force-dynamic";
// src/app/api/admin/payouts/route.ts — Admin: List & manage payouts
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
  const status = searchParams.get("status"); // pending | approved | rejected
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = (page - 1) * limit;

  let query = db
    .from("payouts")
    .select("*, profiles!payouts_partner_id_fkey(email, full_name, partner_rank)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: payouts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate stats
  const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
    db.from("payouts").select("amount", { count: "exact" }).eq("status", "pending"),
    db.from("payouts").select("amount", { count: "exact" }).eq("status", "approved"),
    db.from("payouts").select("amount", { count: "exact" }).eq("status", "rejected"),
  ]);

  const sumAmounts = (rows: any[]) => rows.reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);

  return NextResponse.json({
    payouts: payouts ?? [],
    stats: {
      pending: { count: pendingRes.count ?? 0, total: Math.round(sumAmounts(pendingRes.data ?? []) * 100) / 100 },
      approved: { count: approvedRes.count ?? 0, total: Math.round(sumAmounts(approvedRes.data ?? []) * 100) / 100 },
      rejected: { count: rejectedRes.count ?? 0, total: Math.round(sumAmounts(rejectedRes.data ?? []) * 100) / 100 },
    },
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const db = createSupabaseAdmin();
  const body = await request.json();
  const { payout_id, action, reason } = body;

  if (!payout_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "payout_id and action (approve|reject) required" }, { status: 400 });
  }

  // Verify payout exists and is pending
  const { data: payout, error: fetchError } = await db
    .from("payouts")
    .select("*")
    .eq("id", payout_id)
    .single();

  if (fetchError || !payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }
  if (payout.status !== "pending") {
    return NextResponse.json({ error: `Payout already ${payout.status}` }, { status: 409 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const { data: updated, error: updateError } = await db
    .from("payouts")
    .update({
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: action === "reject" ? (reason ?? "Rejected by admin") : null,
    })
    .eq("id", payout_id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // If approved, deduct FP from partner balance
  if (action === "approve" && payout.fp_amount) {
    await db.rpc("deduct_fp", { p_user_id: payout.partner_id, p_amount: payout.fp_amount });
  }

  return NextResponse.json({ success: true, payout: updated });
}
