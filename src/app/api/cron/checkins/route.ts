export const dynamic = "force-dynamic";
// src/app/api/cron/checkins/route.ts
import { generateProactiveCheckIns } from "@/lib/forge-ai-mentor";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const checkIns = await generateProactiveCheckIns();
    return NextResponse.json({ success: true, count: checkIns.length, checkIns });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
