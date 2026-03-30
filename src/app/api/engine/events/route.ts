export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    // Auth: check CRON_SECRET bearer token
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // For now, allow without auth for internal dashboard
      // In production, add proper user auth check here
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const rawLimit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const status = searchParams.get("status");

    // Fetch copy events
    let query = supabaseAdmin
      .from("copy_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(rawLimit);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    // Summary counts for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayEvents } = await supabaseAdmin
      .from("copy_events")
      .select("status")
      .gte("created_at", today.toISOString());

    const summary = {
      detected: todayEvents?.filter((e) => e.status === "DETECTED").length || 0,
      copied: todayEvents?.filter((e) => e.status === "COPIED").length || 0,
      blocked: todayEvents?.filter((e) => e.status === "BLOCKED").length || 0,
      missed: todayEvents?.filter((e) => e.status === "MISSED").length || 0,
      errors: todayEvents?.filter((e) => e.status === "ERROR").length || 0,
    };

    return NextResponse.json({ events: data, summary });
  } catch (err) {
    console.error("[engine/events] Error:", err);
    return NextResponse.json(
      { error: "Failed to load engine events" },
      { status: 500 },
    );
  }
}
