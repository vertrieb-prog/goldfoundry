export const dynamic = "force-dynamic";
// src/app/api/admin/accounts/route.ts — Admin: All accounts with signal mappings
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const db = createSupabaseAdmin();

  // Fetch all data in parallel
  const [accountsRes, mastersRes, profilesRes, sharingRes] = await Promise.all([
    db.from("slave_accounts").select("*").order("created_at", { ascending: false }),
    db.from("master_accounts").select("*").order("created_at", { ascending: false }),
    db.from("profiles").select("id, email, full_name, role, subscription_tier, subscription_active, created_at"),
    db.from("profit_sharing").select("*"),
  ]);

  return NextResponse.json({
    accounts: accountsRes.data ?? [],
    masters: mastersRes.data ?? [],
    profiles: profilesRes.data ?? [],
    sharing: sharingRes.data ?? [],
  });
}

// POST — Create master (signal) account
export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await request.json();
  const db = createSupabaseAdmin();

  if (body.type === "master") {
    // Create signal/master account
    const { data, error } = await db.from("master_accounts").insert({
      metaapi_account_id: body.metaapiAccountId,
      name: body.name,
      strategy_type: body.strategyType,
      instruments: body.instruments ?? ["XAUUSD", "US500"],
      description: body.description,
      active: true,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, account: data });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
