export const dynamic = "force-dynamic";
// src/app/api/cron/fetch-trades/route.ts
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { MetaApiClient } from "@/lib/metaapi-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const results: any[] = [];

  try {
    // Get all active slave accounts
    const { data: accounts } = await db
      .from("slave_accounts")
      .select("*")
      .is("copier_active", true);

    if (!accounts?.length) {
      return NextResponse.json({ message: "No active accounts", results: [] });
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

    for (const account of accounts) {
      try {
        const client = new MetaApiClient(process.env.META_API_TOKEN!, account.metaapi_account_id);
        const accountInfo = await client.connect();
        const trades = await client.fetchTrades(startTime, endTime);

        // Store trades
        if (trades.length > 0) {
          const tradeRows = trades.map(t => ({
            user_id: account.user_id,
            account_id: account.id,
            external_id: t.id,
            symbol: t.symbol,
            trade_type: t.type,
            volume: t.volume,
            open_price: t.openPrice,
            close_price: t.closePrice,
            profit: t.profit,
            swap: t.swap,
            commission: t.commission,
            open_time: t.openTime,
            close_time: t.closeTime,
            magic: t.magic,
            comment: t.comment,
            is_open: false,
          }));

          await db.from("trades").upsert(tradeRows, { onConflict: "external_id" });
        }

        // Update account equity
        await db.from("slave_accounts").update({
          current_equity: accountInfo.equity,
          equity_high: Math.max(accountInfo.equity, Number(account.equity_high)),
          last_sync: new Date().toISOString(),
          ...(account.dd_type === "trailing" && accountInfo.equity > Number(account.equity_high)
            ? { dd_limit: accountInfo.equity * 0.95 }
            : {}),
        }).eq("id", account.id);

        // Daily snapshot
        const summary = MetaApiClient.computeSummary(trades, startTime, endTime);
        const ddPct = accountInfo.equity > 0
          ? ((Math.max(accountInfo.equity, Number(account.equity_high)) - accountInfo.equity) / Math.max(accountInfo.equity, Number(account.equity_high))) * 100
          : 0;

        await db.from("daily_snapshots").upsert({
          account_id: account.id,
          balance: accountInfo.balance,
          equity: accountInfo.equity,
          floating_pnl: accountInfo.equity - accountInfo.balance,
          closed_pnl: summary.netResult,
          trades_count: summary.totalTrades,
          win_count: summary.winningTrades,
          loss_count: summary.losingTrades,
          equity_high: Math.max(accountInfo.equity, Number(account.equity_high)),
          dd_current_pct: ddPct,
          snapshot_date: new Date().toISOString().split("T")[0],
        }, { onConflict: "account_id,snapshot_date" });

        results.push({
          account: account.mt_login,
          trades: trades.length,
          equity: accountInfo.equity,
          status: "ok",
        });
      } catch (err) {
        results.push({
          account: account.mt_login,
          status: "error",
          error: (err as Error).message,
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
