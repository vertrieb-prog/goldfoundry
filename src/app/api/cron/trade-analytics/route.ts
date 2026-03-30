export const dynamic = "force-dynamic";
// src/app/api/cron/trade-analytics/route.ts
// Pre-compute Trade Analytics für alle User → Mentor liest nur Summary
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { generateAnalytics, formatAnalyticsForAI } from "@/lib/data/trade-analytics";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const results: Array<{ userId: string; trades: number; status: string }> = [];

  try {
    // All users with active accounts
    const { data: users } = await db.from("slave_accounts")
      .select("user_id")
      .eq("copier_active", true);

    const uniqueUsers = [...new Set((users || []).map(u => u.user_id as string))];

    for (const userId of uniqueUsers as string[]) {
      try {
        const analytics = await generateAnalytics(userId);
        const summary = formatAnalyticsForAI(analytics);

        // Store pre-computed summary
        await db.from("user_data").upsert({
          user_id: userId,
          category: "analytics",
          key: "trade_summary",
          value: { summary, data: analytics, generated_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,category,key" });

        results.push({ userId: userId.slice(0, 8), trades: analytics.totalTrades, status: "ok" });
      } catch (err) {
        results.push({ userId: userId.slice(0, 8), trades: 0, status: (err as Error).message.slice(0, 50) });
      }
    }

    return NextResponse.json({ success: true, users: results.length, results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
