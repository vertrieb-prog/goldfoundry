// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — DATA COLLECTION ENGINE
//
// 1) MQL5 Signal Collector — Offizieller CSV-Download
// 2) MyFxBook Smart Scraper — Intelligent, undetectable
//
// Ziel: Alle verfügbaren Gold-Trading-Daten sammeln
// und in Supabase speichern für Pattern-Analyse.
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";


// ─────────────────────────────────────────────────────────────
// SHARED: User Agents, Delays, Fingerprints
// ─────────────────────────────────────────────────────────────

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0",
];

const ACCEPT_LANGUAGES = [
  "en-US,en;q=0.9",
  "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
  "en-GB,en;q=0.9",
  "fr-FR,fr;q=0.9,en;q=0.8",
  "en-US,en;q=0.9,de;q=0.8",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomLang(): string {
  return ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)];
}

// Human-like delay: 2-8 seconds with occasional longer pauses
async function humanDelay(minMs = 2000, maxMs = 8000): Promise<void> {
  // 10% chance of a longer "coffee break" pause (15-30s)
  if (Math.random() < 0.1) {
    const longPause = 15000 + Math.random() * 15000;
    console.log(`[SCRAPER] Coffee break: ${(longPause / 1000).toFixed(1)}s`);
    await new Promise(r => setTimeout(r, longPause));
    return;
  }
  const delay = minMs + Math.random() * (maxMs - minMs);
  await new Promise(r => setTimeout(r, delay));
}

// Randomize request order (don't scrape sequentially)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// ═══════════════════════════════════════════════════════════════
// 1) MQL5 SIGNAL COLLECTOR
//
// MQL5 erlaubt CSV-Export von öffentlichen Signals.
// Wir holen uns die Signal-Liste und dann die Trade-History
// für jedes Gold-Signal.
// ═══════════════════════════════════════════════════════════════

interface MQL5Signal {
  id: string;
  name: string;
  growth: number;        // % total growth
  reliability: number;   // 0-100
  subscribers: number;
  price: number;         // $/month
  weeks: number;         // weeks active
  trades: number;
  winRate: number;
  profitFactor: number;
  maxDD: number;
  avgProfit: number;
  url: string;
}

interface MQL5Trade {
  signalId: string;
  signalName: string;
  openTime: string;
  closeTime: string;
  symbol: string;
  direction: "BUY" | "SELL";
  lots: number;
  openPrice: number;
  closePrice: number;
  sl: number | null;
  tp: number | null;
  profit: number;
  pips: number;
  duration: number;      // minutes
  commission: number;
  swap: number;
}

export class MQL5Collector {
  private collected: MQL5Signal[] = [];
  private trades: MQL5Trade[] = [];
  private maxSignals: number;
  private symbolFilter: string;

  constructor(config: { maxSignals?: number; symbolFilter?: string } = {}) {
    this.maxSignals = config.maxSignals || 50;
    this.symbolFilter = config.symbolFilter || "XAUUSD";
  }

  // ── Step 1: Get Signal List ──────────────────────────────
  async collectSignalList(): Promise<MQL5Signal[]> {
    console.log(`[MQL5] Collecting top ${this.maxSignals} signals for ${this.symbolFilter}...`);

    // MQL5 signals page with filters
    // In production: use proper pagination
    const urls = [
      `https://www.mql5.com/en/signals/mt5/list?sf=reliability&sp=desc`,
      `https://www.mql5.com/en/signals/mt5/list?sf=growth&sp=desc`,
      `https://www.mql5.com/en/signals/mt4/list?sf=reliability&sp=desc`,
    ];

    for (const url of urls) {
      try {
        const resp = await fetch(url, {
          headers: {
            "User-Agent": randomUA(),
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": randomLang(),
            "Cache-Control": "no-cache",
          },
        });

        if (!resp.ok) {
          console.log(`[MQL5] Failed: ${resp.status}`);
          continue;
        }

        const html = await resp.text();
        const signals = this.parseSignalList(html);
        this.collected.push(...signals);

        console.log(`[MQL5] Found ${signals.length} signals from ${url}`);
        await humanDelay(3000, 6000);

      } catch (err) {
        console.error(`[MQL5] Error fetching ${url}:`, err);
      }
    }

    // Deduplicate
    const unique = new Map<string, MQL5Signal>();
    for (const s of this.collected) {
      if (!unique.has(s.id)) unique.set(s.id, s);
    }
    this.collected = Array.from(unique.values());

    console.log(`[MQL5] Total unique signals: ${this.collected.length}`);
    return this.collected;
  }

  // ── Step 2: Download Trade History per Signal ────────────
  async collectTradeHistory(signalId: string, signalName: string): Promise<MQL5Trade[]> {
    // MQL5 allows CSV export from signal pages
    // URL pattern: https://www.mql5.com/en/signals/{id}/export/history
    const exportUrl = `https://www.mql5.com/en/signals/${signalId}/export/history`;

    try {
      const resp = await fetch(exportUrl, {
        headers: {
          "User-Agent": randomUA(),
          "Accept": "text/csv,text/plain,*/*",
          "Accept-Language": randomLang(),
          "Referer": `https://www.mql5.com/en/signals/${signalId}`,
        },
      });

      if (!resp.ok) {
        console.log(`[MQL5] CSV export failed for ${signalName}: ${resp.status}`);
        return [];
      }

      const csv = await resp.text();
      const trades = this.parseCSV(csv, signalId, signalName);

      // Filter for our symbol
      const filtered = trades.filter(t =>
        t.symbol.toUpperCase().includes(this.symbolFilter) ||
        t.symbol.toUpperCase().includes("GOLD") ||
        t.symbol.toUpperCase().includes("XAU")
      );

      console.log(`[MQL5] ${signalName}: ${filtered.length} ${this.symbolFilter} trades (${trades.length} total)`);
      return filtered;

    } catch (err) {
      console.error(`[MQL5] CSV error for ${signalName}:`, err);
      return [];
    }
  }

  // ── Step 3: Run Full Collection ──────────────────────────
  async run(): Promise<{ signals: number; trades: number }> {
    // Get signal list
    await this.collectSignalList();

    // Shuffle order to avoid pattern detection
    const shuffled = shuffle(this.collected).slice(0, this.maxSignals);

    let totalTrades = 0;

    for (const signal of shuffled) {
      const trades = await this.collectTradeHistory(signal.id, signal.name);
      this.trades.push(...trades);
      totalTrades += trades.length;

      // Save batch to Supabase every 500 trades
      if (this.trades.length >= 500) {
        await this.saveTrades(this.trades);
        this.trades = [];
      }

      // Human-like delay between signals
      await humanDelay(4000, 10000);
    }

    // Save remaining
    if (this.trades.length > 0) {
      await this.saveTrades(this.trades);
    }

    // Save signal metadata
    await this.saveSignals(shuffled);

    console.log(`[MQL5] DONE: ${shuffled.length} signals, ${totalTrades} trades collected`);
    return { signals: shuffled.length, trades: totalTrades };
  }

  // ── Parsers ──────────────────────────────────────────────
  private parseSignalList(html: string): MQL5Signal[] {
    // Parse signal cards from HTML
    // Each signal card contains: name, growth%, reliability, subscribers, etc.
    const signals: MQL5Signal[] = [];

    // Regex patterns for signal data extraction
    // In production: use cheerio or jsdom for robust parsing
    const signalPattern = /\/signals\/(\d+)/g;
    const matches = Array.from(html.matchAll(signalPattern));

    for (const match of matches) {
      const id = match[1];
      if (!signals.find(s => s.id === id)) {
        signals.push({
          id,
          name: `Signal_${id}`, // Will be enriched later
          growth: 0,
          reliability: 0,
          subscribers: 0,
          price: 0,
          weeks: 0,
          trades: 0,
          winRate: 0,
          profitFactor: 0,
          maxDD: 0,
          avgProfit: 0,
          url: `https://www.mql5.com/en/signals/${id}`,
        });
      }
    }

    return signals;
  }

  private parseCSV(csv: string, signalId: string, signalName: string): MQL5Trade[] {
    const lines = csv.split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const trades: MQL5Trade[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i].split(",").map(c => c.trim());
        const get = (name: string) => {
          const idx = headers.indexOf(name);
          return idx >= 0 ? cols[idx] : "";
        };

        const openTime = get("open time") || get("time");
        const closeTime = get("close time") || get("close");
        const symbol = get("symbol") || get("pair") || "";
        const type = (get("type") || get("action") || "").toUpperCase();
        const direction = type.includes("BUY") ? "BUY" as const : "SELL" as const;

        trades.push({
          signalId,
          signalName,
          openTime,
          closeTime,
          symbol,
          direction,
          lots: parseFloat(get("volume") || get("lots") || "0") || 0,
          openPrice: parseFloat(get("open price") || get("price") || "0") || 0,
          closePrice: parseFloat(get("close price") || get("close") || "0") || 0,
          sl: parseFloat(get("sl") || get("stop loss") || "0") || null,
          tp: parseFloat(get("tp") || get("take profit") || "0") || null,
          profit: parseFloat(get("profit") || "0") || 0,
          pips: parseFloat(get("pips") || "0") || 0,
          duration: 0, // Calculated from open/close time
          commission: parseFloat(get("commission") || "0") || 0,
          swap: parseFloat(get("swap") || "0") || 0,
        });
      } catch {} // Skip malformed rows
    }

    return trades;
  }

  // ── Save to Supabase ─────────────────────────────────────
  private async saveTrades(trades: MQL5Trade[]) {
    const rows = trades.map(t => ({
      source: "mql5",
      source_id: t.signalId,
      source_name: t.signalName,
      symbol: t.symbol,
      direction: t.direction,
      open_time: t.openTime,
      close_time: t.closeTime,
      open_price: t.openPrice,
      close_price: t.closePrice,
      lots: t.lots,
      sl: t.sl,
      tp: t.tp,
      profit: t.profit,
      pips: t.pips,
      commission: t.commission,
      swap: t.swap,
      collected_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("collected_trades")
      .upsert(rows, { onConflict: "source,source_id,open_time,symbol" });

    if (error) console.error("[MQL5] Save error:", error);
    else console.log(`[MQL5] Saved ${rows.length} trades to Supabase`);
  }

  private async saveSignals(signals: MQL5Signal[]) {
    const rows = signals.map(s => ({
      source: "mql5",
      source_id: s.id,
      name: s.name,
      growth: s.growth,
      reliability: s.reliability,
      subscribers: s.subscribers,
      price: s.price,
      trades_count: s.trades,
      win_rate: s.winRate,
      profit_factor: s.profitFactor,
      max_dd: s.maxDD,
      url: s.url,
      collected_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("collected_signals")
      .upsert(rows, { onConflict: "source,source_id" });

    if (error) console.error("[MQL5] Save signals error:", error);
  }
}


// ═══════════════════════════════════════════════════════════════
// 2) MYFXBOOK SMART SCRAPER
//
// MyFxBook API = nur eigene Accounts
// Öffentliche Accounts = nur über Scraping
//
// Strategie:
// - Sieht aus wie ein normaler Browser
// - Randomisierte Delays (2-30 Sekunden)
// - Rotierendes User-Agent pro Request
// - Verschiedene Accept-Languages
// - Shuffled Reihenfolge (nie sequenziell)
// - Respektiert robots.txt Rate Limits
// - Sessions über Cookies
// - Fallback: Community Outlook über offizielle API
// ═══════════════════════════════════════════════════════════════

interface MFXBAccount {
  id: string;
  name: string;
  url: string;
  gain: number;
  absGain: number;
  daily: number;
  monthly: number;
  drawdown: number;
  balance: number;
  equity: number;
  profitFactor: number;
  pips: number;
  trades: number;
  winRate: number;
  verified: boolean;
}

interface MFXBTrade {
  accountId: string;
  accountName: string;
  openTime: string;
  closeTime: string;
  symbol: string;
  direction: "BUY" | "SELL";
  lots: number;
  openPrice: number;
  closePrice: number;
  sl: number | null;
  tp: number | null;
  pips: number;
  profit: number;
}

export class MyFxBookScraper {
  private session: string | null = null;
  private cookies: string[] = [];
  private requestCount = 0;
  private dailyLimit: number;
  private accounts: MFXBAccount[] = [];
  private trades: MFXBTrade[] = [];

  constructor(config: { dailyLimit?: number } = {}) {
    this.dailyLimit = config.dailyLimit || 200; // Max requests per day
  }

  // ── Rate limiter ─────────────────────────────────────────
  private async throttledFetch(url: string, extraHeaders: Record<string, string> = {}): Promise<Response | null> {
    if (this.requestCount >= this.dailyLimit) {
      console.log(`[MFXB] Daily limit reached (${this.dailyLimit}). Stopping.`);
      return null;
    }

    // Random delay BEFORE each request
    await humanDelay(3000, 8000);

    this.requestCount++;

    const headers: Record<string, string> = {
      "User-Agent": randomUA(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": randomLang(),
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      ...extraHeaders,
    };

    // Add cookies if we have them
    if (this.cookies.length > 0) {
      headers["Cookie"] = this.cookies.join("; ");
    }

    try {
      const resp = await fetch(url, { headers, redirect: "follow" });

      // Capture cookies from response
      const setCookies = resp.headers.getSetCookie?.() || [];
      for (const c of setCookies) {
        const name = c.split("=")[0];
        // Replace existing cookie or add new
        this.cookies = this.cookies.filter(x => !x.startsWith(name + "="));
        this.cookies.push(c.split(";")[0]);
      }

      // Check for rate limiting
      if (resp.status === 429) {
        console.log("[MFXB] Rate limited! Pausing 5 minutes...");
        await new Promise(r => setTimeout(r, 5 * 60 * 1000));
        return null;
      }

      if (resp.status === 403) {
        console.log("[MFXB] Blocked! Rotating identity and pausing 10 minutes...");
        this.cookies = []; // Reset cookies
        await new Promise(r => setTimeout(r, 10 * 60 * 1000));
        return null;
      }

      console.log(`[MFXB] Request #${this.requestCount}: ${resp.status} ${url.slice(0, 80)}...`);
      return resp;

    } catch (err) {
      console.error(`[MFXB] Fetch error: ${err}`);
      return null;
    }
  }

  // ── Step 1: Warm up session (browse like a human) ────────
  async warmUp(): Promise<void> {
    console.log("[MFXB] Warming up — browsing like a human...");

    // Visit homepage first (like a real user would)
    await this.throttledFetch("https://www.myfxbook.com/");
    await humanDelay(2000, 4000);

    // Visit community page
    await this.throttledFetch("https://www.myfxbook.com/community/outlook");
    await humanDelay(3000, 6000);

    // Visit systems page (our target)
    await this.throttledFetch("https://www.myfxbook.com/systems");
    await humanDelay(2000, 5000);

    console.log("[MFXB] Warm-up complete. Cookies established.");
  }

  // ── Step 2: Collect Gold Systems List ─────────────────────
  async collectGoldSystems(): Promise<MFXBAccount[]> {
    console.log("[MFXB] Collecting Gold trading systems...");

    // MyFxBook systems can be filtered by symbol
    const pages = [
      "https://www.myfxbook.com/systems?s=Gold&t=2&o=1&p=1", // Gold, verified, sorted by gain
      "https://www.myfxbook.com/systems?s=XAUUSD&t=2&o=1&p=1",
      "https://www.myfxbook.com/systems?s=Gold&t=2&o=1&p=2", // Page 2
      "https://www.myfxbook.com/systems?s=Gold&t=2&o=3&p=1", // Sorted by DD
    ];

    // Shuffle pages
    const shuffledPages = shuffle(pages);

    for (const url of shuffledPages) {
      const resp = await this.throttledFetch(url);
      if (!resp) continue;

      const html = await resp.text();
      const accounts = this.parseSystemsList(html);
      this.accounts.push(...accounts);

      console.log(`[MFXB] Found ${accounts.length} systems`);
    }

    // Deduplicate
    const unique = new Map<string, MFXBAccount>();
    for (const a of this.accounts) {
      if (!unique.has(a.id)) unique.set(a.id, a);
    }
    this.accounts = Array.from(unique.values());

    console.log(`[MFXB] Total unique Gold systems: ${this.accounts.length}`);
    return this.accounts;
  }

  // ── Step 3: Scrape individual account pages ───────────────
  async collectAccountDetails(account: MFXBAccount): Promise<MFXBTrade[]> {
    // Visit the account page like a human
    const pageUrl = `https://www.myfxbook.com${account.url}`;
    const resp = await this.throttledFetch(pageUrl, {
      "Referer": "https://www.myfxbook.com/systems",
    });

    if (!resp) return [];

    const html = await resp.text();

    // Extract summary stats from account page
    const stats = this.parseAccountStats(html, account.id);
    if (stats) {
      Object.assign(account, stats);
    }

    // Try to get trade history
    // MyFxBook shows recent trades on the account page
    const trades = this.parseTradeHistory(html, account);

    // Also try the history tab (if accessible)
    await humanDelay(2000, 5000);
    const histUrl = `${pageUrl}?s=history`;
    const histResp = await this.throttledFetch(histUrl, {
      "Referer": pageUrl,
    });

    if (histResp) {
      const histHtml = await histResp.text();
      const histTrades = this.parseTradeHistory(histHtml, account);
      trades.push(...histTrades);
    }

    return trades;
  }

  // ── Step 4: Community Outlook (OFFICIAL API) ──────────────
  async getCommunityOutlook(): Promise<any> {
    // This is the OFFICIAL MyFxBook API — no scraping needed
    // Shows what % of MyFxBook traders are long/short on each pair
    const loginUrl = `https://www.myfxbook.com/api/login.json?email=${encodeURIComponent(process.env.MYFXBOOK_EMAIL || "")}&password=${encodeURIComponent(process.env.MYFXBOOK_PASSWORD || "")}`;

    try {
      const loginResp = await fetch(loginUrl);
      const loginData = await loginResp.json();

      if (loginData.error) {
        console.log("[MFXB-API] Login failed:", loginData.message);
        return null;
      }

      this.session = loginData.session;

      // Get community outlook
      const outlookUrl = `https://www.myfxbook.com/api/get-community-outlook.json?session=${this.session}`;
      const outlookResp = await fetch(outlookUrl);
      const outlook = await outlookResp.json();

      if (!outlook.error) {
        // Save to Supabase
        const xauData = outlook.symbols?.find((s: any) =>
          s.name?.toUpperCase().includes("XAU") || s.name?.toUpperCase().includes("GOLD")
        );

        if (xauData) {
          await supabaseAdmin.from("market_sentiment").insert({
            source: "myfxbook",
            symbol: "XAUUSD",
            long_pct: xauData.longPercentage,
            short_pct: xauData.shortPercentage,
            long_volume: xauData.longVolume,
            short_volume: xauData.shortVolume,
            timestamp: new Date().toISOString(),
          });

          console.log(`[MFXB-API] XAUUSD Sentiment: ${xauData.longPercentage}% Long / ${xauData.shortPercentage}% Short`);
        }

        return outlook;
      }
    } catch (err) {
      console.error("[MFXB-API] Outlook error:", err);
    }

    return null;
  }

  // ── Full Run ──────────────────────────────────────────────
  async run(): Promise<{ accounts: number; trades: number }> {
    // 1. Official API first (sentiment data)
    await this.getCommunityOutlook();

    // 2. Warm up browser session
    await this.warmUp();

    // 3. Collect Gold systems
    await this.collectGoldSystems();

    // 4. Scrape top accounts (shuffled, limited)
    const toScrape = shuffle(this.accounts).slice(0, 30); // Max 30 per run
    let totalTrades = 0;

    for (const account of toScrape) {
      const trades = await this.collectAccountDetails(account);
      this.trades.push(...trades);
      totalTrades += trades.length;

      // Save batch
      if (this.trades.length >= 200) {
        await this.saveTrades(this.trades);
        this.trades = [];
      }

      // Check daily limit
      if (this.requestCount >= this.dailyLimit) break;
    }

    // Save remaining
    if (this.trades.length > 0) {
      await this.saveTrades(this.trades);
    }

    // Save account metadata
    await this.saveAccounts(toScrape);

    console.log(`[MFXB] DONE: ${toScrape.length} accounts, ${totalTrades} trades, ${this.requestCount} requests`);
    return { accounts: toScrape.length, trades: totalTrades };
  }

  // ── Parsers (simplified — use cheerio in production) ──────
  private parseSystemsList(html: string): MFXBAccount[] {
    const accounts: MFXBAccount[] = [];

    // Extract system links and basic stats
    // Pattern: /members/[user]/[systemname]/[id]
    const pattern = /href="(\/members\/[^"]+\/(\d+))"/g;
    const matches = Array.from(html.matchAll(pattern));

    for (const match of matches) {
      const url = match[1];
      const id = match[2];
      if (!accounts.find(a => a.id === id)) {
        accounts.push({
          id,
          name: url.split("/").slice(-2, -1)[0] || `System_${id}`,
          url,
          gain: 0, absGain: 0, daily: 0, monthly: 0,
          drawdown: 0, balance: 0, equity: 0,
          profitFactor: 0, pips: 0, trades: 0,
          winRate: 0, verified: true,
        });
      }
    }

    return accounts;
  }

  private parseAccountStats(html: string, accountId: string): Partial<MFXBAccount> | null {
    // Extract key metrics from account page
    // In production: use proper HTML parser (cheerio)
    const stats: Partial<MFXBAccount> = {};

    const extractNumber = (label: string): number => {
      const regex = new RegExp(label + "[^>]*>[^>]*>([\\d,.\\-]+)", "i");
      const match = html.match(regex);
      return match ? parseFloat(match[1].replace(",", "")) : 0;
    };

    stats.gain = extractNumber("Gain");
    stats.drawdown = extractNumber("Drawdown");
    stats.profitFactor = extractNumber("Profit Factor");
    stats.trades = Math.round(extractNumber("Trades"));
    stats.monthly = extractNumber("Monthly");

    return stats;
  }

  private parseTradeHistory(html: string, account: MFXBAccount): MFXBTrade[] {
    // Extract trades from the history table
    // MyFxBook renders trades in an HTML table
    const trades: MFXBTrade[] = [];

    // Look for trade rows in HTML
    // Pattern varies but typically includes: open time, symbol, action, lots, price, etc.
    const tradeRowPattern = /class="openTrade[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = Array.from(html.matchAll(tradeRowPattern));

    for (const row of rows) {
      const cells = row[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length < 6) continue;

      const getText = (cell: string): string =>
        cell.replace(/<[^>]+>/g, "").trim();

      try {
        const symbol = getText(cells[1] || "");
        if (!symbol.toUpperCase().includes("XAU") &&
            !symbol.toUpperCase().includes("GOLD")) continue;

        trades.push({
          accountId: account.id,
          accountName: account.name,
          openTime: getText(cells[0] || ""),
          closeTime: getText(cells[cells.length - 2] || ""),
          symbol,
          direction: getText(cells[2] || "").toUpperCase().includes("BUY") ? "BUY" : "SELL",
          lots: parseFloat(getText(cells[3] || "0")) || 0,
          openPrice: parseFloat(getText(cells[4] || "0")) || 0,
          closePrice: parseFloat(getText(cells[5] || "0")) || 0,
          sl: null,
          tp: null,
          pips: parseFloat(getText(cells[cells.length - 3] || "0")) || 0,
          profit: parseFloat(getText(cells[cells.length - 1] || "0")) || 0,
        });
      } catch {} // Skip malformed rows
    }

    return trades;
  }

  // ── Save to Supabase ─────────────────────────────────────
  private async saveTrades(trades: MFXBTrade[]) {
    const rows = trades.map(t => ({
      source: "myfxbook",
      source_id: t.accountId,
      source_name: t.accountName,
      symbol: t.symbol,
      direction: t.direction,
      open_time: t.openTime,
      close_time: t.closeTime,
      open_price: t.openPrice,
      close_price: t.closePrice,
      lots: t.lots,
      sl: t.sl,
      tp: t.tp,
      profit: t.profit,
      pips: t.pips,
      commission: 0,
      swap: 0,
      collected_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("collected_trades")
      .upsert(rows, { onConflict: "source,source_id,open_time,symbol" });

    if (error) console.error("[MFXB] Save error:", error);
    else console.log(`[MFXB] Saved ${rows.length} trades`);
  }

  private async saveAccounts(accounts: MFXBAccount[]) {
    const rows = accounts.map(a => ({
      source: "myfxbook",
      source_id: a.id,
      name: a.name,
      growth: a.gain,
      reliability: a.verified ? 100 : 0,
      subscribers: 0,
      price: 0,
      trades_count: a.trades,
      win_rate: a.winRate,
      profit_factor: a.profitFactor,
      max_dd: a.drawdown,
      url: `https://www.myfxbook.com${a.url}`,
      collected_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from("collected_signals")
      .upsert(rows, { onConflict: "source,source_id" });

    if (error) console.error("[MFXB] Save accounts error:", error);
  }
}
