export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { discoverNiches } from "@/lib/subdomain/niche-agent";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await discoverNiches();
    console.log("[SUBDOMAIN-AGENT]", JSON.stringify(result));
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[SUBDOMAIN-AGENT] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
