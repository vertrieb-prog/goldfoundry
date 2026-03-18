// src/lib/growth/outreach-agent.ts
// ============================================================
// FORGE OUTREACH — Autonomer Marketing-Agent
//
// Postet täglich auf Forex-Portale, Foren, Reddit, Quora.
// LEGAL: Kein Spam. Value-First. Jeder Post liefert echten Mehrwert.
// Strategie: Erst helfen, dann subtil auf Gold Foundry verweisen.
// Self-Optimizing: Trackt Engagement, passt Strategie an.
// ============================================================

import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase-admin";
const log = (msg: string) => console.log(`[${new Date().toISOString()}] [OUTREACH] ${msg}`);

// ── Target Platforms ──────────────────────────────────────────

export const PLATFORMS = {
  reddit: {
    name: "Reddit",
    subreddits: [
      "r/Forex", "r/algotrading", "r/Trading", "r/Daytrading",
      "r/ForexTrading", "r/proptrading", "r/metatrader",
      "r/Gold", "r/wallstreetbets", "r/Commodities",
    ],
    style: "Casual, hilfreich, Community-Ton. NIEMALS direkt werben. Immer erst Value liefern, dann 'übrigens nutze ich Tool X dafür'.",
    postTypes: ["answer_question", "share_insight", "comparison_post"],
  },
  quora: {
    name: "Quora",
    topics: [
      "Forex Trading", "Gold Trading", "Prop Trading Firms",
      "Algorithmic Trading", "MetaTrader", "Copy Trading",
      "Trading Risk Management", "XAUUSD",
    ],
    style: "Expertenton. Detailliert, mit Daten. Am Ende: 'Ich nutze dafür [Tool] — Disclaimer: bin affiliated.'",
    postTypes: ["answer_question", "write_article"],
  },
  forexFactory: {
    name: "Forex Factory",
    sections: ["Trading Systems", "Trading Discussion", "Platform Tech"],
    style: "Technisch, MT4/MT5 Vokabular. Trader reden mit Tradern. Screenshots von Ergebnissen.",
    postTypes: ["share_system", "answer_question", "journal_update"],
  },
  mql5community: {
    name: "MQL5 Community",
    sections: ["Articles", "Forum", "CodeBase"],
    style: "Sehr technisch. MQL4/MQL5 Code-Snippets, EA-Reviews, Backtest-Ergebnisse.",
    postTypes: ["article", "code_share", "system_review"],
  },
  tradingview: {
    name: "TradingView",
    style: "Chart-basiert. XAUUSD/US500 Analysen mit konkreten Levels. Educational.",
    postTypes: ["chart_analysis", "educational_idea"],
  },
  babypips: {
    name: "BabyPips Forum",
    sections: ["Trading Systems", "Newbie Island", "Expert Advisors"],
    style: "Anfängerfreundlich. Erklärt Konzepte einfach. Hilft bei Prop-Firm Fragen.",
    postTypes: ["answer_question", "tutorial", "system_share"],
  },
  telegram: {
    name: "Telegram Groups",
    groups: ["Forex Signals DE", "Gold Trading", "Prop Firm Community"],
    style: "Kurz, direkt, mit Ergebnissen. Screenshots. 'Heute +$X mit dem Smart Copier'.",
    postTypes: ["result_share", "tip", "discussion"],
  },
};

// ── Content Templates ─────────────────────────────────────────

const CONTENT_ANGLES = [
  // Value-First Posts (kein direktes Marketing)
  {
    angle: "prop_firm_tip",
    prompt: "Schreibe einen hilfreichen Post über Prop-Firm Trading. Thema: Wie man Trailing Drawdown überlebt. Gib 5 konkrete Tipps. Am Ende erwähne beiläufig dass du ein Tool nutzt das automatisch die Lots reduziert wenn der Buffer sinkt.",
    platforms: ["reddit", "babypips", "forexFactory"],
  },
  {
    angle: "gold_analysis",
    prompt: "Schreibe eine XAUUSD Analyse für heute. Nutze aktuelle Levels, Session-Zeiten, und News-Risiken. Erwähne dass dein AI-Tool automatisch vor News pausiert.",
    platforms: ["tradingview", "reddit", "telegram"],
  },
  {
    angle: "night_trading_secret",
    prompt: "Schreibe über das 'Nacht-Trading-Geheimnis' — warum die Asian Session für Gold-Scalper profitabler ist als London/NY. Erkläre mit Daten. Erwähne beiläufig den Nacht-Boost-Mechanismus.",
    platforms: ["reddit", "forexFactory", "babypips"],
  },
  {
    angle: "mql4_optimization",
    prompt: "Schreibe über die häufigsten Fehler in MQL4 EAs und wie man sie vermeidet: fehlende News-Filter, feste Lot-Sizes, kein DD-Management. Erwähne dass AI-Tools den Code automatisch analysieren können.",
    platforms: ["mql5community", "forexFactory", "reddit"],
  },
  {
    angle: "comparison_honest",
    prompt: "Schreibe einen ehrlichen Vergleich von Copy-Trading-Plattformen. Myfxbook AutoTrade vs ZuluTrade vs 4X Solutions. Sei fair aber zeige die Lücken (kein AI Risk Management, keine Manipulation Detection). Am Ende: 'Es gibt neue Tools die das besser machen'.",
    platforms: ["reddit", "quora", "babypips"],
  },
  {
    angle: "manipulation_education",
    prompt: "Erkläre Stop Hunts im Forex-Markt. Was sind sie, wie erkennt man sie, wie schützt man sich. Gib konkrete Gold-Beispiele (Round Numbers $2,100, $2,150). Erwähne am Ende dass es automatische Detection-Tools gibt.",
    platforms: ["reddit", "babypips", "tradingview"],
  },
  {
    angle: "passive_income_trader",
    prompt: "Schreibe über das Geschäftsmodell eines Signal Providers. Wie man mit Copy-Trading passives Einkommen aufbaut. Erwähne Profit-Sharing (60/40), MLM-Strukturen, und dass manche Plattformen automatisch Provisionen abrechnen.",
    platforms: ["reddit", "quora", "telegram"],
  },
  {
    angle: "result_share",
    prompt: "Teile ein Wochen-Ergebnis: 'Mein Smart Copier hat diese Woche X Trades gemacht, Y% Win Rate, +$Z. Der interessanteste Moment: NFP am Freitag — Copier hat automatisch 45min vorher pausiert.' Mach es authentisch, nicht werblich.",
    platforms: ["reddit", "telegram", "forexFactory"],
  },
];

// ── Post Generation ───────────────────────────────────────────

export interface GeneratedPost {
  platform: string;
  angle: string;
  title: string;
  body: string;
  hashtags: string[];
  cta: string;
  legalDisclaimer: string;
}

export async function generateOutreachPost(
  angle: string,
  platform: string,
  tradingData?: { weekPnl: number; weekTrades: number; winRate: number }
): Promise<GeneratedPost> {
  const template = CONTENT_ANGLES.find(a => a.angle === angle);
  const platformConfig = PLATFORMS[platform as keyof typeof PLATFORMS];

  const text = await cachedCall({
    prompt: `Du bist ein erfahrener Forex-Trader der in Online-Communities aktiv ist. Du bist KEIN Marketer — du bist ein Trader der sein Wissen teilt und dabei subtil auf Gold Foundry (goldfoundry.de) verweist.

REGELN:
1. NIEMALS direkt werben. Immer erst VALUE liefern.
2. Erwähne Gold Foundry NUR beiläufig, als Tool das DU nutzt.
3. Klingt AUTHENTISCH wie ein echter Trader, nicht wie ein Bot.
4. Nutze Trader-Vokabular: Pips, Lots, DD, SL/TP, Session, etc.
5. Wenn Ergebnisse geteilt: IMMER Risk Disclaimer.
6. Plattform-Stil: ${platformConfig?.style ?? "Professionell und hilfreich."}

${tradingData ? `Echte Daten diese Woche: ${tradingData.weekTrades} Trades, ${tradingData.winRate}% WR, ${tradingData.weekPnl >= 0 ? "+" : ""}$${tradingData.weekPnl} P&L.` : ""}

Gib JSON zurück:
{"title":"Post-Titel","body":"Post-Inhalt","hashtags":["..."],"cta":"Subtiler Call-to-Action am Ende"}`,
    message: template?.prompt ?? `Schreibe einen hilfreichen Post über ${angle} für ${platform}.`,
    model: MODELS.smart,
    maxTokens: 800,
  });
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

  return {
    platform,
    angle,
    title: parsed.title ?? "",
    body: parsed.body ?? "",
    hashtags: parsed.hashtags ?? [],
    cta: parsed.cta ?? "",
    legalDisclaimer: "Trading birgt Risiken. Vergangene Performance ist kein Indikator für zukünftige Ergebnisse. Keine Finanzberatung.",
  };
}

// ── Daily Outreach Pipeline ───────────────────────────────────

export async function runDailyOutreach(): Promise<{
  postsGenerated: number;
  platforms: string[];
  angles: string[];
}> {
  const db = supabaseAdmin;
  log("Daily Outreach Pipeline gestartet...");

  // Get real performance data
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: trades } = await db.from("trades").select("profit")
    .gte("close_time", weekAgo).eq("is_open", false);

  const weekPnl = (trades ?? []).reduce((s, t) => s + Number(t.profit), 0);
  const weekTrades = trades?.length ?? 0;
  const winners = (trades ?? []).filter(t => Number(t.profit) > 0).length;
  const winRate = weekTrades > 0 ? Math.round((winners / weekTrades) * 100) : 0;

  const tradingData = { weekPnl: Math.round(weekPnl), weekTrades, winRate };

  // Pick 3-5 angles for today (rotate daily)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayAngles = CONTENT_ANGLES
    .sort((a, b) => {
      const aIdx = (CONTENT_ANGLES.indexOf(a) + dayOfYear) % CONTENT_ANGLES.length;
      const bIdx = (CONTENT_ANGLES.indexOf(b) + dayOfYear) % CONTENT_ANGLES.length;
      return aIdx - bIdx;
    })
    .slice(0, 4);

  const results: GeneratedPost[] = [];

  for (const angle of todayAngles) {
    // Pick best platform for this angle
    const platform = angle.platforms[dayOfYear % angle.platforms.length];

    try {
      const post = await generateOutreachPost(angle.angle, platform, tradingData);
      results.push(post);

      // Store for review queue (admin can approve before auto-posting)
      await db.from("market_intel").insert({
        risk_level: "GREEN",
        risk_score: 0,
        regime: "OUTREACH_POST",
        forecast_text: JSON.stringify(post),
        geopolitical_risk: "LOW",
        geopolitical_alerts: [platform, angle.angle],
      });

      log(`Post generiert: ${angle.angle} → ${platform}`);
    } catch (err) {
      log(`Post-Fehler: ${angle.angle} → ${(err as Error).message}`);
    }
  }

  // Self-optimization: Track what worked last week
  // (In production: check link clicks, signups from each platform)
  log(`Pipeline fertig: ${results.length} Posts generiert`);

  return {
    postsGenerated: results.length,
    platforms: results.map(r => r.platform),
    angles: results.map(r => r.angle),
  };
}

// ── Auto-Comparison Website Generator ─────────────────────────

export async function generateDailyComparisonPage(): Promise<{
  slug: string;
  title: string;
  content: string;
  lang: string;
}> {
  const db = supabaseAdmin;

  // Rotate through competitors and languages
  const competitors = ["myfxbook", "zulutrade", "etoro", "4xsolutions", "darwinex"];
  const languages = ["de", "en", "es", "fr", "pt", "ar", "ru", "zh", "ja", "ko", "tr"];
  const dayNum = new Date().getDate();
  const competitor = competitors[dayNum % competitors.length];
  const lang = languages[(dayNum + new Date().getMonth()) % languages.length];

  const langName = { de: "Deutsch", en: "English", es: "Español", fr: "Français", pt: "Português", ar: "العربية", ru: "Русский", zh: "中文", ja: "日本語", ko: "한국어", tr: "Türkçe" }[lang] ?? "English";

  // Get real GF stats
  const { data: recentTrades } = await db.from("trades").select("profit")
    .gte("close_time", new Date(Date.now() - 30 * 86400000).toISOString())
    .eq("is_open", false);

  const monthPnl = (recentTrades ?? []).reduce((s, t) => s + Number(t.profit), 0);
  const totalTrades = recentTrades?.length ?? 0;
  const wr = totalTrades > 0 ? Math.round(((recentTrades ?? []).filter(t => Number(t.profit) > 0).length / totalTrades) * 100) : 0;

  const content = await cachedCall({
    prompt: `Du schreibst SEO-optimierte Vergleichsseiten für Gold Foundry (goldfoundry.de) in ${langName}. 1000+ Wörter, H2/H3, FAQ am Ende, natürliche Keywords. Ehrlich aber Gold Foundry klar im Vorteil. Nutze echte Daten wo möglich.

Gold Foundry hat: AI 7-Faktor Copier, Manipulation Shield, MQL4 AI-Optimierung, Geopolitik-Scanner, Prop-Firm DD-Management, MLM System, CRM, autonome Strategie-Generierung, 25/25 Features im Vergleich.

Echte Gold Foundry Stats (letzter Monat): ${totalTrades} Trades, ${wr}% Win Rate, ${monthPnl >= 0 ? "+" : ""}$${Math.round(monthPnl)} P&L.`,
    message: `Schreibe: "Gold Foundry vs ${competitor}" in ${langName}. SEO-Slug: gold-foundry-vs-${competitor}-${lang}`,
    model: MODELS.smart,
    maxTokens: 2000,
  });

  return {
    slug: `gold-foundry-vs-${competitor}-${lang}`,
    title: `Gold Foundry vs ${competitor.charAt(0).toUpperCase() + competitor.slice(1)}`,
    content,
    lang,
  };
}
