export const dynamic = "force-dynamic";
export const maxDuration = 300;
// ═══════════════════════════════════════════════════════════════
// CRON: Trigger All — Single endpoint for external cron services
// Runs telegram-signals → position-manager → equity-sync in sequence
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";

const CRONS = [
  "/api/cron/telegram-signals",
  "/api/cron/position-manager",
  "/api/cron/equity-sync",
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = new URL(request.url).origin;
  const results: Record<string, any> = {};

  for (const path of CRONS) {
    const label = path.split("/").pop()!;
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { authorization: `Bearer ${cronSecret}` },
        signal: AbortSignal.timeout(120000),
      });
      results[label] = { status: res.status, data: await res.json().catch(() => null) };
    } catch (e: any) {
      results[label] = { status: 0, error: e.message };
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() });
}
