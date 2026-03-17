import { NextResponse } from "next/server";
import { MyFxBookScraper } from "@/lib/data/collector";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const scraper = new MyFxBookScraper({ dailyLimit: 150 });
    const result = await scraper.run();
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
