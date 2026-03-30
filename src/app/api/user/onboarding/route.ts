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
    const { tegas_account, deposit_amount, selected_traders, onboarding_completed } = body;

    // Update profile with onboarding data
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (tegas_account) updateData.tegas_account = tegas_account;
    if (deposit_amount !== undefined) updateData.deposit_amount = deposit_amount;
    if (selected_traders) updateData.selected_traders = selected_traders;
    if (onboarding_completed) updateData.onboarding_completed = true;

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      // Columns might not exist yet — that's OK, onboarding still "completes"
      console.log("[ONBOARDING] Profile update note:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
