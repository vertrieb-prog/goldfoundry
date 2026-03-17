// src/app/api/strategy/propose/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateStrategyProposal, scheduleAutoDemo } from "@/lib/strategy/auto-advisor";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const proposal = await generateStrategyProposal(user.id);
    const { autoDemo } = await request.json().catch(() => ({ autoDemo: false }));

    let demoTestId: string | null = null;
    if (autoDemo) {
      demoTestId = await scheduleAutoDemo(user.id, proposal);
    }

    return NextResponse.json({ success: true, proposal, demoTestId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
