export const dynamic = "force-dynamic";
export const maxDuration = 60;
// ═══════════════════════════════════════════════════════════════
// CRON: Equity Sync (REST-based)
// Fetches real balance/equity from MetaApi REST API for all
// active slave accounts. Runs daily at 06:00 via Vercel Cron.
// Uses REST instead of SDK to avoid "window is not defined".
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const META_CLIENT_BASE =
  "https://mt-client-api-v1.new-york.agiliumtrade.ai";

const log = (level: string, msg: string) => {
  console.log(
    `[${new Date().toISOString()}] [EQUITY-SYNC] [${level}] ${msg}`,
  );
};

async function metaApiFetch(url: string, token: string) {
  const res = await fetch(url, {
    headers: {
      "auth-token": token,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text();
    let msg = `MetaApi ${res.status}`;
    try {
      msg = JSON.parse(body).message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function GET(request: Request) {
  // Auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metaApiToken =
    process.env.METAAPI_TOKEN || process.env.META_API_TOKEN;
  if (!metaApiToken) {
    return NextResponse.json(
      { error: "METAAPI_TOKEN not configured" },
      { status: 500 },
    );
  }

  const db = createSupabaseAdmin();
  const results: any[] = [];

  try {
    // 1. Get all active slave accounts
    const { data: accounts, error: dbErr } = await db
      .from("slave_accounts")
      .select("id, metaapi_account_id, mt_login, current_equity, current_balance")
      .eq("copier_active", true);

    if (dbErr) throw new Error(`DB error: ${dbErr.message}`);

    if (!accounts?.length) {
      log("INFO", "No active slave accounts found");
      return NextResponse.json({
        message: "No active accounts",
        results: [],
      });
    }

    log("INFO", `Syncing equity for ${accounts.length} account(s)`);

    // 2. Fetch account info for each via REST
    for (const acc of accounts) {
      try {
        const info = await metaApiFetch(
          `${META_CLIENT_BASE}/users/current/accounts/${acc.metaapi_account_id}/account-information`,
          metaApiToken,
        );

        const equity = info.equity ?? null;
        const balance = info.balance ?? null;

        // 3. Update DB with real values
        const updates: Record<string, any> = {
          last_sync: new Date().toISOString(),
        };
        if (equity !== null) updates.current_equity = equity;
        if (balance !== null) updates.current_balance = balance;

        await db
          .from("slave_accounts")
          .update(updates)
          .eq("id", acc.id);

        log(
          "INFO",
          `${acc.mt_login}: equity=${equity} balance=${balance} (was eq=${acc.current_equity} bal=${acc.current_balance})`,
        );
        results.push({
          login: acc.mt_login,
          equity,
          balance,
          synced: true,
        });
      } catch (err: any) {
        log("ERROR", `${acc.mt_login}: ${err.message}`);
        results.push({
          login: acc.mt_login,
          error: err.message,
          synced: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.filter((r) => r.synced).length,
      failed: results.filter((r) => !r.synced).length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    log("ERROR", `Cron error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
