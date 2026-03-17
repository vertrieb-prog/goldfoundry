export const dynamic = "force-dynamic";
// src/app/api/crm/dashboard/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCRMDashboard } from "@/lib/crm/crm-engine";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  try {
    const dashboard = await getCRMDashboard();
    return NextResponse.json(dashboard);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
