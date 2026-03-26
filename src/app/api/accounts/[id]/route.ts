export const dynamic = "force-dynamic";
// src/app/api/accounts/[id]/route.ts — Account detail + positions + trades + signals
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const META_PROV = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

function getClientBase(region?: string): string {
  if (region && region !== "default") return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  return "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { id } = params;

  // 1) Account row
  const { data: account, error } = await db
    .from("slave_accounts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // 2) Linked channel
  const { data: channels } = await db
    .from("telegram_active_channels")
    .select("channel_name, channel_id, settings")
    .eq("user_id", user.id);

  let linkedChannel: string | null = null;
  let channelId: string | null = null;
  for (const ch of channels || []) {
    const linkedId = (ch.settings as any)?.linkedAccountId;
    if (linkedId === id) {
      linkedChannel = ch.channel_name || ch.channel_id;
      channelId = ch.channel_id || ch.channel_name;
      break;
    }
  }

  // 3) MetaApi: positions + account info
  const token = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  let positions: any[] = [];
  let metaInfo: any = null;

  if (token && account.metaapi_account_id) {
    try {
      // Resolve region
      let region = "default";
      try {
        const accs = await (await fetch(META_PROV + "/users/current/accounts", {
          headers: { "auth-token": token }, signal: AbortSignal.timeout(10000),
        })).json();
        for (const a of Array.isArray(accs) ? accs : []) {
          if (a._id === account.metaapi_account_id) { region = a.region || "default"; break; }
        }
      } catch {}

      const base = getClientBase(region);
      const hdr = { "auth-token": token };
      const timeout = AbortSignal.timeout(10000);

      // Fetch account info + positions in parallel
      const [infoRes, posRes] = await Promise.all([
        fetch(`${base}/users/current/accounts/${account.metaapi_account_id}/account-information`, { headers: hdr, signal: timeout }).then(r => r.json()).catch(() => null),
        fetch(`${base}/users/current/accounts/${account.metaapi_account_id}/positions`, { headers: hdr, signal: timeout }).then(r => r.json()).catch(() => []),
      ]);

      metaInfo = infoRes;
      positions = Array.isArray(posRes) ? posRes : [];
    } catch {}
  }

  // 4) Trade history from DB
  const { data: trades } = await db
    .from("trades")
    .select("*")
    .eq("account_id", id)
    .order("closed_at", { ascending: false })
    .limit(100);

  // 5) Signal history
  let signals: any[] = [];
  if (channelId) {
    const { data: sigs } = await db
      .from("telegram_signals")
      .select("*")
      .eq("user_id", user.id)
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(20);
    signals = sigs || [];
  }

  // 6) Compute stats from trades
  const closedTrades = (trades || []).filter((t: any) => t.profit !== null && t.profit !== undefined);
  const wins = closedTrades.filter((t: any) => t.profit > 0);
  const losses = closedTrades.filter((t: any) => t.profit < 0);
  const totalProfit = closedTrades.reduce((s: number, t: any) => s + Number(t.profit || 0), 0);
  const avgWin = wins.length ? wins.reduce((s: number, t: any) => s + Number(t.profit), 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s: number, t: any) => s + Number(t.profit), 0) / losses.length : 0;
  const grossWin = wins.reduce((s: number, t: any) => s + Number(t.profit), 0);
  const grossLoss = Math.abs(losses.reduce((s: number, t: any) => s + Number(t.profit), 0));

  const stats = {
    totalTrades: account.total_trades || closedTrades.length,
    winRate: account.win_rate || (closedTrades.length ? (wins.length / closedTrades.length * 100) : 0),
    totalProfit: account.total_profit || totalProfit,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    profitFactor: grossLoss > 0 ? Math.round((grossWin / grossLoss) * 100) / 100 : grossWin > 0 ? 999 : 0,
    bestTrade: closedTrades.length ? Math.max(...closedTrades.map((t: any) => Number(t.profit))) : 0,
    worstTrade: closedTrades.length ? Math.min(...closedTrades.map((t: any) => Number(t.profit))) : 0,
    maxDrawdown: account.equity_high && account.current_equity
      ? Math.round((1 - account.current_equity / account.equity_high) * 10000) / 100
      : 0,
  };

  return NextResponse.json({
    account: { ...account, linked_channel: linkedChannel },
    positions,
    trades: trades || [],
    signals,
    stats,
    metaInfo,
  });
}
