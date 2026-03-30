export const dynamic = "force-dynamic";
export const maxDuration = 300;
// ═══════════════════════════════════════════════════════════════
// CRON: Telegram Signal Poller
// Polls active channels for new messages, parses signals, executes trades
// Runs every 2 minutes via Vercel Cron
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { parseSignal, isLikelySignal } from "@/lib/telegram-copier/parser";
import { resolveSymbol } from "@/lib/telegram-copier/symbol-resolver";
import { calculateLotSize } from "@/lib/telegram-copier/lot-calculator";
import { sendTradeNotification } from "@/lib/telegram-copier/notifier";
import { MasterStrategyEngine, DEFAULT_CONFIG } from "@/lib/strategy-engine";

// Dynamic: use account region (london, new-york, etc.) — fallback to default
function getClientBase(region?: string): string {
  if (region && region !== "default") return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  return "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";
}
const META_CLIENT_BASE = "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";
const META_PROV_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

// ── Region Cache: avoid repeated provisioning API calls ──
const regionCache = new Map<string, { region: string; ts: number }>();
const REGION_TTL = 24 * 60 * 60 * 1000; // 24h — Region ändert sich nie

function getCachedRegion(accountId: string): string | null {
  const c = regionCache.get(accountId);
  if (c && Date.now() - c.ts < REGION_TTL) return c.region;
  return null;
}

function setCachedRegion(accountId: string, region: string) {
  regionCache.set(accountId, { region, ts: Date.now() });
}

const log = (level: string, msg: string) => {
  console.log(`[${new Date().toISOString()}] [TG-CRON] [${level}] ${msg}`);
};

// ── Self-Healing: Log actions to DB ─────────────────────────
async function logSelfHeal(db: any, userId: string, channelId: string, action: string, details: string) {
  try {
    await db.from("telegram_signals").insert({
      channel_id: channelId,
      user_id: userId,
      telegram_message_id: 0,
      raw_message: `[SELF-HEAL] ${action}: ${details}`,
      parsed: { action: "SELF_HEAL", healAction: action, details } as any,
      status: "self_healed",
    });
  } catch (e: any) {
    log("WARN", `Failed to log self-heal action: ${e.message}`);
  }
}

// ── Self-Healing: Verify & fix linked account ───────────────
async function selfHeal(db: any, channel: any, userId: string): Promise<string | null> {
  const settings = (channel.settings as any) || {};
  const linkedAccountId = settings.linkedAccountId;
  const channelId = channel.channel_id;

  // Check 1: Is the linked account still valid?
  if (linkedAccountId) {
    const { data: linkedAccount } = await db
      .from("slave_accounts")
      .select("id, copier_active")
      .eq("id", linkedAccountId)
      .eq("user_id", userId)
      .single();

    if (!linkedAccount) {
      // Linked account was DELETED! Auto-fix: find ANY active account
      log("WARN", `[SELF-HEAL] Linked account ${linkedAccountId} deleted, finding replacement...`);
      const { data: anyAccount } = await db
        .from("slave_accounts")
        .select("id")
        .eq("user_id", userId)
        .is("copier_active", true)
        .limit(1)
        .single();

      if (anyAccount) {
        await db.from("telegram_active_channels")
          .update({ settings: { ...settings, linkedAccountId: anyAccount.id } })
          .eq("user_id", userId)
          .eq("channel_id", channelId);
        log("INFO", `[SELF-HEAL] Re-linked channel ${channelId} to account: ${anyAccount.id}`);
        await logSelfHeal(db, userId, channelId, "RELINK_ACCOUNT",
          `Deleted account ${linkedAccountId} replaced with ${anyAccount.id}`);
        return anyAccount.id;
      }

      // No active accounts at all — try to find ANY account and activate it
      const { data: inactiveAccount } = await db
        .from("slave_accounts")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (inactiveAccount) {
        await db.from("slave_accounts")
          .update({ copier_active: true })
          .eq("id", inactiveAccount.id);
        await db.from("telegram_active_channels")
          .update({ settings: { ...settings, linkedAccountId: inactiveAccount.id } })
          .eq("user_id", userId)
          .eq("channel_id", channelId);
        log("INFO", `[SELF-HEAL] Activated & linked inactive account: ${inactiveAccount.id}`);
        await logSelfHeal(db, userId, channelId, "ACTIVATE_AND_RELINK",
          `No active accounts. Activated ${inactiveAccount.id} and linked it.`);
        return inactiveAccount.id;
      }

      await logSelfHeal(db, userId, channelId, "NO_ACCOUNTS",
        `Linked account ${linkedAccountId} deleted and no replacement found.`);
      return null; // No accounts at all
    }

    if (!linkedAccount.copier_active) {
      // Account exists but copier is disabled — re-enable it
      await db.from("slave_accounts")
        .update({ copier_active: true })
        .eq("id", linkedAccountId);
      log("INFO", `[SELF-HEAL] Re-enabled copier on account: ${linkedAccountId}`);
      await logSelfHeal(db, userId, channelId, "REENABLE_COPIER",
        `Account ${linkedAccountId} had copier_active=false, re-enabled.`);
    }
  }

  return linkedAccountId;
}

async function metaApiFetch(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: { "auth-token": token, "Content-Type": "application/json", ...(options?.headers ?? {}) },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text();
    let msg = `MetaApi ${res.status}`;
    try { msg = JSON.parse(body).message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function GET(request: Request) {
  // Auth: only allow cron calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const results: any[] = [];

  try {
    // 1. Get all active channels with their users
    const { data: channels } = await db
      .from("telegram_active_channels")
      .select("*")
      .eq("status", "active");

    if (!channels?.length) {
      return NextResponse.json({ message: "No active channels", results: [] });
    }

    log("INFO", `Processing ${channels.length} active channels`);

    // 2. For each channel, get user's session and poll messages
    for (const channel of channels) {
      try {
        const channelResult = await processChannel(db, channel);
        results.push(channelResult);
      } catch (err: any) {
        log("ERROR", `Channel ${channel.channel_name}: ${err.message}`);
        results.push({ channel: channel.channel_name, error: err.message });
      }
    }

    return NextResponse.json({ results, timestamp: new Date().toISOString() });
  } catch (err: any) {
    log("ERROR", `Cron error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Lightweight MetaApi REST adapter for Strategy Engine ──
function createEngineMetaApi(token: string, accountId: string) {
  let base = META_CLIENT_BASE;
  const cachedR = getCachedRegion(accountId);
  if (cachedR) base = getClientBase(cachedR);

  const apiFetch = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: { "auth-token": token, "Content-Type": "application/json", ...(options?.headers ?? {}) },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`MetaApi ${res.status}`);
    return res.json();
  };

  return {
    getSymbolPrice: (symbol: string) =>
      apiFetch(`${base}/users/current/accounts/${accountId}/symbols/${symbol}/current-price`),
    getCandles: (symbol: string, tf: string, count: number) =>
      apiFetch(`${base}/users/current/accounts/${accountId}/historical-market-data/symbols/${symbol}/timeframes/${tf}/candles?limit=${count}`),
    createMarketBuyOrder: (symbol: string, lots: number, sl?: number | null, tp?: number | null) => {
      const payload: any = { actionType: "ORDER_TYPE_BUY", symbol, volume: lots };
      if (sl) payload.stopLoss = sl;
      if (tp) payload.takeProfit = tp;
      return apiFetch(`${base}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    createMarketSellOrder: (symbol: string, lots: number, sl?: number | null, tp?: number | null) => {
      const payload: any = { actionType: "ORDER_TYPE_SELL", symbol, volume: lots };
      if (sl) payload.stopLoss = sl;
      if (tp) payload.takeProfit = tp;
      return apiFetch(`${base}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    createLimitBuyOrder: (symbol: string, lots: number, price: number, sl: number, tp: number) =>
      apiFetch(`${base}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify({ actionType: "ORDER_TYPE_BUY_LIMIT", symbol, volume: lots, openPrice: price, stopLoss: sl, takeProfit: tp }) }),
    createLimitSellOrder: (symbol: string, lots: number, price: number, sl: number, tp: number) =>
      apiFetch(`${base}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify({ actionType: "ORDER_TYPE_SELL_LIMIT", symbol, volume: lots, openPrice: price, stopLoss: sl, takeProfit: tp }) }),
    modifyPosition: (posId: string, sl: number | null, tp: number | null) => {
      const payload: any = { actionType: "POSITION_MODIFY", positionId: posId };
      if (sl !== null) payload.stopLoss = sl;
      if (tp !== null) payload.takeProfit = tp;
      return apiFetch(`${base}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    closePosition: (posId: string) =>
      apiFetch(`${base}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId: posId }) }),
    cancelOrder: (orderId: string) =>
      apiFetch(`${base}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify({ actionType: "ORDER_CANCEL", orderId }) }),
    getPosition: (posId: string) =>
      apiFetch(`${base}/users/current/accounts/${accountId}/positions/${posId}`),
  };
}

async function processChannel(db: any, channel: any) {
  const userId = channel.user_id;
  const channelId = channel.channel_id;
  const channelName = channel.channel_name;

  // Get Telegram session
  const { data: session } = await db
    .from("telegram_sessions")
    .select("session_string, status")
    .eq("user_id", userId)
    .single();

  if (!session?.session_string || session.status !== "connected") {
    return { channel: channelName, status: "no_session" };
  }

  const apiId = Number((process.env.TELEGRAM_API_ID || "").trim());
  const apiHash = (process.env.TELEGRAM_API_HASH || "").trim();
  if (!apiId || !apiHash) return { channel: channelName, status: "no_telegram_config" };

  // Connect to Telegram
  let TelegramClient: any, StringSession: any;
  try {
    const tg = await import("telegram" as any);
    const sessions = await import("telegram/sessions" as any);
    TelegramClient = tg.TelegramClient;
    StringSession = sessions.StringSession;
  } catch {
    return { channel: channelName, status: "telegram_module_unavailable" };
  }

  const client = new TelegramClient(
    new StringSession(session.session_string),
    apiId, apiHash,
    { connectionRetries: 2, timeout: 20 }
  );
  await client.connect();

  // Find channel entity
  const dialogs = await client.getDialogs({ limit: 300 });
  let entity: any = null;
  for (const d of dialogs) {
    const e = d.entity;
    if (!e || (e.className !== "Channel" && e.className !== "Chat")) continue;
    const rawId = e.id?.value?.toString() || e.id?.toString() || "";
    const fullId = e.className === "Channel" ? `-100${rawId}` : `-${rawId}`;
    const title = ((e as any).title || "").toLowerCase();
    if (fullId === channelId || title.includes(channelId.toLowerCase())) {
      entity = e;
      break;
    }
  }

  if (!entity) {
    await client.disconnect();
    return { channel: channelName, status: "channel_not_found" };
  }

  // Get last 10 messages (only recent ones)
  const messages = await client.getMessages(entity, { limit: 30 });
  await client.disconnect();

  // Get previously processed message IDs for deduplication
  const { data: processedSignals } = await db
    .from("telegram_signals")
    .select("telegram_message_id")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const processedMessageIds = new Set(
    (processedSignals || []).map((s: any) => s.telegram_message_id).filter(Boolean)
  );

  // Lookback: max 30 Min — Signale älter als 30 Min sind abgelaufen (Setup vorbei)
  // Bei täglichem Cron werden nur frische Signale ausgeführt
  const SIGNAL_MAX_AGE_MS = 30 * 60 * 1000; // 30 Minuten
  const lookbackTime = Date.now() - SIGNAL_MAX_AGE_MS;

  // ── Signal Delay: Group messages within 3 minutes ──────────────
  // Some channels send signals in parts, e.g.:
  //   Msg1: "XAU SELL" (no SL/TP)
  //   Msg2 (2 min later): "SL 3055 TP 3045 3040 3030"
  // We combine consecutive messages within 3 min before parsing.
  const recentMessages = messages
    .filter((m: any) => m.message && m.id && m.date * 1000 > lookbackTime)
    .filter((m: any) => !processedMessageIds.has(m.id)) // Skip already processed
    .sort((a: any, b: any) => a.date - b.date); // oldest first

  const combinedMessages: any[] = [];
  const usedIds = new Set<number>();

  for (let i = 0; i < recentMessages.length; i++) {
    const msg = recentMessages[i];
    if (usedIds.has(msg.id)) continue;

    // Collect consecutive messages within 3 minutes of the first
    const group = [msg];
    usedIds.add(msg.id);
    const threeMinSec = 3 * 60;

    for (let j = i + 1; j < recentMessages.length; j++) {
      const next = recentMessages[j];
      if (usedIds.has(next.id)) continue;
      if (next.date - msg.date <= threeMinSec) {
        group.push(next);
        usedIds.add(next.id);
      } else {
        break;
      }
    }

    if (group.length > 1) {
      // Combine: use earliest message ID, concatenate all text
      const combinedText = group.map((g: any) => g.message).join("\n");
      const combinedIds = group.map((g: any) => g.id);
      log("INFO", `${channelName}: Grouped ${group.length} messages (IDs: ${combinedIds.join(",")}) within 3min window`);
      combinedMessages.push({
        id: group[0].id,
        date: group[0].date,
        message: combinedText,
        _groupedIds: combinedIds,
      });
    } else {
      combinedMessages.push(msg);
    }
  }

  // Filter to new messages only (not already processed, and signal-like)
  const newMessages = combinedMessages
    .filter((m: any) => {
      const ids = m._groupedIds || [m.id];
      return !ids.every((id: number) => processedMessageIds.has(id));
    })
    .filter((m: any) => isLikelySignal(m.message));

  if (newMessages.length === 0) {
    return { channel: channelName, status: "no_new_signals", checked: messages.length };
  }

  // Session filter: only trade during London+NY (07:00-20:00 UTC)
  const hour = new Date().getUTCHours();
  const isActiveSession = hour >= 7 && hour <= 20;

  log("INFO", `${channelName}: ${newMessages.length} new signal(s) found`);

  const settings = (channel.settings as any) || {};
  const autoExecute = settings.autoExecute ?? true;
  const riskPercent = settings.riskPercent ?? 1;

  // ── SELF-HEALING: Verify linked account before processing ──
  const healedAccountId = await selfHeal(db, channel, userId);

  // Get user's trading account — use healed account if set, otherwise first active
  let accountQuery = db
    .from("slave_accounts")
    .select("*")
    .eq("user_id", userId)
    .is("copier_active", true);

  if (healedAccountId) {
    accountQuery = accountQuery.eq("id", healedAccountId);
  }

  const { data: account } = await accountQuery.limit(1).single();

  if (!account) {
    return { channel: channelName, status: "no_active_account", signals: newMessages.length };
  }
  const metaApiToken = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();

  const signalResults: any[] = [];

  // Process each new signal
  for (const msg of newMessages) {
    try {
      const signal = await parseSignal(msg.message);

      // Log to DB (with Telegram message ID for deduplication)
      await db.from("telegram_signals").insert({
        channel_id: channelId,
        user_id: userId,
        telegram_message_id: msg.id,
        raw_message: msg.message.slice(0, 2000),
        parsed: signal as any,
        status: signal.action === "UNKNOWN" ? "unparsed" : "parsed",
      });

      // Skip BUY/SELL outside active trading session
      if (!isActiveSession && (signal.action === "BUY" || signal.action === "SELL")) {
        signalResults.push({ action: signal.action, symbol: signal.symbol, status: "outside_session" });
        continue;
      }

      // Auto-SL: wenn kein SL im Signal → selbst berechnen
      if (!signal.stopLoss && (signal.action === "BUY" || signal.action === "SELL") && signal.symbol) {
        const isGold = /xau|gold/i.test(signal.symbol);
        const entry = signal.entryPrice || 0;
        const slDist = isGold ? 10 : /jpy/i.test(signal.symbol) ? 0.30 : /us500|nas|us30/i.test(signal.symbol) ? 20 : 0.0030;
        if (entry) {
          signal.stopLoss = signal.action === "BUY" ? entry - slDist : entry + slDist;
          log("INFO", `Auto-SL: ${signal.stopLoss} (${slDist} vom Entry ${entry})`);
        }
      }

      // Auto-TP: wenn SL da aber kein TP → berechne 2:1 R:R
      if (signal.stopLoss && signal.entryPrice && (!signal.takeProfits || signal.takeProfits.length === 0)) {
        const slDist = Math.abs(signal.entryPrice - signal.stopLoss);
        const tp1 = signal.action === "BUY" ? signal.entryPrice + slDist * 1.5 : signal.entryPrice - slDist * 1.5;
        const tp2 = signal.action === "BUY" ? signal.entryPrice + slDist * 2.5 : signal.entryPrice - slDist * 2.5;
        signal.takeProfits = [Math.round(tp1 * 100) / 100, Math.round(tp2 * 100) / 100];
        log("INFO", `Auto-TP berechnet: ${signal.takeProfits.join(", ")} (2:1 R:R)`);
      }

      if (signal.action === "UNKNOWN" || !signal.symbol || signal.confidence < 50) {
        signalResults.push({ action: signal.action, symbol: signal.symbol, status: "skipped_low_confidence" });
        continue;
      }

      if (!autoExecute) {
        signalResults.push({ action: signal.action, symbol: signal.symbol, status: "manual_review" });
        continue;
      }

      if (!metaApiToken) {
        signalResults.push({ action: signal.action, symbol: signal.symbol, status: "no_metaapi_token" });
        continue;
      }

      // Resolve symbol for this broker
      const brokerSymbol = await resolveSymbol(signal.symbol, account.metaapi_account_id, metaApiToken);

      // ── ENGINE v3: Score & gate-check signal before execution ──
      // Engine enhances, not replaces: SKIP → skip, OPEN → continue with existing 4-split logic
      let engineDecision: string | null = null;
      try {
        // Create a lightweight MetaApi REST adapter for the engine's SafeAPI wrapper
        const engineMetaApi = createEngineMetaApi(metaApiToken, account.metaapi_account_id);
        const engine = new MasterStrategyEngine(
          engineMetaApi, db, null,
          { ...DEFAULT_CONFIG, testMode: true, propFirmMode: false }
        );
        engineDecision = await engine.processSignal(
          {
            action: signal.action,
            symbol: brokerSymbol,
            entryPrice: signal.entryPrice,
            stopLoss: signal.stopLoss,
            takeProfits: signal.takeProfits || [],
          },
          channelId
        );
        log("INFO", `[ENGINE] Decision for ${signal.action} ${brokerSymbol}: ${engineDecision}`);

        // If engine says SKIP → skip the trade
        if (engineDecision && engineDecision.startsWith("SKIP")) {
          signalResults.push({
            action: signal.action,
            symbol: brokerSymbol,
            status: "engine_skipped",
            engineDecision,
          });
          continue;
        }
      } catch (engineErr: any) {
        // Engine error should NOT block existing execution flow
        log("WARN", `[ENGINE] Error (non-blocking): ${engineErr.message}`);
        engineDecision = `ERROR:${engineErr.message}`;
      }

      // Execute trade via REST API (not SDK — avoids "window is not defined")
      let tradeResult = await executeTrade(
        metaApiToken,
        account.metaapi_account_id,
        brokerSymbol,
        signal,
        Number(account.current_equity) || 10000,
        riskPercent,
        Number(account.leverage) || 30
      );

      // ── SELF-HEALING: Retry once on recoverable errors ──
      if (!tradeResult.success && tradeResult.error &&
          (tradeResult.error.includes("not found") ||
           tradeResult.error.includes("not connected") ||
           tradeResult.error.includes("UNDEPLOYED") ||
           tradeResult.error.includes("timeout"))) {
        log("WARN", `[RETRY] Trade failed (${tradeResult.error}), retrying in 3s...`);
        await new Promise(r => setTimeout(r, 3000));
        tradeResult = await executeTrade(
          metaApiToken,
          account.metaapi_account_id,
          brokerSymbol,
          signal,
          Number(account.current_equity) || 10000,
          riskPercent,
          Number(account.leverage) || 30
        );
        if (tradeResult.success) {
          log("INFO", `[RETRY] Trade succeeded on retry!`);
        }
      }

      // Update signal status with execution details
      const executionResult = {
        success: tradeResult.success,
        orderIds: tradeResult.orderIds,
        lots: tradeResult.lots,
        lotCalcReason: tradeResult.lotCalcReason,
        splits: tradeResult.splits,
        error: tradeResult.error,
        executedAt: new Date().toISOString(),
        accountName: account.label || account.login || account.metaapi_account_id,
        channelName,
        engineDecision: engineDecision || undefined,
      };

      await db.from("telegram_signals")
        .update({
          status: tradeResult.success ? "executed" : "execution_failed",
          execution_result: executionResult,
        })
        .eq("channel_id", channelId)
        .eq("raw_message", msg.message.slice(0, 2000));

      // Send trade notification (Telegram Bot + log)
      try {
        await sendTradeNotification({
          userId,
          action: signal.action,
          symbol: brokerSymbol,
          lots: tradeResult.lots || 0,
          entryPrice: signal.entryPrice,
          stopLoss: signal.stopLoss,
          takeProfits: signal.takeProfits || [],
          orderId: tradeResult.orderIds?.[0] || "",
          accountName: account.label || account.login || account.metaapi_account_id,
          channelName,
          success: tradeResult.success,
          error: tradeResult.error,
        });
      } catch (notifErr: any) {
        log("WARN", `Notification failed: ${notifErr.message}`);
      }

      signalResults.push({
        action: signal.action,
        symbol: brokerSymbol,
        entry: signal.entryPrice,
        sl: signal.stopLoss,
        tp: signal.takeProfits,
        confidence: signal.confidence,
        ...tradeResult,
      });

      // Signal scoring: track channel performance
      if (tradeResult.success) {
        await db.from("telegram_active_channels")
          .update({
            signals_received: (channel.signals_received || 0) + 1,
            last_signal_at: new Date().toISOString()
          })
          .eq("id", channel.id);
      }

      log("INFO", `${tradeResult.success ? "EXECUTED" : "FAILED"}: ${signal.action} ${brokerSymbol} (${signal.confidence}%)`);
    } catch (err: any) {
      signalResults.push({ error: err.message });
      log("ERROR", `Signal processing error: ${err.message}`);
    }
  }

  return { channel: channelName, signals: signalResults };
}

// ── Multi-TP split helpers ───────────────────────────────────

interface SplitOrder {
  lots: number;
  takeProfit: number | null; // null = runner (no TP)
  label: string;
}

/**
 * IMMER 4 Split-Orders: 40% TP1, 25% TP2, 20% TP3, 15% Runner
 * Fehlende TPs werden automatisch berechnet (1.5x, 2.5x, 3.5x SL-Distanz)
 */
function buildSplitOrders(totalLots: number, takeProfits: number[], entryPrice?: number | null, stopLoss?: number | null, action?: string): SplitOrder[] {
  // Immer mindestens 4 TPs generieren
  const tps = [...(takeProfits || [])];
  const entry = entryPrice || tps[0] || 0;
  const sl = stopLoss || 0;
  const slDist = sl && entry ? Math.abs(entry - sl) : 0;
  const isBuy = action !== "SELL";

  // Fehlende TPs berechnen basierend auf SL-Distanz
  while (tps.length < 4 && slDist > 0) {
    const mult = tps.length === 0 ? 1.5 : tps.length === 1 ? 2.5 : tps.length === 2 ? 3.5 : 5;
    const newTp = isBuy ? entry + slDist * mult : entry - slDist * mult;
    tps.push(Math.round(newTp * 100) / 100);
  }

  // Fallback: wenn keine TPs berechenbar → single order
  if (tps.length === 0) {
    return [{ lots: totalLots, takeProfit: null, label: "full" }];
  }

  // IMMER 4-Split: 40/25/20/15
  const rawSplits = [
    { pct: 0.40, tp: tps[0], label: "TP1" },
    { pct: 0.25, tp: tps[1] || tps[0], label: "TP2" },
    { pct: 0.20, tp: tps[2] || tps[1] || tps[0], label: "TP3" },
    { pct: 0.15, tp: tps[3] || tps[2] || tps[1] || tps[0], label: "Runner" },
  ];
  return rawSplits
    .map(s => ({
      lots: Math.floor(totalLots * s.pct * 100) / 100,
      takeProfit: s.tp,
      label: s.label,
    }))
    .filter(s => s.lots >= 0.01);
}

// ── Trade execution ─────────────────────────────────────────

interface TradeResult {
  success: boolean;
  orderIds?: string[];
  error?: string;
  lots?: number;
  lotCalcReason?: string;
  splits?: { label: string; lots: number; tp: number | null; orderId?: string }[];
}

async function executeTrade(
  token: string,
  accountId: string,
  symbol: string,
  signal: any,
  accountBalance: number,
  riskPercent: number,
  leverage: number = 30,
): Promise<TradeResult> {
  try {
    // ── SELF-HEALING: Ensure MetaApi account is deployed + get region ──
    let clientBase = META_CLIENT_BASE;
    const cached = getCachedRegion(accountId);
    if (cached) {
      clientBase = getClientBase(cached);
    } else {
      try {
        const accStatus = await metaApiFetch(
          `${META_PROV_BASE}/users/current/accounts/${accountId}`,
          token
        );
        // Use account's region for API calls
        if (accStatus.region) {
          clientBase = getClientBase(accStatus.region);
          setCachedRegion(accountId, accStatus.region);
          log("INFO", `Using region: ${accStatus.region} → ${clientBase}`);
        }
        if (accStatus.state === "UNDEPLOYED") {
          log("WARN", `[SELF-HEAL] Account ${accountId} UNDEPLOYED, redeploying...`);
          await fetch(`${META_PROV_BASE}/users/current/accounts/${accountId}/deploy`, {
            method: "POST",
            headers: { "auth-token": token },
          });
          await new Promise(r => setTimeout(r, 10000));
          log("INFO", `[SELF-HEAL] Account ${accountId} redeploy requested, continuing...`);
        }
      } catch (e: any) {
        log("WARN", `[SELF-HEAL] Account status check failed: ${e.message}`);
      }
    }

    // Check position limit (max 10 open positions)
    const positions = await metaApiFetch(
      `${clientBase}/users/current/accounts/${accountId}/positions`,
      token
    );
    if (Array.isArray(positions) && positions.length >= 10) {
      return { success: false, error: "Max 10 offene Positionen erreicht" };
    }

    // Slippage protection: check current price vs signal entry
    if (signal.entryPrice) {
      const tick = await metaApiFetch(
        `${clientBase}/users/current/accounts/${accountId}/symbols/${symbol}/current-price`,
        token
      );
      const currentPrice = tick.bid || tick.ask || 0;
      // Slippage: Gold $20, Forex 20 pips — lockerer weil Cron nur 1x/Tag läuft
      const isGold = symbol.toUpperCase().includes("XAU") || symbol.toUpperCase().includes("GOLD");
      const maxSlippage = isGold ? 20.0 : 0.0020;
      if (Math.abs(currentPrice - signal.entryPrice) > maxSlippage) {
        return { success: false, error: `Slippage zu hoch: ${currentPrice} vs Signal ${signal.entryPrice}` };
      }
    }

    // Calculate lot size using professional calculator
    const lotCalc = await calculateLotSize({
      symbol,
      action: signal.action,
      entryPrice: signal.entryPrice || null,
      stopLoss: signal.stopLoss,
      accountBalance,
      riskPercent,
      leverage,
      metaApiAccountId: accountId,
      metaApiToken: token,
    });

    const totalLots = lotCalc.lots;
    log("INFO", `Lot calc: ${lotCalc.reason}`);

    const actionType = signal.action === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";
    const takeProfits: number[] = signal.takeProfits || [];

    // Build split orders based on TP count
    const splits = buildSplitOrders(totalLots, takeProfits, signal.entryPrice, signal.stopLoss, signal.action);
    log("INFO", `Split plan: ${splits.map(s => `${s.label}=${s.lots}L`).join(", ")} (${splits.length} order(s))`);

    const orderIds: string[] = [];
    const splitResults: { label: string; lots: number; tp: number | null; orderId?: string }[] = [];

    // PARALLEL: Alle Split-Orders gleichzeitig senden (Geschwindigkeit!)
    const tradePromises = splits.map(async (split) => {
      const tradePayload: any = {
        actionType, symbol, volume: split.lots,
        comment: `TG-Signal ${split.label}`,
      };
      if (signal.stopLoss) tradePayload.stopLoss = signal.stopLoss;
      if (split.takeProfit !== null) tradePayload.takeProfit = split.takeProfit;

      // Retry einmal bei Fehler
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await metaApiFetch(
            `${clientBase}/users/current/accounts/${accountId}/trade`,
            token,
            { method: "POST", body: JSON.stringify(tradePayload) }
          );
          const ok = result.numericCode === 0 || result.stringCode === "ERR_NO_ERROR" || result.stringCode === "TRADE_RETCODE_DONE";
          if (ok && result.orderId) {
            orderIds.push(result.orderId);
            splitResults.push({ label: split.label, lots: split.lots, tp: split.takeProfit, orderId: result.orderId });
            return;
          }
          if (attempt === 0) await new Promise(r => setTimeout(r, 500)); // kurz warten vor Retry
        } catch {}
      }
      splitResults.push({ label: split.label, lots: split.lots, tp: split.takeProfit });
    });

    await Promise.allSettled(tradePromises);

    if (orderIds.length > 0) {
      return {
        success: true,
        orderIds,
        lots: totalLots,
        lotCalcReason: lotCalc.reason,
        splits: splitResults,
      };
    }

    return {
      success: false,
      error: "Split orders partially failed",
      lots: totalLots,
      lotCalcReason: lotCalc.reason,
      splits: splitResults,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
