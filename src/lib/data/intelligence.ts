// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — CENTRAL INTELLIGENCE ENGINE
//
// Sammelt Daten aus ALLEN Quellen:
//   → MQL5 Signals (CSV Export)
//   → MyFxBook Scraper
//   → Telegram Signal Channels
//   → Eigene verbundene Accounts (MetaApi)
//   → Market Sentiment (MyFxBook Outlook)
//
// Generiert Insights die ALLE Agenten füttern:
//   → Risk Engine (optimale Lot-Size, DD-Thresholds)
//   → Trade Manager (wann halten, wann schließen)
//   → FORGE Mentor (Antworten mit echten Daten)
//   → Signal Copier (Filter, Timing)
//   → Channel Scanner (Benchmark für Channel-Bewertung)
//   → Market Intelligence (Regime-Detection)
//   → Strategy Advisor (Empfehlungen)
//
// Das ist das Gehirn von Gold Foundry.
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";


// ─────────────────────────────────────────────────────────────
// TYPES — Was die Intelligence Engine produziert
// ─────────────────────────────────────────────────────────────

interface SessionStats {
  session: "ASIAN" | "LONDON" | "NEWYORK" | "OVERLAP_LN";
  totalTrades: number;
  winRate: number;
  avgPips: number;
  avgRR: number;
  profitFactor: number;
  bestDirection: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
}

interface DayStats {
  day: number; // 0=Sun, 1=Mon ... 6=Sat
  dayName: string;
  winRate: number;
  avgPips: number;
  totalTrades: number;
  profitFactor: number;
  avoid: boolean; // true = historically bad
}

interface OptimalSLTP {
  symbol: string;
  direction: "BUY" | "SELL";
  session: string;
  optimalSL: number;   // In Preis-Punkten
  optimalTP1: number;
  optimalTP2: number;
  optimalTP3: number;
  winRateAtSL: number;
  avgRR: number;
  sampleSize: number;
}

interface MarketRegime {
  regime: "TRENDING_UP" | "TRENDING_DOWN" | "RANGING" | "HIGH_VOLA" | "LOW_VOLA";
  strength: number;     // 0-100
  since: string;        // When regime started
  bestStrategy: string; // What works in this regime
  sentiment: { longPct: number; shortPct: number; source: string };
}

interface TraderScore {
  sourceId: string;
  sourceName: string;
  source: string;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  maxDD: number;
  consistency: number;  // 0-100, how stable are monthly returns
  avgRR: number;
  score: number;        // 0-100 composite
  rank: number;
  bestSession: string;
  worstSession: string;
}

// ═══════════════════════════════════════════════════════════════
// THE INTELLIGENCE — Was aus allen Insights zusammengebaut wird
// und von ALLEN Agenten gelesen wird
// ═══════════════════════════════════════════════════════════════

export interface GoldIntelligence {
  generatedAt: string;
  dataPoints: number;         // Total trades analyzed
  sources: { mql5: number; myfxbook: number; telegram: number; tracker: number };

  // For RISK ENGINE
  sessions: SessionStats[];
  optimalSLTP: OptimalSLTP[];
  dayStats: DayStats[];
  maxSafeDD: { tag12x: number; tegas24x: number; standard: number };

  // For TRADE MANAGER
  avgTradeDuration: { winner: number; loser: number }; // minutes
  optimalHoldTime: { min: number; max: number; sweet: number };
  breakEvenTiming: number;    // After how many R move to BE
  partialCloseZone: number;   // At which R partial close is optimal

  // For MARKET INTELLIGENCE
  regime: MarketRegime;
  sentiment: { longPct: number; shortPct: number; source: string };
  volatility: { current: string; avg30d: number; percentile: number };

  // For CHANNEL SCANNER
  benchmarks: {
    minWinRate: number;
    minProfitFactor: number;
    maxDD: number;
    avgSignalsPerDay: number;
    avgRR: number;
  };

  // For STRATEGY ADVISOR
  topPatterns: Array<{
    name: string;
    description: string;
    winRate: number;
    avgRR: number;
    sampleSize: number;
    conditions: string;
  }>;

  // For LEADERBOARD
  traderRankings: TraderScore[];

  // For FORGE MENTOR
  funFacts: string[];
  weeklyInsight: string;
}


// ═══════════════════════════════════════════════════════════════
// ANALYSIS ENGINE — Runs daily, generates fresh intelligence
// ═══════════════════════════════════════════════════════════════

export class IntelligenceEngine {
  private trades: any[] = [];
  private signals: any[] = [];
  private sentiment: any[] = [];

  // ── Load all data from Supabase ───────────────────────────
  async loadData(daysBack: number = 90): Promise<void> {
    const since = new Date(Date.now() - daysBack * 86400000).toISOString();

    const [tradesRes, signalsRes, sentimentRes] = await Promise.all([
      supabaseAdmin.from("collected_trades")
        .select("*")
        .gte("collected_at", since)
        .ilike("symbol", "%XAU%"),
      supabaseAdmin.from("collected_signals")
        .select("*"),
      supabaseAdmin.from("market_sentiment")
        .select("*")
        .eq("symbol", "XAUUSD")
        .order("timestamp", { ascending: false })
        .limit(100),
    ]);

    this.trades = tradesRes.data || [];
    this.signals = signalsRes.data || [];
    this.sentiment = sentimentRes.data || [];

    console.log(`[INTEL] Loaded: ${this.trades.length} trades, ${this.signals.length} signals, ${this.sentiment.length} sentiment points`);
  }


  // ── Session Analysis ──────────────────────────────────────
  // → Feeds: Risk Engine (timing filter), Trade Manager (session awareness)
  analyzeSession(): SessionStats[] {
    const sessions: Record<string, any[]> = {
      ASIAN: [], LONDON: [], NEWYORK: [], OVERLAP_LN: [],
    };

    for (const t of this.trades) {
      const hour = this.extractHour(t.open_time);
      if (hour === null) continue;

      if (hour >= 0 && hour < 7) sessions.ASIAN.push(t);
      else if (hour >= 7 && hour < 12) sessions.LONDON.push(t);
      else if (hour >= 12 && hour < 13) sessions.OVERLAP_LN.push(t);
      else if (hour >= 13 && hour < 21) sessions.NEWYORK.push(t);
    }

    return Object.entries(sessions).map(([name, trades]) => {
      const winners = trades.filter(t => t.profit > 0);
      const losers = trades.filter(t => t.profit < 0);
      const totalProfit = winners.reduce((s, t) => s + Math.abs(t.profit), 0);
      const totalLoss = losers.reduce((s, t) => s + Math.abs(t.profit), 0);
      const buys = trades.filter(t => t.direction === "BUY");
      const buyWR = buys.length > 0 ? buys.filter(t => t.profit > 0).length / buys.length : 0;
      const sells = trades.filter(t => t.direction === "SELL");
      const sellWR = sells.length > 0 ? sells.filter(t => t.profit > 0).length / sells.length : 0;

      return {
        session: name as any,
        totalTrades: trades.length,
        winRate: trades.length > 0 ? +(winners.length / trades.length * 100).toFixed(1) : 0,
        avgPips: trades.length > 0 ? +(trades.reduce((s, t) => s + (t.pips || 0), 0) / trades.length).toFixed(1) : 0,
        avgRR: totalLoss > 0 ? +(totalProfit / totalLoss).toFixed(2) : 0,
        profitFactor: totalLoss > 0 ? +(totalProfit / totalLoss).toFixed(2) : 0,
        bestDirection: buyWR > sellWR + 5 ? "BUY" : sellWR > buyWR + 5 ? "SELL" : "NEUTRAL",
        confidence: Math.min(100, Math.round(trades.length / 5)),
      };
    });
  }


  // ── Day of Week Analysis ──────────────────────────────────
  // → Feeds: Risk Engine (day filter), FORGE Mentor
  analyzeDays(): DayStats[] {
    const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    const days: Record<number, any[]> = {};
    for (let i = 0; i < 7; i++) days[i] = [];

    for (const t of this.trades) {
      const day = this.extractDayOfWeek(t.open_time);
      if (day !== null) days[day].push(t);
    }

    return Object.entries(days).map(([d, trades]) => {
      const day = parseInt(d);
      const winners = trades.filter(t => t.profit > 0);
      const losers = trades.filter(t => t.profit < 0);
      const totalProfit = winners.reduce((s, t) => s + Math.abs(t.profit), 0);
      const totalLoss = losers.reduce((s, t) => s + Math.abs(t.profit), 0);
      const winRate = trades.length > 0 ? +(winners.length / trades.length * 100).toFixed(1) : 0;

      return {
        day,
        dayName: dayNames[day],
        winRate,
        avgPips: trades.length > 0 ? +(trades.reduce((s, t) => s + (t.pips || 0), 0) / trades.length).toFixed(1) : 0,
        totalTrades: trades.length,
        profitFactor: totalLoss > 0 ? +(totalProfit / totalLoss).toFixed(2) : 0,
        avoid: winRate < 45 || (totalLoss > 0 && totalProfit / totalLoss < 0.8),
      };
    });
  }


  // ── Optimal SL/TP Analysis ────────────────────────────────
  // → Feeds: Risk Engine, Signal Copier, Trade Manager
  analyzeOptimalSLTP(): OptimalSLTP[] {
    const results: OptimalSLTP[] = [];

    for (const direction of ["BUY", "SELL"] as const) {
      for (const session of ["ASIAN", "LONDON", "NEWYORK"]) {
        const trades = this.trades.filter(t => {
          const hour = this.extractHour(t.open_time);
          const inSession = session === "ASIAN" ? (hour !== null && hour < 7) :
                           session === "LONDON" ? (hour !== null && hour >= 7 && hour < 13) :
                           (hour !== null && hour >= 13 && hour < 21);
          return t.direction === direction && inSession && t.sl && t.tp;
        });

        if (trades.length < 20) continue;

        // SL analysis: what SL distance has best win rate?
        const slDistances = trades.map(t => Math.abs(t.open_price - t.sl)).filter(d => d > 0);
        const avgSL = slDistances.reduce((s, d) => s + d, 0) / slDistances.length;
        const medianSL = slDistances.sort((a, b) => a - b)[Math.floor(slDistances.length / 2)];

        // TP analysis: what TP levels are most common + profitable?
        const tpDistances = trades
          .filter(t => t.profit > 0)
          .map(t => Math.abs(t.close_price - t.open_price))
          .filter(d => d > 0)
          .sort((a, b) => a - b);

        const tp25 = tpDistances[Math.floor(tpDistances.length * 0.25)] || 0;
        const tp50 = tpDistances[Math.floor(tpDistances.length * 0.50)] || 0;
        const tp75 = tpDistances[Math.floor(tpDistances.length * 0.75)] || 0;

        const winners = trades.filter(t => t.profit > 0);

        results.push({
          symbol: "XAUUSD",
          direction,
          session,
          optimalSL: +medianSL.toFixed(2),
          optimalTP1: +tp25.toFixed(2),
          optimalTP2: +tp50.toFixed(2),
          optimalTP3: +tp75.toFixed(2),
          winRateAtSL: +(winners.length / trades.length * 100).toFixed(1),
          avgRR: medianSL > 0 ? +(tp50 / medianSL).toFixed(2) : 0,
          sampleSize: trades.length,
        });
      }
    }

    return results;
  }


  // ── Trade Duration Analysis ───────────────────────────────
  // → Feeds: Trade Manager (when to close)
  analyzeDuration(): { winner: number; loser: number; sweet: number } {
    const withDuration = this.trades.filter(t => t.open_time && t.close_time);

    const winners = withDuration.filter(t => t.profit > 0);
    const losers = withDuration.filter(t => t.profit < 0);

    const avgDuration = (trades: any[]) => {
      if (trades.length === 0) return 0;
      const durations = trades.map(t => {
        const open = new Date(t.open_time).getTime();
        const close = new Date(t.close_time).getTime();
        return (close - open) / 60000; // minutes
      }).filter(d => d > 0 && d < 10000);
      return durations.length > 0 ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : 0;
    };

    return {
      winner: avgDuration(winners),
      loser: avgDuration(losers),
      sweet: avgDuration(winners), // Sweet spot = average winner duration
    };
  }


  // ── Trader Ranking ────────────────────────────────────────
  // → Feeds: Leaderboard, Channel Scanner, Strategy Advisor
  rankTraders(): TraderScore[] {
    // Group trades by source + source_id
    const grouped: Record<string, any[]> = {};
    for (const t of this.trades) {
      const key = `${t.source}:${t.source_id}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    }

    const scores: TraderScore[] = [];

    for (const [key, trades] of Object.entries(grouped)) {
      if (trades.length < 10) continue; // Min 10 trades

      const [source, sourceId] = key.split(":");
      const winners = trades.filter(t => t.profit > 0);
      const losers = trades.filter(t => t.profit < 0);
      const totalProfit = winners.reduce((s, t) => s + Math.abs(t.profit), 0);
      const totalLoss = losers.reduce((s, t) => s + Math.abs(t.profit), 0);
      const winRate = +(winners.length / trades.length * 100).toFixed(1);
      const profitFactor = totalLoss > 0 ? +(totalProfit / totalLoss).toFixed(2) : 99;

      // Monthly consistency (std dev of monthly returns)
      const monthly = this.groupByMonth(trades);
      const monthlyReturns = Object.values(monthly).map(m =>
        m.reduce((s: number, t: any) => s + (t.profit || 0), 0)
      );
      const avgMonthly = monthlyReturns.length > 0 ? monthlyReturns.reduce((s, r) => s + r, 0) / monthlyReturns.length : 0;
      const stdDev = monthlyReturns.length > 1
        ? Math.sqrt(monthlyReturns.reduce((s, r) => s + (r - avgMonthly) ** 2, 0) / monthlyReturns.length)
        : 999;
      const consistency = Math.max(0, Math.min(100, 100 - (stdDev / Math.max(Math.abs(avgMonthly), 1)) * 100));

      // Max DD (simplified)
      let maxDD = 0;
      let peak = 0;
      let cumPnl = 0;
      for (const t of trades.sort((a: any, b: any) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime())) {
        cumPnl += t.profit || 0;
        if (cumPnl > peak) peak = cumPnl;
        const dd = peak - cumPnl;
        if (dd > maxDD) maxDD = dd;
      }

      // Session analysis for this trader
      const sessionWR: Record<string, number> = {};
      for (const sess of ["ASIAN", "LONDON", "NEWYORK"]) {
        const sessTrades = trades.filter(t => {
          const h = this.extractHour(t.open_time);
          return sess === "ASIAN" ? (h !== null && h < 7) :
                 sess === "LONDON" ? (h !== null && h >= 7 && h < 13) :
                 (h !== null && h >= 13);
        });
        if (sessTrades.length >= 5) {
          sessionWR[sess] = sessTrades.filter(t => t.profit > 0).length / sessTrades.length * 100;
        }
      }
      const bestSession = Object.entries(sessionWR).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";
      const worstSession = Object.entries(sessionWR).sort(([, a], [, b]) => a - b)[0]?.[0] || "N/A";

      // Composite score (0-100)
      const score = Math.round(
        winRate * 0.25 +                              // 25% win rate
        Math.min(profitFactor * 15, 40) +             // 40% max profit factor
        consistency * 0.20 +                          // 20% consistency
        Math.max(0, 15 - maxDD / 100)                 // 15% low DD bonus
      );

      scores.push({
        sourceId,
        sourceName: trades[0]?.source_name || `Source_${sourceId}`,
        source,
        totalTrades: trades.length,
        winRate,
        profitFactor,
        maxDD: +maxDD.toFixed(2),
        consistency: +consistency.toFixed(1),
        avgRR: totalLoss > 0 ? +(totalProfit / totalLoss).toFixed(2) : 0,
        score: Math.min(100, Math.max(0, score)),
        rank: 0,
        bestSession,
        worstSession,
      });
    }

    // Assign ranks
    scores.sort((a, b) => b.score - a.score);
    scores.forEach((s, i) => s.rank = i + 1);

    return scores;
  }


  // ── Pattern Detection ─────────────────────────────────────
  // → Feeds: Strategy Advisor, FORGE Mentor, Risk Engine
  detectPatterns(): GoldIntelligence["topPatterns"] {
    const patterns: GoldIntelligence["topPatterns"] = [];

    // Pattern 1: Asian Range Breakout
    const asianTrades = this.trades.filter(t => {
      const h = this.extractHour(t.open_time);
      return h !== null && h >= 7 && h <= 9; // London open
    });
    if (asianTrades.length >= 30) {
      const wr = asianTrades.filter(t => t.profit > 0).length / asianTrades.length * 100;
      patterns.push({
        name: "London Open Breakout",
        description: "Trades die zwischen 07:00-09:00 UTC eröffnet werden (Asian Range Breakout bei London Open)",
        winRate: +wr.toFixed(1),
        avgRR: this.calcAvgRR(asianTrades),
        sampleSize: asianTrades.length,
        conditions: "07:00-09:00 UTC, nach Asian Range",
      });
    }

    // Pattern 2: NY Session Momentum
    const nyTrades = this.trades.filter(t => {
      const h = this.extractHour(t.open_time);
      return h !== null && h >= 13 && h <= 16;
    });
    if (nyTrades.length >= 30) {
      const wr = nyTrades.filter(t => t.profit > 0).length / nyTrades.length * 100;
      patterns.push({
        name: "NY Session Momentum",
        description: "Trades in der New York Kernzeit (13:00-16:00 UTC). Oft Trend-Continuation nach London.",
        winRate: +wr.toFixed(1),
        avgRR: this.calcAvgRR(nyTrades),
        sampleSize: nyTrades.length,
        conditions: "13:00-16:00 UTC",
      });
    }

    // Pattern 3: Friday Avoid
    const fridayTrades = this.trades.filter(t => this.extractDayOfWeek(t.open_time) === 5);
    if (fridayTrades.length >= 20) {
      const wr = fridayTrades.filter(t => t.profit > 0).length / fridayTrades.length * 100;
      patterns.push({
        name: "Friday Afternoon Risk",
        description: "Freitag-Trades (besonders nach 15:00 UTC) haben historisch niedrigere Win Rate. Weekend-Gap Risiko.",
        winRate: +wr.toFixed(1),
        avgRR: this.calcAvgRR(fridayTrades),
        sampleSize: fridayTrades.length,
        conditions: "Freitag, besonders nach 15:00 UTC",
      });
    }

    // Pattern 4: BUY vs SELL bias
    const buys = this.trades.filter(t => t.direction === "BUY");
    const sells = this.trades.filter(t => t.direction === "SELL");
    if (buys.length >= 50 && sells.length >= 50) {
      const buyWR = buys.filter(t => t.profit > 0).length / buys.length * 100;
      const sellWR = sells.filter(t => t.profit > 0).length / sells.length * 100;
      patterns.push({
        name: buyWR > sellWR ? "Gold Long Bias" : "Gold Short Bias",
        description: `BUY Win Rate: ${buyWR.toFixed(1)}% (${buys.length} Trades) vs SELL Win Rate: ${sellWR.toFixed(1)}% (${sells.length} Trades)`,
        winRate: Math.max(buyWR, sellWR),
        avgRR: this.calcAvgRR(buyWR > sellWR ? buys : sells),
        sampleSize: buys.length + sells.length,
        conditions: `${buyWR > sellWR ? "BUY" : "SELL"} bevorzugt über ${Math.round((Date.now() - new Date(this.trades[0]?.collected_at || Date.now()).getTime()) / 86400000)} Tage`,
      });
    }

    // Pattern 5: Quick scalps vs longer holds
    const quick = this.trades.filter(t => {
      if (!t.open_time || !t.close_time) return false;
      const dur = (new Date(t.close_time).getTime() - new Date(t.open_time).getTime()) / 60000;
      return dur > 0 && dur < 30;
    });
    const longer = this.trades.filter(t => {
      if (!t.open_time || !t.close_time) return false;
      const dur = (new Date(t.close_time).getTime() - new Date(t.open_time).getTime()) / 60000;
      return dur >= 30 && dur < 480;
    });
    if (quick.length >= 30 && longer.length >= 30) {
      const quickWR = quick.filter(t => t.profit > 0).length / quick.length * 100;
      const longerWR = longer.filter(t => t.profit > 0).length / longer.length * 100;
      patterns.push({
        name: "Scalp vs Swing",
        description: `Scalps (<30 Min): ${quickWR.toFixed(1)}% WR, ${quick.length} Trades. Swings (30-480 Min): ${longerWR.toFixed(1)}% WR, ${longer.length} Trades.`,
        winRate: Math.max(quickWR, longerWR),
        avgRR: this.calcAvgRR(quickWR > longerWR ? quick : longer),
        sampleSize: quick.length + longer.length,
        conditions: quickWR > longerWR ? "Scalping bevorzugt" : "Swing bevorzugt",
      });
    }

    return patterns.sort((a, b) => b.winRate - a.winRate);
  }


  // ── Market Regime Detection ───────────────────────────────
  // → Feeds: Trade Manager, Risk Engine, Strategy Advisor
  detectRegime(): MarketRegime {
    // Use recent trades to determine market behavior
    const recent = this.trades
      .filter(t => {
        const age = Date.now() - new Date(t.collected_at).getTime();
        return age < 7 * 86400000; // Last 7 days
      })
      .sort((a, b) => new Date(b.open_time).getTime() - new Date(a.open_time).getTime());

    const buys = recent.filter(t => t.direction === "BUY" && t.profit > 0).length;
    const sells = recent.filter(t => t.direction === "SELL" && t.profit > 0).length;
    const avgPips = recent.length > 0
      ? Math.abs(recent.reduce((s, t) => s + (t.pips || 0), 0) / recent.length)
      : 0;

    // Determine regime
    let regime: MarketRegime["regime"] = "RANGING";
    let bestStrategy = "Mean-Reversion und Range-Trading";

    if (buys > sells * 1.5) {
      regime = "TRENDING_UP";
      bestStrategy = "BUY Dips, Trend-Following Long";
    } else if (sells > buys * 1.5) {
      regime = "TRENDING_DOWN";
      bestStrategy = "SELL Rallies, Trend-Following Short";
    } else if (avgPips > 50) {
      regime = "HIGH_VOLA";
      bestStrategy = "Reduzierte Lot-Size, breitere SLs, weniger Trades";
    } else if (avgPips < 15) {
      regime = "LOW_VOLA";
      bestStrategy = "Scalping mit engen Targets, mehr Trades";
    }

    // Latest sentiment
    const latestSentiment = this.sentiment[0];

    return {
      regime,
      strength: Math.min(100, Math.round(Math.abs(buys - sells) / Math.max(recent.length, 1) * 200)),
      since: recent[recent.length - 1]?.open_time || new Date().toISOString(),
      bestStrategy,
      sentiment: {
        longPct: latestSentiment?.long_pct || 50,
        shortPct: latestSentiment?.short_pct || 50,
        source: latestSentiment?.source || "market_sentiment",
      },
    };
  }


  // ── Channel Benchmarks ────────────────────────────────────
  // → Feeds: Channel Scanner (what's "good" vs "bad")
  calcBenchmarks(): GoldIntelligence["benchmarks"] {
    const bySource = new Map<string, any[]>();
    for (const t of this.trades) {
      const key = `${t.source}:${t.source_id}`;
      if (!bySource.has(key)) bySource.set(key, []);
      bySource.get(key)!.push(t);
    }

    const winRates: number[] = [];
    const profitFactors: number[] = [];
    const drawdowns: number[] = [];

    for (const trades of Array.from(bySource.values())) {
      if (trades.length < 10) continue;
      const wr = trades.filter((t: any) => t.profit > 0).length / trades.length * 100;
      winRates.push(wr);
      const tp = trades.filter((t: any) => t.profit > 0).reduce((s: number, t: any) => s + Math.abs(t.profit), 0);
      const tl = trades.filter((t: any) => t.profit < 0).reduce((s: number, t: any) => s + Math.abs(t.profit), 0);
      if (tl > 0) profitFactors.push(tp / tl);
    }

    const median = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)] || 0;
    };

    return {
      minWinRate: +median(winRates).toFixed(1),
      minProfitFactor: +median(profitFactors).toFixed(2),
      maxDD: 15, // Conservative default
      avgSignalsPerDay: 3,
      avgRR: +median(profitFactors).toFixed(2),
    };
  }


  // ── Generate Fun Facts for FORGE Mentor ───────────────────
  generateFunFacts(sessions: SessionStats[], days: DayStats[], patterns: any[]): string[] {
    const facts: string[] = [];

    const bestSession = sessions.sort((a, b) => b.winRate - a.winRate)[0];
    if (bestSession) {
      facts.push(`Beste Session für Gold: ${bestSession.session} mit ${bestSession.winRate}% Win Rate über ${bestSession.totalTrades} Trades.`);
    }

    const worstDay = days.filter(d => d.totalTrades > 20).sort((a, b) => a.winRate - b.winRate)[0];
    if (worstDay) {
      facts.push(`${worstDay.dayName} ist historisch der schwächste Tag für Gold-Trading (${worstDay.winRate}% WR).`);
    }

    const bestPattern = patterns[0];
    if (bestPattern) {
      facts.push(`Top Pattern: "${bestPattern.name}" hat ${bestPattern.winRate}% Win Rate über ${bestPattern.sampleSize} Trades.`);
    }

    facts.push(`Unsere Datenbank: ${this.trades.length.toLocaleString()} verifizierte Gold-Trades aus ${new Set(this.trades.map(t => t.source)).size} Quellen.`);

    return facts;
  }


  // ── MAIN: Generate Complete Intelligence ──────────────────
  async generate(): Promise<GoldIntelligence> {
    console.log("[INTEL] Generating fresh intelligence...");

    await this.loadData(90);

    const sessions = this.analyzeSession();
    const days = this.analyzeDays();
    const optimalSLTP = this.analyzeOptimalSLTP();
    const duration = this.analyzeDuration();
    const traders = this.rankTraders();
    const patterns = this.detectPatterns();
    const regime = this.detectRegime();
    const benchmarks = this.calcBenchmarks();
    const funFacts = this.generateFunFacts(sessions, days, patterns);

    const sources = {
      mql5: this.trades.filter(t => t.source === "mql5").length,
      myfxbook: this.trades.filter(t => t.source === "myfxbook").length,
      telegram: this.trades.filter(t => t.source === "telegram").length,
      tracker: this.trades.filter(t => t.source === "tracker").length,
    };

    const intelligence: GoldIntelligence = {
      generatedAt: new Date().toISOString(),
      dataPoints: this.trades.length,
      sources,
      sessions,
      optimalSLTP,
      dayStats: days,
      maxSafeDD: { tag12x: 8, tegas24x: 3.5, standard: 25 },
      avgTradeDuration: { winner: duration.winner, loser: duration.loser },
      optimalHoldTime: { min: 5, max: duration.sweet * 2, sweet: duration.sweet },
      breakEvenTiming: 1.2, // Move to BE after 1.2R
      partialCloseZone: 2.0, // Partial close at 2R
      regime,
      sentiment: regime.sentiment,
      volatility: { current: regime.regime.includes("VOLA") ? "HIGH" : "NORMAL", avg30d: 0, percentile: 50 },
      benchmarks,
      topPatterns: patterns,
      traderRankings: traders.slice(0, 50),
      funFacts,
      weeklyInsight: `Market Regime: ${regime.regime}. Empfehlung: ${regime.bestStrategy}. Basierend auf ${this.trades.length.toLocaleString()} analysierten Trades.`,
    };

    // Save to Supabase for all agents to read
    await supabaseAdmin.from("user_data").upsert({
      user_id: "system",
      category: "gold_intelligence",
      data: intelligence,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,category" });

    console.log(`[INTEL] Intelligence generated: ${this.trades.length} trades → ${patterns.length} patterns, ${traders.length} traders ranked`);

    return intelligence;
  }


  // ── Helpers ───────────────────────────────────────────────
  private extractHour(timeStr: string): number | null {
    try {
      const d = new Date(timeStr);
      return isNaN(d.getTime()) ? null : d.getUTCHours();
    } catch { return null; }
  }

  private extractDayOfWeek(timeStr: string): number | null {
    try {
      const d = new Date(timeStr);
      return isNaN(d.getTime()) ? null : d.getUTCDay();
    } catch { return null; }
  }

  private groupByMonth(trades: any[]): Record<string, any[]> {
    const months: Record<string, any[]> = {};
    for (const t of trades) {
      try {
        const d = new Date(t.open_time);
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        if (!months[key]) months[key] = [];
        months[key].push(t);
      } catch {}
    }
    return months;
  }

  private calcAvgRR(trades: any[]): number {
    const winners = trades.filter(t => t.profit > 0);
    const losers = trades.filter(t => t.profit < 0);
    const avgWin = winners.length > 0 ? winners.reduce((s, t) => s + Math.abs(t.profit), 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? losers.reduce((s, t) => s + Math.abs(t.profit), 0) / losers.length : 0;
    return avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : 0;
  }
}


// ═══════════════════════════════════════════════════════════════
// AGENT CONNECTOR — So liest jeder Agent die Intelligence
// ═══════════════════════════════════════════════════════════════

export async function getIntelligence(): Promise<GoldIntelligence | null> {
  const { data } = await supabaseAdmin
    .from("user_data")
    .select("data")
    .eq("user_id", "system")
    .eq("category", "gold_intelligence")
    .single();

  return data?.data as GoldIntelligence || null;
}
