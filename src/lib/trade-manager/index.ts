// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — AI TRADE MANAGER
//
// Claude Haiku analysiert offene Positionen und entscheidet
// dynamisch: Halten, absichern, teilschließen.
//
// ECHTE Daten: Candles für Momentum, S/R von Highs/Lows,
// Cooldown pro Position, News-Integration.
// ═══════════════════════════════════════════════════════════════

import { cachedCall, PROMPTS } from "@/lib/ai/cached-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const log = (level: string, msg: string, data?: any) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [AI-MANAGER] [${level}] ${msg}`, data ? JSON.stringify(data) : "");
};

// ─────────────────────────────────────────────────────────────
// POSITION CONTEXT — Was wir dem AI Manager pro Trade geben
// ─────────────────────────────────────────────────────────────

export interface PositionContext {
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number | null;
  lots: number;
  openDurationMinutes: number;
  unrealizedPnl: number;
  unrealizedPips: number;
  rMultiple: number;
  session: "ASIAN" | "LONDON" | "NEWYORK" | "CLOSED";
  atr14: number;
  spread: number;
  momentum5m: number;
  momentum15m: number;
  momentum30m: number;
  trendDirection: "UP" | "DOWN" | "SIDEWAYS";
  nearestSupport: number;
  nearestResistance: number;
  balance: number;
  equity: number;
  ddBufferPercent: number;
  totalOpenTrades: number;
  dayOfWeek: number;
  hourUTC: number;
  minutesToNextNews: number | null;
}

// ─────────────────────────────────────────────────────────────
// AI ANALYSIS — Pro Position
// ─────────────────────────────────────────────────────────────

export interface ManagementDecision {
  decision: "HOLD" | "TIGHTEN_SL" | "PARTIAL_CLOSE" | "MOVE_BE" | "CLOSE_ALL" | "WIDEN_SL";
  newSL: number | null;
  closePercent: number | null;
  confidence: number;
  reason: string;
}

export async function analyzePosition(ctx: PositionContext): Promise<ManagementDecision> {
  const message = `
POSITION: ${ctx.direction} ${ctx.symbol} @ ${ctx.entryPrice}
Aktuell: ${ctx.currentPrice} | SL: ${ctx.stopLoss} | TP: ${ctx.takeProfit || "kein"}
Lots: ${ctx.lots} | Offen seit: ${ctx.openDurationMinutes} Min
P&L: ${ctx.unrealizedPnl > 0 ? "+" : ""}${ctx.unrealizedPnl.toFixed(2)} (${ctx.unrealizedPips.toFixed(1)} Pips, ${ctx.rMultiple.toFixed(1)}R)

MARKT: Session: ${ctx.session} | ATR: ${ctx.atr14.toFixed(2)} | Spread: ${ctx.spread.toFixed(1)}
Momentum 5m: ${ctx.momentum5m > 0 ? "+" : ""}${ctx.momentum5m.toFixed(2)} | 15m: ${ctx.momentum15m > 0 ? "+" : ""}${ctx.momentum15m.toFixed(2)} | 30m: ${ctx.momentum30m > 0 ? "+" : ""}${ctx.momentum30m.toFixed(2)}
Trend: ${ctx.trendDirection} | Support: ${ctx.nearestSupport} | Resistance: ${ctx.nearestResistance}

ACCOUNT: Balance: ${ctx.balance} | DD-Buffer: ${ctx.ddBufferPercent.toFixed(1)}% | Open Trades: ${ctx.totalOpenTrades}
Zeit: Tag ${ctx.dayOfWeek}, ${ctx.hourUTC}:00 UTC ${ctx.minutesToNextNews != null ? `| News in ${ctx.minutesToNextNews} Min` : ""}

Was tun?`;

  try {
    const text = await cachedCall({
      prompt: PROMPTS.tradeManager,
      message,
      maxTokens: 150,
    });

    const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      decision: parsed.decision || "HOLD",
      newSL: parsed.newSL ?? null,
      closePercent: parsed.closePercent ?? null,
      confidence: parsed.confidence ?? 0,
      reason: parsed.reason || "Keine Begründung",
    };
  } catch (err) {
    log("ERROR", "AI analysis failed", { error: (err as Error).message });
    return { decision: "HOLD", newSL: null, closePercent: null, confidence: 0, reason: "Analysis error — holding" };
  }
}

// ─────────────────────────────────────────────────────────────
// CANDLE-BASIERTE MARKTDATEN (echte Daten statt Math.random)
// ─────────────────────────────────────────────────────────────

function getPipMultiplier(symbol: string): number {
  if (symbol.includes("XAU")) return 10;
  if (symbol.includes("JPY")) return 100;
  return 10000;
}

function getPipSize(symbol: string): number {
  if (symbol.includes("XAU")) return 0.1;
  if (symbol.includes("JPY")) return 0.01;
  return 0.0001;
}

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  tickVolume?: number;
}

async function fetchCandles(conn: any, symbol: string, timeframe: string, count: number): Promise<CandleData[]> {
  try {
    const candles = await conn.getCandle(symbol, timeframe, count);
    if (Array.isArray(candles)) return candles;
    if (candles) return [candles];
    return [];
  } catch {
    return [];
  }
}

function calculateMomentum(candles: CandleData[]): number {
  if (candles.length < 2) return 0;
  const first = candles[0].close;
  const last = candles[candles.length - 1].close;
  return last - first;
}

function calculateATR(candles: CandleData[]): number {
  if (candles.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    sum += tr;
  }
  return sum / (candles.length - 1);
}

function findSupportResistance(candles: CandleData[], currentPrice: number): { support: number; resistance: number } {
  if (candles.length < 5) return { support: currentPrice - 5, resistance: currentPrice + 5 };

  const highs = candles.map(c => c.high).sort((a, b) => b - a);
  const lows = candles.map(c => c.low).sort((a, b) => a - b);

  // Nächster Support: Höchstes Low unter aktuellem Preis
  const support = lows.find(l => l < currentPrice) ?? currentPrice - 5;
  // Nächste Resistance: Niedrigstes High über aktuellem Preis
  const resistance = highs.find(h => h > currentPrice) ?? currentPrice + 5;

  return { support, resistance };
}

// ─────────────────────────────────────────────────────────────
// NEWS-INTEGRATION
// ─────────────────────────────────────────────────────────────

async function getMinutesToNextNews(): Promise<number | null> {
  try {
    const db = createSupabaseAdmin();
    const now = new Date();
    const { data } = await db
      .from("economic_calendar")
      .select("event_time, tier")
      .gte("event_time", now.toISOString())
      .lte("event_time", new Date(now.getTime() + 120 * 60000).toISOString())
      .in("tier", [0, 1])
      .order("event_time", { ascending: true })
      .limit(1);

    if (data?.length) {
      return (new Date(data[0].event_time).getTime() - now.getTime()) / 60000;
    }
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// TRADE MANAGER — Mit Cooldown + echten Daten
// ─────────────────────────────────────────────────────────────

interface DecisionRecord {
  time: number;
  decision: ManagementDecision;
  positionId: string;
}

export class AITradeManager {
  private conn: any;
  private running = false;
  private interval: any;
  private decisionLog: Array<{ time: Date; position: string; decision: ManagementDecision }> = [];

  // Cooldown: Min 3 Minuten zwischen Entscheidungen pro Position
  private lastDecision: Map<string, DecisionRecord> = new Map();
  private readonly COOLDOWN_MS = 3 * 60 * 1000;

  // Max AI-Calls pro Zyklus (Kostenkontrolle)
  private readonly MAX_CALLS_PER_CYCLE = 5;

  constructor(conn: any) {
    this.conn = conn;
  }

  async start(intervalMs: number = 30000) {
    this.running = true;
    log("INFO", `Started — analyzing every ${intervalMs / 1000}s`);

    this.interval = setInterval(async () => {
      if (!this.running) return;
      try {
        await this.analyzeAll();
      } catch (err) {
        log("ERROR", "Cycle error", { error: (err as Error).message });
      }
    }, intervalMs);

    // First run immediately
    await this.analyzeAll();
  }

  stop() {
    this.running = false;
    if (this.interval) clearInterval(this.interval);
    log("INFO", "Stopped");
  }

  private shouldAnalyze(positionId: string, currentDecision?: string): boolean {
    const last = this.lastDecision.get(positionId);
    if (!last) return true;

    const elapsed = Date.now() - last.time;

    // Immer analysieren nach Cooldown
    if (elapsed >= this.COOLDOWN_MS) return true;

    // Innerhalb Cooldown: Nur wenn letzte Entscheidung HOLD war (kein Flip-Flopping)
    if (last.decision.decision !== "HOLD") return false;

    return false;
  }

  private recordDecision(positionId: string, decision: ManagementDecision) {
    this.lastDecision.set(positionId, {
      time: Date.now(),
      decision,
      positionId,
    });

    // Alte Einträge aufräumen (Positionen die nicht mehr offen sind)
    if (this.lastDecision.size > 50) {
      const cutoff = Date.now() - 30 * 60 * 1000;
      for (const [id, record] of this.lastDecision) {
        if (record.time < cutoff) this.lastDecision.delete(id);
      }
    }
  }

  private async analyzeAll() {
    const positions = await this.conn.getPositions();
    if (!positions.length) return;

    const accountInfo = await this.conn.getAccountInformation();
    const now = new Date();
    const hour = now.getUTCHours();
    const session = hour >= 0 && hour < 8 ? "ASIAN" : hour < 15 ? "LONDON" : hour < 22 ? "NEWYORK" : "CLOSED";
    const minutesToNews = await getMinutesToNextNews();

    // DD-Buffer basierend auf DB-Daten
    let ddLimit = accountInfo.balance * 0.9; // Fallback: 10% fixed DD
    try {
      const db = createSupabaseAdmin();
      const { data: acc } = await db.from("slave_accounts")
        .select("dd_limit, dd_type, equity_high")
        .eq("copier_active", true)
        .limit(1)
        .single();
      if (acc) ddLimit = Number(acc.dd_limit);
    } catch {}

    const ddBuffer = accountInfo.equity > 0
      ? ((accountInfo.equity - ddLimit) / accountInfo.equity) * 100
      : 0;

    let callsThisCycle = 0;

    for (const pos of positions) {
      // Cooldown-Check
      if (!this.shouldAnalyze(pos.id)) continue;

      // Max Calls pro Zyklus
      if (callsThisCycle >= this.MAX_CALLS_PER_CYCLE) break;

      const openMinutes = (Date.now() - new Date(pos.openTime).getTime()) / 60000;
      if (openMinutes < 2) continue; // Zu frisch

      const price = await this.conn.getSymbolPrice(pos.symbol);
      const direction = pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
      const currentPrice = direction === "BUY" ? price.bid : price.ask;
      const pipMult = getPipMultiplier(pos.symbol);
      const pnlPips = direction === "BUY"
        ? (currentPrice - pos.openPrice) * pipMult
        : (pos.openPrice - currentPrice) * pipMult;
      const slDistance = pos.stopLoss
        ? Math.abs(pos.openPrice - pos.stopLoss) * pipMult
        : 50;
      const rMultiple = slDistance > 0 ? pnlPips / slDistance : 0;

      // Echte Candle-Daten für Momentum
      const [candles5m, candles15m, candles30m, candles1h] = await Promise.all([
        fetchCandles(this.conn, pos.symbol, "5m", 6),
        fetchCandles(this.conn, pos.symbol, "15m", 6),
        fetchCandles(this.conn, pos.symbol, "30m", 6),
        fetchCandles(this.conn, pos.symbol, "1h", 20),
      ]);

      const momentum5m = calculateMomentum(candles5m);
      const momentum15m = calculateMomentum(candles15m);
      const momentum30m = calculateMomentum(candles30m);
      const atr14 = calculateATR(candles1h);
      const { support, resistance } = findSupportResistance(candles1h, currentPrice);

      // Trend aus Momentum ableiten
      const pipSize = getPipSize(pos.symbol);
      const trendThreshold = 5 * pipSize; // 5 Pips
      const trendDirection = momentum30m > trendThreshold ? "UP"
        : momentum30m < -trendThreshold ? "DOWN"
        : "SIDEWAYS";

      const ctx: PositionContext = {
        symbol: pos.symbol,
        direction: direction as "BUY" | "SELL",
        entryPrice: pos.openPrice,
        currentPrice,
        stopLoss: pos.stopLoss || 0,
        takeProfit: pos.takeProfit || null,
        lots: pos.volume,
        openDurationMinutes: Math.round(openMinutes),
        unrealizedPnl: pos.unrealizedProfit || 0,
        unrealizedPips: pnlPips,
        rMultiple,
        session: session as any,
        atr14,
        spread: price.ask - price.bid,
        momentum5m,
        momentum15m,
        momentum30m,
        trendDirection,
        nearestSupport: support,
        nearestResistance: resistance,
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        ddBufferPercent: ddBuffer,
        totalOpenTrades: positions.length,
        dayOfWeek: now.getUTCDay(),
        hourUTC: hour,
        minutesToNextNews: minutesToNews,
      };

      callsThisCycle++;
      const decision = await analyzePosition(ctx);

      // Nur ausführen wenn Confidence hoch genug UND kein Widerspruch zur letzten Entscheidung
      const lastDec = this.lastDecision.get(pos.id);
      const isFlipFlop = lastDec &&
        Date.now() - lastDec.time < 5 * 60 * 1000 &&
        lastDec.decision.decision !== "HOLD" &&
        decision.decision !== "HOLD" &&
        lastDec.decision.decision !== decision.decision;

      if (decision.confidence >= 70 && !isFlipFlop) {
        await this.executeDecision(pos.id, pos, decision);
      } else if (isFlipFlop) {
        log("WARN", `Flip-Flop verhindert: ${pos.symbol} ${lastDec!.decision.decision} → ${decision.decision}`);
      }

      this.recordDecision(pos.id, decision);

      this.decisionLog.push({
        time: now,
        position: `${direction} ${pos.symbol} @ ${pos.openPrice}`,
        decision,
      });

      if (this.decisionLog.length > 500) {
        this.decisionLog = this.decisionLog.slice(-200);
      }
    }
  }

  private async executeDecision(positionId: string, pos: any, decision: ManagementDecision) {
    try {
      switch (decision.decision) {
        case "HOLD":
          break;

        case "TIGHTEN_SL":
          if (decision.newSL) {
            // Validierung: SL darf nur in Profit-Richtung bewegt werden
            const isBuy = pos.type === "POSITION_TYPE_BUY";
            const validTighten = isBuy
              ? decision.newSL > pos.stopLoss
              : decision.newSL < pos.stopLoss || pos.stopLoss === 0;
            if (validTighten) {
              await this.conn.modifyPosition(positionId, decision.newSL, pos.takeProfit);
              log("INFO", `${pos.symbol} SL -> ${decision.newSL} (${decision.reason})`);
            }
          }
          break;

        case "MOVE_BE": {
          const pipSize = getPipSize(pos.symbol);
          const buffer = pipSize * 2; // 2 Pips Buffer
          const bePrice = pos.type === "POSITION_TYPE_BUY"
            ? pos.openPrice + buffer
            : pos.openPrice - buffer;
          // Nur wenn BE besser als aktueller SL
          const isBetter = pos.type === "POSITION_TYPE_BUY"
            ? bePrice > (pos.stopLoss || 0)
            : bePrice < pos.stopLoss || pos.stopLoss === 0;
          if (isBetter) {
            await this.conn.modifyPosition(positionId, bePrice, pos.takeProfit);
            log("INFO", `${pos.symbol} SL -> BE ${bePrice} (${decision.reason})`);
          }
          break;
        }

        case "PARTIAL_CLOSE":
          if (decision.closePercent) {
            const closeLots = +(pos.volume * decision.closePercent / 100).toFixed(2);
            if (closeLots >= 0.01) {
              await this.conn.closePositionPartially(positionId, closeLots);
              log("INFO", `${pos.symbol} partial close ${decision.closePercent}% = ${closeLots}L (${decision.reason})`);
            }
          }
          break;

        case "CLOSE_ALL":
          await this.conn.closePosition(positionId);
          log("INFO", `${pos.symbol} CLOSED (${decision.reason})`);
          break;

        case "WIDEN_SL":
          if (decision.newSL && pos.stopLoss) {
            const pipSize = getPipSize(pos.symbol);
            const maxWiden = 10 * pipSize; // Max 10 Pips weiten
            const currentSLDist = Math.abs(pos.openPrice - pos.stopLoss);
            const newSLDist = Math.abs(pos.openPrice - decision.newSL);
            if (newSLDist <= currentSLDist + maxWiden) {
              await this.conn.modifyPosition(positionId, decision.newSL, pos.takeProfit);
              log("INFO", `${pos.symbol} SL widened -> ${decision.newSL} (${decision.reason})`);
            }
          }
          break;
      }
    } catch (err) {
      log("ERROR", `Execute failed for ${pos.symbol}`, { error: (err as Error).message });
    }
  }

  getRecentDecisions(n: number = 20) {
    return this.decisionLog.slice(-n);
  }
}

// ─────────────────────────────────────────────────────────────
// TRIGGER-BASED ANALYSIS
// ─────────────────────────────────────────────────────────────

export interface Trigger {
  type: string;
  position: any;
  context: Partial<PositionContext>;
}

export function checkTriggers(positions: any[], prices: Map<string, any>): Trigger[] {
  const triggers: Trigger[] = [];

  for (const pos of positions) {
    const price = prices.get(pos.symbol);
    if (!price) continue;

    const direction = pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
    const currentPrice = direction === "BUY" ? price.bid : price.ask;
    const pipMult = getPipMultiplier(pos.symbol);
    const pnlPips = direction === "BUY"
      ? (currentPrice - pos.openPrice) * pipMult
      : (pos.openPrice - currentPrice) * pipMult;
    const slDist = Math.abs(pos.openPrice - (pos.stopLoss || pos.openPrice - 5));
    const slDistPips = slDist * pipMult;
    const rMultiple = slDistPips > 0 ? pnlPips / slDistPips : 0;

    // Trigger 1: R-Multiple Milestones
    if (rMultiple >= 1 && rMultiple < 1.1) {
      triggers.push({ type: "R_MILESTONE_1", position: pos, context: { rMultiple } });
    } else if (rMultiple >= 2 && rMultiple < 2.1) {
      triggers.push({ type: "R_MILESTONE_2", position: pos, context: { rMultiple } });
    } else if (rMultiple >= 3 && rMultiple < 3.1) {
      triggers.push({ type: "R_MILESTONE_3", position: pos, context: { rMultiple } });
    }

    // Trigger 2: SL in danger
    if (pos.stopLoss) {
      const distToSL = Math.abs(currentPrice - pos.stopLoss);
      const totalSLDist = Math.abs(pos.openPrice - pos.stopLoss);
      if (distToSL < totalSLDist * 0.3 && pnlPips < 0) {
        triggers.push({ type: "SL_DANGER", position: pos, context: { rMultiple } });
      }
    }

    // Trigger 3: Stale trade (>2h, no significant movement)
    const openMinutes = (Date.now() - new Date(pos.openTime).getTime()) / 60000;
    if (openMinutes > 120 && Math.abs(rMultiple) < 0.3) {
      triggers.push({ type: "STALE_TRADE", position: pos, context: { rMultiple, openDurationMinutes: openMinutes } });
    }

    // Trigger 4: Session change
    const hour = new Date().getUTCHours();
    const minute = new Date().getUTCMinutes();
    if ((hour === 8 && minute < 2) || (hour === 13 && minute < 2) || (hour === 21 && minute < 2)) {
      triggers.push({ type: "SESSION_CHANGE", position: pos, context: { rMultiple } });
    }
  }

  return triggers;
}
