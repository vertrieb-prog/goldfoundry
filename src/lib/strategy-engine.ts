// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — STRATEGY ENGINE v3 FINAL
//
// PRINZIP: AI schläft bis sie gebraucht wird.
// - Kein Signal, kein Trade offen → NICHTS passiert, 0 API Calls
// - Signal kommt → AI bewertet → Trade wird eröffnet oder nicht
// - Trade offen → Engine managt (Code-basiert, kein AI nötig)
// - AI nur bei: Signal-Bewertung + Trade-Close-Analyse
//
// 13 SYSTEME:
// Core:  DCA, Zone Recovery, Step+ATR Trail, Mode Detection, Grid
// Smart: Signal Scoring, Anti-Tilt, Pyramiding, Re-Entry,
//        News Straddle, Time Decay, Volume Check, Correlation
//
// Safety: Locking, Weekend, Session, Spread, ATR Min, Safe Modify
//
// AI-Kosten: ~$1.50/Monat (nur bei Signal + Post-Trade)
// ═══════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type MarketMode = "TREND" | "RANGE" | "SQUEEZE";
type Direction = "BUY" | "SELL";

interface DCAOrder {
  orderId: string;
  price: number;        // Echter Fill-Preis
  lots: number;
  level: 1 | 2;
  status: "OPEN" | "CLOSED";
}

interface ZoneRecoveryOrder {
  orderId: string;
  direction: Direction;
  price: number;        // Echter Fill-Preis
  lots: number;
  sl: number;           // = Original Entry
  tp: number;           // = Entry ± gleiche Distanz wie Original SL
  status: "OPEN" | "CLOSED";
}

interface PyramidOrder {
  orderId: string;
  price: number;
  lots: number;
  sl: number;
  status: "OPEN" | "CLOSED";
}

interface GridLevel {
  price: number;
  direction: Direction;
  orderId: string | null;
  status: "PENDING" | "OPEN" | "CLOSED" | "CANCELLED";
  tp: number;
  sl: number;
  lots: number;
}

interface GridSession {
  symbol: string;
  mode: "ACTIVE" | "CLOSED";
  rangeHigh: number;
  rangeLow: number;
  levels: GridLevel[];
  maxOpenPositions: number;
  createdAt: Date;
}

interface SignalScore {
  confluence: number;
  trendStrength: number;
  srLevel: number;
  riskReward: number;
  spreadScore: number;
  channelRecord: number;
  total: number;
  lotMultiplier: number;  // 0=skip, 0.5=halbe, 1.0=voll
}

interface ReEntryCandidate {
  direction: Direction;
  symbol: string;
  closedAt: Date;
  cooldownUntil: Date;
  attempted: boolean;
  originalLots: number;
  originalSL: number;
}

interface ActiveSignalGroup {
  id: string;
  channelId: string;
  symbol: string;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];      // [TP1, TP2, TP3]
  orders: Array<{
    orderId: string;
    lots: number;
    tp: number | null;
    status: "OPEN" | "CLOSED";
    role: "TP1" | "TP2" | "TP3" | "RUNNER";
  }>;
  status: "OPEN" | "PARTIAL" | "CLOSED";
  openedAt: Date;
  signalScore: number;

  // DCA
  dca: {
    orders: DCAOrder[];
    triggered1: boolean;
    triggered2: boolean;
  };

  // Zone Recovery
  recovery: {
    order: ZoneRecoveryOrder | null;
    triggered: boolean;
  };

  // Step Trail
  step: {
    tp1Hit: boolean;
    tp2Hit: boolean;
    tp3Hit: boolean;
    currentStepSL: number | null;
  };

  // Pyramid
  pyramid: {
    order: PyramidOrder | null;
    triggered: boolean;
  };

  // Trailing
  trailingSL: number | null;

  // Break Even
  breakEvenTriggered: boolean;
}

interface StrategyConfig {
  // DCA
  dcaEnabled: boolean;
  dcaTrigger1: number;      // 0.33
  dcaTrigger2: number;      // 0.60
  dcaLot1Pct: number;       // 50
  dcaLot2Pct: number;       // 30

  // Zone Recovery
  recoveryEnabled: boolean;
  recoveryLotPct: number;   // 60
  recoveryTriggerPct: number; // 0.92

  // Trailing
  trailEnabled: boolean;
  atrMultiplier: number;    // 1.2
  beOffsetPips: number;     // 2

  // Grid
  gridEnabled: boolean;
  gridLotSize: number;
  gridMinRangePips: number;

  // Pyramiding
  pyramidEnabled: boolean;
  pyramidLotPct: number;    // 30

  // Scoring
  scoringEnabled: boolean;
  scoreMinTrade: number;    // 50
  scoreFullLots: number;    // 80

  // Anti-Tilt
  tiltEnabled: boolean;

  // Re-Entry
  reEntryEnabled: boolean;
  reEntryCooldownMin: number;  // 15
  reEntryLotPct: number;       // 50

  // Time Decay
  timeDecayEnabled: boolean;
  timeDecayTightenHours: number;  // 4
  timeDecayCloseHours: number;    // 8

  // AI
  aiEnabled: boolean;
  aiModel: "haiku" | "sonnet";

  // Volume
  volumeEnabled: boolean;

  // News Straddle
  straddleEnabled: boolean;
  straddleLotSize: number;

  // Modes
  propFirmMode: boolean;
  testMode: boolean;

  // Safety
  normalSpread: Record<string, number>;
  minATR: Record<string, number>;

  // Correlation Groups
  correlationGroups: Record<string, string[]>;
}

const DEFAULT_CONFIG: StrategyConfig = {
  dcaEnabled: true,
  dcaTrigger1: 0.33,
  dcaTrigger2: 0.60,
  dcaLot1Pct: 50,
  dcaLot2Pct: 30,

  recoveryEnabled: true,
  recoveryLotPct: 60,
  recoveryTriggerPct: 0.92,

  trailEnabled: true,
  atrMultiplier: 1.2,
  beOffsetPips: 2,

  gridEnabled: true,
  gridLotSize: 0.05,
  gridMinRangePips: 30,

  pyramidEnabled: true,
  pyramidLotPct: 30,

  scoringEnabled: true,
  scoreMinTrade: 50,
  scoreFullLots: 80,

  tiltEnabled: true,

  reEntryEnabled: true,
  reEntryCooldownMin: 15,
  reEntryLotPct: 50,

  timeDecayEnabled: true,
  timeDecayTightenHours: 4,
  timeDecayCloseHours: 8,

  aiEnabled: true,
  aiModel: "haiku",

  volumeEnabled: true,

  straddleEnabled: true,
  straddleLotSize: 0.05,

  propFirmMode: false,
  testMode: true,     // Kein DD Limit im Test

  normalSpread: { XAUUSD: 0.30, "XAUUSD.pro": 0.30, US500: 0.50, NAS100: 1.00, EURUSD: 0.00012, GBPUSD: 0.00015 },
  minATR: { XAUUSD: 5, "XAUUSD.pro": 5, US500: 5, NAS100: 10, EURUSD: 0.0008, GBPUSD: 0.001 },

  correlationGroups: {
    USD: ["XAUUSD", "EURUSD", "GBPUSD", "AUDUSD"],
    IDX: ["US500", "NAS100", "US30"],
    GOLD: ["XAUUSD", "XAGUSD"],
  },
};


// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

function pipSize(symbol: string): number {
  if (symbol.includes("XAU")) return 0.10;
  if (symbol.includes("US500") || symbol.includes("NAS")) return 0.1;
  if (symbol.includes("JPY")) return 0.01;
  return 0.0001;
}

function calcATR(candles: any[], period = 14): number {
  if (candles.length < period + 1) return 0;
  let sum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low;
    const pc = candles[i - 1]?.close || candles[i].open;
    sum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
  return sum / period;
}

function calcADX(candles: any[], period = 14): number {
  if (candles.length < period * 2) return 25;
  let plusDM = 0, minusDM = 0, tr = 0;
  const dx: number[] = [];
  let sPlusDI = 0, sMinusDI = 0;

  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low;
    const ph = candles[i - 1].high, pl = candles[i - 1].low;
    const pc = candles[i - 1].close;
    const up = h - ph, down = pl - l;
    plusDM = up > down && up > 0 ? up : 0;
    minusDM = down > up && down > 0 ? down : 0;
    tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));

    if (i <= period) { sPlusDI += plusDM; sMinusDI += minusDM; }
    else { sPlusDI = sPlusDI - sPlusDI / period + plusDM; sMinusDI = sMinusDI - sMinusDI / period + minusDM; }

    if (i >= period && tr > 0) {
      const pDI = (sPlusDI / tr) * 100;
      const mDI = (sMinusDI / tr) * 100;
      dx.push(Math.abs(pDI - mDI) / ((pDI + mDI) || 1) * 100);
    }
  }
  const last = dx.slice(-period);
  return last.reduce((a, b) => a + b, 0) / (last.length || 1);
}

function calcRSI(candles: any[], period = 14): number {
  if (candles.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const d = candles[i].close - candles[i - 1].close;
    if (d > 0) gains += d; else losses += Math.abs(d);
  }
  const rs = gains / (losses || 0.001);
  return 100 - (100 / (1 + rs));
}

function calcBBWidth(candles: any[], period = 20): number {
  const closes = candles.slice(-period).map((c: any) => c.close);
  if (closes.length === 0) return 0.01; // Fallback
  const sma = closes.reduce((a: number, b: number) => a + b, 0) / closes.length;
  if (sma === 0) return 0.01;
  const std = Math.sqrt(closes.reduce((s: number, c: number) => s + (c - sma) ** 2, 0) / closes.length);
  return ((sma + std * 2) - (sma - std * 2)) / sma;
}

function getTrend(candles: any[]): Direction | "NEUTRAL" {
  if (candles.length < 10) return "NEUTRAL";
  const r = candles.slice(-10);
  const sma = r.reduce((s: number, c: any) => s + c.close, 0) / r.length;
  const d = (r[r.length - 1].close - sma) / sma;
  return d > 0.001 ? "BUY" : d < -0.001 ? "SELL" : "NEUTRAL";
}


// ─────────────────────────────────────────────────────────────
// SAFE METAAPI WRAPPER
// ─────────────────────────────────────────────────────────────

class SafeAPI {
  private api: any;

  constructor(metaApi: any) { this.api = metaApi; }

  async modify(orderId: string, sl: number | null, tp: number | null): Promise<boolean> {
    try {
      await this.api.modifyPosition(orderId, sl, tp);
      return true;
    } catch (err: any) {
      if (err?.message?.includes("not found") || err?.numericCode === 10013 || err?.numericCode === 10016) {
        console.warn(`[SAFE] Position ${orderId} already closed`);
        return false;
      }
      console.error(`[SAFE] Modify error:`, err?.message || err);
      return false;
    }
  }

  async close(orderId: string): Promise<boolean> {
    try {
      await this.api.closePosition(orderId);
      return true;
    } catch (err: any) {
      console.warn(`[SAFE] Close error ${orderId}:`, err?.message);
      return false;
    }
  }

  async cancel(orderId: string): Promise<boolean> {
    try {
      await this.api.cancelOrder(orderId);
      return true;
    } catch (err: any) {
      console.warn(`[SAFE] Cancel error ${orderId}:`, err?.message);
      return false;
    }
  }

  async price(symbol: string) { return this.api.getSymbolPrice(symbol); }
  async candles(symbol: string, tf: string, count: number) { return this.api.getCandles(symbol, tf, count); }
  async buy(symbol: string, lots: number, sl?: number | null, tp?: number | null) { return this.api.createMarketBuyOrder(symbol, lots, sl, tp); }
  async sell(symbol: string, lots: number, sl?: number | null, tp?: number | null) { return this.api.createMarketSellOrder(symbol, lots, sl, tp); }
  async limitBuy(symbol: string, lots: number, price: number, sl: number, tp: number) { return this.api.createLimitBuyOrder(symbol, lots, price, sl, tp); }
  async limitSell(symbol: string, lots: number, price: number, sl: number, tp: number) { return this.api.createLimitSellOrder(symbol, lots, price, sl, tp); }
  async stopBuy(symbol: string, lots: number, price: number, sl: number, tp: number) { return this.api.createStopBuyOrder(symbol, lots, price, sl, tp); }
  async stopSell(symbol: string, lots: number, price: number, sl: number, tp: number) { return this.api.createStopSellOrder(symbol, lots, price, sl, tp); }
  async getPosition(posId: string) { return this.api.getPosition(posId); }
  async getPositions() { return this.api.getPositions(); }
  async getAccountInfo() { return this.api.getAccountInfo(); }

  async fillPrice(result: any): Promise<number> {
    try {
      if (result.positionId) {
        const pos = await this.api.getPosition(result.positionId);
        return pos?.openPrice || 0;
      }
      // orderId fallback: search open positions
      if (result.orderId) {
        const positions = await this.api.getPositions();
        if (Array.isArray(positions)) {
          const match = positions.find((p: any) => p.id === result.orderId);
          if (match?.openPrice) return match.openPrice;
          // Return latest position's price as best guess
          if (positions.length > 0) return positions[positions.length - 1].openPrice || 0;
        }
      }
      return 0;
    } catch { return 0; }
  }
}


// ─────────────────────────────────────────────────────────────
// MARKET MODE DETECTION (Code-basiert, KEIN AI nötig)
// ─────────────────────────────────────────────────────────────

async function detectMode(api: SafeAPI, symbol: string, config: StrategyConfig): Promise<{
  mode: MarketMode;
  confidence: number;
  adx: number; rsi: number; atr: number; bbWidth: number;
  support: number | null; resistance: number | null;
}> {
  const [c15, c5] = await Promise.all([
    api.candles(symbol, "M15", 100),
    api.candles(symbol, "M5", 50),
  ]);

  const adx = calcADX(c15, 14);
  const rsi = calcRSI(c15, 14);
  let atr = calcATR(c5, 14);
  const bbWidth = calcBBWidth(c15, 20);

  // ATR Minimum
  const min = config.minATR[symbol] || 0.001;
  if (atr < min) atr = min;

  // S/R Detection (einfache Cluster-Methode)
  const highs = c15.slice(-30).map((c: any) => c.high);
  const lows = c15.slice(-30).map((c: any) => c.low);
  const resistance = findCluster(highs);
  const support = findCluster(lows);

  let mode: MarketMode;
  let confidence: number;

  if (bbWidth < 0.003 && atr < min * 1.5) {
    mode = "SQUEEZE"; confidence = Math.min(95, 60 + (1 - bbWidth / 0.003) * 35);
  } else if (adx < 20 && resistance && support && rsi > 38 && rsi < 62) {
    mode = "RANGE"; confidence = Math.min(90, 50 + (20 - adx) * 2);
  } else {
    mode = "TREND"; confidence = Math.min(95, 40 + adx * 1.5);
  }

  return { mode, confidence, adx, rsi, atr, bbWidth, support, resistance };
}

function findCluster(values: number[], tolerance = 0.001): number | null {
  const sorted = [...values].sort((a, b) => a - b);
  let bestLevel = 0, bestCount = 0;
  for (const target of sorted) {
    const count = sorted.filter(v => Math.abs(v - target) / target < tolerance).length;
    if (count > bestCount) { bestCount = count; bestLevel = target; }
  }
  return bestCount >= 3 ? bestLevel : null;
}


// ─────────────────────────────────────────────────────────────
// SIGNAL SCORING (Code-basiert, AI optional)
// ─────────────────────────────────────────────────────────────

class SignalScorer {
  private channelStats = new Map<string, { wins: number; total: number }>();

  async score(api: SafeAPI, signal: any, channelId: string): Promise<SignalScore> {
    const sym = signal.symbol;
    const [m5, h1, h4, priceData] = await Promise.all([
      api.candles(sym, "M5", 50),
      api.candles(sym, "H1", 50),
      api.candles(sym, "H4", 30),
      api.price(sym),
    ]);

    const spread = priceData.ask - priceData.bid;
    const price = signal.action === "BUY" ? priceData.ask : priceData.bid;

    // 1. Confluence (0-20)
    const trends = [m5, h1, h4].map(getTrend);
    const confluence = (trends.filter(t => t === signal.action).length / 3) * 20;

    // 2. Trend Strength (0-15)
    const adx = calcADX(h1, 14);
    const trendStrength = Math.min(15, (adx / 40) * 15);

    // 3. S/R Level (0-20)
    const atr = calcATR(h1, 14);
    const levels = [...h1.map((c: any) => c.high), ...h1.map((c: any) => c.low)];
    const nearestSR = Math.min(...levels.map(l => Math.abs(price - l)));
    const srLevel = nearestSR < atr * 0.3 ? 20 : nearestSR < atr ? 10 : 0;

    // 4. Risk/Reward (0-15)
    let riskReward = 0;
    if (signal.stopLoss && signal.takeProfits?.length) {
      const risk = Math.abs(price - signal.stopLoss);
      const reward = Math.abs(signal.takeProfits[signal.takeProfits.length - 1] - price);
      const rr = risk > 0 ? reward / risk : 0;
      riskReward = rr >= 3 ? 15 : rr >= 2 ? 12 : rr >= 1.5 ? 8 : rr >= 1 ? 4 : 0;
    }

    // 5. Spread (0-10)
    const ns = DEFAULT_CONFIG.normalSpread[sym] || spread;
    const spreadScore = spread <= ns * 1.5 ? 10 : spread <= ns * 3 ? 5 : 0;

    // 6. Channel (0-20)
    const stats = this.channelStats.get(channelId) || { wins: 0, total: 0 };
    const wr = stats.total >= 5 ? stats.wins / stats.total : 0.5;
    const channelRecord = Math.round(wr * 20);

    const total = Math.round(confluence + trendStrength + srLevel + riskReward + spreadScore + channelRecord);
    const lotMultiplier = total >= 80 ? 1.0 : total >= 50 ? 0.5 : 0;

    console.log(`[SCORE] ${sym} ${signal.action}: ${total}/100 → ×${lotMultiplier}`);
    return { confluence, trendStrength, srLevel, riskReward, spreadScore, channelRecord, total, lotMultiplier };
  }

  record(channelId: string, result: "WIN" | "LOSS") {
    const s = this.channelStats.get(channelId) || { wins: 0, total: 0 };
    s.total++;
    if (result === "WIN") s.wins++;
    if (s.total > 20) { s.wins = Math.round((s.wins / s.total) * 20); s.total = 20; }
    this.channelStats.set(channelId, s);
  }
}


// ─────────────────────────────────────────────────────────────
// ANTI-TILT
// ─────────────────────────────────────────────────────────────

class AntiTilt {
  private results: ("WIN" | "LOSS")[] = [];
  private pauseUntil: Date | null = null;

  record(r: "WIN" | "LOSS") {
    this.results.push(r);
    if (this.results.length > 10) this.results.shift();
    if (this.streak() >= 5) {
      this.pauseUntil = new Date(Date.now() + 3600_000);
      console.log(`[TILT] 🛑 5 Losses → Pause 1h`);
    }
  }

  private streak(): number {
    let s = 0;
    for (let i = this.results.length - 1; i >= 0; i--) {
      if (this.results[i] === "LOSS") s++; else break;
    }
    return s;
  }

  lotMultiplier(): number {
    const s = this.streak();
    if (s >= 5) return 0;
    if (s >= 4) return 0.25;
    if (s >= 3) return 0.50;
    if (s >= 2) return 0.75;
    return 1.0;
  }

  isPaused(): boolean {
    if (!this.pauseUntil) return false;
    if (Date.now() > this.pauseUntil.getTime()) { this.pauseUntil = null; return false; }
    return true;
  }
}


// ─────────────────────────────────────────────────────────────
// CORRELATION CHECKER
// ─────────────────────────────────────────────────────────────

class CorrelationCheck {
  private openSymbols = new Set<string>();

  isAllowed(symbol: string, groups: Record<string, string[]>): boolean {
    for (const syms of Object.values(groups)) {
      if (!syms.includes(symbol)) continue;
      for (const s of syms) {
        if (s !== symbol && this.openSymbols.has(s)) {
          console.log(`[CORR] Blocked ${symbol} — ${s} already open`);
          return false;
        }
      }
    }
    return true;
  }

  open(symbol: string) { this.openSymbols.add(symbol); }
  close(symbol: string) { this.openSymbols.delete(symbol); }
}


// ─────────────────────────────────────────────────────────────
// VOLUME CONFIRMATION (Code-basiert)
// ─────────────────────────────────────────────────────────────

class VolumeCheck {
  async isConfirmed(api: SafeAPI, symbol: string): Promise<{ confirmed: boolean; ratio: number }> {
    try {
      const candles = await api.candles(symbol, "M15", 25);
      if (candles.length < 21) return { confirmed: true, ratio: 1.0 };

      const recent = candles.slice(-20, -1);
      const avgVol = recent.reduce((s: number, c: any) => s + (c.volume || c.tickVolume || 0), 0) / recent.length;
      const lastVol = candles[candles.length - 1].volume || candles[candles.length - 1].tickVolume || 0;

      if (avgVol === 0) return { confirmed: true, ratio: 1.0 };

      const ratio = lastVol / avgVol;
      return {
        confirmed: ratio >= 0.8,  // Mindestens 80% vom Durchschnitt
        ratio,
      };
    } catch {
      return { confirmed: true, ratio: 1.0 }; // Bei Fehler: nicht blockieren
    }
  }
}


// ─────────────────────────────────────────────────────────────
// NEWS STRADDLE (BUY + SELL Stop vor High-Impact News)
// ─────────────────────────────────────────────────────────────

class NewsStraddleEngine {
  private api: SafeAPI;
  private activeStraddles = new Map<string, { buyId: string; sellId: string; symbol: string; placedAt: Date }>();

  constructor(api: SafeAPI) { this.api = api; }

  // Manuell aufrufen wenn News ansteht (z.B. aus News-Kalender oder manuell)
  async placeStraddle(symbol: string, lotSize: number, config: StrategyConfig): Promise<string> {
    if (this.activeStraddles.has(symbol)) return "STRADDLE_ALREADY_ACTIVE";

    // Im Prop Firm Modus: kein Straddle (gleichzeitig BUY + SELL = Hedging)
    if (config.propFirmMode) return "SKIP:PROP_FIRM";

    try {
      const p = await this.api.price(symbol);
      const candles = await this.api.candles(symbol, "M5", 20);
      let atr = calcATR(candles, 14);
      const min = config.minATR[symbol] || 5;
      if (atr < min) atr = min;

      const offset = Math.max(atr * 1.5, 15 * pipSize(symbol));
      const slDist = offset * 1.3;

      const buyPrice = +(p.ask + offset).toFixed(2);
      const sellPrice = +(p.bid - offset).toFixed(2);

      // BUY STOP above price, SELL STOP below price
      const buyRes = await this.api.stopBuy(symbol, lotSize, buyPrice, +(buyPrice - slDist).toFixed(2), 0);
      const sellRes = await this.api.stopSell(symbol, lotSize, sellPrice, +(sellPrice + slDist).toFixed(2), 0);

      this.activeStraddles.set(symbol, {
        buyId: buyRes.orderId,
        sellId: sellRes.orderId,
        symbol,
        placedAt: new Date(),
      });

      console.log(`[STRADDLE] ${symbol} | BUY STOP @${buyPrice} | SELL STOP @${sellPrice}`);

      return `STRADDLE:${symbol}:BUY@${buyPrice}|SELL@${sellPrice}`;
    } catch (err) {
      console.error("[STRADDLE] Error:", err);
      return "STRADDLE:ERROR";
    }
  }

  async cleanup(symbol: string): Promise<void> {
    const straddle = this.activeStraddles.get(symbol);
    if (!straddle) return;

    // Cancel nicht getriggerte Orders
    await this.api.cancel(straddle.buyId);
    await this.api.cancel(straddle.sellId);
    this.activeStraddles.delete(symbol);
    console.log(`[STRADDLE] ${symbol} cleaned up`);
  }

  hasActive(symbol: string): boolean {
    return this.activeStraddles.has(symbol);
  }

  async cleanupExpired(): Promise<void> {
    for (const [sym, straddle] of this.activeStraddles) {
      if (Date.now() - straddle.placedAt.getTime() > 60_000) {
        await this.cleanup(sym);
      }
    }
  }
}


// ─────────────────────────────────────────────────────────────
// AI ENGINE (Token-optimiert — nur bei Signal + Post-Trade)
// ─────────────────────────────────────────────────────────────

class AIEngine {
  private anthropic: any;
  private config: StrategyConfig;

  constructor(anthropicClient: any, config: StrategyConfig) {
    this.anthropic = anthropicClient;
    this.config = config;
  }

  // ── Nur aufgerufen wenn ein Signal reinkommt ──
  async evaluateSignal(signal: any, indicators: {
    adx: number; rsi: number; atr: number; bbWidth: number;
    trends: string[]; support: number | null; resistance: number | null;
  }, channelWinRate: number): Promise<{
    verdict: "TRADE" | "SKIP" | "WAIT";
    adjustedSL?: number;
    adjustedTPs?: number[];
    reasoning: string;
    lotMultiplier: number;
  } | null> {
    if (!this.config.aiEnabled || !this.anthropic) return null;

    try {
      // Compressed prompt: ~150 Input Tokens
      const prompt = [
        `${signal.symbol}|${signal.action}@${signal.entryPrice || "MKT"}`,
        `SL:${signal.stopLoss}|TP:${(signal.takeProfits || []).join("/")}`,
        `ADX:${indicators.adx.toFixed(0)}|RSI:${indicators.rsi.toFixed(0)}|ATR:${indicators.atr.toFixed(1)}|BB:${indicators.bbWidth.toFixed(3)}`,
        `T:${indicators.trends.join("/")}|S:${indicators.support || "?"}|R:${indicators.resistance || "?"}`,
        `CH:${(channelWinRate * 100).toFixed(0)}%`,
      ].join("\n");

      const resp = await this.anthropic.messages.create({
        model: this.config.aiModel === "sonnet" ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: "GF Signal Judge. JSON only:{v,sl?,tp?,r,lm} v=TRADE/SKIP r=reason(max15words) lm=lot multiplier 0-1",
        messages: [{ role: "user", content: prompt }],
      });

      const text = resp.content[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const data = JSON.parse(clean);

      return {
        verdict: data.v || "TRADE",
        adjustedSL: data.sl || undefined,
        adjustedTPs: data.tp || undefined,
        reasoning: data.r || "",
        lotMultiplier: data.lm ?? 1.0,
      };
    } catch (err) {
      console.error("[AI] Signal eval error:", err);
      return null; // AI Fehler → falle auf Code-Scoring zurück
    }
  }

  // ── Nur aufgerufen nach Trade-Close ──
  async postTradeAnalysis(group: ActiveSignalGroup, pnl: number): Promise<{
    lesson: string;
    parameterSuggestions?: Record<string, number>;
  } | null> {
    if (!this.config.aiEnabled || !this.anthropic) return null;

    try {
      const prompt = [
        `${group.symbol}|${group.direction}|Entry:${group.entryPrice}|PnL:${pnl > 0 ? "+" : ""}${pnl.toFixed(0)}`,
        `TPs:${group.step.tp1Hit ? "1" : "0"}${group.step.tp2Hit ? "2" : ""}${group.step.tp3Hit ? "3" : ""}`,
        `DCA:${group.dca.triggered1 ? "1" : "0"}${group.dca.triggered2 ? "2" : ""}|REC:${group.recovery.triggered ? "Y" : "N"}`,
        `PYR:${group.pyramid.triggered ? "Y" : "N"}|Age:${((Date.now() - group.openedAt.getTime()) / 60000).toFixed(0)}m`,
      ].join("|");

      const resp = await this.anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        system: "GF Post-Trade. JSON:{l,p?} l=lesson(max20words) p=optional param suggestions",
        messages: [{ role: "user", content: prompt }],
      });

      const text = resp.content[0]?.text || "";
      const data = JSON.parse(text.replace(/```json|```/g, "").trim());
      return { lesson: data.l || "", parameterSuggestions: data.p || undefined };
    } catch {
      return null;
    }
  }
}


// ═══════════════════════════════════════════════════════════════
// MASTER STRATEGY ENGINE
// ═══════════════════════════════════════════════════════════════

class MasterStrategyEngine {
  private api: SafeAPI;
  private supabase: any;
  private config: StrategyConfig;

  private scorer: SignalScorer;
  private tilt: AntiTilt;
  private correlation: CorrelationCheck;
  private ai: AIEngine;
  private volumeChecker: VolumeCheck;
  private newsStraddle: NewsStraddleEngine;

  private groups = new Map<string, ActiveSignalGroup>();
  private grids = new Map<string, GridSession>();
  private reEntryCandidates: ReEntryCandidate[] = [];
  private locks = new Set<string>();

  // Price + Candle Cache
  private priceCache = new Map<string, { bid: number; ask: number; spread: number; ts: number }>();
  private candleCache = new Map<string, { data: any[]; ts: number }>();
  private readonly CACHE_TTL = 10_000;  // 10 Sek
  private readonly CANDLE_TTL = 300_000; // 5 Min

  constructor(metaApi: any, supabase: any, anthropic?: any, config?: Partial<StrategyConfig>) {
    this.api = new SafeAPI(metaApi);
    this.supabase = supabase;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.scorer = new SignalScorer();
    this.tilt = new AntiTilt();
    this.correlation = new CorrelationCheck();
    this.ai = new AIEngine(anthropic || null, this.config);
    this.volumeChecker = new VolumeCheck();
    this.newsStraddle = new NewsStraddleEngine(this.api);

    console.log("[ENGINE] v3 FINAL — 13 systems, AI on-demand only");
  }


  // ═══════════════════════════════════════════════════════════
  // TICK — Läuft alle 30 Sek, aber AI wird NICHT gecalled
  // ═══════════════════════════════════════════════════════════

  async tick(): Promise<void> {
    // Weekend → defensiv
    if (this.isWeekend()) { await this.weekendProtect(); return; }

    // Cleanup expired straddles (>60s old)
    await this.newsStraddle.cleanupExpired();

    // Keine offenen Gruppen UND kein Grid → NICHTS TUN
    const activeGroups = [...this.groups.values()].filter(g => g.status !== "CLOSED");
    const activeGrids = [...this.grids.values()].filter(g => g.mode === "ACTIVE");

    if (activeGroups.length === 0 && activeGrids.length === 0) return; // 💤 0 API Calls

    // ── Für jede aktive Gruppe: Code-basiertes Management ──
    for (const [key, group] of this.groups) {
      if (group.status === "CLOSED") continue;
      if (this.locks.has(key)) continue;
      this.locks.add(key);

      try {
        const p = await this.getPrice(group.symbol);
        const current = group.direction === "BUY" ? p.bid : p.ask;

        // 1. DCA Check
        if (this.config.dcaEnabled) await this.checkDCA(group, current);

        // 2. Zone Recovery Check
        if (this.config.recoveryEnabled && !this.config.propFirmMode) await this.checkRecovery(group, current, p.spread);

        // 3. Step + ATR Trailing
        if (this.config.trailEnabled) await this.updateTrail(group, current);

        // 4. Pyramiding
        if (this.config.pyramidEnabled) await this.checkPyramid(group, current);

        // 5. Time Decay
        if (this.config.timeDecayEnabled) await this.checkTimeDecay(group, current);

        // 6. Recovery Order trailern
        if (group.recovery.order?.status === "OPEN") await this.trailRecovery(group, current);

        // 7. Pyramid Order trailern (wie ein zweiter Runner)
        if (group.pyramid.order?.status === "OPEN" && group.step.tp2Hit) {
          await this.trailPyramid(group, current);
        }

        // 8. Prüfe ob alles geschlossen
        await this.checkGroupClosed(key, group);

      } finally {
        this.locks.delete(key);
      }
    }

    // ── Grid Monitor ──
    for (const [symbol, grid] of this.grids) {
      if (grid.mode === "ACTIVE") await this.monitorGrid(symbol, grid);
    }

    // ── Re-Entry Check ──
    if (this.config.reEntryEnabled && !this.tilt.isPaused()) {
      await this.checkReEntries();
    }
  }


  // ═══════════════════════════════════════════════════════════
  // PROCESS SIGNAL — Hier kommt AI ins Spiel (einziger Punkt!)
  // ═══════════════════════════════════════════════════════════

  async processSignal(signal: any, channelId: string): Promise<string> {
    const sym = signal.symbol;

    // Grid aktiv? → skip
    if (this.grids.has(sym) && this.grids.get(sym)!.mode === "ACTIVE") {
      return "SKIP:GRID_ACTIVE";
    }

    // Symbol bereits aktiv?
    for (const g of this.groups.values()) {
      if (g.symbol === sym && g.status !== "CLOSED") return "SKIP:ALREADY_ACTIVE";
    }

    // Anti-Tilt Pause?
    if (this.config.tiltEnabled && this.tilt.isPaused()) return "SKIP:TILT_PAUSE";

    // Correlation?
    if (!this.correlation.isAllowed(sym, this.config.correlationGroups)) return "SKIP:CORRELATION";

    // Spread Check
    const p = await this.getPrice(sym);
    const ns = this.config.normalSpread[sym] || p.ask - p.bid;
    if ((p.ask - p.bid) > ns * 3) return "SKIP:SPREAD_HIGH";

    // Session Check
    if (!this.isActiveSession()) return "SKIP:OUTSIDE_SESSION";

    // ── Code-basiertes Signal Scoring ──
    let lotMult = 1.0;
    if (this.config.scoringEnabled) {
      const score = await this.scorer.score(this.api, signal, channelId);
      if (score.lotMultiplier === 0) return `SKIP:LOW_SCORE:${score.total}`;
      lotMult = score.lotMultiplier;
    }

    // ── Anti-Tilt Lot-Anpassung ──
    if (this.config.tiltEnabled) lotMult *= this.tilt.lotMultiplier();

    // ── Volume Confirmation ──
    if (this.config.volumeEnabled) {
      const vol = await this.volumeChecker.isConfirmed(this.api, sym);
      if (!vol.confirmed) {
        console.log(`[VOL] ${sym}: weak volume (${vol.ratio.toFixed(2)}) → halbe Lots`);
        lotMult *= 0.5;
      }
    }

    // ── AI Signal Evaluation (EINZIGER AI CALL!) ──
    if (this.config.aiEnabled) {
      const mode = await detectMode(this.api, sym, this.config);
      const aiResult = await this.ai.evaluateSignal(signal, {
        adx: mode.adx, rsi: mode.rsi, atr: mode.atr, bbWidth: mode.bbWidth,
        trends: [getTrend(await this.api.candles(sym, "M5", 20)),
                 getTrend(await this.api.candles(sym, "H1", 20)),
                 getTrend(await this.api.candles(sym, "H4", 20))].map(String),
        support: mode.support, resistance: mode.resistance,
      }, 0.5);

      if (aiResult) {
        if (aiResult.verdict === "SKIP") return `SKIP:AI:${aiResult.reasoning}`;
        lotMult *= aiResult.lotMultiplier;
        if (aiResult.adjustedSL) signal.stopLoss = aiResult.adjustedSL;
        if (aiResult.adjustedTPs) signal.takeProfits = aiResult.adjustedTPs;
        console.log(`[AI] ${aiResult.verdict}: ${aiResult.reasoning}`);
      }
    }

    // ── Market Mode → Grid bei Range ──
    const mode = await detectMode(this.api, sym, this.config);
    if (mode.mode === "RANGE" && this.config.gridEnabled && mode.support && mode.resistance) {
      await this.activateGrid(sym, mode.support, mode.resistance);
    }

    // ── Signal-Gruppe erstellen ──
    signal._lotMult = lotMult;
    this.correlation.open(sym);
    return await this.createGroup(signal, channelId, lotMult);
  }


  // ═══════════════════════════════════════════════════════════
  // DCA
  // ═══════════════════════════════════════════════════════════

  private async checkDCA(g: ActiveSignalGroup, price: number) {
    if (!g.stopLoss || g.breakEvenTriggered || g.entryPrice === 0) return; // Nach BE kein DCA mehr nötig

    const dist = Math.abs(g.entryPrice - g.stopLoss);
    const fromEntry = Math.abs(price - g.entryPrice);
    const pct = dist > 0 ? fromEntry / dist : 0;

    const wrong = g.direction === "BUY" ? price < g.entryPrice : price > g.entryPrice;
    if (!wrong) return;

    const maxLot = Math.max(...g.orders.map(o => o.lots));

    // DCA1 @ 33%
    if (!g.dca.triggered1 && pct >= this.config.dcaTrigger1) {
      const lots = +(maxLot * this.config.dcaLot1Pct / 100).toFixed(2);
      if (lots >= 0.01) {
        const res = g.direction === "BUY"
          ? await this.api.buy(g.symbol, lots, g.stopLoss)
          : await this.api.sell(g.symbol, lots, g.stopLoss);
        const fill = await this.api.fillPrice(res) || price;
        g.dca.orders.push({ orderId: res.orderId, price: fill, lots, level: 1, status: "OPEN" });
        g.dca.triggered1 = true;
        console.log(`[DCA1] ${g.symbol} ${lots}L @ ${fill}`);
      }
    }

    // DCA2 @ 60%
    if (g.dca.triggered1 && !g.dca.triggered2 && pct >= this.config.dcaTrigger2) {
      const lots = +(maxLot * this.config.dcaLot2Pct / 100).toFixed(2);
      if (lots >= 0.01) {
        const res = g.direction === "BUY"
          ? await this.api.buy(g.symbol, lots, g.stopLoss)
          : await this.api.sell(g.symbol, lots, g.stopLoss);
        const fill = await this.api.fillPrice(res) || price;
        g.dca.orders.push({ orderId: res.orderId, price: fill, lots, level: 2, status: "OPEN" });
        g.dca.triggered2 = true;
        console.log(`[DCA2] ${g.symbol} ${lots}L @ ${fill}`);
      }
    }
  }


  // ═══════════════════════════════════════════════════════════
  // ZONE RECOVERY
  // ═══════════════════════════════════════════════════════════

  private async checkRecovery(g: ActiveSignalGroup, price: number, spread: number) {
    if (g.recovery.triggered || !g.stopLoss || g.entryPrice === 0) return;

    // Spread-Schutz
    const ns = this.config.normalSpread[g.symbol] || spread;
    if (spread > ns * 3) return;

    const dist = Math.abs(g.entryPrice - g.stopLoss);
    const fromEntry = Math.abs(price - g.entryPrice);
    const pct = dist > 0 ? fromEntry / dist : 0;

    const wrong = g.direction === "BUY" ? price < g.entryPrice : price > g.entryPrice;
    if (!wrong || pct < this.config.recoveryTriggerPct) return;

    // Lots berechnen
    const openLots = g.orders.filter(o => o.status === "OPEN").reduce((s, o) => s + o.lots, 0)
      + g.dca.orders.filter(o => o.status === "OPEN").reduce((s, o) => s + o.lots, 0);
    const lots = +(openLots * this.config.recoveryLotPct / 100).toFixed(2);
    if (lots < 0.01) return;

    const dir: Direction = g.direction === "BUY" ? "SELL" : "BUY";
    const sl = g.entryPrice;
    const tp = dir === "BUY" ? +(price + dist).toFixed(2) : +(price - dist).toFixed(2);

    console.log(`[RECOVERY] ${dir} ${g.symbol} ${lots}L | SL:${sl} TP:${tp}`);

    const res = dir === "BUY"
      ? await this.api.buy(g.symbol, lots, sl, tp)
      : await this.api.sell(g.symbol, lots, sl, tp);
    const fill = await this.api.fillPrice(res) || price;

    g.recovery.order = { orderId: res.orderId, direction: dir, price: fill, lots, sl, tp, status: "OPEN" };
    g.recovery.triggered = true;
  }


  // ═══════════════════════════════════════════════════════════
  // STEP + ATR TRAILING
  // ═══════════════════════════════════════════════════════════

  private async updateTrail(g: ActiveSignalGroup, price: number) {
    const pip = pipSize(g.symbol);
    const tps = g.takeProfits;

    // Prüfe ALLE TPs auf einmal (Gap-Schutz)
    const hits = tps.map(tp => g.direction === "BUY" ? price >= tp : price <= tp);
    const highest = hits.lastIndexOf(true);

    // TP1 hit → alle auf BE
    if (highest >= 0 && !g.step.tp1Hit) {
      const be = g.direction === "BUY"
        ? g.entryPrice + this.config.beOffsetPips * pip
        : g.entryPrice - this.config.beOffsetPips * pip;
      await this.moveAllSL(g, be);
      g.step.tp1Hit = true;
      g.step.currentStepSL = be;
      g.breakEvenTriggered = true;
      const o = g.orders.find(o => o.role === "TP1"); if (o) o.status = "CLOSED";
    }

    // TP2 hit → SL auf TP1
    if (highest >= 1 && g.step.tp1Hit && !g.step.tp2Hit && tps[0]) {
      await this.moveAllSL(g, tps[0]);
      g.step.tp2Hit = true;
      g.step.currentStepSL = tps[0];
      const o = g.orders.find(o => o.role === "TP2"); if (o) o.status = "CLOSED";
    }

    // TP3 hit → Runner SL auf TP2
    if (highest >= 2 && g.step.tp2Hit && !g.step.tp3Hit && tps[1]) {
      const runner = g.orders.find(o => o.role === "RUNNER" && o.status === "OPEN");
      if (runner) await this.api.modify(runner.orderId, tps[1], null);
      g.step.tp3Hit = true;
      g.step.currentStepSL = tps[1];
      const o = g.orders.find(o => o.role === "TP3"); if (o) o.status = "CLOSED";
    }

    // ATR Trail auf Runner (ab TP2)
    if (g.step.tp2Hit) {
      const runner = g.orders.find(o => o.role === "RUNNER" && o.status === "OPEN");
      if (runner) {
        const c5 = await this.getCachedCandles(g.symbol, "M5", 20);
        let atr = calcATR(c5, 14);
        const min = this.config.minATR[g.symbol] || 0.001;
        if (atr < min) atr = min;

        const trail = atr * this.config.atrMultiplier;
        const atrSL = g.direction === "BUY"
          ? +(price - trail).toFixed(2)
          : +(price + trail).toFixed(2);

        const stepSL = g.step.currentStepSL || 0;
        const best = g.direction === "BUY" ? Math.max(atrSL, stepSL) : Math.min(atrSL, stepSL || Infinity);
        const current = g.trailingSL || 0;
        const better = g.direction === "BUY" ? best > current : best < current;

        if (better) {
          if (await this.api.modify(runner.orderId, best, null)) {
            g.trailingSL = best;
          }
        }
      }
    }
  }

  private async moveAllSL(g: ActiveSignalGroup, sl: number) {
    for (const o of g.orders) {
      if (o.status === "OPEN") {
        if (!await this.api.modify(o.orderId, sl, o.tp)) o.status = "CLOSED";
      }
    }
    for (const d of g.dca.orders) {
      if (d.status === "OPEN") {
        if (!await this.api.modify(d.orderId, sl, null)) d.status = "CLOSED";
      }
    }
    // FIX: Pyramid Order auch mitziehen
    if (g.pyramid.order?.status === "OPEN") {
      const better = g.direction === "BUY" ? sl > g.pyramid.order.sl : sl < g.pyramid.order.sl;
      if (better) {
        if (await this.api.modify(g.pyramid.order.orderId, sl, null)) {
          g.pyramid.order.sl = sl;
        }
      }
    }
    g.stopLoss = sl;
    g.trailingSL = sl;
  }


  // ═══════════════════════════════════════════════════════════
  // RECOVERY TRAILING
  // ═══════════════════════════════════════════════════════════

  private async trailRecovery(g: ActiveSignalGroup, price: number) {
    const rec = g.recovery.order!;
    const inProfit = rec.direction === "BUY" ? price > rec.price : price < rec.price;
    if (!inProfit) return;

    const c5 = await this.getCachedCandles(g.symbol, "M5", 20);
    let atr = calcATR(c5, 14);
    const min = this.config.minATR[g.symbol] || 5;
    if (atr < min) atr = min;

    const newSL = rec.direction === "BUY"
      ? +(price - atr * this.config.atrMultiplier).toFixed(2)
      : +(price + atr * this.config.atrMultiplier).toFixed(2);

    const better = rec.direction === "BUY" ? newSL > rec.sl : newSL < rec.sl;
    if (better) {
      if (await this.api.modify(rec.orderId, newSL, rec.tp)) rec.sl = newSL;
    }
  }


  // ═══════════════════════════════════════════════════════════
  // PYRAMIDING
  // ═══════════════════════════════════════════════════════════

  private async checkPyramid(g: ActiveSignalGroup, price: number) {
    if (g.pyramid.triggered || !g.step.tp2Hit) return;

    const runner = g.orders.find(o => o.role === "RUNNER" && o.status === "OPEN");
    if (!runner) return;

    // ADX noch stark?
    const c15 = await this.getCachedCandles(g.symbol, "M15", 30);
    if (calcADX(c15) < 25) return;

    const lots = +(runner.lots * this.config.pyramidLotPct / 100).toFixed(2);
    if (lots < 0.01) return;

    const sl = g.takeProfits[1]; // TP2 = gesicherter Profit
    if (!sl) return;

    const res = g.direction === "BUY"
      ? await this.api.buy(g.symbol, lots, sl)
      : await this.api.sell(g.symbol, lots, sl);
    const fill = await this.api.fillPrice(res) || price;

    g.pyramid.order = { orderId: res.orderId, price: fill, lots, sl, status: "OPEN" };
    g.pyramid.triggered = true;
    console.log(`[PYRAMID] ${g.direction} ${g.symbol} +${lots}L @ ${fill}`);
  }

  // ── Pyramid ATR Trailing (wie ein zweiter Runner) ──
  private async trailPyramid(g: ActiveSignalGroup, price: number) {
    const pyr = g.pyramid.order!;
    const inProfit = g.direction === "BUY" ? price > pyr.price : price < pyr.price;
    if (!inProfit) return;

    const c5 = await this.getCachedCandles(g.symbol, "M5", 20);
    let atr = calcATR(c5, 14);
    const min = this.config.minATR[g.symbol] || 5;
    if (atr < min) atr = min;

    const newSL = g.direction === "BUY"
      ? +(price - atr * this.config.atrMultiplier).toFixed(2)
      : +(price + atr * this.config.atrMultiplier).toFixed(2);

    const better = g.direction === "BUY" ? newSL > pyr.sl : newSL < pyr.sl;
    if (better) {
      if (await this.api.modify(pyr.orderId, newSL, null)) {
        pyr.sl = newSL;
      }
    }
  }


  // ═══════════════════════════════════════════════════════════
  // TIME DECAY
  // ═══════════════════════════════════════════════════════════

  private async checkTimeDecay(g: ActiveSignalGroup, price: number) {
    const age = (Date.now() - g.openedAt.getTime()) / 3600_000; // hours

    if (age >= this.config.timeDecayCloseHours) {
      // 8h+ → alles schließen
      for (const o of g.orders) {
        if (o.status === "OPEN") { await this.api.close(o.orderId); o.status = "CLOSED"; }
      }
      for (const d of g.dca.orders) {
        if (d.status === "OPEN") { await this.api.close(d.orderId); d.status = "CLOSED"; }
      }
      if (g.recovery.order?.status === "OPEN") {
        await this.api.close(g.recovery.order.orderId); g.recovery.order.status = "CLOSED";
      }
      if (g.pyramid.order?.status === "OPEN") {
        await this.api.close(g.pyramid.order.orderId); g.pyramid.order.status = "CLOSED";
      }
      console.log(`[DECAY] ${g.symbol} ${age.toFixed(1)}h → CLOSE ALL`);
      return;
    }

    if (age >= this.config.timeDecayTightenHours && !g.step.tp1Hit && g.stopLoss) {
      // 4h+ → SL enger
      const dist = Math.abs(g.entryPrice - g.stopLoss);
      const tighter = g.direction === "BUY"
        ? g.entryPrice - dist * 0.5
        : g.entryPrice + dist * 0.5;
      const current = g.trailingSL || g.stopLoss;
      const better = g.direction === "BUY" ? tighter > current : tighter < current;
      if (better) await this.moveAllSL(g, tighter);
    }
  }


  // ═══════════════════════════════════════════════════════════
  // GROUP CLOSED → AI Post-Trade (zweiter AI Call)
  // ═══════════════════════════════════════════════════════════

  private async checkGroupClosed(key: string, g: ActiveSignalGroup) {
    const open = g.orders.filter(o => o.status === "OPEN").length
      + g.dca.orders.filter(o => o.status === "OPEN").length
      + (g.recovery.order?.status === "OPEN" ? 1 : 0)
      + (g.pyramid.order?.status === "OPEN" ? 1 : 0);

    if (open > 0) return;

    g.status = "CLOSED";
    this.correlation.close(g.symbol);

    // PnL schätzen
    const pnl = this.estimatePnL(g);
    const result = pnl >= 0 ? "WIN" : "LOSS";

    // Anti-Tilt
    if (this.config.tiltEnabled) this.tilt.record(result);

    // Channel Score
    this.scorer.record(g.channelId, result);

    // Re-Entry Candidate
    if (this.config.reEntryEnabled && result === "LOSS" && !g.step.tp1Hit) {
      this.reEntryCandidates.push({
        direction: g.direction, symbol: g.symbol,
        closedAt: new Date(),
        cooldownUntil: new Date(Date.now() + this.config.reEntryCooldownMin * 60_000),
        attempted: false, originalLots: g.orders[0]?.lots || 0.01, originalSL: g.stopLoss,
      });
    }

    // ── AI Post-Trade (ZWEITER und LETZTER AI Call) ──
    if (this.config.aiEnabled) {
      const analysis = await this.ai.postTradeAnalysis(g, pnl);
      if (analysis) console.log(`[AI-POST] ${analysis.lesson}`);
    }

    console.log(`[CLOSED] ${g.symbol} ${g.direction} | ${result} | PnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}`);
    await this.logTrade(g, pnl, result);
  }

  private estimatePnL(g: ActiveSignalGroup): number {
    // Simplified PnL estimation
    let pnl = 0;
    const pip = pipSize(g.symbol);
    for (const o of g.orders) {
      if (o.status === "CLOSED" && o.tp) {
        const dist = g.direction === "BUY" ? (o.tp - g.entryPrice) : (g.entryPrice - o.tp);
        pnl += dist / pip * o.lots * 10;
      }
    }
    return pnl;
  }


  // ═══════════════════════════════════════════════════════════
  // RE-ENTRY
  // ═══════════════════════════════════════════════════════════

  private async checkReEntries() {
    for (const c of this.reEntryCandidates) {
      if (c.attempted || Date.now() < c.cooldownUntil.getTime()) continue;

      const candles = await this.getCachedCandles(c.symbol, "M15", 10);
      const trend = getTrend(candles);
      if (trend !== c.direction) continue;

      c.attempted = true;
      const lots = +(c.originalLots * this.config.reEntryLotPct / 100).toFixed(2);
      if (lots < 0.01) continue;

      console.log(`[RE-ENTRY] ${c.direction} ${c.symbol} ${lots}L`);
      await this.processSignal({
        action: c.direction, symbol: c.symbol,
        stopLoss: c.originalSL, takeProfits: [],
        _isReEntry: true,
      }, "RE-ENTRY");
    }

    // Cleanup alte Candidates (>2h)
    this.reEntryCandidates = this.reEntryCandidates.filter(
      c => Date.now() - c.closedAt.getTime() < 7200_000
    );
  }


  // ═══════════════════════════════════════════════════════════
  // GRID
  // ═══════════════════════════════════════════════════════════

  private async activateGrid(symbol: string, support: number, resistance: number) {
    if (this.grids.has(symbol)) return;

    const range = resistance - support;
    const pip = pipSize(symbol);
    if (range / pip < this.config.gridMinRangePips) return;

    const step = range / 6;
    const levels: GridLevel[] = [];
    const mid = (resistance + support) / 2;
    const currentPrice = (await this.getPrice(symbol)).bid;

    // Prop Firm Mode: nur EINE Richtung (kein Hedging!)
    // Unter Mitte = nur BUYs, über Mitte = nur SELLs
    const propFirmDir: Direction | null = this.config.propFirmMode
      ? (currentPrice < mid ? "BUY" : "SELL")
      : null;

    for (let i = 1; i <= 5; i++) {
      const p = +(support + step * i).toFixed(2);
      let dir: Direction = p < mid ? "BUY" : "SELL";

      // Prop Firm: nur erlaubte Richtung
      if (propFirmDir && dir !== propFirmDir) continue;

      const tp = dir === "BUY" ? +(p + step).toFixed(2) : +(p - step).toFixed(2);
      const sl = dir === "BUY" ? +(support - step * 0.5).toFixed(2) : +(resistance + step * 0.5).toFixed(2);

      try {
        const res = dir === "BUY"
          ? await this.api.limitBuy(symbol, this.config.gridLotSize, p, sl, tp)
          : await this.api.limitSell(symbol, this.config.gridLotSize, p, sl, tp);
        levels.push({ price: p, direction: dir, orderId: res.orderId, status: "PENDING", tp, sl, lots: this.config.gridLotSize });
      } catch {}
    }

    if (levels.length === 0) return; // Keine Levels platziert

    this.grids.set(symbol, { symbol, mode: "ACTIVE", rangeHigh: resistance, rangeLow: support, levels, maxOpenPositions: 3, createdAt: new Date() });
    console.log(`[GRID] ${symbol} activated: ${support}-${resistance} | ${levels.length} levels${propFirmDir ? ` (${propFirmDir} only)` : ""}`);
  }

  private async monitorGrid(symbol: string, grid: GridSession) {
    const p = await this.getPrice(symbol);
    const buf = (grid.rangeHigh - grid.rangeLow) * 0.15;

    // Breakout?
    if (p.bid > grid.rangeHigh + buf || p.bid < grid.rangeLow - buf) {
      console.log(`[GRID] ${symbol} BREAKOUT @ ${p.bid}`);
      for (const l of grid.levels) {
        if (l.orderId && l.status === "PENDING") await this.api.cancel(l.orderId);
        l.status = "CANCELLED";
      }
      grid.mode = "CLOSED";
      this.grids.delete(symbol);
    }
  }


  // ═══════════════════════════════════════════════════════════
  // CREATE GROUP (Order Execution)
  // ═══════════════════════════════════════════════════════════

  private async createGroup(signal: any, channelId: string, lotMult: number): Promise<string> {
    const sym = signal.symbol;
    const dir = signal.action as Direction;
    const sl = signal.stopLoss;
    const tps = signal.takeProfits || [];

    // Lot-Berechnung: Risk% × Balance / (SL Distance × Pip Value)
    // Wenn kein SL → Fallback auf feste Lots
    let baseLot = 0.10; // Fallback
    if (sl && signal.entryPrice) {
      try {
        const account = await this.api.price(sym); // Preis für Pip-Wert
        const slDistPips = Math.abs(signal.entryPrice - sl) / pipSize(sym);
        const pipValue = pipSize(sym) * 10; // ~$1 pro Pip bei 0.01L für Forex, ~$0.10 für Gold
        const riskPercent = 0.01; // 1% Risiko pro Trade
        let balance = 10000;
        try {
          const accInfo = await this.api.getAccountInfo();
          balance = accInfo?.balance || accInfo?.equity || 10000;
        } catch { /* Fallback auf 10k */ }
        const riskAmount = balance * riskPercent;
        if (slDistPips > 0 && pipValue > 0) {
          baseLot = +(riskAmount / (slDistPips * pipValue * 100)).toFixed(2);
          baseLot = Math.max(0.01, Math.min(baseLot, 5.0)); // Min 0.01, Max 5.0
        }
      } catch {
        baseLot = 0.10; // Fallback bei Fehler
      }
    }
    baseLot = +(baseLot * lotMult).toFixed(2);
    const split = [0.30, 0.25, 0.25, 0.20]; // TP1, TP2, TP3, Runner
    const roles: Array<"TP1" | "TP2" | "TP3" | "RUNNER"> = ["TP1", "TP2", "TP3", "RUNNER"];
    const orders: ActiveSignalGroup["orders"] = [];

    for (let i = 0; i < 4; i++) {
      const lots = +(baseLot * split[i]).toFixed(2);
      if (lots < 0.01) continue;
      const tp = i < 3 ? tps[i] || null : null; // Runner hat kein TP

      const res = dir === "BUY"
        ? await this.api.buy(sym, lots, sl, tp)
        : await this.api.sell(sym, lots, sl, tp);

      orders.push({ orderId: res.orderId, lots, tp, status: "OPEN", role: roles[i] });
    }

    const fill = orders.length > 0 ? (await this.api.fillPrice(orders[0]) || 0) : 0;

    // FIX: Wenn Fill-Preis nicht verfügbar, nutze aktuellen Preis
    const priceData = await this.getPrice(sym);
    const entryPrice = fill > 0 ? fill : (dir === "BUY" ? priceData.ask : priceData.bid);

    const group: ActiveSignalGroup = {
      id: `${channelId}-${sym}-${Date.now()}`,
      channelId, symbol: sym, direction: dir,
      entryPrice, stopLoss: sl, takeProfits: tps,
      orders, status: "OPEN", openedAt: new Date(),
      signalScore: 0,
      dca: { orders: [], triggered1: false, triggered2: false },
      recovery: { order: null, triggered: false },
      step: { tp1Hit: false, tp2Hit: false, tp3Hit: false, currentStepSL: null },
      pyramid: { order: null, triggered: false },
      trailingSL: sl, breakEvenTriggered: false,
    };

    this.groups.set(`${channelId}:${sym}`, group);
    console.log(`[OPEN] ${dir} ${sym} | ${orders.length} orders | Lots ×${lotMult.toFixed(2)} | Entry: ${entryPrice}`);
    return `OPENED:${group.id}`;
  }


  // ═══════════════════════════════════════════════════════════
  // SAFETY + UTILS
  // ═══════════════════════════════════════════════════════════

  private isWeekend(): boolean {
    const d = new Date();
    return (d.getUTCDay() === 5 && d.getUTCHours() >= 22) || d.getUTCDay() === 6 || (d.getUTCDay() === 0 && d.getUTCHours() < 22);
  }

  private isActiveSession(): boolean {
    const h = new Date().getUTCHours();
    return h >= 7 && h < 21;
  }

  private async weekendProtect() {
    for (const g of this.groups.values()) {
      if (g.status === "CLOSED") continue;
      if (g.recovery.order?.status === "OPEN") {
        await this.api.close(g.recovery.order.orderId);
        g.recovery.order.status = "CLOSED";
      }
      for (const d of g.dca.orders) {
        if (d.status === "OPEN") { await this.api.close(d.orderId); d.status = "CLOSED"; }
      }
      if (g.pyramid.order?.status === "OPEN") {
        await this.api.close(g.pyramid.order.orderId);
        g.pyramid.order.status = "CLOSED";
      }
    }
    for (const [sym, grid] of this.grids) {
      for (const l of grid.levels) {
        if (l.orderId && l.status === "PENDING") await this.api.cancel(l.orderId);
      }
      grid.mode = "CLOSED";
    }
    this.grids.clear();
  }

  private async getPrice(symbol: string) {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL) return cached;
    const p = await this.api.price(symbol);
    const data = { bid: p.bid, ask: p.ask, spread: p.ask - p.bid, ts: Date.now() };
    this.priceCache.set(symbol, data);
    return data;
  }

  private async getCachedCandles(symbol: string, tf: string, count: number) {
    const key = `${symbol}:${tf}:${count}`;
    const cached = this.candleCache.get(key);
    if (cached && Date.now() - cached.ts < this.CANDLE_TTL) return cached.data;
    const data = await this.api.candles(symbol, tf, count);
    this.candleCache.set(key, { data, ts: Date.now() });
    return data;
  }

  private async logTrade(g: ActiveSignalGroup, pnl: number, result: string) {
    try {
      await this.supabase.from("trade_log").insert({
        group_id: g.id, channel_id: g.channelId, symbol: g.symbol,
        direction: g.direction, entry: g.entryPrice, pnl,
        result, dca_used: g.dca.triggered1, recovery_used: g.recovery.triggered,
        pyramid_used: g.pyramid.triggered, score: g.signalScore,
        duration_min: (Date.now() - g.openedAt.getTime()) / 60_000,
        created_at: new Date().toISOString(),
      });
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC: News Straddle (manuell oder per News-Kalender)
  // ═══════════════════════════════════════════════════════════

  async placeNewsStraddle(symbol: string): Promise<string> {
    if (!this.config.straddleEnabled) return "SKIP:STRADDLE_DISABLED";
    return this.newsStraddle.placeStraddle(symbol, this.config.straddleLotSize, this.config);
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC: Status / Debug
  // ═══════════════════════════════════════════════════════════

  getStatus(): {
    activeGroups: number;
    activeGrids: number;
    tiltPaused: boolean;
    tiltMultiplier: number;
    openSymbols: string[];
  } {
    const activeGroups = [...this.groups.values()].filter(g => g.status !== "CLOSED");
    return {
      activeGroups: activeGroups.length,
      activeGrids: [...this.grids.values()].filter(g => g.mode === "ACTIVE").length,
      tiltPaused: this.tilt.isPaused(),
      tiltMultiplier: this.tilt.lotMultiplier(),
      openSymbols: activeGroups.map(g => g.symbol),
    };
  }
}


// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────

export { MasterStrategyEngine, DEFAULT_CONFIG };
export type { StrategyConfig, ActiveSignalGroup, MarketMode };

// ─────────────────────────────────────────────────────────────
// USAGE:
//
// import { MasterStrategyEngine } from "./strategy-engine-v3";
// import Anthropic from "@anthropic-ai/sdk";
//
// const engine = new MasterStrategyEngine(
//   metaApi,                    // MetaApi Client
//   supabase,                   // Supabase Client
//   new Anthropic(),            // Optional: AI (null = nur Code-Scoring)
//   { testMode: true }          // Config Overrides
// );
//
// // Tick alle 30 Sek (0 API Calls wenn nichts offen!)
// setInterval(() => engine.tick(), 30_000);
//
// // Signal von Telegram:
// const result = await engine.processSignal(parsedSignal, channelId);
//
// AI CALLS:
// - Signal kommt rein → 1 Haiku Call (~150 Tokens) → $0.00004
// - Trade geschlossen → 1 Haiku Call (~100 Tokens) → $0.00003
// - 10 Signals/Tag = 20 Calls = ~$0.001/Tag = $0.03/Monat
// - Rest ist Code-basiert: 0 AI Kosten
// ─────────────────────────────────────────────────────────────
