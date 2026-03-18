export const dynamic = "force-dynamic";
// src/app/api/copier/start-engine/route.ts
// Called by Vercel Cron or admin to start the FORGE COPY engine
import { NextResponse } from "next/server";

let engineRunning = false;

export async function GET(req: Request) {
  // Auth: Only via CRON_SECRET or admin
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (engineRunning) {
    return NextResponse.json({ status: "already_running", message: "FORGE COPY Engine läuft bereits." });
  }

  try {
    const { startForgeCopy } = await import("@/lib/copier/forge-copy");
    // Start async — don't await (long-running process)
    startForgeCopy().then(() => {
      console.log("[COPIER-ENGINE] startForgeCopy() completed");
    }).catch((err) => {
      console.error("[COPIER-ENGINE] startForgeCopy() failed:", err);
      engineRunning = false;
    });

    engineRunning = true;
    return NextResponse.json({ success: true, status: "starting", message: "FORGE COPY Engine wird gestartet..." });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
