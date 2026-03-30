// ═══════════════════════════════════════════════════════════════
// src/lib/data/collector.ts — MQL5 + MyFxBook Data Collector
// Scrapt Signal-Stats + Trade-History + Performance-Details
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
  subscribers: number;
  weeks: number;
  balance: number;
  equity: number;
  lastUpdated: string;
}

// ── MQL5 Scraper (Stats only — Trade-Scraping bringt wenig) ──

export async function collectMQL5(signalIds: string[]): Promise<TraderStats[]> {
  const allStats: TraderStats[] = [];

  for (const id of signalIds) {
    try {
      const url = `https://www.mql5.com/en/signals/${id}`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const stats = parseMQL5Html(html, id);
      if (stats) allStats.push(stats);
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[MQL5] Error collecting ${id}:`, err);
    }
  }
  return allStats;
}

function parseMQL5Html(html: string, id: string): TraderStats | null {
  const extract = (pattern: RegExp) => {
    const m = html.match(pattern);
    return m ? m[1] : null;
  };
  const num = (pattern: RegExp, fallback = 0) => {
    const v = extract(pattern);
    return v ? parseFloat(v.replace(/[,\s]/g, "")) : fallback;
  };

  // Multiple patterns for each metric (MQL5 changes layout)
  const gain = num(/Gain:?\s*<[^>]*>\s*<?[^>]*>?\s*([\d,.]+)%/i) ||
               num(/class="[^"]*gain[^"]*"[^>]*>([\d,.]+)%/i);
  const dd = num(/(?:Max\.?\s*)?Drawdown:?\s*<[^>]*>\s*<?[^>]*>?\s*([\d,.]+)%/i) ||
             num(/class="[^"]*drawdown[^"]*"[^>]*>([\d,.]+)%/i);
  const trades = num(/Trades:?\s*<[^>]*>\s*<?[^>]*>?\s*([\d,]+)/i) ||
                 num(/class="[^"]*trades[^"]*"[^>]*>([\d,]+)/i);
  const winRate = num(/(?:Win|Profit)\s*(?:Rate|%):?\s*<[^>]*>\s*<?[^>]*>?\s*([\d,.]+)%/i);
  const pf = num(/Profit\s*Factor:?\s*<[^>]*>\s*<?[^>]*>?\s*([\d,.]+)/i);
  const subs = num(/Subscribers:?\s*<[^>]*>\s*<?[^>]*>?\s*([\d,]+)/i);
  const weeks = num(/Weeks:?\s*<[^>]*>\s*<?[^>]*>?\s*([\d,]+)/i);
  const balance = num(/Balance:?\s*<[^>]*>\s*<?[^>]*>?\s*\$?\s*([\d,.]+)/i);
  const equity = num(/Equity:?\s*<[^>]*>\s*<?[^>]*>?\s*\$?\s*([\d,.]+)/i);
  const monthly = num(/Monthly:?\s*<[^>]*>\s*<?[^>]*>?\s*([\d,.]+)%/i);
  const nameMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/);

  return {
    source: "mql5",
    sourceId: id,
    name: nameMatch?.[1]?.replace(/<[^>]*>/g, "").trim() || `Signal ${id}`,
    gain, drawdown: dd, trades, winRate,
    profitFactor: pf,
    monthlyReturn: monthly,
    subscribers: subs,
    weeks, balance, equity,
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
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) continue;
      const html = await resp.text();
      const stats = parseMyFxBookHtml(html, id);
      if (stats) results.push(stats);
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[MyFxBook] Error collecting ${id}:`, err);
    }
  }
  return results;
}

function parseMyFxBookHtml(html: string, id: string): TraderStats | null {
  const num = (pattern: RegExp) => {
    const m = html.match(pattern);
    return m ? parseFloat(m[1].replace(/[,\s]/g, "")) : 0;
  };

  return {
    source: "myfxbook",
    sourceId: id,
    name: `MyFxBook ${id}`,
    gain: num(/Gain:.*?<span>([\d,.]+)%/),
    drawdown: num(/Daily DD:.*?<span>([\d,.]+)%/),
    trades: num(/Trades:.*?<span>([\d,]+)/),
    winRate: num(/Won:.*?<span>([\d,.]+)%/),
    profitFactor: num(/Profit Factor:.*?<span>([\d,.]+)/),
    monthlyReturn: num(/Monthly:.*?<span>([\d,.]+)%/),
    subscribers: 0,
    weeks: 0,
    balance: num(/Balance:.*?\$([\d,.]+)/),
    equity: num(/Equity:.*?\$([\d,.]+)/),
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
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(10000),
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
      subscribers: s.subscribers,
      weeks: s.weeks,
      balance: s.balance,
      equity: s.equity,
      last_updated: s.lastUpdated,
    })), { onConflict: "source,source_id" });
  if (error) console.error("[Collector] Save stats error:", error);
}

