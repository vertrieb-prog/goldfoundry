export const dynamic = "force-dynamic";
// src/app/api/profit-sharing/follower-view/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { getFollowerProfitView } from "@/lib/profit/profit-engine";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const view = await getFollowerProfitView(user.id);
  return NextResponse.json(view);
}
