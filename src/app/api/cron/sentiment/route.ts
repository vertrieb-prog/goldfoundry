import { NextResponse } from "next/server";
import { MyFxBookScraper } from "@/lib/data/collector";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const scraper = new MyFxBookScraper();
    const outlook = await scraper.getCommunityOutlook();
    return NextResponse.json({ success: true, outlook });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
