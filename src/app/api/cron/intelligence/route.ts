export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { IntelligenceEngine } from "@/lib/data/intelligence";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const engine = new IntelligenceEngine();
    const intel = await engine.generate();
    return NextResponse.json({
      success: true,
      dataPoints: intel.dataPoints,
      patterns: intel.topPatterns.length,
      traders: intel.traderRankings.length,
      regime: intel.regime.regime,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
