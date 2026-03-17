export const dynamic = "force-dynamic";
// src/app/api/auth/logout/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createSupabaseServer();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
