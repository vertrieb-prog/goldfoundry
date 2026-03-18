// src/lib/seo/seo-agent.ts
// ============================================================
// FORGE SEO — Autonomous Website & Content Generator
// Auto-generates: Blog, Comparison Pages, Landing Pages
// Multi-language: DE, EN, ES, FR, PT, AR, RU, ZH, JA, KO, TR
// ============================================================

import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase-admin";

const LANGUAGES = [
  { code: "de", name: "Deutsch" }, { code: "en", name: "English" },
  { code: "es", name: "Español" }, { code: "fr", name: "Français" },
  { code: "pt", name: "Português" }, { code: "ar", name: "العربية" },
  { code: "ru", name: "Русский" }, { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" }, { code: "ko", name: "한국어" },
  { code: "tr", name: "Türkçe" },
];

const COMPETITORS = [
  { name: "Myfxbook", slug: "myfxbook", weaknesses: ["No smart copier", "No prop-firm optimization", "No code analysis", "Outdated UI"] },
  { name: "4X Solutions", slug: "4xsolutions", weaknesses: ["No AI risk management", "No strategy optimization", "No MLM system", "High pricing"] },
  { name: "ZuluTrade", slug: "zulutrade", weaknesses: ["No AI autopilot", "No manipulation detection", "No MQL4 analysis", "No prop-firm focus"] },
  { name: "Darwinex", slug: "darwinex", weaknesses: ["Complex onboarding", "No MetaTrader copier", "No XAUUSD focus", "No trailing DD protection"] },
];

export interface SEOArticle {
  slug: string;
  lang: string;
  title: string;
  metaDescription: string;
  content: string;
  keywords: string[];
  type: "blog" | "comparison" | "landing" | "glossary";
}

// ── Generate Comparison Page ──────────────────────────────────
export async function generateComparisonPage(competitorSlug: string, lang: string = "en"): Promise<SEOArticle> {
  const competitor = COMPETITORS.find(c => c.slug === competitorSlug);
  if (!competitor) throw new Error(`Unknown competitor: ${competitorSlug}`);

  const language = LANGUAGES.find(l => l.code === lang);

  const text = await cachedCall({
    prompt: `Du bist ein SEO-Texter für Gold Foundry (goldfoundry.de). Schreibe einen Vergleichsartikel Gold Foundry vs ${competitor.name}. Sprache: ${language?.name ?? "English"}. SEO-optimiert, H2-Tags für Sections, ehrlich aber Gold Foundry klar im Vorteil. 800-1200 Wörter. Gib auch einen meta-Title (max 60 Zeichen) und meta-Description (max 155 Zeichen) am Anfang in JSON an: {"title":"...","metaDescription":"...","content":"...Markdown..."}`,
    message: `Vergleich: Gold Foundry vs ${competitor.name}. Gold Foundry Vorteile: Smart Copier mit 7-Faktor Risk Engine, Manipulation Shield, MQL4 Code-Optimierung, Prop-Firm Playbooks, MLM System, autonome Strategie-Generierung, Nacht-Boost. ${competitor.name} Schwächen: ${competitor.weaknesses.join(", ")}.`,
    model: MODELS.smart,
    maxTokens: 1500,
  });
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      slug: `vs-${competitorSlug}`,
      lang,
      title: parsed.title,
      metaDescription: parsed.metaDescription,
      content: parsed.content,
      keywords: [`gold foundry vs ${competitor.name}`, `${competitor.name} alternative`, "best forex copier", "ai trade copier"],
      type: "comparison",
    };
  } catch {
    return {
      slug: `vs-${competitorSlug}`, lang, title: `Gold Foundry vs ${competitor.name}`,
      metaDescription: `Vergleich: Gold Foundry vs ${competitor.name}. Smart Copier, Prop-Firm Tools, und mehr.`,
      content: text, keywords: [], type: "comparison",
    };
  }
}

// ── Generate Blog Article ─────────────────────────────────────
export async function generateBlogArticle(topic: string, lang: string = "en"): Promise<SEOArticle> {
  const language = LANGUAGES.find(l => l.code === lang);

  const text = await cachedCall({
    prompt: `Du bist ein Forex/Trading Blog-Autor für Gold Foundry. Schreibe einen SEO-optimierten Artikel. Sprache: ${language?.name ?? "English"}. 800-1500 Wörter, H2/H3 Struktur, natürliche Keywords. Am Ende immer CTA zu Gold Foundry. Gib JSON zurück: {"title":"...","metaDescription":"...","slug":"...", "keywords":["..."],"content":"...Markdown..."}`,
    message: `Thema: ${topic}`,
    model: MODELS.smart,
    maxTokens: 2000,
  });

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return { ...parsed, lang, type: "blog" };
  } catch {
    return { slug: topic.toLowerCase().replace(/\s+/g, "-").slice(0, 50), lang, title: topic, metaDescription: "", content: text, keywords: [], type: "blog" };
  }
}

// ── Daily Auto-Generation Pipeline ────────────────────────────
export async function runDailySEOPipeline(): Promise<{ generated: number; articles: string[] }> {
  const results: string[] = [];
  const db = supabaseAdmin;

  // 1. Generate 1 comparison page (rotate competitors)
  const today = new Date().getDate();
  const competitor = COMPETITORS[today % COMPETITORS.length];
  const compLang = LANGUAGES[today % LANGUAGES.length].code;
  try {
    const compPage = await generateComparisonPage(competitor.slug, compLang);
    results.push(`Comparison: ${compPage.slug} (${compLang})`);
    // Store in a CMS table or write to filesystem
  } catch (e) { results.push(`Comparison FAILED: ${(e as Error).message}`); }

  // 2. Generate 2 blog articles in different languages
  const BLOG_TOPICS = [
    "How to Pass a Prop Firm Challenge in 10 Days with AI",
    "XAUUSD Analysis: Best Sessions for Gold Trading",
    "Why AI Trade Copiers Are the Future of Forex",
    "Trailing vs Fixed Drawdown: Complete Guide",
    "MQL4 Optimization: How AI Makes Your EA More Profitable",
    "Stop Hunting Protection: How to Detect Market Manipulation",
    "The Perfect Risk Management for Prop Firm Accounts",
  ];

  for (let i = 0; i < 2; i++) {
    const topic = BLOG_TOPICS[(today + i) % BLOG_TOPICS.length];
    const lang = LANGUAGES[(today + i + 1) % LANGUAGES.length].code;
    try {
      const article = await generateBlogArticle(topic, lang);
      results.push(`Blog: ${article.slug} (${lang})`);
    } catch (e) { results.push(`Blog FAILED: ${(e as Error).message}`); }
  }

  return { generated: results.length, articles: results };
}
