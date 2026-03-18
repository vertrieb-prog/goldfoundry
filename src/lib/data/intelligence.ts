// ═══════════════════════════════════════════════════════════════
// src/lib/data/intelligence.ts — Market Intelligence & Analysis
// ═══════════════════════════════════════════════════════════════

import { cachedCall } from "@/lib/ai/cached-client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MODELS } from "@/lib/config";

export type MarketRegime = "trending" | "ranging" | "volatile" | "quiet";
export type Sentiment = "bullish" | "bearish" | "neutral";

export interface MarketIntelligence {
  symbol: string;
  regime: MarketRegime;
  sentiment: Sentiment;
  sentimentScore: number; // -100 to +100
  volatility: number;
  keyLevels: { support: number[]; resistance: number[] };
  recommendation: string;
  updatedAt: string;
}

// ── Market Regime Detection ─────────────────────────────────
export function detectRegime(prices: number[]): MarketRegime {
  if (prices.length < 20) return "quiet";
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((a, r) => a + (r - avgReturn) ** 2, 0) / returns.length);
  const trendStrength = Math.abs(avgReturn) / (stdDev || 0.001);

  if (stdDev > 0.02) return "volatile";
  if (trendStrength > 0.5) return "trending";
  if (stdDev < 0.005) return "quiet";
  return "ranging";
}

// ── Sentiment Analysis ──────────────────────────────────────
export async function analyzeSentiment(symbol: string, newsData: string): Promise<{ sentiment: Sentiment; score: number }> {
  try {
    const result = await cachedCall({
      prompt: "Analysiere Marktsentiment. Antworte NUR mit JSON: {\"sentiment\":\"bullish|bearish|neutral\",\"score\":-100 bis 100}",
      message: `Symbol: ${symbol}\nNachrichten: ${newsData.slice(0, 1000)}`,
      model: MODELS.fast,
      maxTokens: 100,
    });
    const parsed = JSON.parse(result.replace(/```json\n?/g, "").replace(/```/g, "").trim());
    return { sentiment: parsed.sentiment || "neutral", score: parsed.score || 0 };
  } catch {
    return { sentiment: "neutral", score: 0 };
  }
}

// ── Trade Pattern Analysis ──────────────────────────────────
export function analyzeTradePatterns(trades: Array<{ symbol: string; profit: number; openTime: string; closeTime: string; type: string }>) {
  const bySymbol: Record<string, { wins: number; losses: number; totalProfit: number }> = {};
  const bySession: Record<string, { wins: number; losses: number }> = {};

  for (const t of trades) {
    // By symbol
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { wins: 0, losses: 0, totalProfit: 0 };
    if (t.profit > 0) bySymbol[t.symbol].wins++;
    else bySymbol[t.symbol].losses++;
    bySymbol[t.symbol].totalProfit += t.profit;

    // By session
    const hour = new Date(t.openTime).getUTCHours();
    const session = hour < 8 ? "Asian" : hour < 14 ? "London" : hour < 21 ? "NewYork" : "Asian";
    if (!bySession[session]) bySession[session] = { wins: 0, losses: 0 };
    if (t.profit > 0) bySession[session].wins++;
    else bySession[session].losses++;
  }

  return {
    bySymbol,
    bySession,
    totalTrades: trades.length,
    winRate: trades.filter(t => t.profit > 0).length / (trades.length || 1) * 100,
    totalProfit: trades.reduce((a, t) => a + t.profit, 0),
  };
}

// ── Save Intelligence ───────────────────────────────────────
export async function saveIntelligence(intel: MarketIntelligence) {
  const { error } = await supabaseAdmin
    .from("market_intelligence")
    .upsert({
      symbol: intel.symbol,
      regime: intel.regime,
      sentiment: intel.sentiment,
      sentiment_score: intel.sentimentScore,
      volatility: intel.volatility,
      key_levels: intel.keyLevels,
      recommendation: intel.recommendation,
      updated_at: intel.updatedAt,
    }, { onConflict: "symbol" });
  if (error) console.error("[Intelligence] Save error:", error);
}
