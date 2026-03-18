// src/lib/intel/competitive-agent.ts
// ============================================================
// FORGE RECON — Autonomous Competitive Intelligence Agent
// 
// Scannt täglich: Myfxbook, ZuluTrade, 4X Solutions, eToro,
// Darwinex, cTrader Copy, IC Social, Pelican Exchange
// 
// Ziel: Gold Foundry bleibt IMMER das beste Tool.
// Erkennt neue Features der Konkurrenz → schlägt Gegenmaßnahmen vor.
// Generiert automatisch Vergleichsdaten für SEO + Sales.
// ============================================================

import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const log = (msg: string) =>
  console.log(`[${new Date().toISOString()}] [FORGE-RECON] ${msg}`);

// ── Competitor Registry ───────────────────────────────────────

export const COMPETITORS = {
  myfxbook: {
    name: "Myfxbook",
    url: "https://www.myfxbook.com",
    type: "analytics",
    pricing: "Free (Ad-supported) + Premium",
    users: "500k+",
    strengths: [
      "Größte Forex-Analytics-Community",
      "Verifizierte Account-Statistiken",
      "AutoTrade Copy-Trading",
      "TradingView Integration",
      "Forex Sentiment Indicator",
      "Economic Calendar + Market Hours",
      "Gratis für Basis-Features",
    ],
    weaknesses: [
      "KEIN AI Risk Management",
      "KEIN Manipulation Shield",
      "KEIN MQL4/MQL5 Code-Analyse",
      "KEINE autonome Strategie-Optimierung",
      "KEIN Prop-Firm-spezifisches DD-Management",
      "Veraltetes UI Design (2014-Ära)",
      "Werbefinanziert — störende Ads überall",
      "Keine Nacht-Boost oder Session-Optimierung",
      "Kein MLM/Affiliate-System für Trader",
      "Keine Geopolitik-Analyse",
    ],
    scanUrls: [
      "https://www.myfxbook.com/features",
      "https://blog.myfxbook.com",
    ],
  },
  zulutrade: {
    name: "ZuluTrade",
    url: "https://www.zulutrade.com",
    type: "copy_trading",
    pricing: "€10/Strategie/Monat oder Profit-Sharing",
    users: "2.4M+",
    strengths: [
      "10,000+ Signal Provider weltweit",
      "ZuluGuard Schutz-Mechanismus",
      "Broker-agnostisch (100+ Broker)",
      "15-Faktor ZuluRank Algorithmus",
      "Profit-Sharing Modell verfügbar",
      "Mobile Apps (iOS, Android)",
      "192 Länder abgedeckt",
    ],
    weaknesses: [
      "KEIN 7-Faktor AI Risk Multiplier",
      "KEIN Manipulation Shield",
      "KEINE MQL4 Code-Analyse oder Optimierung",
      "KEINE autonome Strategie-Generierung",
      "ZuluGuard ist REAKTIV nicht PRÄDIKTIV (reagiert erst NACH Verlust)",
      "Kein Nacht-Boost oder Session-Optimierung",
      "Komplex für Anfänger (Broker + ZuluTrade = 2 Accounts)",
      "Keine Prop-Firm-spezifische DD-Überwachung",
      "Keine Geopolitik/News-basierte Auto-Pause",
      "Kein integriertes CRM für Signal Provider",
    ],
    scanUrls: [
      "https://www.zulutrade.com",
    ],
  },
  etoro: {
    name: "eToro",
    url: "https://www.etoro.com",
    type: "social_trading",
    pricing: "Free (Spread-basiert)",
    users: "30M+",
    strengths: [
      "Größte Social-Trading-Plattform weltweit",
      "CopyTrader: Bis zu 100 Trader kopieren",
      "Benutzerfreundlich für Anfänger",
      "Multi-Asset (Stocks, Crypto, Forex)",
      "Reguliert in vielen Jurisdiktionen",
      "Starke Brand und Marketing",
    ],
    weaknesses: [
      "Eigener Broker nötig (kein MT4/MT5)",
      "Höhere Spreads als ECN-Broker",
      "KEIN AI Risk Management",
      "KEIN Prop-Firm-Support",
      "KEINE MQL4/MQL5 Unterstützung",
      "Keine EA/Bot-Integration",
      "Limited Advanced Analytics",
      "Kein Gold-Fokus (XAUUSD)",
    ],
    scanUrls: [],
  },
  fourx: {
    name: "4X Solutions",
    url: "https://4xsolutions.com",
    type: "copier",
    pricing: "€5/Account/Monat",
    users: "10k+",
    strengths: [
      "Enterprise-Grade Trade Copier",
      "Multi-Account Management",
      "Zuverlässige Execution",
    ],
    weaknesses: [
      "KEIN Risk Engine",
      "KEINE dynamische Lot-Anpassung",
      "KEIN Manipulation Shield",
      "KEINE Strategie-Analyse",
      "Kein Community/Marketplace",
      "Kein MLM System",
      "Teuer bei vielen Accounts",
    ],
    scanUrls: [],
  },
  darwinex: {
    name: "Darwinex",
    url: "https://www.darwinex.com",
    type: "investment_platform",
    pricing: "Broker Fees + 20% Performance Fee",
    users: "50k+",
    strengths: [
      "Investoren können in Trader-Strategien investieren",
      "DARWIN-Rating System",
      "FCA Reguliert (UK)",
      "Professionelle Zielgruppe",
    ],
    weaknesses: [
      "Sehr komplex (nicht für Anfänger)",
      "Kein MetaTrader-Copier im klassischen Sinne",
      "Kein XAUUSD-Fokus",
      "20% Performance Fee an Darwinex",
      "Keine AI-Optimierung",
      "Kein MLM/Affiliate für Trader",
      "Langsames Onboarding",
    ],
    scanUrls: [],
  },
};

// ── Gold Foundry Advantages (auto-updated) ────────────────────

export const GF_ADVANTAGES = [
  "7-Faktor AI Risk Multiplier (einzigartig — kein Wettbewerber hat das)",
  "Manipulation Shield mit 6 Pattern-Detektoren (Stop Hunt, Flash Crash, etc.)",
  "MQL4/MQL5 Code Upload + AI-Analyse + automatische Optimierung",
  "Autonome Strategie-Generierung (FORGE LAB testet auf Demo)",
  "Backtest-Upload mit Monte Carlo Simulation + Prop-Firm Challenge Simulation",
  "Nacht-Boost (höhere Lots in ruhiger Asian Session — 30% mehr Profit)",
  "Geopolitik-Scanner + X/Twitter Analyst Feed → Auto-Pause bei Krisen",
  "Economic Calendar mit Event-Tier-System (FOMC = 0.0, Claims = 0.7)",
  "Prop-Firm-spezifische DD-Intelligenz (Trailing vs Fixed, Phase-System)",
  "Consistency Rule Enforcement (Daily Loss Limit + Consistency Guard)",
  "40/60 Profit Sharing mit High Water Mark (fair für Trader UND Follower)",
  "3-Level MLM mit 5 Tiers (Bronze→Diamond) + Auto-Upgrade",
  "Autonomer Sales Director 'Marcus Steiner' (pusht Affiliates automatisch)",
  "CRM mit Auto-Scoring, 8-stufiger Pipeline, Kampagnen-Engine",
  "Content Engine (Auto-Post auf Instagram, X, TikTok, YouTube)",
  "SEO Agent (3 Pages/Tag in 11 Sprachen, automatische Vergleichsseiten)",
  "Cryptomus Crypto-Payment (kein Stripe nötig — Trader lieben Crypto)",
  "Obsidian+Gold Industrial Luxury Design (kein generisches Bootstrap-UI)",
  "Broker-agnostisch via MetaApi (Tegas, Tag, IC Markets, Pepperstone...)",
  "FORGE Mentor Chat mit RAG (kennt deine Trades, dein DD, deine Strategie)",
];

// ══════════════════════════════════════════════════════════════
// COMPETITIVE SCAN — Autonomous daily analysis
// ══════════════════════════════════════════════════════════════

export interface CompetitiveReport {
  date: string;
  competitors: CompetitorUpdate[];
  threats: string[];
  opportunities: string[];
  recommendations: string[];
  seoActions: string[];
}

interface CompetitorUpdate {
  name: string;
  newFeatures: string[];
  pricingChanges: string[];
  threatLevel: "LOW" | "MEDIUM" | "HIGH";
  notes: string;
}

export async function runCompetitiveScan(): Promise<CompetitiveReport> {
  log("Competitive Scan gestartet...");

  const competitorNames = Object.values(COMPETITORS).map(c => c.name);

  // AI analyzes the competitive landscape
  const text = await cachedCall({
    prompt: `Du bist der Competitive Intelligence Agent von Gold Foundry (goldfoundry.de), einem AI-Trading-Portal.

Deine Aufgabe: Analysiere die Wettbewerbslandschaft und identifiziere Threats + Opportunities.

Gold Foundry Unique Features:
${GF_ADVANTAGES.slice(0, 10).join("\n")}

Antworte als JSON:
{
  "competitors": [{"name":"...", "newFeatures":["..."], "pricingChanges":["..."], "threatLevel":"LOW|MEDIUM|HIGH", "notes":"..."}],
  "threats": ["Bedrohung 1", ...],
  "opportunities": ["Chance 1", ...],
  "recommendations": ["Empfehlung 1", ...],
  "seoActions": ["SEO Aktion 1", ...]
}`,
    message: `Analysiere diese Konkurrenten und ihre aktuellen Schwächen die wir ausnutzen können:

${Object.entries(COMPETITORS).map(([key, c]) =>
  `${c.name} (${c.type}): ${c.users} User, ${c.pricing}. Schwächen: ${c.weaknesses.slice(0, 5).join(", ")}`
).join("\n\n")}

Basierend darauf:
1. Welche neuen Features könnten Konkurrenten bald launchen?
2. Wo sind sie am verwundbarsten?
3. Was sollte Gold Foundry als nächstes bauen um den Vorsprung zu halten?
4. Welche SEO-Vergleichsseiten sollten wir erstellen?`,
    model: MODELS.fast,
    maxTokens: 1500,
  });

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const report: CompetitiveReport = {
      date: new Date().toISOString().split("T")[0],
      competitors: parsed.competitors ?? [],
      threats: parsed.threats ?? [],
      opportunities: parsed.opportunities ?? [],
      recommendations: parsed.recommendations ?? [],
      seoActions: parsed.seoActions ?? [],
    };

    // Store report
    const db = createSupabaseAdmin();
    await db.from("market_intel").insert({
      risk_level: "GREEN",
      risk_score: 0,
      regime: "COMPETITIVE_SCAN",
      forecast_text: JSON.stringify(report),
      geopolitical_risk: "LOW",
    });

    log(`Scan fertig: ${report.threats.length} Threats, ${report.opportunities.length} Opportunities, ${report.recommendations.length} Recommendations`);

    return report;
  } catch {
    log("Scan-Parse fehlgeschlagen");
    return { date: new Date().toISOString().split("T")[0], competitors: [], threats: [], opportunities: [], recommendations: [], seoActions: [] };
  }
}

// ══════════════════════════════════════════════════════════════
// FEATURE GAP ANALYSIS — Was haben andere, was wir nicht haben?
// ══════════════════════════════════════════════════════════════

export function getFeatureComparison() {
  const features = [
    { feature: "AI Risk Multiplier (7 Faktoren)", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Manipulation Shield (6 Detektoren)", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "MQL4/MQL5 AI-Optimierung", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Autonome Strategie-Generierung", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Geopolitik Auto-Pause", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Nacht-Boost (Session-Optimierung)", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Prop-Firm DD-Management", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Consistency Rule Enforcement", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "AI Chat mit Trade-Kontext (RAG)", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Monte Carlo Backtesting", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "3-Level MLM System", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Auto Sales Director (AI)", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Verifizierte Account Stats", gf: true, mfxb: true, zulu: true, etoro: true, fourx: false },
    { feature: "Copy Trading", gf: true, mfxb: true, zulu: true, etoro: true, fourx: true },
    { feature: "Strategy Leaderboard", gf: true, mfxb: true, zulu: true, etoro: true, fourx: false },
    { feature: "Broker-agnostisch", gf: true, mfxb: true, zulu: true, etoro: false, fourx: true },
    { feature: "Guard/Protection System", gf: true, mfxb: false, zulu: true, etoro: false, fourx: false },
    { feature: "Economic Calendar", gf: true, mfxb: true, zulu: false, etoro: false, fourx: false },
    { feature: "Sentiment Analysis", gf: true, mfxb: true, zulu: false, etoro: true, fourx: false },
    { feature: "Mobile App", gf: true, mfxb: true, zulu: true, etoro: true, fourx: false },
    { feature: "Crypto Payment", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Content Auto-Posting", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "SEO Auto-Generator", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "CRM für Trader", gf: true, mfxb: false, zulu: false, etoro: false, fourx: false },
    { feature: "Profit Sharing (HWM)", gf: true, mfxb: false, zulu: true, etoro: true, fourx: false },
  ];

  const gfScore = features.filter(f => f.gf).length;
  const maxScore = features.length;

  return {
    features,
    scores: {
      "Gold Foundry": gfScore,
      "Myfxbook": features.filter(f => f.mfxb).length,
      "ZuluTrade": features.filter(f => f.zulu).length,
      "eToro": features.filter(f => f.etoro).length,
      "4X Solutions": features.filter(f => f.fourx).length,
    },
    maxScore,
    gfExclusives: features.filter(f => f.gf && !f.mfxb && !f.zulu && !f.etoro && !f.fourx).map(f => f.feature),
  };
}

// ══════════════════════════════════════════════════════════════
// AUTO SEO COMPARISON GENERATOR
// ══════════════════════════════════════════════════════════════

export async function generateComparisonContent(competitorKey: string): Promise<{
  title: string;
  metaDescription: string;
  content: string;
  features: ReturnType<typeof getFeatureComparison>["features"];
}> {
  const competitor = COMPETITORS[competitorKey as keyof typeof COMPETITORS];
  if (!competitor) throw new Error("Unknown competitor");

  const comparison = getFeatureComparison();

  const text = await cachedCall({
    prompt: `Du schreibst SEO-optimierte Vergleichsseiten für Gold Foundry. Ehrlich aber klar Gold Foundry im Vorteil. 800+ Wörter, H2/H3, natürliche Keywords.`,
    message: `Gold Foundry vs ${competitor.name}.

Gold Foundry hat ${comparison.scores["Gold Foundry"]}/${comparison.maxScore} Features.
${competitor.name} hat ${comparison.scores[competitor.name as keyof typeof comparison.scores] ?? 0}/${comparison.maxScore} Features.

Gold Foundry EXKLUSIVE Features (kein Wettbewerber hat das):
${comparison.gfExclusives.join("\n")}

${competitor.name} Schwächen:
${competitor.weaknesses.join("\n")}

Schreibe die Vergleichsseite. Title max 60 Zeichen, Meta max 155.`,
    model: MODELS.fast,
    maxTokens: 1500,
  });

  return {
    title: `Gold Foundry vs ${competitor.name} — Der komplette Vergleich`,
    metaDescription: `Gold Foundry vs ${competitor.name}: ${comparison.scores["Gold Foundry"]} vs ${comparison.scores[competitor.name as keyof typeof comparison.scores] ?? 0} Features im direkten Vergleich. Smart Copier, Shield, Strategy Lab.`,
    content: text,
    features: comparison.features,
  };
}
