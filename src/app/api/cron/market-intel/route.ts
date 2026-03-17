export const dynamic = "force-dynamic";
// src/app/api/cron/market-intel/route.ts
import { runIntelUpdate } from "@/lib/intel/market-intel";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signal = await runIntelUpdate();
    return NextResponse.json({ success: true, signal });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
