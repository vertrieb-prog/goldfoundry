import { NextResponse } from "next/server";
import { MQL5Collector } from "@/lib/data/collector";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const collector = new MQL5Collector({ maxSignals: 30, symbolFilter: "XAUUSD" });
    const result = await collector.run();
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
