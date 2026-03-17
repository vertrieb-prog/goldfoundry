export const dynamic = "force-dynamic";
// src/app/api/cron/profit-settlement/route.ts
import { runMonthlySettlement } from "@/lib/profit/profit-engine";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runMonthlySettlement();
    return NextResponse.json({ success: true, ...results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
