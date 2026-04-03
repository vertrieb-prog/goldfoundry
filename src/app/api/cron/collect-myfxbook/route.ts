export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { MyFxBookScraper } from "@/lib/data/collector";
import { getPortfolio, refreshStaleAccounts } from "@/lib/myfxbook";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Step 1: Check for stale accounts via API and trigger refresh
    let refreshed = 0;
    try {
      const portfolio = await getPortfolio();
      // getPortfolio returns clean accounts — re-fetch raw to get lastUpdateDate
      // Use refreshStaleAccounts which handles the API update call
      refreshed = await refreshStaleAccounts(
        portfolio.accounts.map((a) => ({ id: a.id })),
        60 * 60 * 1000, // 1 hour threshold
      );
      if (refreshed > 0) {
        console.log(`[Cron] Refreshed ${refreshed} stale MyFXBook account(s)`);
      }
    } catch (err) {
      console.warn("[Cron] Stale-check failed, continuing with scrape:", err);
    }

    // Step 2: Run the scraper as before
    const scraper = new MyFxBookScraper({ dailyLimit: 150 });
    const result = await scraper.run();
    return NextResponse.json({ success: true, refreshed, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
