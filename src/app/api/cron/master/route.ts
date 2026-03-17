export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const CRON_ROUTES = [
  "/api/cron/collect-mql5",
  "/api/cron/collect-myfxbook",
  "/api/cron/intelligence",
  "/api/cron/sentiment",
  "/api/cron/lead-scoring",
  "/api/cron/seo",
  "/api/cron/winback",
];

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const results: Record<string, any> = {};

    for (const route of CRON_ROUTES) {
      try {
        const resp = await fetch(`${baseUrl}${route}`, {
          headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
        });
        results[route] = { status: resp.status, ...(await resp.json().catch(() => ({}))) };
      } catch (err: any) {
        results[route] = { status: "error", message: err.message };
      }
    }

    const failed = Object.entries(results).filter(([, r]) => r.status !== 200 && !r.success);

    return NextResponse.json({
      success: true,
      total: CRON_ROUTES.length,
      failed: failed.length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
