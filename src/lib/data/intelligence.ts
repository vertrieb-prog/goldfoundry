// ═══════════════════════════════════════════════════════════════
// src/lib/data/intelligence.ts — Market Intelligence & Analysis
// ═══════════════════════════════════════════════════════════════

import { cachedCall } from "@/lib/ai/cached-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { MODELS } from "@/lib/config";

export type MarketRegime = "trending" | "ranging" | "volatile" | "quiet";
export type Sentiment = "bullish" | "bearish" | "neutral";

export interface MarketIntelligence {
  symbol: string;
  regime: MarketRegime;
  sentiment: Sentiment;
  sentimentScore: number;
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
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { wins: 0, losses: 0, totalProfit: 0 };
    if (t.profit > 0) bySymbol[t.symbol].wins++;
    else bySymbol[t.symbol].losses++;
    bySymbol[t.symbol].totalProfit += t.profit;

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

// ── Pattern Detection (echte Daten statt Dummy) ─────────────
function detectPatterns(
  trades: Array<{ symbol: string; profit: number; openTime: string; closeTime: string }>,
  bySymbol: Record<string, { wins: number; losses: number; totalProfit: number }>,
  bySession: Record<string, { wins: number; losses: number }>
): Array<{ pattern: string; confidence: number; symbol: string }> {
  const patterns: Array<{ pattern: string; confidence: number; symbol: string }> = [];

  // Pattern 1: Session-basierte Stärke
  for (const [session, stats] of Object.entries(bySession)) {
    const total = stats.wins + stats.losses;
    if (total < 5) continue;
    const wr = stats.wins / total;
    if (wr >= 0.65) {
      patterns.push({
        pattern: `${session} Session Stärke`,
        confidence: Math.round(wr * 100) / 100,
        symbol: "ALL",
      });
    }
  }

  // Pattern 2: Symbol-spezifische Edge
  for (const [symbol, stats] of Object.entries(bySymbol)) {
    const total = stats.wins + stats.losses;
    if (total < 5) continue;
    const wr = stats.wins / total;
    if (wr >= 0.60 && stats.totalProfit > 0) {
      patterns.push({
        pattern: `${symbol} Profitable Edge`,
        confidence: Math.round(wr * 100) / 100,
        symbol,
      });
    }
    if (wr < 0.40) {
      patterns.push({
        pattern: `${symbol} Schwäche (vermeiden)`,
        confidence: Math.round((1 - wr) * 100) / 100,
        symbol,
      });
    }
  }

  // Pattern 3: Streak-Analyse
  if (trades.length >= 10) {
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWin = 0;
    let currentLoss = 0;

    for (const t of trades) {
      if (t.profit > 0) {
        currentWin++;
        currentLoss = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWin);
      } else {
        currentLoss++;
        currentWin = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLoss);
      }
    }

    if (maxWinStreak >= 5) {
      patterns.push({ pattern: `Win-Streak Potential (${maxWinStreak} max)`, confidence: 0.7, symbol: "ALL" });
    }
    if (maxLossStreak >= 4) {
      patterns.push({ pattern: `Loss-Streak Risiko (${maxLossStreak} max)`, confidence: 0.8, symbol: "ALL" });
    }
  }

  // Pattern 4: Tageszeit-Analyse
  const byHour: Record<number, { wins: number; losses: number }> = {};
  for (const t of trades) {
    const hour = new Date(t.openTime).getUTCHours();
    if (!byHour[hour]) byHour[hour] = { wins: 0, losses: 0 };
    if (t.profit > 0) byHour[hour].wins++;
    else byHour[hour].losses++;
  }

  let bestHour = -1;
  let bestWR = 0;
  for (const [h, stats] of Object.entries(byHour)) {
    const total = stats.wins + stats.losses;
    if (total < 3) continue;
    const wr = stats.wins / total;
    if (wr > bestWR) { bestWR = wr; bestHour = Number(h); }
  }

  if (bestHour >= 0 && bestWR >= 0.70) {
    patterns.push({ pattern: `Beste Stunde: ${bestHour}:00 UTC (${Math.round(bestWR * 100)}% WR)`, confidence: bestWR, symbol: "ALL" });
  }

  return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
}

// ── IntelligenceEngine Class ────────────────────────────────
export interface GoldIntelligence {
  dataPoints: number;
  topPatterns: Array<{ pattern: string; confidence: number; symbol: string }>;
  traderRankings: Array<{ name: string; score: number; gain: number }>;
  regime: { regime: MarketRegime; confidence: number };
  sentiment: { overall: Sentiment; score: number };
  updatedAt: string;
}

export class IntelligenceEngine {
  async generate(): Promise<GoldIntelligence> {
    const db = createSupabaseAdmin();

    const { data: stats } = await db
      .from("trader_stats")
      .select("*")
      .order("gain", { ascending: false })
      .limit(50);

    // Echte Trades laden für Pattern-Detection
    const { data: recentTrades } = await db
      .from("trades")
      .select("symbol, profit, open_time, close_time, trade_type")
      .eq("is_open", false)
      .order("close_time", { ascending: false })
      .limit(500);

    const trades = (recentTrades ?? []).map((t: any) => ({
      symbol: t.symbol,
      profit: Number(t.profit),
      openTime: t.open_time,
      closeTime: t.close_time,
      type: t.trade_type,
    }));

    const tradeAnalysis = analyzeTradePatterns(trades);
    const topPatterns = detectPatterns(trades, tradeAnalysis.bySymbol, tradeAnalysis.bySession);

    const traderRankings = (stats || []).map((s: Record<string, unknown>) => ({
      name: s.name as string,
      score: ((s.gain as number) || 0) * ((s.profit_factor as number) || 1) / Math.max((s.drawdown as number) || 1, 1),
      gain: (s.gain as number) || 0,
    }));

    // Regime aus echten Equity-Snapshots ableiten
    const { data: snapshots } = await db
      .from("equity_snapshots")
      .select("equity")
      .order("snapshot_at", { ascending: false })
      .limit(30);

    const equities = (snapshots ?? []).map((s: any) => Number(s.equity)).reverse();
    const regime = detectRegime(equities.length >= 20 ? equities : []);
    const regimeConfidence = equities.length >= 20 ? 0.8 : 0.4;

    return {
      dataPoints: trades.length + (stats?.length || 0),
      topPatterns,
      traderRankings: traderRankings.slice(0, 10),
      regime: { regime, confidence: regimeConfidence },
      sentiment: { overall: "neutral", score: 0 },
      updatedAt: new Date().toISOString(),
    };
  }
}

// ── Save Intelligence ───────────────────────────────────────
export async function saveIntelligence(intel: MarketIntelligence) {
  const db = createSupabaseAdmin();
  const { error } = await db
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
