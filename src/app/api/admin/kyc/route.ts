export const dynamic = "force-dynamic";
// src/app/api/admin/kyc/route.ts — Admin: KYC submission management
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
    .from("kyc_submissions")
    .select("*, profiles!kyc_submissions_user_id_fkey(email, full_name)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: submissions, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get counts per status
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    db.from("kyc_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("kyc_submissions").select("id", { count: "exact", head: true }).eq("status", "approved"),
    db.from("kyc_submissions").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  return NextResponse.json({
    submissions: submissions ?? [],
    stats: {
      pending: pendingCount.count ?? 0,
      approved: approvedCount.count ?? 0,
      rejected: rejectedCount.count ?? 0,
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
  const { submission_id, action, reason } = body;

  if (!submission_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "submission_id and action (approve|reject) required" }, { status: 400 });
  }

  // Verify submission exists and is pending
  const { data: submission, error: fetchError } = await db
    .from("kyc_submissions")
    .select("*")
    .eq("id", submission_id)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json({ error: "KYC submission not found" }, { status: 404 });
  }
  if (submission.status !== "pending") {
    return NextResponse.json({ error: `Submission already ${submission.status}` }, { status: 409 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  const { data: updated, error: updateError } = await db
    .from("kyc_submissions")
    .update({
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: action === "reject" ? (reason ?? "Rejected by admin") : null,
    })
    .eq("id", submission_id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // If approved, update the user's profile kyc_verified flag
  if (action === "approve") {
    await db
      .from("profiles")
      .update({ kyc_verified: true, kyc_verified_at: new Date().toISOString() })
      .eq("id", submission.user_id);
  }

  return NextResponse.json({ success: true, submission: updated });
}
