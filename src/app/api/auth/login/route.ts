export const dynamic = "force-dynamic";
// src/app/api/auth/login/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // DEV MODE: Skip Supabase only in development when not configured
    if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ success: true, user: { id: 'dev-user', email }, devMode: true });
    }

    const supabase = createSupabaseServer();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
