// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/symbol-resolver.ts — MetaApi Symbol Resolver
// Mappt Signal-Symbole (XAU, GOLD) auf Broker-Symbole (XAUUSD.pro)
// ═══════════════════════════════════════════════════════════════

const META_API_BASE = "https://mt-manager-api-v1.agiliumtrade.agiliumtrade.ai";

// Alle bekannten Signal-Abkürzungen → MetaTrader Standard-Symbol
const BASE_SYMBOLS: Record<string, string> = {
  // Gold
  XAUUSD: "XAUUSD", GOLD: "XAUUSD", XAU: "XAUUSD", GOLDUSD: "XAUUSD",
  "GOLD.": "XAUUSD", "XAU.": "XAUUSD",
  // Silber
  XAGUSD: "XAGUSD", SILVER: "XAGUSD", XAG: "XAGUSD", SILVERUSD: "XAGUSD",
  // Forex Majors
  EURUSD: "EURUSD", EU: "EURUSD", EUR: "EURUSD", FIBER: "EURUSD", "EUR/USD": "EURUSD",
  GBPUSD: "GBPUSD", GU: "GBPUSD", GBP: "GBPUSD", CABLE: "GBPUSD", POUND: "GBPUSD", "GBP/USD": "GBPUSD",
  USDJPY: "USDJPY", UJ: "USDJPY", JPY: "USDJPY", YEN: "USDJPY", "USD/JPY": "USDJPY",
  USDCAD: "USDCAD", UC: "USDCAD", CAD: "USDCAD", LOONIE: "USDCAD", "USD/CAD": "USDCAD",
  AUDUSD: "AUDUSD", AU: "AUDUSD", AUD: "AUDUSD", AUSSIE: "AUDUSD", "AUD/USD": "AUDUSD",
  NZDUSD: "NZDUSD", NZ: "NZDUSD", NZD: "NZDUSD", KIWI: "NZDUSD", "NZD/USD": "NZDUSD",
  USDCHF: "USDCHF", UCHF: "USDCHF", CHF: "USDCHF", SWISSY: "USDCHF", "USD/CHF": "USDCHF",
  // Forex Crosses
  EURGBP: "EURGBP", EG: "EURGBP", "EUR/GBP": "EURGBP",
  EURJPY: "EURJPY", EJ: "EURJPY", "EUR/JPY": "EURJPY",
  GBPJPY: "GBPJPY", GJ: "GBPJPY", GUPPY: "GBPJPY", "GBP/JPY": "GBPJPY",
  CADJPY: "CADJPY", CJ: "CADJPY", "CAD/JPY": "CADJPY",
  AUDCAD: "AUDCAD", AC: "AUDCAD", "AUD/CAD": "AUDCAD",
  EURCHF: "EURCHF", ECHF: "EURCHF", "EUR/CHF": "EURCHF",
  EURAUD: "EURAUD", EA: "EURAUD", "EUR/AUD": "EURAUD",
  EURNZD: "EURNZD", EN: "EURNZD", "EUR/NZD": "EURNZD",
  GBPAUD: "GBPAUD", GA: "GBPAUD", "GBP/AUD": "GBPAUD",
  GBPCAD: "GBPCAD", GC: "GBPCAD", "GBP/CAD": "GBPCAD",
  GBPNZD: "GBPNZD", GN: "GBPNZD", "GBP/NZD": "GBPNZD",
  AUDNZD: "AUDNZD", AN: "AUDNZD", "AUD/NZD": "AUDNZD",
  AUDJPY: "AUDJPY", AJ: "AUDJPY", "AUD/JPY": "AUDJPY",
  NZDJPY: "NZDJPY", NJ: "NZDJPY", "NZD/JPY": "NZDJPY",
  CHFJPY: "CHFJPY", "CHF/JPY": "CHFJPY",
  EURCAD: "EURCAD", EC: "EURCAD", "EUR/CAD": "EURCAD",
  // Indizes
  US500: "US500", SPX: "US500", SP500: "US500", "S&P": "US500", "S&P500": "US500", SPX500: "US500",
  US30: "US30", DOW: "US30", DJI: "US30", DJ30: "US30", "DOW JONES": "US30",
  NAS100: "NAS100", NASDAQ: "NAS100", NAS: "NAS100", NDX: "NAS100", USTEC: "NAS100", NDX100: "NAS100",
  DAX: "DE40", DE40: "DE40", GER40: "DE40", DAX40: "DE40",
  FTSE: "UK100", UK100: "UK100",
  // Crypto
  BTCUSD: "BTCUSD", BTC: "BTCUSD", BITCOIN: "BTCUSD", "BTC/USD": "BTCUSD", BTCUSDT: "BTCUSD",
  ETHUSD: "ETHUSD", ETH: "ETHUSD", ETHEREUM: "ETHUSD", "ETH/USD": "ETHUSD", ETHUSDT: "ETHUSD",
  SOLUSD: "SOLUSD", SOL: "SOLUSD", SOLANA: "SOLUSD",
  XRPUSD: "XRPUSD", XRP: "XRPUSD", RIPPLE: "XRPUSD",
  DOGEUSD: "DOGEUSD", DOGE: "DOGEUSD",
  // Rohstoffe
  USOIL: "USOIL", WTI: "USOIL", OIL: "USOIL", CRUDE: "USOIL", CRUDEOIL: "USOIL", "WTI OIL": "USOIL",
  UKOIL: "UKOIL", BRENT: "UKOIL",
  NATGAS: "NATGAS", GAS: "NATGAS", NGAS: "NATGAS",
  COPPER: "COPPER", HG: "COPPER",
};

// In-memory cache für Broker-Symbole (TTL: 1h), keyed by accountId
const symbolCache: Map<string, { symbols: string[]; ts: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 Stunde

/**
 * Lädt die verfügbaren Symbole eines MetaApi-Accounts.
 */
async function fetchBrokerSymbols(accountId: string, token: string): Promise<string[]> {
  const cached = symbolCache.get(accountId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.symbols;
  }

  try {
    const res = await fetch(
      `${META_API_BASE}/users/current/accounts/${accountId}/symbols`,
      { headers: { "auth-token": token, "Content-Type": "application/json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const symbols = Array.isArray(data) ? data.map((s: any) => s.symbol || s) : [];
    symbolCache.set(accountId, { symbols, ts: Date.now() });
    return symbols;
  } catch {
    return [];
  }
}

/**
 * Resolved ein Signal-Symbol zum korrekten Broker-Symbol.
 *
 * "XAU" → sucht in Broker-Symbolen nach XAUUSD, XAUUSD.pro, XAUUSDm, GOLD, GOLDm etc.
 */
export async function resolveSymbol(
  signalSymbol: string,
  accountId?: string,
  token?: string,
): Promise<string> {
  if (!signalSymbol) return signalSymbol;

  // Normalize: uppercase, strip whitespace
  const normalized = signalSymbol.toUpperCase().trim();

  // Get the base symbol
  const base = BASE_SYMBOLS[normalized] || normalized;

  // Without MetaApi, just return base
  if (!accountId || !token) return base;

  // Fetch broker symbols and find best match
  const brokerSymbols = await fetchBrokerSymbols(accountId, token);
  if (brokerSymbols.length === 0) return base;

  // Priority matching:
  // 1. Exact match (XAUUSD)
  if (brokerSymbols.includes(base)) return base;

  // 2. With suffix (.pro, m, .raw, .ecn, .std, _SB, .a, .b)
  const variations = [
    `${base}.pro`, `${base}m`, `${base}.raw`, `${base}.ecn`,
    `${base}.std`, `${base}_SB`, `${base}.a`, `${base}.b`,
    `${base}pro`, `${base}.i`, `${base}.`, `${base}+`,
  ];
  for (const v of variations) {
    if (brokerSymbols.includes(v)) return v;
  }

  // 3. Fuzzy: any broker symbol that starts with base
  const fuzzy = brokerSymbols.find(s => s.startsWith(base));
  if (fuzzy) return fuzzy;

  // 4. Reverse: try with original signal symbol
  if (normalized !== base) {
    const fromOriginal = brokerSymbols.find(s =>
      s.toUpperCase().startsWith(normalized) || s.toUpperCase().includes(normalized)
    );
    if (fromOriginal) return fromOriginal;
  }

  // 5. Fallback: just return base
  return base;
}

/**
 * Schnelle lokale Normalisierung ohne MetaApi-Lookup.
 * Für die Vorschau im Training.
 * Erkennt auch Varianten wie XAUUSD.pro, GOLDm, XAUUSD.i etc.
 */
export function normalizeSymbol(raw: string): string {
  if (!raw) return raw;
  const upper = raw.toUpperCase().trim();

  // Direct match
  if (BASE_SYMBOLS[upper]) return BASE_SYMBOLS[upper];

  // Strip common broker suffixes: .pro, .raw, .ecn, .std, .i, .a, .b, m, +, _SB
  const stripped = upper
    .replace(/\.(PRO|RAW|ECN|STD|I|A|B|SB|MINI|MICRO)$/i, "")
    .replace(/(M|PRO|\+|_SB)$/i, "")
    .replace(/[.#!]$/, "");

  if (BASE_SYMBOLS[stripped]) return BASE_SYMBOLS[stripped];

  // Try without slash: EUR/USD → EURUSD
  const noSlash = upper.replace("/", "");
  if (BASE_SYMBOLS[noSlash]) return BASE_SYMBOLS[noSlash];

  return upper;
}
