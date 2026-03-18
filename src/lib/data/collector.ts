// ═══════════════════════════════════════════════════════════════
// src/lib/data/collector.ts — MQL5 + MyFxBook Data Collector
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

export interface TraderStats {
  source: "mql5" | "myfxbook";
  sourceId: string;
  name: string;
  gain: number;
  drawdown: number;
  trades: number;
  winRate: number;
  profitFactor: number;
  monthlyReturn: number;
  lastUpdated: string;
}

// ── MQL5 Scraper ────────────────────────────────────────────
export async function collectMQL5(signalIds: string[]): Promise<TraderStats[]> {
  const results: TraderStats[] = [];
  for (const id of signalIds) {
    try {
      const url = `https://www.mql5.com/en/signals/${id}`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GoldFoundry/1.0)" },
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const stats = parseMQL5Html(html, id);
      if (stats) results.push(stats);
    } catch (err) {
      console.error(`[MQL5] Error collecting ${id}:`, err);
    }
  }
  return results;
}

function parseMQL5Html(html: string, id: string): TraderStats | null {
  // Extract key metrics from MQL5 page HTML
  const gainMatch = html.match(/Gain:.*?<span[^>]*>([\d.]+)%/);
  const ddMatch = html.match(/Drawdown:.*?<span[^>]*>([\d.]+)%/);
  const tradesMatch = html.match(/Trades:.*?<span[^>]*>(\d+)/);
  const nameMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);

  return {
    source: "mql5",
    sourceId: id,
    name: nameMatch?.[1]?.trim() || `Signal ${id}`,
    gain: parseFloat(gainMatch?.[1] || "0"),
    drawdown: parseFloat(ddMatch?.[1] || "0"),
    trades: parseInt(tradesMatch?.[1] || "0"),
    winRate: 0,
    profitFactor: 0,
    monthlyReturn: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// ── MyFxBook Scraper ────────────────────────────────────────
export async function collectMyFxBook(accountIds: string[]): Promise<TraderStats[]> {
  const results: TraderStats[] = [];
  for (const id of accountIds) {
    try {
      const url = `https://www.myfxbook.com/members/GoldFoundry/${id}`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GoldFoundry/1.0)" },
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const stats = parseMyFxBookHtml(html, id);
      if (stats) results.push(stats);
    } catch (err) {
      console.error(`[MyFxBook] Error collecting ${id}:`, err);
    }
  }
  return results;
}

function parseMyFxBookHtml(html: string, id: string): TraderStats | null {
  const gainMatch = html.match(/Gain:.*?<span>([\d.]+)%/);
  const ddMatch = html.match(/Daily DD:.*?<span>([\d.]+)%/);
  const pfMatch = html.match(/Profit Factor:.*?<span>([\d.]+)/);

  return {
    source: "myfxbook",
    sourceId: id,
    name: `MyFxBook ${id}`,
    gain: parseFloat(gainMatch?.[1] || "0"),
    drawdown: parseFloat(ddMatch?.[1] || "0"),
    trades: 0,
    winRate: 0,
    profitFactor: parseFloat(pfMatch?.[1] || "0"),
    monthlyReturn: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Save to DB ──────────────────────────────────────────────
export async function saveTraderStats(stats: TraderStats[]) {
  if (!stats.length) return;
  const { error } = await supabaseAdmin
    .from("trader_stats")
    .upsert(stats.map(s => ({
      source: s.source,
      source_id: s.sourceId,
      name: s.name,
      gain: s.gain,
      drawdown: s.drawdown,
      trades: s.trades,
      win_rate: s.winRate,
      profit_factor: s.profitFactor,
      monthly_return: s.monthlyReturn,
      last_updated: s.lastUpdated,
    })), { onConflict: "source,source_id" });
  if (error) console.error("[Collector] Save error:", error);
}
