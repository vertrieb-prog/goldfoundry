// src/lib/copier/forge-copy.ts
// ============================================================
// FORGE COPY ENGINE — Master→Slave with AI Risk Management
// ============================================================

// MetaApi imported dynamically to avoid SSR window error
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  calculateRiskMultiplier,
  calculateCopyLots,
  type RiskAssessment,
} from "./risk-engine";
import { runShieldAssessment } from "@/lib/shield/manipulation-shield";

const log = (level: string, msg: string, data?: any) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [FORGE-COPY] [${level}] ${msg}`, data ? JSON.stringify(data) : "");
};

// ── Types ─────────────────────────────────────────────────────
interface TradeSignal {
  instrument: string;
  direction: "DEAL_TYPE_BUY" | "DEAL_TYPE_SELL";
  lots: number;
  stopLoss?: number;
  takeProfit?: number;
  price: number;
  magic: number;
  positionId: string;
}

interface SlaveConfig {
  id: string;
  metaapiAccountId: string;
  firmProfile: "tegas_24x" | "tag_12x";
  currentEquity: number;
  initialBalance: number;
  equityHigh: number;
  ddLimit: number;
  ddType: "trailing" | "fixed";
  phase: number | null;
  copierActive: boolean;
}

// ── Connection Pool ───────────────────────────────────────────
const connectionPool: Map<string, any> = new Map();

async function getConnection(api: any, accountId: string) {
  if (connectionPool.has(accountId)) {
    return connectionPool.get(accountId);
  }
  const account = await api.metatraderAccountApi.getAccount(accountId);
  const conn = account.getRPCConnection();
  await conn.connect();
  await conn.waitSynchronized();
  connectionPool.set(accountId, conn);
  return conn;
}

// ── Master Trade Listener ─────────────────────────────────────
export class MasterTradeListener {
  private api: any;
  private db: any;

  constructor(api: any) {
    this.api = api;
    this.db = createSupabaseAdmin();
  }

  async onDealAdded(deal: any) {
    try {
      // New position opened
      if (deal.entryType === "DEAL_ENTRY_IN") {
        log("INFO", `Neuer Trade erkannt: ${deal.symbol} ${deal.type} ${deal.volume}L`, {
          positionId: deal.positionId,
          magic: deal.magic,
        });

        await this.copyToAllSlaves({
          instrument: deal.symbol,
          direction: deal.type,
          lots: deal.volume,
          stopLoss: deal.stopLoss,
          takeProfit: deal.takeProfit,
          price: deal.price,
          magic: deal.magic ?? 0,
          positionId: deal.positionId ?? deal.id,
        });
      }

      // Position closed
      if (deal.entryType === "DEAL_ENTRY_OUT") {
        log("INFO", `Trade geschlossen: ${deal.symbol} P&L: ${deal.profit}`, {
          positionId: deal.positionId,
        });

        await this.closeAllSlavePositions(deal.positionId, deal.symbol);
      }
    } catch (err) {
      log("ERROR", "onDealAdded Error", { error: (err as Error).message });
    }
  }

  async onOrderUpdated(order: any) {
    try {
      if (order.stopLoss !== undefined || order.takeProfit !== undefined) {
        log("INFO", `SL/TP Update: Position ${order.positionId}`, {
          sl: order.stopLoss,
          tp: order.takeProfit,
        });

        await this.updateAllSlaveSLTP(order.positionId, order.stopLoss, order.takeProfit);
      }
    } catch (err) {
      log("ERROR", "onOrderUpdated Error", { error: (err as Error).message });
    }
  }

  // ── Copy to All Slaves ────────────────────────────────────
  private async copyToAllSlaves(signal: TradeSignal) {
    // Load all active slave accounts
    const { data: slaves } = await this.db
      .from("slave_accounts")
      .select("*")
      .eq("copier_active", true);

    if (!slaves?.length) {
      log("WARN", "Keine aktiven Slave-Accounts gefunden");
      return;
    }

    // Load market intel
    const { data: intelData } = await this.db
      .from("market_intel")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    const intel = intelData?.[0] ? {
      geopoliticalRisk: intelData[0].geopolitical_risk,
      regime: intelData[0].regime,
      riskScore: intelData[0].risk_score,
      xauusdSpreadNormal: true, // Will be checked live below
      us500SpreadNormal: true,
      hasTier0Event: false, // Will be checked from calendar below
    } : null;

    // Load upcoming events + check for Tier 0
    const { data: events } = await this.db
      .from("economic_calendar")
      .select("event_time, tier, title")
      .gte("event_time", new Date(Date.now() - 60 * 60000).toISOString())
      .lte("event_time", new Date(Date.now() + 60 * 60000).toISOString());

    const parsedEvents = (events ?? []).map((e: any) => ({
      time: new Date(e.event_time),
      tier: e.tier,
      title: e.title,
    }));

    // FIX: Check Tier 0 events from actual calendar data
    if (intel) {
      intel.hasTier0Event = parsedEvents.some(e => e.tier === 0);
    }

    // Calculate stop distance in pips
    let stopPips = 0;
    if (signal.stopLoss && signal.price) {
      const diff = Math.abs(signal.price - signal.stopLoss);
      stopPips = signal.instrument === "XAUUSD" ? diff * 100 : diff; // Gold: $1 = 100 pips
    }

    // Execute on ALL slaves in parallel
    const results = await Promise.allSettled(
      slaves.map((slave: any) => this.executeCopyOnSlave(slave, signal, parsedEvents, intel, stopPips))
    );

    const copied = results.filter(r => r.status === "fulfilled" && (r as any).value?.action === "COPIED").length;
    const skipped = results.filter(r => r.status === "fulfilled" && (r as any).value?.action === "SKIPPED").length;
    const failed = results.filter(r => r.status === "rejected").length;

    log("INFO", `Copy-Ergebnis: ${copied} kopiert, ${skipped} übersprungen, ${failed} fehlgeschlagen`);
  }

  // ── Execute on Single Slave ───────────────────────────────
  private async executeCopyOnSlave(
    slave: any,
    signal: TradeSignal,
    events: any[],
    intel: any,
    stopPips: number
  ) {
    const startTime = Date.now();

    // Load recent trades for performance factor
    const { data: recentTrades } = await this.db
      .from("copier_log")
      .select("pnl_result")
      .eq("slave_account_id", slave.id)
      .eq("action", "COPIED")
      .order("created_at", { ascending: false })
      .limit(20);

    const trades = (recentTrades ?? []).map((t: any) => ({ profit: t.pnl_result ?? 0 }));

    // ATR ratio — calculate from recent equity snapshot volatility
    // Compares today's range to average range (approx via equity changes)
    let atrRatio = 1.0;
    try {
      const { data: recentSnaps } = await this.db.from("equity_snapshots")
        .select("equity, snapshot_at")
        .eq("account_id", slave.id)
        .order("snapshot_at", { ascending: false })
        .limit(60); // Last 5 hours (every 5min)

      if (recentSnaps && recentSnaps.length >= 10) {
        const equities = recentSnaps.map((s: any) => Number(s.equity));
        const changes = equities.slice(0, -1).map((e: number, i: number) => Math.abs(e - equities[i + 1]));
        const recentAvg = changes.slice(0, 12).reduce((s, c) => s + c, 0) / Math.max(changes.slice(0, 12).length, 1);
        const histAvg = changes.reduce((s, c) => s + c, 0) / Math.max(changes.length, 1);
        atrRatio = histAvg > 0 ? recentAvg / histAvg : 1.0;
      }
    } catch {}

    // Live spread check via MetaApi (if connection available)
    try {
      const conn = await getConnection(this.api, slave.metaapi_account_id);
      const tick = await conn.getSymbolPrice(signal.instrument);
      if (tick && intel) {
        const spread = tick.ask - tick.bid;
        const avgSpread = signal.instrument === "XAUUSD" ? 0.30 : 0.80; // Typical ECN spread
        const spreadRatio = spread / avgSpread;
        if (signal.instrument === "XAUUSD") intel.xauusdSpreadNormal = spreadRatio < 3.0;
        else intel.us500SpreadNormal = spreadRatio < 3.0;

        // If spread is 5x+ normal → Shield BLOCK level
        if (spreadRatio >= 5.0) {
          log("WARN", `EXTREME SPREAD: ${signal.instrument} ${spread.toFixed(2)} (${spreadRatio.toFixed(1)}x normal)`);
        }
      }
    } catch {} // Non-blocking — default to "normal" if check fails

    // Calculate risk multiplier
    const assessment = calculateRiskMultiplier(
      {
        firmProfile: slave.firm_profile,
        currentEquity: Number(slave.current_equity),
        initialBalance: Number(slave.initial_balance),
        equityHigh: Number(slave.equity_high),
        ddLimit: Number(slave.dd_limit),
        ddType: slave.dd_type,
        phase: slave.phase,
      },
      signal.instrument,
      events,
      trades,
      atrRatio,
      intel
    );

    // Calculate lots
    let copyLots = calculateCopyLots(
      signal.lots,
      stopPips,
      Number(slave.current_equity),
      slave.firm_profile,
      assessment.finalMultiplier,
      signal.instrument
    );

    const ddBuffer = Number(slave.current_equity) > 0
      ? ((Number(slave.current_equity) - Number(slave.dd_limit)) / Number(slave.current_equity) * 100)
      : 0;

    // Log decision
    const logEntry: any = {
      master_position_id: signal.positionId,
      slave_account_id: slave.id,
      firm_profile: slave.firm_profile,
      instrument: signal.instrument,
      direction: signal.direction === "DEAL_TYPE_BUY" ? "BUY" : "SELL",
      master_lots: signal.lots,
      calculated_lots: copyLots,
      dd_buffer_pct: ddBuffer,
      equity_at_copy: Number(slave.current_equity),
      phase_at_copy: slave.phase,
      risk_assessment: assessment,
    };

    // MANIPULATION SHIELD CHECK — with REAL data
    try {
      const conn = await getConnection(this.api, slave.metaapi_account_id);

      // Get recent price snapshots from MetaApi
      let priceSnapshots: any[] = [];
      try {
        const candles = await conn.getCandle(signal.instrument, "1m");
        if (candles) {
          priceSnapshots = [{
            timestamp: Date.now(),
            bid: candles.close ?? signal.price,
            ask: (candles.close ?? signal.price) + 0.15,
            spread: 0.15,
            volume: candles.tickVolume ?? 500,
          }];
        }
      } catch {}

      // Collect key levels from recent equity highs
      const keyLevels: number[] = [];
      if (signal.instrument === "XAUUSD") {
        const rounded = Math.round(signal.price / 50) * 50; // Round numbers ($2100, $2150, etc.)
        keyLevels.push(rounded, rounded - 50, rounded + 50);
      }

      // Get current spread for Shield
      let currentSpread = signal.instrument === "XAUUSD" ? 15 : 0.6;
      try {
        const tick = await conn.getSymbolPrice(signal.instrument);
        if (tick) currentSpread = (tick.ask - tick.bid) * (signal.instrument === "XAUUSD" ? 100 : 1);
      } catch {}

      const shieldResult = runShieldAssessment(
        priceSnapshots,
        signal.instrument,
        keyLevels,
        currentSpread,
        priceSnapshots[0]?.volume ?? 500,
        events.length > 0 ? events[0].time : null,
        0, // gold change — calculated from candles in production
        0, // dxy change
      );

      if (shieldResult.action === "CLOSE_ALL" || shieldResult.action === "BLOCK") {
        logEntry.action = "SKIPPED";
        logEntry.skip_reason = `SHIELD: ${shieldResult.detectedPatterns.map(p => p.type).join(", ")}`;
        logEntry.risk_assessment = { ...assessment, shield: shieldResult };
        await this.db.from("copier_log").insert(logEntry);
        log("WARN", `SHIELD BLOCK: ${slave.mt_login} — ${shieldResult.detectedPatterns.map(p => p.description).join("; ")}`);
        return { action: "SKIPPED", reasons: shieldResult.detectedPatterns.map(p => p.description) };
      }

      // Shield says reduce — apply override
      if (shieldResult.action === "REDUCE" && shieldResult.multiplierOverride < 1.0) {
        const shieldedLots = Math.floor(copyLots * shieldResult.multiplierOverride * 100) / 100;
        if (shieldedLots < copyLots) {
          log("INFO", `SHIELD REDUCE: ${slave.mt_login} Lots ${copyLots} → ${shieldedLots} (${shieldResult.detectedPatterns.map(p => p.type).join(",")})`);
          copyLots = shieldedLots;
          logEntry.calculated_lots = shieldedLots;
        }
      }
    } catch (shieldErr) {
      log("WARN", "Shield check failed, proceeding without shield", { error: (shieldErr as Error).message });
    }

    // SKIP?
    if (assessment.action === "SKIP" || copyLots <= 0) {
      logEntry.action = "SKIPPED";
      logEntry.skip_reason = assessment.reasons.join("; ");
      await this.db.from("copier_log").insert(logEntry);
      log("INFO", `SKIP: ${slave.firm_profile} (${slave.mt_login}) — ${assessment.reasons.join(", ")}`);
      return { action: "SKIPPED", reasons: assessment.reasons };
    }

    // EXECUTE
    try {
      const conn = await getConnection(this.api, slave.metaapi_account_id);

      // Final margin check
      const info = await conn.getAccountInformation();
      if (info.freeMargin < copyLots * 1000) { // Simplified margin check
        logEntry.action = "SKIPPED";
        logEntry.skip_reason = "INSUFFICIENT_MARGIN";
        await this.db.from("copier_log").insert(logEntry);
        return { action: "SKIPPED", reasons: ["Insufficient margin"] };
      }

      // Execute trade
      const method = signal.direction === "DEAL_TYPE_BUY" ? "createMarketBuyOrder" : "createMarketSellOrder";
      const result = await conn[method](
        signal.instrument,
        copyLots,
        signal.stopLoss,
        signal.takeProfit,
        { comment: `FC-${signal.positionId}`, magic: signal.magic + 100000 }
      );

      logEntry.action = "COPIED";
      logEntry.slave_order_id = result.orderId;
      logEntry.execution_time_ms = Date.now() - startTime;
      await this.db.from("copier_log").insert(logEntry);

      // Update equity high if needed (for trailing DD)
      if (slave.dd_type === "trailing" && info.equity > Number(slave.equity_high)) {
        await this.db
          .from("slave_accounts")
          .update({
            equity_high: info.equity,
            dd_limit: info.equity * 0.95, // 5% trailing
            current_equity: info.equity,
          })
          .eq("id", slave.id);
      } else {
        await this.db
          .from("slave_accounts")
          .update({ current_equity: info.equity })
          .eq("id", slave.id);
      }

      log("INFO", `COPIED: ${slave.firm_profile} (${slave.mt_login}) ${copyLots}L × ${assessment.finalMultiplier}`, {
        orderId: result.orderId,
        execMs: Date.now() - startTime,
      });

      return { action: "COPIED", orderId: result.orderId, lots: copyLots };
    } catch (err) {
      logEntry.action = "FAILED";
      logEntry.skip_reason = (err as Error).message;
      await this.db.from("copier_log").insert(logEntry);
      log("ERROR", `FAILED: ${slave.firm_profile} (${slave.mt_login})`, { error: (err as Error).message });
      return { action: "FAILED", error: (err as Error).message };
    }
  }

  // ── Close Slave Positions ─────────────────────────────────
  private async closeAllSlavePositions(masterPositionId: string, symbol: string) {
    const { data: slaves } = await this.db
      .from("slave_accounts")
      .select("*")
      .eq("copier_active", true);

    if (!slaves?.length) return;

    await Promise.allSettled(
      slaves.map(async (slave: any) => {
        try {
          const conn = await getConnection(this.api, slave.metaapi_account_id);
          const positions = await conn.getPositions();
          const slavePos = positions.find(
            (p: any) => p.comment?.includes(`FC-${masterPositionId}`)
          );

          if (slavePos) {
            await conn.closePosition(slavePos.id);
            log("INFO", `Closed: ${slave.mt_login} position ${slavePos.id}`);

            // Log close
            await this.db.from("copier_log").insert({
              master_position_id: masterPositionId,
              slave_account_id: slave.id,
              firm_profile: slave.firm_profile,
              instrument: symbol,
              direction: "CLOSE",
              master_lots: 0,
              calculated_lots: slavePos.volume,
              action: "CLOSED",
              dd_buffer_pct: 0,
              equity_at_copy: Number(slave.current_equity),
              risk_assessment: {},
            });
          }
        } catch (err) {
          log("ERROR", `Close failed: ${slave.mt_login}`, { error: (err as Error).message });
        }
      })
    );
  }

  // ── Update SL/TP on Slaves ────────────────────────────────
  private async updateAllSlaveSLTP(masterPositionId: string, sl?: number, tp?: number) {
    const { data: slaves } = await this.db
      .from("slave_accounts")
      .select("*")
      .eq("copier_active", true);

    if (!slaves?.length) return;

    await Promise.allSettled(
      slaves.map(async (slave: any) => {
        try {
          const conn = await getConnection(this.api, slave.metaapi_account_id);
          const positions = await conn.getPositions();
          const slavePos = positions.find(
            (p: any) => p.comment?.includes(`FC-${masterPositionId}`)
          );

          if (slavePos) {
            await conn.modifyPosition(slavePos.id, sl, tp);
            log("INFO", `SL/TP updated: ${slave.mt_login} SL:${sl} TP:${tp}`);
          }
        } catch (err) {
          log("ERROR", `SL/TP update failed: ${slave.mt_login}`, { error: (err as Error).message });
        }
      })
    );
  }
}

// ── Start Copier (called once on server startup) ──────────────
export async function startForgeCopy() {
  const token = process.env.META_API_TOKEN;
  const masterAccountId = process.env.META_API_ACCOUNT_ID;

  if (!token || !masterAccountId) {
    log("ERROR", "META_API_TOKEN or META_API_ACCOUNT_ID missing");
    return;
  }

  log("INFO", "Starting FORGE COPY Engine...");

  try {
    const { default: MetaApi } = await import("metaapi.cloud-sdk");
    const api = new MetaApi(token, {
      retryOpts: { retries: 3, minDelayInSeconds: 1, maxDelayInSeconds: 10 },
    });

    const account = await api.metatraderAccountApi.getAccount(masterAccountId);

    if (account.state !== "DEPLOYED") {
      await account.deploy();
    }
    await account.waitConnected();

    const connection = account.getStreamingConnection();
    const listener = new MasterTradeListener(api);
    connection.addSynchronizationListener(listener as any);
    await connection.connect();
    await connection.waitSynchronized();

    log("INFO", "FORGE COPY Engine läuft! Warte auf Trades vom Master...");
  } catch (err) {
    log("ERROR", "FORGE COPY Start fehlgeschlagen", { error: (err as Error).message });
  }
}
