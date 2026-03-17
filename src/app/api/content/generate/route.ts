// src/app/api/content/generate/route.ts
import { generateMorningBriefing, generateTradeResults, generateEducationalContent } from "@/lib/content/content-engine";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "morning_briefing";

  try {
    let content;
    if (type === "morning_briefing") content = await generateMorningBriefing();
    else if (type === "trade_results") content = await generateTradeResults();
    else if (type === "educational") content = await generateEducationalContent();
    else return NextResponse.json({ error: "Unknown type" }, { status: 400 });

    // TODO: Post to social media APIs (Instagram, X, TikTok)
    // For now, return generated content for manual review / queue
    return NextResponse.json({ success: true, content });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
