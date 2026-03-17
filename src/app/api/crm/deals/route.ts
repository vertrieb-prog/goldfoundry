// src/app/api/crm/deals/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET — List deals (optionally by stage)
export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage");

  let query = db.from("crm_deals")
    .select("*, crm_contacts(email, full_name, tags, status)")
    .order("updated_at", { ascending: false });

  if (stage) query = query.eq("stage", stage);

  const { data } = await query;

  // Pipeline summary
  const { data: allDeals } = await db.from("crm_deals").select("stage, value");
  const pipeline = {
    new: { count: 0, value: 0 },
    contacted: { count: 0, value: 0 },
    demo: { count: 0, value: 0 },
    negotiation: { count: 0, value: 0 },
    won: { count: 0, value: 0 },
    lost: { count: 0, value: 0 },
  };
  for (const d of allDeals ?? []) {
    const s = d.stage as keyof typeof pipeline;
    if (pipeline[s]) {
      pipeline[s].count++;
      pipeline[s].value += Number(d.value ?? 0);
    }
  }

  return NextResponse.json({ deals: data ?? [], pipeline });
}

// POST — Create deal
export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const body = await request.json();

  const { data: deal, error } = await db.from("crm_deals").insert({
    contact_id: body.contactId,
    title: body.title,
    value: body.value ?? 0,
    stage: body.stage ?? "new",
    expected_close: body.expectedClose,
    assigned_to: body.assignedTo ?? user.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deal });
}

// PATCH — Update deal stage
export async function PATCH(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { dealId, stage, lostReason, ...updates } = await request.json();

  const updateData: any = { ...updates, stage, updated_at: new Date().toISOString() };
  if (stage === "lost" && lostReason) updateData.lost_reason = lostReason;

  const { data: deal, error } = await db.from("crm_deals")
    .update(updateData).eq("id", dealId).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deal });
}
