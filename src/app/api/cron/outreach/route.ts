// src/app/api/cron/outreach/route.ts
import { runDailyOutreach, generateDailyComparisonPage } from "@/lib/growth/outreach-agent";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [outreach, comparison] = await Promise.all([
      runDailyOutreach(),
      generateDailyComparisonPage(),
    ]);
    return NextResponse.json({ success: true, outreach, comparison });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
