// ═══════════════════════════════════════════════════════════════
// src/lib/partner/screenshot-gen.ts — Performance screenshot cards
// Shows USER profit data for sharing on social media
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

interface ProfitData {
  userId: string;
  profit: number;
  profitPercent: number;
  trades: number;
  winRate: number;
  period: string;
}

function renderCard(data: ProfitData, periodLabel: string): string {
  const color = data.profit >= 0 ? "#22c55e" : "#ef4444";
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" rx="16" fill="#1a1a2e"/>
      <rect x="0" y="0" width="600" height="60" rx="16" fill="#d4a017"/>
      <text x="300" y="40" text-anchor="middle" fill="#1a1a2e" font-size="22" font-weight="bold">
        Gold Foundry — ${periodLabel}
      </text>
      <text x="300" y="120" text-anchor="middle" fill="${color}" font-size="48" font-weight="bold">
        ${data.profit >= 0 ? "+" : ""}${data.profit.toFixed(2)} €
      </text>
      <text x="300" y="160" text-anchor="middle" fill="${color}" font-size="24">
        ${data.profitPercent >= 0 ? "+" : ""}${data.profitPercent.toFixed(1)}%
      </text>
      <text x="150" y="220" text-anchor="middle" fill="#ccc" font-size="16">Trades: ${data.trades}</text>
      <text x="450" y="220" text-anchor="middle" fill="#ccc" font-size="16">Win-Rate: ${data.winRate.toFixed(0)}%</text>
      <text x="300" y="370" text-anchor="middle" fill="#888" font-size="14">goldfoundry.de</text>
    </svg>`;
}

async function fetchProfitData(userId: string, days: number): Promise<ProfitData> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabaseAdmin
    .from("trades")
    .select("profit, result")
    .eq("user_id", userId)
    .gte("closed_at", since);

  const trades = data ?? [];
  const profit = trades.reduce((s, t) => s + (t.profit ?? 0), 0);
  const wins = trades.filter((t) => (t.profit ?? 0) > 0).length;

  return {
    userId,
    profit,
    profitPercent: trades.length ? (profit / Math.max(1, trades.length)) : 0,
    trades: trades.length,
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    period: `${days}d`,
  };
}

export async function generateDailyCard(userId: string): Promise<string> {
  const data = await fetchProfitData(userId, 1);
  return renderCard(data, "Tages-Performance");
}

export async function generateWeeklyCard(userId: string): Promise<string> {
  const data = await fetchProfitData(userId, 7);
  return renderCard(data, "Wochen-Performance");
}

export async function generateMonthlyCard(userId: string): Promise<string> {
  const data = await fetchProfitData(userId, 30);
  return renderCard(data, "Monats-Performance");
}
