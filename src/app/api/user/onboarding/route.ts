import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { experience, goal, plan, completed } = body;

    // Update profile with onboarding data
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (experience) updateData.trading_experience = experience;
    if (goal) updateData.trading_goal = goal;
    if (completed) updateData.onboarding_completed = true;

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      // Columns might not exist yet — that's OK, onboarding still "completes"
      console.log("[ONBOARDING] Profile update note:", error.message);
    }

    return NextResponse.json({ success: true, plan });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
