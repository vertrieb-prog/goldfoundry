export const dynamic = "force-dynamic";
export const maxDuration = 60;
// ═══════════════════════════════════════════════════════════════
// CRON: Strategy Engine v3 Tick
// Calls engine.tick() every minute via Vercel Cron
// Uses MetaApi REST API (NOT SDK) — same approach as telegram-signals cron
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { createRestAdapter } from "@/lib/engine-adapter";
import { MasterStrategyEngine, DEFAULT_CONFIG } from "@/lib/strategy-engine";

// Engine singleton per account (reused across cron invocations within same serverless instance)
const engineCache = new Map<string, MasterStrategyEngine>();

export async function GET(request: Request) {
  // Auth: only allow cron calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metaApiToken = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  if (!metaApiToken) {
    return NextResponse.json({ error: "METAAPI_TOKEN not configured" }, { status: 500 });
  }

  const db = createSupabaseAdmin();

  try {
    // Get all users with active copier accounts
    const { data: accounts } = await db
      .from("slave_accounts")
      .select("user_id, metaapi_account_id")
      ;

    if (!accounts?.length) {
      return NextResponse.json({ message: "No active accounts", ticked: 0 });
    }

    let ticked = 0;
    const errors: string[] = [];

    for (const account of accounts) {
      try {
        const cacheKey = account.metaapi_account_id;
        let engine = engineCache.get(cacheKey);

        if (!engine) {
          const adapter = createRestAdapter(metaApiToken, account.metaapi_account_id);
          engine = new MasterStrategyEngine(
            adapter,
            db,
            null, // AI client — null for now (code-scoring only)
            { ...DEFAULT_CONFIG, testMode: true, propFirmMode: false }
          );
          engineCache.set(cacheKey, engine);
        }

        await engine.tick();
        ticked++;
      } catch (err: any) {
        console.error(`[ENGINE-CRON] Tick error for ${account.metaapi_account_id}:`, err.message);
        errors.push(`${account.metaapi_account_id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      ticked,
      total: accounts.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[ENGINE-CRON] Fatal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
