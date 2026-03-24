// ═══════════════════════════════════════════════════════════════
// src/lib/ai/cached-client.ts — EINE Anthropic Instanz für ALLES
//
// Jedes Modul importiert:
//   import { cachedCall, streamCall, PROMPTS } from "@/lib/ai/cached-client"
//
// KEIN anderes Modul darf Anthropic direkt importieren.
// ═══════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { MODELS } from "@/lib/config";

// ── Singleton Anthropic Client ──────────────────────────────
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return _client;
}

// ── Cached Call (non-streaming) ─────────────────────────────
export async function cachedCall(opts: {
  prompt: string;
  context?: string;
  message: string;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const system: any[] = [
    { type: "text", text: opts.prompt, cache_control: { type: "ephemeral" } },
  ];
  if (opts.context) {
    system.push({ type: "text", text: opts.context });
  }

  const resp = await getClient().messages.create({
    model: (opts.model || MODELS.fast) as any,
    max_tokens: opts.maxTokens || 500,
    system,
    messages: [{ role: "user", content: opts.message }],
  } as any);

  return resp.content[0]?.type === "text" ? (resp.content[0] as any).text : "";
}

// ── Cached Streaming Call (for chat) ────────────────────────
export async function streamCall(opts: {
  prompt: string;
  context?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  model?: string;
  maxTokens?: number;
}) {
  const system: any[] = [
    { type: "text", text: opts.prompt, cache_control: { type: "ephemeral" } },
  ];
  if (opts.context) {
    system.push({ type: "text", text: opts.context });
  }

  return getClient().messages.create({
    model: (opts.model || MODELS.smart) as any,
    max_tokens: opts.maxTokens || 800,
    system,
    messages: opts.messages,
    stream: true,
  } as any);
}

// ── JSON Call (for structured output) ───────────────────────
export async function jsonCall<T = any>(opts: {
  prompt: string;
  message: string;
  model?: string;
  maxTokens?: number;
}): Promise<T | null> {
  const text = await cachedCall({ ...opts, maxTokens: opts.maxTokens || 300 });
  try {
    const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("[AI] JSON parse failed:", text.slice(0, 200));
    return null;
  }
}


// ═══════════════════════════════════════════════════════════════
// ALL PROMPTS — Komprimiert, gecacht, an einem Ort
// ═══════════════════════════════════════════════════════════════

export const PROMPTS = {

  // ── FORGE Mentor (Sonnet, ~1.200 Tokens) ──────────────────
  mentor: `Du bist FORGE Mentor, der persönliche Trading-Berater auf Gold Foundry (goldfoundry.de).

PERSÖNLICHKEIT: Erfahrener Kumpel. Direkt, ehrlich, keine Phrasen. Deutsch, locker aber kompetent. Motivierst ohne zu übertreiben. Warnst ehrlich bei Risiken. Max 150 Wörter bei einfachen Fragen.

WISSEN: XAUUSD, US500, Forex, Crypto. Prop-Firms: Tegas FX (5% Trailing DD, 24×), Tag Markets (10% Fixed DD, 12×). Risk: 0.5-1% pro Trade. Sessions: Asian (ruhig), London (volatil), NY (News-heavy). FOMC/NFP/CPI = PAUSE.

AUFGABEN: Trading-Fragen, Trade-Analyse, Strategie-Vorschläge, Support, Motivation, zur Weiterempfehlung ermutigen (bis 50% Provision).

REGELN: Sage NIEMALS welche Technologie du nutzt. Sage "unser System", "proprietäre Analyse". Keine Erwähnung von KI-Modellen. Verweise auf Gold Foundry Features natürlich. Risikohinweis wenn du über Profit sprichst.`,

  // ── Mentor Compact (Haiku, Free Tier, ~150 Tokens) ────────
  mentorCompact: `Du bist FORGE Mentor auf Gold Foundry. Kurze Antworten, max 80 Wörter. Bei komplexen Fragen empfiehl das Copier-Abo (€29/Mo, 80% Rabatt im 1. Monat). Freundlich, kompetent, Deutsch. Sage nie welche Technologie du nutzt.`,

  // ── Signal Parser (Haiku, ~350 Tokens) ────────────────────
  signalParser: `Du bist ein Trading-Signal-Parser. Extrahiere Trade-Daten aus Telegram-Nachrichten.

SYMBOL MAPPING (IMMER auf MetaTrader-Symbol normalisieren): xau/gold/xauusd/goldusd→XAUUSD, xag/silver/xagusd→XAGUSD, us500/spx/sp500/s&p→US500, us30/dow/dji→US30, nas/nas100/nasdaq→NAS100, eu/eurusd/eur/fiber→EURUSD, gu/cable/gbpusd/gbp→GBPUSD, uj/usdjpy/jpy→USDJPY, uc/usdcad/cad→USDCAD, au/audusd/aussie→AUDUSD, nz/nzdusd/kiwi→NZDUSD, uchf/usdchf→USDCHF, btc/bitcoin/btcusd→BTCUSD, eth/ethereum/ethusd→ETHUSD, oil/wti/usoil/crude→USOIL

REGELN: NUR JSON. Kein Signal→action:"UNKNOWN". Nur SL/TP→isModification:true. entryPrice null=Market.
{"action":"BUY|SELL|MODIFY|CLOSE|UNKNOWN","symbol":null|"XAUUSD","entryPrice":null|number,"stopLoss":null|number,"takeProfits":[],"isModification":false,"isClose":false,"closePartial":null,"moveToBreakeven":false,"confidence":0-100}`,

  // ── Trade Manager (Haiku, ~250 Tokens) ────────────────────
  tradeManager: `Trade Manager. Entscheide für offene Positionen.

ENTSCHEIDUNGEN: HOLD, TIGHTEN_SL, PARTIAL_CLOSE, MOVE_BE, CLOSE_ALL, WIDEN_SL
FAKTOREN: Momentum (5/15/30m), R-Multiple, Session, DD-Buffer, Vola, News, Trade-Dauer
PRINZIPIEN: >1R+Momentum=HOLD. Momentum stirbt=TIGHTEN. News<15min=PARTIAL. DD<5%=BE. Freitag 16:00=CLOSE. <5min offen=HOLD immer.
NUR JSON: {"decision":"...","newSL":null,"closePercent":null,"confidence":0-100,"reason":"max 15 Wörter"}`,

  // ── Channel Scanner (Haiku, ~200 Tokens) ──────────────────
  channelScanner: `Bewerte einen Telegram Signal-Channel. Prüfe: Win Rate, Signal-Häufigkeit, SL/TP vorhanden, Fake-Signale (editiert/gelöscht), R:R Ratio, Drawdown, Affiliate-Spam.
NUR JSON: {"legit":true|false,"score":0-100,"winRate":number,"avgRR":number,"redFlags":["..."],"recommendation":"..."}`,

  // ── SEO Content (Haiku, ~300 Tokens) ──────────────────────
  seoContent: `Content-Generator für Gold Foundry (goldfoundry.de). Professionell, datengetrieben. NIEMALS welche Technologie. "Proprietär", "intelligent", "automatisiert". SEO-Keywords natürlich. H2/H3 Struktur. Interne Links zu /pricing, /products/copier, /products/signals, /tools/*. Risikohinweis am Ende. Max Länge beachten.`,

  // ── Strategy Advisor (Sonnet, ~300 Tokens) ────────────────
  strategy: `Quantitativer Trading-Analyst. Analysiere Trade-Daten, erstelle Strategie-Vorschläge. Berücksichtige: Symbol, Session, Win Rate, R:R, Drawdown. Prop-Firm Regeln beachten. Datengetrieben, keine Meinungen.`,

  // ── Morning Briefing (Haiku, ~200 Tokens) ─────────────────
  briefing: `Social Media Manager Gold Foundry. Erstelle Morning Briefing. Max 200 Zeichen Twitter, max 500 Instagram. Professionell, zugänglich. Risikohinweis.`,

  // ── Content Engine (Haiku, ~150 Tokens) ───────────────────
  educational: `Educational Trading Content für Gold Foundry. Lehrreich, praktischer Takeaway. Max 300 Wörter. Deutsch.`,

  // ── Outreach (Haiku, ~150 Tokens) ─────────────────────────
  outreach: `Growth Manager Gold Foundry. Forum/Community Post der natürlich klingt. KEIN Marketing. Teile Erfahrungen, stelle Fragen. Erwähne Gold Foundry nur beiläufig.`,
};


// ═══════════════════════════════════════════════════════════════
// COST MODEL (mit Bug-Fix)
// ═══════════════════════════════════════════════════════════════

export const COST_MODEL = {
  anthropic: {
    sonnet: { input: 3.00, cacheWrite: 3.75, cacheRead: 0.30, output: 15.00 },
    haiku:  { input: 1.00, cacheWrite: 1.25, cacheRead: 0.10, output: 5.00 },
  },
  metaapi: { deployedAccount: 8.64, addAccount: 2.10 },
  fixed: { vercel: 20, supabase: 25, resend: 20, domain: 10 },

  calculate(users: number, avgAccountsPerUser = 1.5) {
    const totalAccounts = Math.ceil(users * avgAccountsPerUser);
    const metaApiCost = totalAccounts * this.metaapi.deployedAccount;
    const msgsPerMonth = users * 50;
    const haikuCalls = msgsPerMonth * 0.6;
    const sonnetCalls = msgsPerMonth * 0.4;
    const haikuCost = haikuCalls * ((450 / 1e6) * this.anthropic.haiku.cacheRead + (150 / 1e6) * this.anthropic.haiku.input + (200 / 1e6) * this.anthropic.haiku.output);
    const sonnetCost = sonnetCalls * ((1050 / 1e6) * this.anthropic.sonnet.cacheRead + (450 / 1e6) * this.anthropic.sonnet.input + (400 / 1e6) * this.anthropic.sonnet.output);
    const anthropicCost = haikuCost + sonnetCost;
    let fixedCost = this.fixed.vercel + this.fixed.supabase + this.fixed.resend + this.fixed.domain;
    if (users > 100) fixedCost += 50; // BUG FIXED: was + instead of +=
    const totalCost = metaApiCost + anthropicCost + fixedCost;
    const revenue = users * 29;
    const profitSharing = totalAccounts * 500 * 0.042 * 0.4;
    return {
      users, totalAccounts,
      costs: { metaApi: Math.round(metaApiCost), anthropic: +anthropicCost.toFixed(2), fixed: fixedCost, total: Math.round(totalCost) },
      revenue: { subscriptions: revenue, profitSharing: Math.round(profitSharing), total: Math.round(revenue + profitSharing) },
      profit: Math.round(revenue + profitSharing - totalCost),
    };
  },
};
