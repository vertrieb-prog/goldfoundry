// src/app/api/sales/leaderboard/route.ts
import { getAffiliateLeaderboard } from "@/lib/sales/sales-director";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") ?? "month") as "week" | "month" | "alltime";

  const leaderboard = await getAffiliateLeaderboard(period);
  return NextResponse.json({ leaderboard, period });
}
