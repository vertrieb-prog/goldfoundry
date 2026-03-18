// src/lib/content/content-engine.ts
// ============================================================
// FORGE MEDIA — Autonomous Content Generation
// Morning Briefing, Trade Results, Educational, Leaderboard
// ============================================================

import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type ContentType = "morning_briefing" | "trade_results" | "educational" | "leaderboard" | "competition";
export type Platform = "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin";

export interface GeneratedContent {
  type: ContentType;
  platform: Platform;
  title: string;
  body: string;
  hashtags: string[];
  scheduledFor: string;
}

// ── Morning Briefing (07:30 CET) ──────────────────────────────
export async function generateMorningBriefing(): Promise<GeneratedContent[]> {
  const db = supabaseAdmin;
  const { data: intel } = await db.from("market_intel").select("*").order("created_at", { ascending: false }).limit(1);
  const { data: calendar } = await db.from("economic_calendar").select("*").gte("event_time", new Date().toISOString()).order("event_time").limit(5);

  const intelData = intel?.[0];
  const events = (calendar ?? []).map(e => `${e.title} (${e.impact})`).join(", ");

  const text = await cachedCall({
    prompt: `Du bist der Social Media Manager von Gold Foundry (goldfoundry.de). Erstelle einen kurzen, knackigen Morning Briefing Post. Max 200 Zeichen für Twitter, max 500 für Instagram. Professionell aber zugänglich. Immer mit dem Gold Foundry Forge-Stil.`,
    message: `Risk Level: ${intelData?.risk_level ?? "GREEN"}, Regime: ${intelData?.regime ?? "N/A"}, Gold Bias: ${intelData?.xauusd_bias ?? "N/A"}, US500 Bias: ${intelData?.us500_bias ?? "N/A"}, Events: ${events || "Keine"}, Forecast: ${intelData?.forecast_text ?? "N/A"}`,
    model: MODELS.fast,
    maxTokens: 300,
  });

  return [
    { type: "morning_briefing", platform: "twitter", title: "FORGE Briefing", body: text.slice(0, 280), hashtags: ["#GoldFoundry", "#XAUUSD", "#US500", "#PropFirm", "#ForexAI"], scheduledFor: "07:30" },
    { type: "morning_briefing", platform: "instagram", title: "FORGE Briefing", body: text, hashtags: ["#GoldFoundry", "#ForexTrading", "#GoldTrading", "#PropFirmChallenge", "#TradingAI", "#XAUUSD", "#SP500"], scheduledFor: "07:30" },
  ];
}

// ── Trade Results (18:00 CET) ─────────────────────────────────
export async function generateTradeResults(): Promise<GeneratedContent[]> {
  const db = supabaseAdmin;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const { data: trades } = await db.from("trades").select("*").gte("close_time", today.toISOString()).eq("is_open", false);

  const totalPnl = (trades ?? []).reduce((s, t) => s + Number(t.profit), 0);
  const count = trades?.length ?? 0;
  const winners = (trades ?? []).filter(t => Number(t.profit) > 0).length;
  const wr = count > 0 ? ((winners / count) * 100).toFixed(0) : "0";

  const text = await cachedCall({
    prompt: `Erstelle einen Trade-Results Social Media Post für Gold Foundry. Kurz, datengetrieben, professionell. Zeige dass der Smart Copier funktioniert.`,
    message: `Heute: ${count} Trades, ${wr}% Win Rate, ${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)} P&L. Smart Copier lief ${count > 0 ? "aktiv" : "pausiert"}.`,
    model: MODELS.fast,
    maxTokens: 200,
  });

  return [
    { type: "trade_results", platform: "twitter", title: "Daily Results", body: text.slice(0, 280), hashtags: ["#GoldFoundry", "#TradingResults", "#AITrading"], scheduledFor: "18:00" },
    { type: "trade_results", platform: "instagram", title: "Daily Results", body: text, hashtags: ["#GoldFoundry", "#TradingResults", "#PropFirm", "#GoldTrading", "#AITrading", "#ForexResults"], scheduledFor: "18:00" },
  ];
}

// ── Educational Content (3× pro Woche) ────────────────────────
const EDUCATIONAL_TOPICS = [
  "Warum 80% der Prop-Firm Challenges scheitern — und wie du bestehst",
  "Trailing vs Fixed Drawdown: Was ist sicherer für dein Kapital?",
  "Die 3 besten Trading-Sessions für XAUUSD",
  "Wie der FORGE Smart Copier dein Risiko automatisch managed",
  "Stop Hunts erkennen: So schützt du dich vor Marktmanipulation",
  "Die goldene Regel: Warum Nacht-Trading profitabler ist als du denkst",
  "MQL4 Code optimieren mit KI: So wird dein EA 30% profitabler",
  "Prop-Firm Consistency Rule: Der stille Account-Killer",
  "XAUUSD vs US500: Warum du beides traden solltest",
  "Wie Gold Foundry besser als Myfxbook ist — der direkte Vergleich",
];

export async function generateEducationalContent(): Promise<GeneratedContent[]> {
  const topic = EDUCATIONAL_TOPICS[Math.floor(Math.random() * EDUCATIONAL_TOPICS.length)];

  const text = await cachedCall({
    prompt: `Erstelle Educational Content für Gold Foundry Social Media. Thema wird vorgegeben. Instagram-Post Format: Hook (1 Satz), 3-5 Bulletpoints mit Value, CTA am Ende. Professionell, datengetrieben, kein Fluff.`,
    message: `Thema: ${topic}`,
    model: MODELS.smart,
    maxTokens: 600,
  });

  return [
    { type: "educational", platform: "instagram", title: topic, body: text, hashtags: ["#GoldFoundry", "#TradingEducation", "#PropFirm", "#ForexTips", "#TradingWissen"], scheduledFor: "12:00" },
    { type: "educational", platform: "twitter", title: topic, body: text.slice(0, 280), hashtags: ["#GoldFoundry", "#TradingTips"], scheduledFor: "12:00" },
  ];
}
