// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/executor.ts — Signal → MetaTrader Execution
// Nimmt geparste Telegram-Signale und führt sie über MetaApi aus
// ═══════════════════════════════════════════════════════════════

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { type ParsedSignal } from "./copier";
import { processSmartOrder, DEFAULT_SMART_CONFIG } from "./smart-orders";
import {
  calculateRiskMultiplier,
  calculateCopyLots,
} from "@/lib/copier/risk-engine";
import {
  calculateBreakEvenSL,
  enforceMinDistance,
  canModifySL,
  recordSLChange,
} from "./sl-config";

const log = (level: string, msg: string, data?: any) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [TG-EXECUTOR] [${level}] ${msg}`, data ? JSON.stringify(data) : "");
};

// ── MetaApi Singleton ─────────────────────────────────────────
let _metaApi: any = null;
async function getMetaApi(): Promise<any> {
  const token = process.env.METAAPI_TOKEN;
  if (!token) throw new Error("METAAPI_TOKEN fehlt");
  if (!_metaApi) {
    const { default: MetaApi } = await import("metaapi.cloud-sdk");
    _metaApi = new MetaApi(token, {
      retryOpts: { retries: 3, minDelayInSeconds: 1, maxDelayInSeconds: 10 },
    });
  }
  return _metaApi;
}

// ── Connection Cache ──────────────────────────────────────────
const connections: Map<string, { conn: any; lastUsed: number }> = new Map();
const CONNECTION_TTL = 10 * 60 * 1000;

async function getConnection(api: any, accountId: string): Promise<any> {
  const cached = connections.get(accountId);
  if (cached && Date.now() - cached.lastUsed < CONNECTION_TTL) {
    cached.lastUsed = Date.now();
    try {
      await cached.conn.getAccountInformation();
      return cached.conn;
    } catch {
      connections.delete(accountId);
    }
  }

  const account = await api.metatraderAccountApi.getAccount(accountId);
  const conn = account.getRPCConnection();
  await conn.connect();
  await conn.waitSynchronized();
  connections.set(accountId, { conn, lastUsed: Date.now() });
  return conn;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of connections) {
    if (now - entry.lastUsed > CONNECTION_TTL) {
      entry.conn.close?.();
      connections.delete(id);
    }
  }
}, 60_000);

// ── Duplikat-Schutz ───────────────────────────────────────────
const executedSignals: Map<string, number> = new Map();
const DEDUP_TTL = 10 * 60 * 1000; // 10 Minuten

function isDuplicate(channelId: string, messageId: number): boolean {
  const key = `${channelId}-${messageId}`;
  const existing = executedSignals.get(key);
  if (existing && Date.now() - existing < DEDUP_TTL) return true;
  executedSignals.set(key, Date.now());
  // Cleanup alte Einträge
  if (executedSignals.size > 1000) {
    const cutoff = Date.now() - DEDUP_TTL;
    for (const [k, t] of executedSignals) {
      if (t < cutoff) executedSignals.delete(k);
    }
  }
  return false;
}

// ── Rate Limiter ──────────────────────────────────────────────
const signalTimestamps: number[] = [];
const MAX_SIGNALS_PER_MINUTE = 5;

function isRateLimited(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  // Entferne alte Einträge
  while (signalTimestamps.length > 0 && signalTimestamps[0] < oneMinuteAgo) {
    signalTimestamps.shift();
  }
  if (signalTimestamps.length >= MAX_SIGNALS_PER_MINUTE) return true;
  signalTimestamps.push(now);
  return false;
}

// ── PIP-Berechnung ────────────────────────────────────────────
function getPipSize(symbol: string): number {
  if (symbol.includes("JPY")) return 0.01;
  if (symbol === "XAUUSD") return 0.01;
  if (symbol === "XAGUSD") return 0.001;
  return 0.0001;
}

function priceToPips(symbol: string, priceDiff: number): number {
  return Math.abs(priceDiff) / getPipSize(symbol);
}

// ── Execute Signal ────────────────────────────────────────────
export async function executeSignal(
  signal: ParsedSignal,
  channelId: string,
  messageId: number
): Promise<{ copied: number; skipped: number; failed: number }> {
  const db = createSupabaseAdmin();
  const result = { copied: 0, skipped: 0, failed: 0 };

  if (!signal.symbol || signal.action === "UNKNOWN") {
    return result;
  }

  // Duplikat-Schutz
  if (isDuplicate(channelId, messageId)) {
    log("WARN", `Duplikat-Signal ignoriert: ${channelId}-${messageId}`);
    return result;
  }

  // Rate Limiting
  if (signal.action === "BUY" || signal.action === "SELL") {
    if (isRateLimited()) {
      log("WARN", `Rate Limit erreicht (${MAX_SIGNALS_PER_MINUTE}/min) — Signal übersprungen`);
      return result;
    }
  }

  // CLOSE-Signal
  if (signal.isClose) {
    return await handleCloseSignal(signal, channelId);
  }

  // MODIFY-Signal
  if (signal.isModification) {
    return await handleModifySignal(signal, channelId);
  }

  // BUY/SELL-Signal
  if (signal.action !== "BUY" && signal.action !== "SELL") {
    return result;
  }

  // MetaApi Singleton
  let api: any;
  try {
    api = await getMetaApi();
  } catch (err) {
    log("ERROR", (err as Error).message);
    return result;
  }

  // Alle aktiven Slave-Accounts laden
  const { data: slaves } = await db
    .from("slave_accounts")
    .select("*")
    .is("copier_active", true);

  if (!slaves?.length) {
    log("WARN", "Keine aktiven Slave-Accounts");
    return result;
  }

  // Market Intel laden
  const { data: intelData } = await db
    .from("market_intel")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  const intel = intelData?.[0]
    ? {
        geopoliticalRisk: intelData[0].geopolitical_risk,
        regime: intelData[0].regime,
        riskScore: intelData[0].risk_score,
        xauusdSpreadNormal: true,
        us500SpreadNormal: true,
        hasTier0Event: false,
      }
    : null;

  // Economic Calendar laden
  const { data: events } = await db
    .from("economic_calendar")
    .select("event_time, tier, title")
    .gte("event_time", new Date(Date.now() - 60 * 60000).toISOString())
    .lte("event_time", new Date(Date.now() + 60 * 60000).toISOString());

  const parsedEvents = (events ?? []).map((e: any) => ({
    time: new Date(e.event_time),
    tier: e.tier,
    title: e.title,
  }));

  if (intel) {
    intel.hasTier0Event = parsedEvents.some((e) => e.tier === 0);
  }

  // Stop-Distance in Pips berechnen
  const stopPips =
    signal.stopLoss && signal.entryPrice
      ? priceToPips(signal.symbol, signal.entryPrice - signal.stopLoss)
      : 0;

  // Smart Orders berechnen (TP-Splits)
  const direction = signal.action as "BUY" | "SELL";

  // Parallel auf allen Slaves ausführen
  const execResults = await Promise.allSettled(
    slaves.map((slave: any) =>
      executeSingleSlave(api, db, slave, signal, direction, parsedEvents, intel, stopPips, channelId, messageId)
    )
  );

  for (const r of execResults) {
    if (r.status === "fulfilled") {
      if (r.value === "COPIED") result.copied++;
      else if (r.value === "SKIPPED") result.skipped++;
      else result.failed++;
    } else {
      result.failed++;
    }
  }

  // Signal-Status in DB updaten
  await db
    .from("telegram_signals")
    .update({
      status: result.copied > 0 ? "executed" : "blocked",
      execution_result: result,
    })
    .eq("channel_id", channelId)
    .eq("message_id", messageId);

  log("INFO", `Signal ${signal.action} ${signal.symbol}: ${result.copied} kopiert, ${result.skipped} übersprungen, ${result.failed} fehlgeschlagen`);
  return result;
}

// ── Single Slave Execution ────────────────────────────────────
async function executeSingleSlave(
  api: any,
  db: any,
  slave: any,
  signal: ParsedSignal,
  direction: "BUY" | "SELL",
  events: any[],
  intel: any,
  stopPips: number,
  channelId: string,
  messageId: number
): Promise<"COPIED" | "SKIPPED" | "FAILED"> {
  const startTime = Date.now();

  // Recent Trades für Performance-Faktor
  const { data: recentTrades } = await db
    .from("copier_log")
    .select("pnl_result")
    .eq("slave_account_id", slave.id)
    .eq("action", "COPIED")
    .order("created_at", { ascending: false })
    .limit(20);

  const trades = (recentTrades ?? []).map((t: any) => ({ profit: t.pnl_result ?? 0 }));

  // Risk Multiplier berechnen
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
    signal.symbol!,
    events,
    trades,
    1.0, // Default ATR ratio
    intel
  );

  // Lots berechnen
  const copyLots = calculateCopyLots(
    0.01, // Telegram-Signale: Basis-Lot, wird durch Risk Engine skaliert
    stopPips,
    Number(slave.current_equity),
    slave.firm_profile,
    assessment.finalMultiplier,
    signal.symbol!
  );

  // SKIP?
  if (assessment.action === "SKIP" || copyLots <= 0) {
    await logCopyAction(db, slave, signal, channelId, messageId, "SKIPPED", assessment, copyLots, 0, assessment.reasons.join("; "));
    log("INFO", `SKIP: ${slave.firm_profile} — ${assessment.reasons.join(", ")}`);
    return "SKIPPED";
  }

  // EXECUTE
  try {
    const conn = await getConnection(api, slave.metaapi_account_id);

    // Margin-Check
    const info = await conn.getAccountInformation();
    const estimatedMargin = /xau|gold/i.test(signal.symbol || "") ? copyLots * 10000 : copyLots * 1500;
    if (info.freeMargin < estimatedMargin) {
      await logCopyAction(db, slave, signal, channelId, messageId, "SKIPPED", assessment, copyLots, 0, "INSUFFICIENT_MARGIN");
      return "SKIPPED";
    }

    // Smart Orders: TP-Splits berechnen
    const smartOrder = processSmartOrder({
      entryPrice: signal.entryPrice || 0,
      currentPrice: signal.entryPrice || 0,
      direction,
      stopLoss: signal.stopLoss || 0,
      takeProfits: signal.takeProfits,
      totalLots: copyLots,
      tpHit: 0,
      highestPrice: signal.entryPrice || 0,
      lowestPrice: signal.entryPrice || 0,
    });

    // Orders platzieren (Split-TPs)
    if (smartOrder.splits.length > 0 && signal.takeProfits.length > 1) {
      // Multi-TP: Mehrere Orders mit verschiedenen TPs
      for (const split of smartOrder.splits) {
        if (split.lots < 0.01) continue;
        const method = direction === "BUY" ? "createMarketBuyOrder" : "createMarketSellOrder";
        await conn[method](signal.symbol, split.lots, signal.stopLoss, split.tp, {
          comment: `TG-${channelId}-${messageId}`,
        });
      }
    } else {
      // Single Order
      const method = direction === "BUY" ? "createMarketBuyOrder" : "createMarketSellOrder";
      await conn[method](
        signal.symbol,
        copyLots,
        signal.stopLoss,
        signal.takeProfits[0] || undefined,
        { comment: `TG-${channelId}-${messageId}` }
      );
    }

    const execMs = Date.now() - startTime;
    await logCopyAction(db, slave, signal, channelId, messageId, "COPIED", assessment, copyLots, execMs);

    // Equity-High updaten (für Trailing DD)
    if (slave.dd_type === "trailing" && info.equity > Number(slave.equity_high)) {
      await db
        .from("slave_accounts")
        .update({
          equity_high: info.equity,
          dd_limit: info.equity * 0.95,
          current_equity: info.equity,
        })
        .eq("id", slave.id);
    } else {
      await db.from("slave_accounts").update({ current_equity: info.equity }).eq("id", slave.id);
    }

    log("INFO", `COPIED: ${slave.firm_profile} ${copyLots}L × ${assessment.finalMultiplier} (${execMs}ms)`);
    return "COPIED";
  } catch (err) {
    await logCopyAction(db, slave, signal, channelId, messageId, "FAILED", assessment, copyLots, 0, (err as Error).message);
    log("ERROR", `FAILED: ${slave.firm_profile}`, { error: (err as Error).message });
    return "FAILED";
  }
}

// ── Handle CLOSE Signal ───────────────────────────────────────
async function handleCloseSignal(
  signal: ParsedSignal,
  channelId: string
): Promise<{ copied: number; skipped: number; failed: number }> {
  const db = createSupabaseAdmin();
  const result = { copied: 0, skipped: 0, failed: 0 };

  let api: any;
  try { api = await getMetaApi(); } catch { return result; }

  const { data: slaves } = await db
    .from("slave_accounts")
    .select("*")
    .is("copier_active", true);

  if (!slaves?.length) return result;

  await Promise.allSettled(
    slaves.map(async (slave: any) => {
      try {
        const conn = await getConnection(api, slave.metaapi_account_id);
        const positions = await conn.getPositions();

        // Finde Positionen mit passendem Symbol und TG-Comment
        const matching = positions.filter(
          (p: any) =>
            p.symbol === signal.symbol &&
            p.comment?.startsWith(`TG-${channelId}`)
        );

        for (const pos of matching) {
          if (signal.closePartial && signal.closePartial < 100) {
            // Partial Close
            const closeLots = Math.max(0.01, Math.floor(pos.volume * (signal.closePartial / 100) * 100) / 100);
            await conn.closePosition(pos.id, { volume: closeLots });
          } else {
            await conn.closePosition(pos.id);
          }
          result.copied++;
        }

        if (matching.length === 0) result.skipped++;
      } catch {
        result.failed++;
      }
    })
  );

  log("INFO", `CLOSE ${signal.symbol}: ${result.copied} geschlossen`);
  return result;
}

// ── Handle MODIFY Signal ──────────────────────────────────────
async function handleModifySignal(
  signal: ParsedSignal,
  channelId: string
): Promise<{ copied: number; skipped: number; failed: number }> {
  const db = createSupabaseAdmin();
  const result = { copied: 0, skipped: 0, failed: 0 };

  let api: any;
  try { api = await getMetaApi(); } catch { return result; }

  const { data: slaves } = await db
    .from("slave_accounts")
    .select("*")
    .is("copier_active", true);

  if (!slaves?.length) return result;

  await Promise.allSettled(
    slaves.map(async (slave: any) => {
      try {
        const conn = await getConnection(api, slave.metaapi_account_id);
        const positions = await conn.getPositions();

        const matching = positions.filter(
          (p: any) =>
            p.symbol === signal.symbol &&
            p.comment?.startsWith(`TG-${channelId}`)
        );

        for (const pos of matching) {
          // Cooldown: Min 2 Min zwischen SL-Änderungen
          if (!canModifySL(pos.id)) {
            log("INFO", `[SL] Cooldown aktiv für ${pos.symbol} ${pos.id}`);
            continue;
          }

          const direction = pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL" as const;

          if (signal.moveToBreakeven) {
            // Break Even MIT symbol-spezifischem Buffer
            let beSL = calculateBreakEvenSL(signal.symbol!, direction, pos.openPrice);

            // Nur wenn besser als aktueller SL
            const isBetter = direction === "BUY"
              ? beSL > (pos.stopLoss || 0)
              : beSL < pos.stopLoss || pos.stopLoss === 0;

            if (isBetter) {
              await conn.modifyPosition(pos.id, beSL, pos.takeProfit);
              recordSLChange(pos.id);
              log("INFO", `[BE] ${pos.symbol} SL → ${beSL} (Entry + Buffer)`);
            }
          } else {
            // SL/TP Update — enforce minimum distance
            let newSL = signal.stopLoss ?? pos.stopLoss;
            if (newSL && signal.symbol) {
              const price = await conn.getSymbolPrice(pos.symbol);
              const currentPrice = direction === "BUY" ? price.bid : price.ask;
              newSL = enforceMinDistance(signal.symbol, direction, currentPrice, newSL);
            }
            await conn.modifyPosition(
              pos.id,
              newSL,
              signal.takeProfits[0] ?? pos.takeProfit
            );
            recordSLChange(pos.id);
          }
          result.copied++;
        }

        if (matching.length === 0) result.skipped++;
      } catch {
        result.failed++;
      }
    })
  );

  log("INFO", `MODIFY ${signal.symbol}: ${result.copied} aktualisiert`);
  return result;
}

// ── Log Helper ────────────────────────────────────────────────
async function logCopyAction(
  db: any,
  slave: any,
  signal: ParsedSignal,
  channelId: string,
  messageId: number,
  action: string,
  assessment: any,
  copyLots: number,
  execMs: number,
  skipReason?: string
) {
  await db.from("copier_log").insert({
    master_position_id: `TG-${channelId}-${messageId}`,
    slave_account_id: slave.id,
    firm_profile: slave.firm_profile,
    instrument: signal.symbol,
    direction: signal.action,
    master_lots: 0.01,
    calculated_lots: copyLots,
    action,
    skip_reason: skipReason || null,
    dd_buffer_pct:
      Number(slave.current_equity) > 0
        ? ((Number(slave.current_equity) - Number(slave.dd_limit)) / Number(slave.current_equity)) * 100
        : 0,
    equity_at_copy: Number(slave.current_equity),
    phase_at_copy: slave.phase,
    risk_assessment: assessment,
    execution_time_ms: execMs,
  });
}
