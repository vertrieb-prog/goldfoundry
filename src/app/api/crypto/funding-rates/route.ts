export const dynamic = "force-dynamic";
// src/app/api/crypto/funding-rates/route.ts — Fetch current funding rates for tracked crypto pairs
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BINANCE_FUNDING_URL = "https://fapi.binance.com/fapi/v1/premiumIndex";
const BYBIT_FUNDING_URL = "https://api.bybit.com/v5/market/tickers?category=linear";

interface FundingRate {
  symbol: string;
  exchange: string;
  funding_rate: number;
  next_funding_time: string;
  mark_price: number;
}

async function fetchBinanceFunding(symbols: string[]): Promise<FundingRate[]> {
  try {
    const res = await fetch(BINANCE_FUNDING_URL, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data
      .filter((d: any) => symbols.includes(d.symbol))
      .map((d: any) => ({
        symbol: d.symbol,
        exchange: "binance",
        funding_rate: parseFloat(d.lastFundingRate),
        next_funding_time: new Date(d.nextFundingTime).toISOString(),
        mark_price: parseFloat(d.markPrice),
      }));
  } catch {
    return [];
  }
}

async function fetchBybitFunding(symbols: string[]): Promise<FundingRate[]> {
  try {
    const res = await fetch(BYBIT_FUNDING_URL, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    const tickers = data?.result?.list ?? [];
    return tickers
      .filter((t: any) => symbols.includes(t.symbol))
      .map((t: any) => ({
        symbol: t.symbol,
        exchange: "bybit",
        funding_rate: parseFloat(t.fundingRate ?? "0"),
        next_funding_time: new Date(parseInt(t.nextFundingTime ?? "0")).toISOString(),
        mark_price: parseFloat(t.markPrice ?? "0"),
      }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const exchange = searchParams.get("exchange"); // binance | bybit | null (both)
  const symbolsParam = searchParams.get("symbols");

  const defaultSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT"];
  const symbols = symbolsParam ? symbolsParam.split(",").map(s => s.trim().toUpperCase()) : defaultSymbols;

  const results: FundingRate[] = [];

  if (!exchange || exchange === "binance") {
    const binanceRates = await fetchBinanceFunding(symbols);
    results.push(...binanceRates);
  }

  if (!exchange || exchange === "bybit") {
    const bybitRates = await fetchBybitFunding(symbols);
    results.push(...bybitRates);
  }

  // Identify arbitrage opportunities (rate difference > 0.01%)
  const arbitrage: Array<{ symbol: string; binance_rate: number; bybit_rate: number; spread: number }> = [];
  for (const symbol of symbols) {
    const binRate = results.find(r => r.symbol === symbol && r.exchange === "binance");
    const bybitRate = results.find(r => r.symbol === symbol && r.exchange === "bybit");
    if (binRate && bybitRate) {
      const spread = Math.abs(binRate.funding_rate - bybitRate.funding_rate);
      if (spread > 0.0001) {
        arbitrage.push({
          symbol,
          binance_rate: binRate.funding_rate,
          bybit_rate: bybitRate.funding_rate,
          spread: Math.round(spread * 10000) / 10000,
        });
      }
    }
  }

  // Store snapshot in Supabase for historical tracking
  const db = createSupabaseAdmin();
  if (results.length > 0) {
    await db.from("funding_rate_snapshots").insert(
      results.map(r => ({
        symbol: r.symbol,
        exchange: r.exchange,
        funding_rate: r.funding_rate,
        mark_price: r.mark_price,
        snapshot_at: new Date().toISOString(),
      }))
    ).then(() => {});  // fire-and-forget
  }

  return NextResponse.json({
    rates: results,
    arbitrage: arbitrage.sort((a, b) => b.spread - a.spread),
    fetched_at: new Date().toISOString(),
  });
}
