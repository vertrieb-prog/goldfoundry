export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const now = Date.now();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    // Missed events in last 24h
    const { data: missedEvents } = await supabaseAdmin
      .from("copy_events")
      .select("*")
      .eq("status", "MISSED")
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    // Latest events per pair (last 100)
    const { data: pairStatus } = await supabaseAdmin
      .from("copy_events")
      .select("signal_account_id, copy_account_id, pair_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    // Group by signal+copy pair and compute health
    const pairMap = new Map<string, {
      name: string;
      signalId: string;
      copyId: string;
      lastEvent: string;
      copied: number;
      blocked: number;
      missed: number;
      missedRecent: number;
    }>();

    for (const ev of pairStatus ?? []) {
      const key = `${ev.signal_account_id}→${ev.copy_account_id}`;
      if (!pairMap.has(key)) {
        pairMap.set(key, {
          name: `${ev.pair_name || "Unknown"} (${key})`,
          signalId: ev.signal_account_id,
          copyId: ev.copy_account_id,
          lastEvent: ev.created_at,
          copied: 0,
          blocked: 0,
          missed: 0,
          missedRecent: 0,
        });
      }
      const p = pairMap.get(key)!;
      if (ev.status === "COPIED") p.copied++;
      if (ev.status === "BLOCKED") p.blocked++;
      if (ev.status === "MISSED") {
        p.missed++;
        if (ev.created_at >= oneHourAgo) p.missedRecent++;
      }
    }

    const pairs = Array.from(pairMap.values()).map((p) => ({
      name: p.name,
      signalId: p.signalId,
      copyId: p.copyId,
      healthy: p.missedRecent === 0,
      lastEvent: p.lastEvent,
      copied: p.copied,
      blocked: p.blocked,
      missed: p.missed,
    }));

    return NextResponse.json({
      pairs,
      alerts: missedEvents ?? [],
      lastCheck: new Date().toISOString(),
      healthy: (missedEvents?.length ?? 0) === 0,
    });
  } catch (err) {
    console.error("[engine/health] Error:", err);
    return NextResponse.json(
      { error: "Failed to load engine health" },
      { status: 500 },
    );
  }
}
