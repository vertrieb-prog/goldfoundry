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

// ── MQL5Collector Class ─────────────────────────────────────
export class MQL5Collector {
  private maxSignals: number;
  private symbolFilter: string;

  constructor(opts: { maxSignals?: number; symbolFilter?: string } = {}) {
    this.maxSignals = opts.maxSignals || 20;
    this.symbolFilter = opts.symbolFilter || "";
  }

  async run() {
    const { data: signals } = await supabaseAdmin
      .from("mql5_signals")
      .select("signal_id")
      .limit(this.maxSignals);
    const ids = signals?.map((s: { signal_id: string }) => s.signal_id) || [];
    const stats = await collectMQL5(ids);
    await saveTraderStats(stats);
    return { collected: stats.length, source: "mql5", filter: this.symbolFilter };
  }
}

// ── MyFxBookScraper Class ───────────────────────────────────
export class MyFxBookScraper {
  private dailyLimit: number;

  constructor(opts: { dailyLimit?: number } = {}) {
    this.dailyLimit = opts.dailyLimit || 100;
  }

  async run() {
    const { data: accounts } = await supabaseAdmin
      .from("myfxbook_accounts")
      .select("account_id")
      .limit(this.dailyLimit);
    const ids = accounts?.map((a: { account_id: string }) => a.account_id) || [];
    const stats = await collectMyFxBook(ids);
    await saveTraderStats(stats);
    return { collected: stats.length, source: "myfxbook" };
  }

  async getCommunityOutlook() {
    try {
      const resp = await fetch("https://www.myfxbook.com/community/outlook", {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GoldFoundry/1.0)" },
      });
      if (!resp.ok) return { pairs: [], updated: new Date().toISOString() };
      const html = await resp.text();
      const pairs: Array<{ symbol: string; longPct: number; shortPct: number }> = [];
      const regex = /class="symbol"[^>]*>(\w+)<.*?(\d+\.?\d*)%.*?(\d+\.?\d*)%/gs;
      let match;
      while ((match = regex.exec(html)) !== null) {
        pairs.push({ symbol: match[1], longPct: parseFloat(match[2]), shortPct: parseFloat(match[3]) });
      }
      return { pairs, updated: new Date().toISOString() };
    } catch {
      return { pairs: [], updated: new Date().toISOString() };
    }
  }
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
