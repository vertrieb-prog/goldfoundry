// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/trade-manager.ts — AI Trade Management
// Checks open positions and recommends actions
// ═══════════════════════════════════════════════════════════════

import { cachedCall, PROMPTS } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { TradeDecision } from "./types";

/**
 * Check all open positions for a user and return AI-driven decisions.
 */
export async function checkOpenPositions(
  userId: string
): Promise<TradeDecision[]> {
  // Get user's MetaApi account
  const { data: accounts } = await supabaseAdmin
    .from("slave_accounts")
    .select("metaapi_account_id, current_equity, initial_balance, firm_profile")
    .eq("user_id", userId)
    .eq("copier_active", true);

  if (!accounts?.length) return [];

  const decisions: TradeDecision[] = [];

  for (const account of accounts) {
    try {
      const positions = await fetchOpenPositions(account.metaapi_account_id);
      if (!positions.length) continue;

      const equity = Number(account.current_equity) || 10000;
      const initialBalance = Number(account.initial_balance) || equity;
      const ddPercent = ((initialBalance - equity) / initialBalance) * 100;

      for (const pos of positions) {
        const decision = await analyzePosition(pos, {
          equity,
          ddPercent,
          firmProfile: account.firm_profile,
        });
        decisions.push(decision);
      }
    } catch (err) {
      console.error(
        `[TRADE-MANAGER] Error for account ${account.metaapi_account_id}:`,
        (err as Error).message
      );
    }
  }

  return decisions;
}

/**
 * Fetch open positions from MetaApi.
 */
async function fetchOpenPositions(accountId: string): Promise<any[]> {
  try {
    const { default: MetaApi } = await import("metaapi.cloud-sdk" as any);
    const token = process.env.METAAPI_TOKEN;
    if (!token) return [];

    const api = new MetaApi(token);
    const account = await api.metatraderAccountApi.getAccount(accountId);
    const conn = account.getRPCConnection();
    await conn.connect();
    await conn.waitSynchronized();

    const positions = await conn.getPositions();
    return positions.filter(
      (p: any) => p.comment?.startsWith("TG-")
    );
  } catch {
    return [];
  }
}

/**
 * Use AI to analyze a single position and recommend an action.
 */
async function analyzePosition(
  position: any,
  context: { equity: number; ddPercent: number; firmProfile: string }
): Promise<TradeDecision> {
  const posInfo = {
    symbol: position.symbol,
    direction: position.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL",
    openPrice: position.openPrice,
    currentPrice: position.currentPrice,
    profit: position.profit,
    volume: position.volume,
    stopLoss: position.stopLoss,
    takeProfit: position.takeProfit,
    openTime: position.time,
    durationMinutes: Math.round(
      (Date.now() - new Date(position.time).getTime()) / 60000
    ),
  };

  const profitPips =
    posInfo.direction === "BUY"
      ? posInfo.currentPrice - posInfo.openPrice
      : posInfo.openPrice - posInfo.currentPrice;

  const slDistance = posInfo.stopLoss
    ? Math.abs(posInfo.openPrice - posInfo.stopLoss)
    : 0;
  const rMultiple = slDistance > 0 ? profitPips / slDistance : 0;

  const message = [
    `Position: ${posInfo.direction} ${posInfo.symbol}`,
    `Entry: ${posInfo.openPrice}, Current: ${posInfo.currentPrice}`,
    `P/L: ${posInfo.profit}, R-Multiple: ${rMultiple.toFixed(2)}`,
    `SL: ${posInfo.stopLoss}, TP: ${posInfo.takeProfit}`,
    `Duration: ${posInfo.durationMinutes}min`,
    `Account DD: ${context.ddPercent.toFixed(1)}%`,
    `Firm: ${context.firmProfile}`,
  ].join("\n");

  try {
    const result = await cachedCall({
      prompt: PROMPTS.tradeManager,
      message,
      model: MODELS.fast,
      maxTokens: 150,
    });

    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    return {
      decision: parsed.decision || "HOLD",
      newSL: parsed.newSL ?? null,
      closePercent: parsed.closePercent ?? null,
      confidence: parsed.confidence ?? 50,
      reason: parsed.reason || "No reason provided",
    };
  } catch {
    return {
      decision: "HOLD",
      newSL: null,
      closePercent: null,
      confidence: 0,
      reason: "AI analysis unavailable",
    };
  }
}
