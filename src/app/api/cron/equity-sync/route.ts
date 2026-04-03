export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextResponse } from "next/server";
import { createSupabaseAdmin, supabaseRestQuery } from "@/lib/supabase/server";

const META_PROV = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

function getClientBase(region?: string): string {
  if (region && region !== "default") return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  return "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";
}

export async function GET(request: Request) {
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  if (!token) return NextResponse.json({ error: "METAAPI_TOKEN missing" }, { status: 500 });

  const db = createSupabaseAdmin();
  const results: any[] = [];

  try {
    const accounts = await supabaseRestQuery("slave_accounts", "select=id,metaapi_account_id,mt_login,current_equity,initial_balance,total_trades,total_profit,equity_high,dd_limit,dd_type");

    if (!accounts?.length) return NextResponse.json({ message: "No active accounts", results: [] });

    // Get account regions from MetaApi
    let regionMap: Record<string, string> = {};
    try {
      const accs = await (await fetch(META_PROV + "/users/current/accounts", {
        headers: { "auth-token": token }, signal: AbortSignal.timeout(10000),
      })).json();
      for (const a of (Array.isArray(accs) ? accs : [])) {
        regionMap[a._id] = a.region || "default";
      }
    } catch {}

    for (const acc of accounts) {
      try {
        const region = regionMap[acc.metaapi_account_id] || "default";
        const base = getClientBase(region);

        const info = await (await fetch(
          `${base}/users/current/accounts/${acc.metaapi_account_id}/account-information`,
          { headers: { "auth-token": token }, signal: AbortSignal.timeout(10000) }
        )).json();

        const equity = info.equity ?? null;
        const balance = info.balance ?? null;
        const profit = balance !== null ? balance - Number(acc.initial_balance || 0) : null;

        // Update DB — only columns that exist
        const updates: Record<string, any> = { last_sync: new Date().toISOString() };
        if (equity !== null) {
          updates.current_equity = equity;
          const oldHigh = Number(acc.equity_high) || 0;
          if (equity > oldHigh) {
            updates.equity_high = equity;
            if (acc.dd_type === "trailing") {
              updates.dd_limit = equity * 0.95;
            }
          }
        }
        if (profit !== null) updates.total_profit = profit;

        await db.from("slave_accounts").update(updates).eq("id", acc.id);

        results.push({ login: acc.mt_login, equity, balance, profit, synced: true });
      } catch (err: any) {
        results.push({ login: acc.mt_login, error: err.message, synced: false });
      }
    }

    return NextResponse.json({
      synced: results.filter(r => r.synced).length,
      failed: results.filter(r => !r.synced).length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
