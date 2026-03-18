export const dynamic = "force-dynamic";
// src/app/api/crypto/on-chain/route.ts — On-chain analytics (whale movements, large transactions)
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface WhaleMovement {
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: number;
  token: string;
  usd_value: number;
  timestamp: string;
  type: "exchange_inflow" | "exchange_outflow" | "whale_transfer" | "unknown";
}

const KNOWN_EXCHANGE_ADDRESSES: Record<string, string> = {
  "0x28c6c06298d514db089934071355e5743bf21d60": "Binance",
  "0x21a31ee1afc51d94c2efccaa2092ad1028285549": "Binance",
  "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": "Binance",
  "0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23": "Bybit",
  "0x0d0707963952f2fba59dd06f2b425ace40b492fe": "Gate.io",
  "0xa910f92acdaf488fa12579f8bcc5b6232e": "OKX",
};

function classifyTransfer(from: string, to: string): WhaleMovement["type"] {
  const fromExchange = KNOWN_EXCHANGE_ADDRESSES[from.toLowerCase()];
  const toExchange = KNOWN_EXCHANGE_ADDRESSES[to.toLowerCase()];

  if (fromExchange && !toExchange) return "exchange_outflow";
  if (!fromExchange && toExchange) return "exchange_inflow";
  if (!fromExchange && !toExchange) return "whale_transfer";
  return "unknown";
}

export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "ETH"; // ETH | USDT | BTC
  const minUsdValue = parseInt(searchParams.get("min_usd") ?? "1000000", 10);
  const hours = parseInt(searchParams.get("hours") ?? "24", 10);
  const periodStart = new Date(Date.now() - hours * 3600000).toISOString();

  // Fetch stored whale movements from Supabase
  let query = db
    .from("whale_transactions")
    .select("*")
    .gte("usd_value", minUsdValue)
    .gte("created_at", periodStart)
    .order("usd_value", { ascending: false })
    .limit(100);

  if (token !== "ALL") {
    query = query.eq("token", token.toUpperCase());
  }

  const { data: storedTx, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const transactions: WhaleMovement[] = (storedTx ?? []).map((tx: any) => ({
    tx_hash: tx.tx_hash,
    from_address: tx.from_address,
    to_address: tx.to_address,
    amount: tx.amount,
    token: tx.token,
    usd_value: tx.usd_value,
    timestamp: tx.created_at,
    type: classifyTransfer(tx.from_address, tx.to_address),
  }));

  // Aggregate analytics
  const totalVolume = transactions.reduce((s, tx) => s + tx.usd_value, 0);
  const inflowTx = transactions.filter(tx => tx.type === "exchange_inflow");
  const outflowTx = transactions.filter(tx => tx.type === "exchange_outflow");
  const whaleTx = transactions.filter(tx => tx.type === "whale_transfer");

  const inflowVolume = inflowTx.reduce((s, tx) => s + tx.usd_value, 0);
  const outflowVolume = outflowTx.reduce((s, tx) => s + tx.usd_value, 0);
  const netFlow = outflowVolume - inflowVolume; // positive = bullish (leaving exchanges)

  // Unique whale addresses
  const uniqueAddresses = new Set([
    ...transactions.map(tx => tx.from_address),
    ...transactions.map(tx => tx.to_address),
  ]);

  // Sentiment indicator based on net flow
  let sentiment: "bullish" | "bearish" | "neutral" = "neutral";
  if (netFlow > 0 && Math.abs(netFlow) > totalVolume * 0.1) sentiment = "bullish";
  if (netFlow < 0 && Math.abs(netFlow) > totalVolume * 0.1) sentiment = "bearish";

  return NextResponse.json({
    token,
    period_hours: hours,
    transactions: transactions.slice(0, 50), // top 50 by value
    analytics: {
      total_transactions: transactions.length,
      total_volume_usd: Math.round(totalVolume),
      exchange_inflow: {
        count: inflowTx.length,
        volume_usd: Math.round(inflowVolume),
      },
      exchange_outflow: {
        count: outflowTx.length,
        volume_usd: Math.round(outflowVolume),
      },
      whale_transfers: {
        count: whaleTx.length,
        volume_usd: Math.round(whaleTx.reduce((s, tx) => s + tx.usd_value, 0)),
      },
      net_flow_usd: Math.round(netFlow),
      sentiment,
      unique_addresses: uniqueAddresses.size,
    },
    fetched_at: new Date().toISOString(),
  });
}
