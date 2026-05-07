import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const db = createSupabaseAdmin();
  const { data: profile, error } = await db
    .from("profiles")
    .select("full_name, avatar_url, username")
    .eq("username", username)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
