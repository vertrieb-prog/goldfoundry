export const dynamic = "force-dynamic";
import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Load profile data from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, avatar_url, role, subscription_tier, subscription_active, referral_code, phone, onboarding_completed, trading_experience, trading_goal, created_at"
    )
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: profile?.role ?? "user",
      subscription_tier: profile?.subscription_tier ?? "free",
      subscription_active: profile?.subscription_active ?? false,
      referral_code: profile?.referral_code ?? null,
      phone: profile?.phone ?? null,
      onboarding_completed: profile?.onboarding_completed ?? false,
      trading_experience: profile?.trading_experience ?? null,
      trading_goal: profile?.trading_goal ?? null,
      created_at: profile?.created_at ?? user.created_at,
    },
  });
}
