// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/manager.ts — Telegram Copier Orchestrator
// Flow: Parse -> Risk Check -> Calculate Orders -> Execute
// ═══════════════════════════════════════════════════════════════

import { createSupabaseAdmin } from "@/lib/supabase/server";

const db = createSupabaseAdmin();
import { parseSignal, isLikelySignal } from "./parser";
import { calculateOrders } from "./smart-orders-v2";
import { executeOrders } from "./executor-v2";
import type { ParsedSignal, SmartOrder } from "./types";

const log = (level: string, msg: string, data?: any) => {
  console.log(
    `[${new Date().toISOString()}] [TG-MANAGER] [${level}] ${msg}`,
    data ? JSON.stringify(data) : ""
  );
};

/**
 * Process a new Telegram message.
 * Called by the listener when a message arrives in a monitored channel.
 */
export async function onNewMessage(
  message: string,
  channelId: string,
  userId: string
): Promise<void> {
  // Quick filter: skip non-signal messages
  if (!isLikelySignal(message)) {
    log("DEBUG", `Skipped non-signal message from ${channelId}`);
    return;
  }

  // 1. Parse signal via AI
  const signal = await parseSignal(message);

  // 2. Log to database
  await logSignalToDB(channelId, userId, message, signal);

  // Skip unknown signals
  if (signal.action === "UNKNOWN" || !signal.symbol) {
    log("INFO", `Unknown signal from ${channelId}, logged only`);
    return;
  }

  // Skip low confidence signals
  if (signal.confidence < 50) {
    log("WARN", `Low confidence (${signal.confidence}%) — skipping execution`);
    await updateSignalStatus(channelId, message, "low_confidence");
    return;
  }

  // 3. Get user settings and account info
  const settings = await getUserSettings(userId, channelId);
  if (!settings) {
    log("WARN", `No settings found for user ${userId}`);
    return;
  }

  if (!settings.autoExecute) {
    log("INFO", `Auto-execute disabled for channel ${channelId}`);
    await updateSignalStatus(channelId, message, "manual_review");
    return;
  }

  // 4. Risk check
  const riskOk = await checkRisk(userId, signal);
  if (!riskOk) {
    log("WARN", `Risk check failed for ${signal.symbol}`);
    await updateSignalStatus(channelId, message, "risk_blocked");
    return;
  }

  // 5. Calculate smart orders (4-split)
  const orders = calculateOrders(
    signal,
    settings.accountBalance,
    settings.riskPercent
  );

  if (orders.length === 0) {
    log("WARN", `No orders calculated for ${signal.symbol}`);
    return;
  }

  // 6. Execute
  try {
    await executeOrders(orders, settings.metaApiAccountId);
    await updateSignalStatus(channelId, message, "executed");
    await incrementChannelStats(channelId);
    log("INFO", `Executed ${orders.length} orders for ${signal.symbol}`);
  } catch (err) {
    log("ERROR", `Execution failed: ${(err as Error).message}`);
    await updateSignalStatus(channelId, message, "execution_failed");
  }
}

// ── Helpers ──────────────────────────────────────────────────

async function logSignalToDB(
  channelId: string,
  userId: string,
  rawMessage: string,
  signal: ParsedSignal
): Promise<void> {
  await db.from("telegram_signals").insert({
    channel_id: channelId,
    user_id: userId,
    raw_message: rawMessage.slice(0, 2000),
    parsed: signal as any,
    status: signal.action === "UNKNOWN" ? "unparsed" : "parsed",
  });
}

async function updateSignalStatus(
  channelId: string,
  rawMessage: string,
  status: string
): Promise<void> {
  await db
    .from("telegram_signals")
    .update({ status })
    .eq("channel_id", channelId)
    .eq("raw_message", rawMessage.slice(0, 2000));
}

async function getUserSettings(
  userId: string,
  channelId: string
): Promise<{
  autoExecute: boolean;
  riskPercent: number;
  accountBalance: number;
  metaApiAccountId: string;
} | null> {
  // Get channel settings
  const { data: channel } = await db
    .from("telegram_active_channels")
    .select("settings")
    .eq("user_id", userId)
    .eq("channel_id", channelId)
    .single();

  if (!channel) return null;

  // Get user's MetaApi account
  const { data: account } = await db
    .from("slave_accounts")
    .select("metaapi_account_id, current_equity")
    .eq("user_id", userId)
    .eq("copier_active", true)
    .limit(1)
    .single();

  if (!account) return null;

  const settings = (channel.settings as any) || {};
  return {
    autoExecute: settings.autoExecute ?? true,
    riskPercent: settings.riskPercent ?? 1,
    accountBalance: Number(account.current_equity) || 10000,
    metaApiAccountId: account.metaapi_account_id,
  };
}

async function checkRisk(userId: string, signal: ParsedSignal): Promise<boolean> {
  // Basic risk checks
  if (!signal.stopLoss) return false;
  if (!signal.entryPrice) return true; // Market order, allow

  const slDistance = Math.abs(signal.entryPrice - signal.stopLoss);
  const slPercent = (slDistance / signal.entryPrice) * 100;

  // Reject if SL is more than 3% away (likely bad signal)
  if (slPercent > 3) return false;

  // Check open positions count
  const { count } = await db
    .from("telegram_signals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "executed")
    .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString());

  if ((count ?? 0) >= 10) return false;

  return true;
}

async function incrementChannelStats(channelId: string): Promise<void> {
  try {
    await db.rpc("increment_channel_signals", {
      p_channel_id: channelId,
    });
  } catch {
    await db
      .from("telegram_active_channels")
      .update({ updated_at: new Date().toISOString() })
      .eq("channel_id", channelId);
  }
}
