// src/app/api/cron/competitive-scan/route.ts
import { runCompetitiveScan } from "@/lib/intel/competitive-agent";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const report = await runCompetitiveScan();
    return NextResponse.json({ success: true, report });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
