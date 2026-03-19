import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email erforderlich" }, { status: 400 });

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://goldfoundry.de"}/auth/reset-password`,
    });

    if (error) {
      console.error("[AUTH] Reset error:", error.message);
      // Don't reveal if email exists
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
