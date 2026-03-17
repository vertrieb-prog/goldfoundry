// src/app/api/seo/generate/route.ts
import { runDailySEOPipeline } from "@/lib/seo/seo-agent";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runDailySEOPipeline();
    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
