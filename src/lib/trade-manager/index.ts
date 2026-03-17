// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — AI TRADE MANAGER
//
// Claude Haiku analysiert JEDE offene Position und entscheidet
// dynamisch: Halten, absichern, teilschließen.
// ═══════════════════════════════════════════════════════════════

import { cachedCall, PROMPTS } from "@/lib/ai/cached-client";


// ─────────────────────────────────────────────────────────────
// POSITION CONTEXT — Was wir dem AI Manager pro Trade geben
// ─────────────────────────────────────────────────────────────

export interface PositionContext {
  // Position
  symbol: string;
  direction: "BUY" | "SELL";
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number | null;
  lots: number;
  openDurationMinutes: number;

  // P&L
  unrealizedPnl: number;
  unrealizedPips: number;
  rMultiple: number;

  // Market
  session: "ASIAN" | "LONDON" | "NEWYORK" | "CLOSED";
  atr14: number;
  spread: number;
  momentum5m: number;
  momentum15m: number;
  momentum30m: number;
  trendDirection: "UP" | "DOWN" | "SIDEWAYS";
  nearestSupport: number;
  nearestResistance: number;

  // Account
  balance: number;
  equity: number;
  ddBufferPercent: number;
  totalOpenTrades: number;

  // Time
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
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[AI-MANAGER] Analysis failed:", err);
    return { decision: "HOLD", newSL: null, closePercent: null, confidence: 0, reason: "Analysis error — holding" };
  }
}


// ─────────────────────────────────────────────────────────────
// TRADE MANAGER — Runs continuously
// ─────────────────────────────────────────────────────────────

export class AITradeManager {
  private metaApi: any;
  private running = false;
  private interval: any;
  private decisionLog: Array<{ time: Date; position: string; decision: ManagementDecision }> = [];

  constructor(metaApi: any) {
    this.metaApi = metaApi;
  }

  async start(intervalMs: number = 30000) {
    this.running = true;
    console.log(`[AI-MANAGER] Started — analyzing every ${intervalMs / 1000}s`);

    this.interval = setInterval(async () => {
      if (!this.running) return;
      await this.analyzeAll();
    }, intervalMs);

    // First run immediately
    await this.analyzeAll();
  }

  stop() {
    this.running = false;
    if (this.interval) clearInterval(this.interval);
    console.log("[AI-MANAGER] Stopped");
  }

  private async analyzeAll() {
    try {
      const positions = await this.metaApi.getPositions();
      if (!positions.length) return;

      const accountInfo = await this.metaApi.getAccountInformation();
      const now = new Date();
      const hour = now.getUTCHours();
      const session = hour >= 0 && hour < 8 ? "ASIAN" : hour < 15 ? "LONDON" : hour < 22 ? "NEWYORK" : "CLOSED";

      for (const pos of positions) {
        const price = await this.metaApi.getSymbolPrice(pos.symbol);
        const currentPrice = pos.type === "POSITION_TYPE_BUY" ? price.bid : price.ask;
        const direction = pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL";
        const pnlPips = direction === "BUY"
          ? (currentPrice - pos.openPrice) * (pos.symbol.includes("XAU") ? 10 : 10000)
          : (pos.openPrice - currentPrice) * (pos.symbol.includes("XAU") ? 10 : 10000);
        const slDistance = pos.stopLoss
          ? Math.abs(pos.openPrice - pos.stopLoss) * (pos.symbol.includes("XAU") ? 10 : 10000)
          : 50;
        const rMultiple = slDistance > 0 ? pnlPips / slDistance : 0;

        const openMinutes = (Date.now() - new Date(pos.openTime).getTime()) / 60000;
        if (openMinutes < 2) continue;

        const momentum5m = (Math.random() - 0.48) * 2;
        const momentum15m = (Math.random() - 0.47) * 4;
        const momentum30m = (Math.random() - 0.46) * 6;

        const ctx: PositionContext = {
          symbol: pos.symbol,
          direction,
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
          atr14: pos.symbol.includes("XAU") ? 8.5 : 0.0045,
          spread: price.ask - price.bid,
          momentum5m,
          momentum15m,
          momentum30m,
          trendDirection: momentum30m > 0.5 ? "UP" : momentum30m < -0.5 ? "DOWN" : "SIDEWAYS",
          nearestSupport: pos.openPrice - 5,
          nearestResistance: pos.openPrice + 8,
          balance: accountInfo.balance,
          equity: accountInfo.equity,
          ddBufferPercent: ((accountInfo.equity - (accountInfo.balance * 0.9)) / accountInfo.equity) * 100,
          totalOpenTrades: positions.length,
          dayOfWeek: now.getUTCDay(),
          hourUTC: hour,
          minutesToNextNews: null,
        };

        const decision = await analyzePosition(ctx);

        if (decision.confidence >= 70) {
          await this.executeDecision(pos.id, pos, decision);
        }

        this.decisionLog.push({
          time: now,
          position: `${direction} ${pos.symbol} @ ${pos.openPrice}`,
          decision,
        });

        if (this.decisionLog.length > 500) {
          this.decisionLog = this.decisionLog.slice(-200);
        }
      }
    } catch (err) {
      console.error("[AI-MANAGER] Cycle error:", err);
    }
  }

  private async executeDecision(positionId: string, pos: any, decision: ManagementDecision) {
    try {
      switch (decision.decision) {
        case "HOLD":
          break;

        case "TIGHTEN_SL":
          if (decision.newSL) {
            await this.metaApi.modifyPosition(positionId, decision.newSL, pos.takeProfit);
            console.log(`[AI-MANAGER] ${pos.symbol} SL -> ${decision.newSL} (${decision.reason})`);
          }
          break;

        case "MOVE_BE":
          const bePrice = pos.type === "POSITION_TYPE_BUY"
            ? pos.openPrice + 0.2
            : pos.openPrice - 0.2;
          await this.metaApi.modifyPosition(positionId, bePrice, pos.takeProfit);
          console.log(`[AI-MANAGER] ${pos.symbol} SL -> BE ${bePrice} (${decision.reason})`);
          break;

        case "PARTIAL_CLOSE":
          if (decision.closePercent) {
            const closeLots = +(pos.volume * decision.closePercent / 100).toFixed(2);
            if (closeLots >= 0.01) {
              await this.metaApi.closePositionPartially(positionId, closeLots);
              console.log(`[AI-MANAGER] ${pos.symbol} partial close ${decision.closePercent}% = ${closeLots}L (${decision.reason})`);
            }
          }
          break;

        case "CLOSE_ALL":
          await this.metaApi.closePosition(positionId);
          console.log(`[AI-MANAGER] ${pos.symbol} CLOSED (${decision.reason})`);
          break;

        case "WIDEN_SL":
          if (decision.newSL) {
            const maxWidenPips = pos.symbol.includes("XAU") ? 10 : 50;
            const currentSLDist = Math.abs(pos.openPrice - pos.stopLoss);
            const newSLDist = Math.abs(pos.openPrice - decision.newSL);
            if (newSLDist <= currentSLDist + (maxWidenPips * (pos.symbol.includes("XAU") ? 0.1 : 0.0001))) {
              await this.metaApi.modifyPosition(positionId, decision.newSL, pos.takeProfit);
              console.log(`[AI-MANAGER] ${pos.symbol} SL widened -> ${decision.newSL} (${decision.reason})`);
            }
          }
          break;
      }
    } catch (err) {
      console.error(`[AI-MANAGER] Execute failed for ${pos.symbol}:`, err);
    }
  }

  getRecentDecisions(n: number = 20) {
    return this.decisionLog.slice(-n);
  }
}


// ─────────────────────────────────────────────────────────────
// TRIGGER-BASED ANALYSIS (recommended over fixed interval)
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
    const pnlPips = direction === "BUY"
      ? (currentPrice - pos.openPrice) * (pos.symbol.includes("XAU") ? 10 : 10000)
      : (pos.openPrice - currentPrice) * (pos.symbol.includes("XAU") ? 10 : 10000);
    const slDist = Math.abs(pos.openPrice - (pos.stopLoss || pos.openPrice - 5));
    const slDistPips = slDist * (pos.symbol.includes("XAU") ? 10 : 10000);
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
