// src/app/api/affiliate/profile/route.ts
// Apply as affiliate + Get dashboard
import { createSupabaseServer } from "@/lib/supabase/server";
import { applyAsAffiliate, getAffiliateDashboard } from "@/lib/mlm/affiliate-engine";
import { NextResponse } from "next/server";

// GET — Full affiliate dashboard
export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dashboard = await getAffiliateDashboard(user.id);
  if (!dashboard) return NextResponse.json({ error: "Kein Affiliate-Profil. Bewirb dich unter POST /api/affiliate/profile" }, { status: 404 });

  return NextResponse.json(dashboard);
}

// POST — Apply as affiliate
export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { partnerType, payoutMethod, payoutDetails } = await request.json();
    const profile = await applyAsAffiliate(user.id, partnerType ?? "affiliate", payoutMethod ?? "usdt", payoutDetails ?? {});
    return NextResponse.json({ success: true, profile });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
