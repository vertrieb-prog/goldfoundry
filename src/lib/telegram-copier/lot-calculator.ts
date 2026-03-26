// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/lot-calculator.ts — Professional Lot Size Calculator
// Risk-based position sizing with margin checks
// ═══════════════════════════════════════════════════════════════

// Try multiple regions for price fetching
const API_BASES = [
  "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai",
  "https://mt-client-api-v1.london.agiliumtrade.ai",
  "https://mt-client-api-v1.new-york.agiliumtrade.ai",
];

const log = (level: string, msg: string) => {
  console.log(`[${new Date().toISOString()}] [LOT-CALC] [${level}] ${msg}`);
};

// ── Symbol classification ────────────────────────────────────

type SymbolType = "gold" | "forex" | "forex_jpy" | "index" | "unknown";

function classifySymbol(symbol: string): SymbolType {
  const s = symbol.toUpperCase();
  if (s.includes("XAU") || s.includes("GOLD")) return "gold";
  if (s.includes("US500") || s.includes("SP500") || s.includes("SPX")) return "index";
  if (s.includes("NAS100") || s.includes("USTEC") || s.includes("NDX")) return "index";
  if (s.includes("US30") || s.includes("DJ30") || s.includes("DOW")) return "index";
  if (s.includes("DE40") || s.includes("DAX") || s.includes("GER40")) return "index";
  if (s.includes("UK100") || s.includes("FTSE")) return "index";
  if (s.includes("JP225") || s.includes("NIKKEI")) return "index";
  if (s.endsWith("JPY") || s.startsWith("JPY")) return "forex_jpy";
  // Anything 6-char like EURUSD, GBPUSD, etc.
  if (/^[A-Z]{6}$/.test(s)) return "forex";
  if (s.includes("USD") || s.includes("EUR") || s.includes("GBP") ||
      s.includes("AUD") || s.includes("NZD") || s.includes("CAD") ||
      s.includes("CHF")) return "forex";
  return "unknown";
}

// ── Contract specs per symbol type ───────────────────────────

interface ContractSpec {
  contractSize: number;     // units per 1 lot
  riskPerLotPerUnit: number; // $ risk per lot per 1 unit of price move
  hardCapLots: number;      // absolute max lots
}

function getContractSpec(symbol: string, symbolType: SymbolType): ContractSpec {
  switch (symbolType) {
    case "gold":
      // 1 lot = 100 oz, $1 price move = $100 per lot
      return { contractSize: 100, riskPerLotPerUnit: 100, hardCapLots: 2.0 };
    case "forex":
    case "forex_jpy":
      // 1 lot = 100,000 units
      return { contractSize: 100_000, riskPerLotPerUnit: 100_000, hardCapLots: 5.0 };
    case "index": {
      const s = symbol.toUpperCase();
      // US500/SP500: typically $50 per point per lot (contract size 50)
      if (s.includes("US500") || s.includes("SP500") || s.includes("SPX"))
        return { contractSize: 50, riskPerLotPerUnit: 50, hardCapLots: 5.0 };
      // NAS100: typically $20 per point per lot
      if (s.includes("NAS100") || s.includes("USTEC") || s.includes("NDX"))
        return { contractSize: 20, riskPerLotPerUnit: 20, hardCapLots: 5.0 };
      // US30/DOW: $5 per point per lot
      if (s.includes("US30") || s.includes("DJ30") || s.includes("DOW"))
        return { contractSize: 5, riskPerLotPerUnit: 5, hardCapLots: 5.0 };
      // DAX/DE40: typically €25 per point
      if (s.includes("DE40") || s.includes("DAX") || s.includes("GER40"))
        return { contractSize: 25, riskPerLotPerUnit: 25, hardCapLots: 5.0 };
      // Default index
      return { contractSize: 10, riskPerLotPerUnit: 10, hardCapLots: 5.0 };
    }
    default:
      // Conservative fallback: treat like gold
      return { contractSize: 100, riskPerLotPerUnit: 100, hardCapLots: 1.0 };
  }
}

// ── Fetch current price from MetaApi ─────────────────────────

async function fetchCurrentPrice(
  symbol: string,
  accountId: string,
  token: string,
): Promise<number | null> {
  try {
    for (const base of API_BASES) {
      try {
        const res = await fetch(`${base}/users/current/accounts/${accountId}/symbols/${symbol}/current-price`, {
          headers: { "auth-token": token, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.ask || data.bid) return data.ask || data.bid;
      } catch { continue; }
    }
    return null;
  } catch {
    return null;
  }
}

// ── Main calculator ──────────────────────────────────────────

export interface LotCalcParams {
  symbol: string;
  action: "BUY" | "SELL";
  entryPrice: number | null;
  stopLoss: number;
  accountBalance: number;
  riskPercent: number;
  leverage: number;
  metaApiAccountId?: string;
  metaApiToken?: string;
}

export interface LotCalcResult {
  lots: number;
  riskAmount: number;
  marginRequired: number;
  reason: string;
}

export async function calculateLotSize(params: LotCalcParams): Promise<LotCalcResult> {
  const {
    symbol,
    action,
    stopLoss,
    accountBalance,
    riskPercent = 1,
    leverage = 30,
    metaApiAccountId,
    metaApiToken,
  } = params;

  let { entryPrice } = params;

  const symbolType = classifySymbol(symbol);
  const spec = getContractSpec(symbol, symbolType);
  const riskAmount = accountBalance * (riskPercent / 100);

  log("INFO", `Calc: ${symbol} (${symbolType}), balance=${accountBalance}, risk=${riskPercent}%, leverage=1:${leverage}`);

  // ── 1. Get entry price (from param, MetaApi, or fail) ──────

  if (!entryPrice && metaApiAccountId && metaApiToken) {
    entryPrice = await fetchCurrentPrice(symbol, metaApiAccountId, metaApiToken);
    if (entryPrice) {
      log("INFO", `Fetched current price for ${symbol}: ${entryPrice}`);
    }
  }

  if (!entryPrice) {
    log("WARN", `No entry price for ${symbol}, using minimum lot`);
    return {
      lots: 0.01,
      riskAmount,
      marginRequired: 0,
      reason: "No entry price available — using minimum lot 0.01",
    };
  }

  // ── 2. Calculate SL distance ───────────────────────────────

  const slDistance = Math.abs(entryPrice - stopLoss);
  if (slDistance <= 0) {
    return {
      lots: 0.01,
      riskAmount,
      marginRequired: 0,
      reason: "SL distance is zero — using minimum lot 0.01",
    };
  }

  // ── 3. Risk-based lot calculation ──────────────────────────

  // Risk per lot = slDistance * riskPerLotPerUnit
  // For XAUUSD: slDistance=5 → 5 * 100 = $500 risk per lot
  // For EURUSD: slDistance=0.0030 → 0.0030 * 100000 = $300 risk per lot
  const riskPerLot = slDistance * spec.riskPerLotPerUnit;

  let lots = riskPerLot > 0 ? riskAmount / riskPerLot : 0.01;

  log("INFO", `SL distance=${slDistance}, riskPerLot=${riskPerLot.toFixed(2)}, raw lots=${lots.toFixed(4)}`);

  // ── 4. Margin check ────────────────────────────────────────

  const marginRequired = (lots * spec.contractSize * entryPrice) / leverage;
  const maxMarginAllowed = accountBalance * 0.05; // max 5% equity as margin per trade

  if (marginRequired > maxMarginAllowed) {
    const reducedLots = (maxMarginAllowed * leverage) / (spec.contractSize * entryPrice);
    log("WARN", `Margin ${marginRequired.toFixed(2)} exceeds 5% cap (${maxMarginAllowed.toFixed(2)}). Reducing from ${lots.toFixed(2)} to ${reducedLots.toFixed(2)}`);
    lots = reducedLots;
  }

  // Also check 80% of available balance as margin limit
  const availableMargin = accountBalance * 0.8;
  if (marginRequired > availableMargin) {
    const reducedLots = (availableMargin * leverage) / (spec.contractSize * entryPrice);
    log("WARN", `Margin exceeds 80% of balance. Reducing to ${reducedLots.toFixed(2)}`);
    lots = Math.min(lots, reducedLots);
  }

  // ── 5. Apply safety limits ─────────────────────────────────

  // Hard cap per symbol type
  lots = Math.min(lots, spec.hardCapLots);

  // Round to 2 decimal places
  lots = Math.floor(lots * 100) / 100;

  // Minimum 0.01
  lots = Math.max(lots, 0.01);

  const finalMargin = (lots * spec.contractSize * entryPrice) / leverage;

  const reason = `${symbolType.toUpperCase()}: ${riskPercent}% risk ($${riskAmount.toFixed(0)}) | SL dist=${slDistance.toFixed(symbolType === "gold" ? 1 : 5)} | ${lots} lots | margin=$${finalMargin.toFixed(0)} (1:${leverage})`;

  log("INFO", `Result: ${reason}`);

  return {
    lots,
    riskAmount,
    marginRequired: finalMargin,
    reason,
  };
}
