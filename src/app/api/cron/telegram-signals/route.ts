export const dynamic = "force-dynamic";
export const maxDuration = 60;
// ═══════════════════════════════════════════════════════════════
// CRON: Telegram Signal Poller
// Polls active channels for new messages, parses signals, executes trades
// Runs every 2 minutes via Vercel Cron
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { parseSignal, isLikelySignal } from "@/lib/telegram-copier/parser";
import { resolveSymbol } from "@/lib/telegram-copier/symbol-resolver";

const META_CLIENT_BASE = "https://mt-client-api-v1.new-york.agiliumtrade.ai";

const log = (level: string, msg: string) => {
  console.log(`[${new Date().toISOString()}] [TG-CRON] [${level}] ${msg}`);
};

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
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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

  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH || "";
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
  const messages = await client.getMessages(entity, { limit: 10 });
  await client.disconnect();

  // Get last processed message ID
  const { data: lastSignal } = await db
    .from("telegram_signals")
    .select("raw_message, created_at")
    .eq("channel_id", channelId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const lastProcessedTime = lastSignal ? new Date(lastSignal.created_at).getTime() : 0;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  // Filter to new messages only (after last processed, and within last 5 minutes)
  const newMessages = messages
    .filter((m: any) => m.message && m.date * 1000 > Math.max(lastProcessedTime, fiveMinutesAgo))
    .filter((m: any) => isLikelySignal(m.message));

  if (newMessages.length === 0) {
    return { channel: channelName, status: "no_new_signals", checked: messages.length };
  }

  log("INFO", `${channelName}: ${newMessages.length} new signal(s) found`);

  // Get user's trading account
  const { data: account } = await db
    .from("slave_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("copier_active", true)
    .limit(1)
    .single();

  if (!account) {
    return { channel: channelName, status: "no_active_account", signals: newMessages.length };
  }

  const settings = (channel.settings as any) || {};
  const autoExecute = settings.autoExecute ?? true;
  const riskPercent = settings.riskPercent ?? 1;
  const metaApiToken = process.env.METAAPI_TOKEN || process.env.META_API_TOKEN;

  const signalResults: any[] = [];

  // Process each new signal
  for (const msg of newMessages) {
    try {
      const signal = await parseSignal(msg.message);

      // Log to DB
      await db.from("telegram_signals").insert({
        channel_id: channelId,
        user_id: userId,
        raw_message: msg.message.slice(0, 2000),
        parsed: signal as any,
        status: signal.action === "UNKNOWN" ? "unparsed" : "parsed",
      });

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

      // Execute trade via REST API (not SDK — avoids "window is not defined")
      const tradeResult = await executeTrade(
        metaApiToken,
        account.metaapi_account_id,
        brokerSymbol,
        signal,
        Number(account.current_equity) || 10000,
        riskPercent
      );

      // Update signal status
      await db.from("telegram_signals")
        .update({ status: tradeResult.success ? "executed" : "execution_failed" })
        .eq("channel_id", channelId)
        .eq("raw_message", msg.message.slice(0, 2000));

      signalResults.push({
        action: signal.action,
        symbol: brokerSymbol,
        entry: signal.entryPrice,
        sl: signal.stopLoss,
        tp: signal.takeProfits,
        confidence: signal.confidence,
        ...tradeResult,
      });

      log("INFO", `${tradeResult.success ? "EXECUTED" : "FAILED"}: ${signal.action} ${brokerSymbol} (${signal.confidence}%)`);
    } catch (err: any) {
      signalResults.push({ error: err.message });
      log("ERROR", `Signal processing error: ${err.message}`);
    }
  }

  return { channel: channelName, signals: signalResults };
}

async function executeTrade(
  token: string,
  accountId: string,
  symbol: string,
  signal: any,
  accountBalance: number,
  riskPercent: number,
): Promise<{ success: boolean; orderId?: string; error?: string; lots?: number }> {
  try {
    // Calculate lot size based on risk
    const slDistance = signal.stopLoss && signal.entryPrice
      ? Math.abs(signal.entryPrice - signal.stopLoss)
      : 0;

    let lots = 0.01; // minimum
    if (slDistance > 0) {
      const riskAmount = accountBalance * (riskPercent / 100);
      const pipValue = symbol.includes("JPY") ? 100 : symbol === "XAUUSD" ? 1 : 10;
      const slPips = slDistance * pipValue;
      lots = Math.max(0.01, Math.round((riskAmount / slPips) * 100) / 100);
      lots = Math.min(lots, 1.0); // cap at 1 lot
    }

    const actionType = signal.action === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL";

    // Place main order with first TP
    const tradePayload: any = {
      actionType,
      symbol,
      volume: lots,
      comment: `TG-Signal`,
    };

    if (signal.stopLoss) tradePayload.stopLoss = signal.stopLoss;
    if (signal.takeProfits?.length > 0) tradePayload.takeProfit = signal.takeProfits[0];

    const result = await metaApiFetch(
      `${META_CLIENT_BASE}/users/current/accounts/${accountId}/trade`,
      token,
      { method: "POST", body: JSON.stringify(tradePayload) }
    );

    if (result.numericCode === 0 || result.stringCode === "ERR_NO_ERROR") {
      return { success: true, orderId: result.orderId, lots };
    }

    return { success: false, error: `${result.stringCode}: ${result.message}`, lots };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
