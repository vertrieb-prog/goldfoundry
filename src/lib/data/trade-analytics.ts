// src/lib/data/trade-analytics.ts
// ═══════════════════════════════════════════════════════════════
// Trade Analytics Aggregator — Pre-computed Summaries
// Läuft als Cron, speichert kompakte Summaries
// Mentor liest nur Summary = 0 Tokens für Rohdaten
// ═══════════════════════════════════════════════════════════════

import { createSupabaseAdmin } from "@/lib/supabase/server";

export interface AnalyticsSummary {
  // Overview
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  rrRatio: number;
  profitFactor: number;
  bestTrade: { symbol: string; profit: number; date: string };
  worstTrade: { symbol: string; profit: number; date: string };

  // Per Symbol
  bySymbol: Array<{ symbol: string; trades: number; winRate: number; pnl: number; avgPnl: number }>;

  // Per Weekday
  byWeekday: Array<{ day: string; trades: number; pnl: number; winRate: number }>;

  // Per Session
  bySession: Array<{ session: string; trades: number; pnl: number; winRate: number }>;

  // Streaks
  currentStreak: { type: "win" | "loss"; count: number };
  longestWinStreak: number;
  longestLossStreak: number;

  // Equity curve (daily)
  equityCurve: Array<{ date: string; equity: number; pnl: number }>;

  // Period comparison
  thisWeekPnL: number;
  lastWeekPnL: number;
  thisMonthPnL: number;
  lastMonthPnL: number;

  // MQL5 Signal Performance (wenn vorhanden)
  signalStats: Array<{
    name: string; gain: number; drawdown: number;
    winRate: number; profitFactor: number; subscribers: number;
    recentTrades: Array<{ symbol: string; type: string; profit: number }>;
  }>;

  generatedAt: string;
}

export async function generateAnalytics(userId: string): Promise<AnalyticsSummary> {
  const db = createSupabaseAdmin();

  // All closed trades
  const { data: trades } = await db.from("trades")
    .select("symbol, profit, volume, trade_type, open_time, close_time")
    .eq("user_id", userId).eq("is_open", false)
    .order("close_time", { ascending: false })
    .limit(500);

  const t = trades || [];
  const wins = t.filter(x => Number(x.profit) > 0);
  const losses = t.filter(x => Number(x.profit) <= 0);
  const totalPnL = t.reduce((s, x) => s + Number(x.profit), 0);
  const avgWin = wins.length ? wins.reduce((s, x) => s + Number(x.profit), 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, x) => s + Number(x.profit), 0) / losses.length) : 0;
  const grossWin = wins.reduce((s, x) => s + Number(x.profit), 0);
  const grossLoss = Math.abs(losses.reduce((s, x) => s + Number(x.profit), 0));

  // Best/Worst
  const best = t.reduce((b, x) => Number(x.profit) > Number(b.profit) ? x : b, t[0] || { symbol: "-", profit: 0, close_time: "" });
  const worst = t.reduce((w, x) => Number(x.profit) < Number(w.profit) ? x : w, t[0] || { symbol: "-", profit: 0, close_time: "" });

  // By Symbol
  const symMap: Record<string, { trades: number; wins: number; pnl: number }> = {};
  for (const x of t) {
    const s = x.symbol || "?";
    if (!symMap[s]) symMap[s] = { trades: 0, wins: 0, pnl: 0 };
    symMap[s].trades++;
    symMap[s].pnl += Number(x.profit);
    if (Number(x.profit) > 0) symMap[s].wins++;
  }
  const bySymbol = Object.entries(symMap)
    .map(([symbol, d]) => ({ symbol, trades: d.trades, winRate: d.trades ? d.wins / d.trades * 100 : 0, pnl: d.pnl, avgPnl: d.trades ? d.pnl / d.trades : 0 }))
    .sort((a, b) => b.pnl - a.pnl);

  // By Weekday
  const days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const dayMap: Record<string, { trades: number; wins: number; pnl: number }> = {};
  for (const x of t) {
    if (!x.close_time) continue;
    const d = days[new Date(x.close_time).getDay()];
    if (!dayMap[d]) dayMap[d] = { trades: 0, wins: 0, pnl: 0 };
    dayMap[d].trades++;
    dayMap[d].pnl += Number(x.profit);
    if (Number(x.profit) > 0) dayMap[d].wins++;
  }
  const byWeekday = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"]
    .filter(d => dayMap[d])
    .map(d => ({ day: d, trades: dayMap[d].trades, pnl: dayMap[d].pnl, winRate: dayMap[d].trades ? dayMap[d].wins / dayMap[d].trades * 100 : 0 }));

  // By Session (UTC hours)
  const sessionMap: Record<string, { trades: number; wins: number; pnl: number }> = {
    "Asian (00-08)": { trades: 0, wins: 0, pnl: 0 },
    "London (08-13)": { trades: 0, wins: 0, pnl: 0 },
    "New York (13-17)": { trades: 0, wins: 0, pnl: 0 },
    "Late (17-00)": { trades: 0, wins: 0, pnl: 0 },
  };
  for (const x of t) {
    if (!x.open_time) continue;
    const h = new Date(x.open_time).getUTCHours();
    const session = h < 8 ? "Asian (00-08)" : h < 13 ? "London (08-13)" : h < 17 ? "New York (13-17)" : "Late (17-00)";
    sessionMap[session].trades++;
    sessionMap[session].pnl += Number(x.profit);
    if (Number(x.profit) > 0) sessionMap[session].wins++;
  }
  const bySession = Object.entries(sessionMap)
    .filter(([, d]) => d.trades > 0)
    .map(([session, d]) => ({ session, trades: d.trades, pnl: d.pnl, winRate: d.trades ? d.wins / d.trades * 100 : 0 }));

  // Streaks
  let currentType: "win" | "loss" = Number(t[0]?.profit) > 0 ? "win" : "loss";
  let currentCount = 0;
  let longestWin = 0, longestLoss = 0, tempWin = 0, tempLoss = 0;
  for (const x of t) {
    const isWin = Number(x.profit) > 0;
    if (isWin) { tempWin++; tempLoss = 0; if (tempWin > longestWin) longestWin = tempWin; }
    else { tempLoss++; tempWin = 0; if (tempLoss > longestLoss) longestLoss = tempLoss; }
  }
  // Current streak from most recent
  currentCount = 1;
  for (let i = 1; i < t.length; i++) {
    if ((Number(t[i].profit) > 0) === (currentType === "win")) currentCount++;
    else break;
  }

  // Period comparison
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfLastWeek = new Date(startOfWeek); startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisWeekPnL = t.filter(x => new Date(x.close_time) >= startOfWeek).reduce((s, x) => s + Number(x.profit), 0);
  const lastWeekPnL = t.filter(x => { const d = new Date(x.close_time); return d >= startOfLastWeek && d < startOfWeek; }).reduce((s, x) => s + Number(x.profit), 0);
  const thisMonthPnL = t.filter(x => new Date(x.close_time) >= startOfMonth).reduce((s, x) => s + Number(x.profit), 0);
  const lastMonthPnL = t.filter(x => { const d = new Date(x.close_time); return d >= startOfLastMonth && d < startOfMonth; }).reduce((s, x) => s + Number(x.profit), 0);

  // Equity curve (daily snapshots)
  const { data: snapshots } = await db.from("daily_snapshots")
    .select("snapshot_date, equity, closed_pnl")
    .in("account_id", (await db.from("slave_accounts").select("id").eq("user_id", userId)).data?.map(a => a.id) || [])
    .order("snapshot_date", { ascending: true })
    .limit(90);

  const equityCurve = (snapshots || []).map(s => ({
    date: s.snapshot_date,
    equity: Number(s.equity),
    pnl: Number(s.closed_pnl),
  }));

  // MQL5 Signal Stats (wenn configured)
  let signalStats: AnalyticsSummary["signalStats"] = [];
  try {
    const { data: trackedSignals } = await db.from("trader_stats")
      .select("*").eq("source", "mql5").order("last_updated", { ascending: false }).limit(10);

    if (trackedSignals?.length) {
      for (const sig of trackedSignals) {
        signalStats.push({
          name: sig.name,
          gain: Number(sig.gain),
          drawdown: Number(sig.drawdown),
          winRate: Number(sig.win_rate),
          profitFactor: Number(sig.profit_factor),
          subscribers: Number(sig.subscribers) || 0,
          recentTrades: [],
        });
      }
    }
  } catch {}

  return {
    totalTrades: t.length,
    totalPnL: Math.round(totalPnL * 100) / 100,
    winRate: t.length ? Math.round(wins.length / t.length * 1000) / 10 : 0,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    rrRatio: avgLoss > 0 ? Math.round(avgWin / avgLoss * 100) / 100 : 0,
    profitFactor: grossLoss > 0 ? Math.round(grossWin / grossLoss * 100) / 100 : 0,
    bestTrade: { symbol: best?.symbol || "-", profit: Number(best?.profit || 0), date: best?.close_time || "" },
    worstTrade: { symbol: worst?.symbol || "-", profit: Number(worst?.profit || 0), date: worst?.close_time || "" },
    bySymbol, byWeekday, bySession,
    currentStreak: { type: currentType, count: currentCount },
    longestWinStreak: longestWin,
    longestLossStreak: longestLoss,
    equityCurve,
    thisWeekPnL: Math.round(thisWeekPnL * 100) / 100,
    lastWeekPnL: Math.round(lastWeekPnL * 100) / 100,
    thisMonthPnL: Math.round(thisMonthPnL * 100) / 100,
    lastMonthPnL: Math.round(lastMonthPnL * 100) / 100,
    signalStats,
    generatedAt: new Date().toISOString(),
  };
}

// Format summary as compact text for AI (tokensparend!)
export function formatAnalyticsForAI(a: AnalyticsSummary): string {
  let out = `TRADE ANALYTICS (${new Date(a.generatedAt).toLocaleDateString("de-DE")})\n`;
  out += `Trades: ${a.totalTrades} | WR: ${a.winRate}% | P&L: ${a.totalPnL >= 0 ? "+" : ""}$${a.totalPnL}\n`;
  out += `Avg Win: +$${a.avgWin} | Avg Loss: -$${a.avgLoss} | RR: ${a.rrRatio} | PF: ${a.profitFactor}\n`;
  out += `Best: ${a.bestTrade.symbol} +$${a.bestTrade.profit.toFixed(0)} | Worst: ${a.worstTrade.symbol} $${a.worstTrade.profit.toFixed(0)}\n`;
  out += `Streak: ${a.currentStreak.count}× ${a.currentStreak.type} | Max Win: ${a.longestWinStreak} | Max Loss: ${a.longestLossStreak}\n`;
  out += `Diese Woche: ${a.thisWeekPnL >= 0 ? "+" : ""}$${a.thisWeekPnL} | Letzte: ${a.lastWeekPnL >= 0 ? "+" : ""}$${a.lastWeekPnL}\n`;
  out += `Dieser Monat: ${a.thisMonthPnL >= 0 ? "+" : ""}$${a.thisMonthPnL} | Letzter: ${a.lastMonthPnL >= 0 ? "+" : ""}$${a.lastMonthPnL}\n\n`;

  if (a.bySymbol.length) {
    out += `SYMBOLE:\n`;
    for (const s of a.bySymbol.slice(0, 8)) {
      out += `  ${s.symbol}: ${s.trades}T WR:${s.winRate.toFixed(0)}% P&L:${s.pnl >= 0 ? "+" : ""}$${s.pnl.toFixed(0)}\n`;
    }
  }

  if (a.bySession.length) {
    out += `SESSIONS:\n`;
    for (const s of a.bySession) {
      out += `  ${s.session}: ${s.trades}T WR:${s.winRate.toFixed(0)}% P&L:${s.pnl >= 0 ? "+" : ""}$${s.pnl.toFixed(0)}\n`;
    }
  }

  if (a.byWeekday.length) {
    out += `WOCHENTAGE:\n`;
    for (const d of a.byWeekday) {
      out += `  ${d.day}: ${d.trades}T WR:${d.winRate.toFixed(0)}% P&L:${d.pnl >= 0 ? "+" : ""}$${d.pnl.toFixed(0)}\n`;
    }
  }

  if (a.signalStats.length) {
    out += `\nMQL5 SIGNALS:\n`;
    for (const s of a.signalStats) {
      out += `  ${s.name}: Gain:${s.gain}% DD:${s.drawdown}% WR:${s.winRate}% PF:${s.profitFactor} Subs:${s.subscribers}\n`;
      if (s.recentTrades.length) {
        out += `    Letzte: ${s.recentTrades.map(t => `${t.type} ${t.symbol} ${t.profit >= 0 ? "+" : ""}$${t.profit.toFixed(0)}`).join(", ")}\n`;
      }
    }
  }

  return out;
}
