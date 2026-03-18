// ═══════════════════════════════════════════════════════════════
// src/lib/crypto/funding-rates.ts — Funding rate monitoring & alerts
// ═══════════════════════════════════════════════════════════════

type Exchange = "binance" | "bybit" | "bitget" | "okx";

interface FundingRate {
  exchange: Exchange;
  symbol: string;
  rate: number;
  nextFundingTime: string;
  annualized: number;
}

interface FundingAlert {
  symbol: string;
  exchange: Exchange;
  rate: number;
  direction: "high_positive" | "high_negative";
}

// Placeholder endpoints per exchange
const FUNDING_ENDPOINTS: Record<Exchange, string> = {
  binance: "https://fapi.binance.com/fapi/v1/fundingRate",
  bybit: "https://api.bybit.com/v5/market/funding/history",
  bitget: "https://api.bitget.com/api/v2/mix/market/current-fund-rate",
  okx: "https://www.okx.com/api/v5/public/funding-rate",
};

export async function fetchFundingRates(exchange: Exchange): Promise<FundingRate[]> {
  // TODO: Implement actual API calls
  // Placeholder returning empty — real implementation would fetch from FUNDING_ENDPOINTS[exchange]
  const _endpoint = FUNDING_ENDPOINTS[exchange];

  // Example structure for when implemented:
  return [
    {
      exchange,
      symbol: "BTCUSDT",
      rate: 0.0001,
      nextFundingTime: new Date(Date.now() + 8 * 3600000).toISOString(),
      annualized: 0.0001 * 3 * 365 * 100,
    },
  ];
}

export async function getAlerts(threshold: number = 0.01): Promise<FundingAlert[]> {
  const exchanges: Exchange[] = ["binance", "bybit", "bitget", "okx"];
  const alerts: FundingAlert[] = [];

  for (const ex of exchanges) {
    const rates = await fetchFundingRates(ex);
    for (const r of rates) {
      if (Math.abs(r.rate) >= threshold) {
        alerts.push({
          symbol: r.symbol,
          exchange: r.exchange,
          rate: r.rate,
          direction: r.rate > 0 ? "high_positive" : "high_negative",
        });
      }
    }
  }

  return alerts;
}

export async function getBestRates(): Promise<FundingRate[]> {
  const exchanges: Exchange[] = ["binance", "bybit", "bitget", "okx"];
  const all: FundingRate[] = [];

  for (const ex of exchanges) {
    const rates = await fetchFundingRates(ex);
    all.push(...rates);
  }

  // Sort by absolute rate descending (best arbitrage opportunities)
  return all.sort((a, b) => Math.abs(b.rate) - Math.abs(a.rate)).slice(0, 20);
}
