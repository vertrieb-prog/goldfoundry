// src/lib/intel/market-intel.ts
// ============================================================
// FORGE INTEL — Market Intelligence Engine
// Feeds Factor 7 (INTEL_FACTOR) of the Copier Risk Engine
// ============================================================

import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase-admin";

const log = (level: string, msg: string, data?: any) =>
  console.log(`[${new Date().toISOString()}] [FORGE-INTEL] [${level}] ${msg}`, data ?? "");

export interface MarketIntelSignal {
  riskLevel: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "BLACK";
  riskScore: number;
  regime: "RISK_ON" | "RISK_OFF" | "TRANSITIONING" | "CRISIS";
  vixLevel: number | null;
  dxyTrend: "BULLISH" | "NEUTRAL" | "BEARISH";
  geopoliticalRisk: "LOW" | "ELEVATED" | "HIGH" | "CRITICAL";
  geopoliticalAlerts: string[];
  xauusd: { atr: number; atrRatio: number; bias: string; spreadNormal: boolean };
  us500: { atr: number; atrRatio: number; bias: string; spreadNormal: boolean };
  hasTier0Event: boolean;
  forecastText: string;
}

// ── Event Classification ──────────────────────────────────────
const TIER_0_KEYWORDS = [
  "non-farm", "nfp", "fomc", "fed rate", "interest rate decision",
  "cpi", "consumer price index", "core cpi",
  "ecb rate", "boe rate", "boj rate",
];
const TIER_1_KEYWORDS = [
  "ppi", "producer price", "retail sales", "ism manufacturing",
  "ism services", "gdp", "pce price", "powell", "fed chair",
];

export function classifyEventTier(title: string): number {
  const lower = title.toLowerCase();
  if (TIER_0_KEYWORDS.some(k => lower.includes(k))) return 0;
  if (TIER_1_KEYWORDS.some(k => lower.includes(k))) return 1;
  if (lower.includes("claims") || lower.includes("adp") || lower.includes("confidence")) return 2;
  return 3;
}

// ── Geopolitical Risk Assessment ──────────────────────────────
const INSTANT_CRITICAL = [
  "nuclear strike", "nuclear attack", "world war", "market crash",
  "circuit breaker", "exchange halted", "flash crash",
];
const INSTANT_HIGH = [
  "military strike", "invasion", "declaration of war", "martial law",
  "bank run", "sovereign default", "emergency session",
];
const INSTANT_ELEVATED = [
  "sanctions package", "military escalation", "troop deployment",
  "missile launch", "airspace closed", "credit downgrade",
];

export function quickGeopoliticalScan(headlines: string[]): {
  level: "LOW" | "ELEVATED" | "HIGH" | "CRITICAL";
  triggers: string[];
} {
  const triggers: string[] = [];
  let level: "LOW" | "ELEVATED" | "HIGH" | "CRITICAL" = "LOW";

  const combined = headlines.join(" ").toLowerCase();

  for (const kw of INSTANT_CRITICAL) {
    if (combined.includes(kw)) { level = "CRITICAL"; triggers.push(kw); }
  }
  if (level !== "CRITICAL") {
    for (const kw of INSTANT_HIGH) {
      if (combined.includes(kw)) { level = "HIGH"; triggers.push(kw); }
    }
  }
  if (level === "LOW") {
    for (const kw of INSTANT_ELEVATED) {
      if (combined.includes(kw)) { level = "ELEVATED"; triggers.push(kw); }
    }
  }

  return { level, triggers };
}

// ── AI-Powered Full Geopolitical Analysis ─────────────────────
export async function analyzeGeopolitics(headlines: string[]): Promise<{
  level: string; score: number; alerts: string[];
}> {
  if (!headlines.length) return { level: "LOW", score: 5, alerts: [] };

  // Quick scan first (no API call needed)
  const quick = quickGeopoliticalScan(headlines);
  if (quick.level === "CRITICAL") {
    return { level: "CRITICAL", score: 95, alerts: quick.triggers };
  }

  try {
    const text = await cachedCall({
      prompt: `Du bist ein geopolitischer Risikoanalyst für einen Trading-Copier.
Bewerte die Headlines. Antworte NUR als JSON:
{"level":"LOW|ELEVATED|HIGH|CRITICAL","score":0-100,"alerts":["kurze Beschreibung"]}`,
      message: `Headlines:\n${headlines.slice(0, 20).join("\n")}`,
      model: MODELS.fast,
      maxTokens: 300,
    });
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    log("ERROR", "Geopolitik-Analyse fehlgeschlagen", { error: (err as Error).message });
    return { level: quick.level, score: quick.level === "HIGH" ? 65 : quick.level === "ELEVATED" ? 35 : 10, alerts: quick.triggers };
  }
}

// ── Regime Detection ──────────────────────────────────────────
export function detectRegime(vix: number | null, dxyTrend: string, goldBias: string): string {
  if (vix && vix > 35) return "CRISIS";
  if (vix && vix > 25) return "RISK_OFF";
  if (vix && vix < 18 && dxyTrend !== "BULLISH") return "RISK_ON";
  return "TRANSITIONING";
}

// ── Composite Risk Score ──────────────────────────────────────
export function calculateRiskScore(
  geoScore: number,
  regime: string,
  hasTier0: boolean,
  atrRatioGold: number,
  atrRatioSPX: number
): { score: number; level: "GREEN" | "YELLOW" | "ORANGE" | "RED" | "BLACK" } {
  let score = geoScore * 0.4; // 40% geopolitics

  // Regime contribution (30%)
  score += (regime === "CRISIS" ? 30 : regime === "RISK_OFF" ? 20 : regime === "TRANSITIONING" ? 10 : 5);

  // Volatility (15%)
  const avgATR = (atrRatioGold + atrRatioSPX) / 2;
  score += Math.min(avgATR * 10, 15);

  // Event risk (15%)
  if (hasTier0) score += 15;

  score = Math.min(Math.round(score), 100);

  const level = score >= 80 ? "BLACK" : score >= 60 ? "RED" : score >= 40 ? "ORANGE" : score >= 20 ? "YELLOW" : "GREEN";

  return { score, level };
}

// ── 24h Forecast Generator ────────────────────────────────────
export async function generate24hForecast(signal: Partial<MarketIntelSignal>): Promise<string> {
  try {
    const text = await cachedCall({
      prompt: `Du bist FORGE INTEL. Erstelle eine 24h-Prognose für XAUUSD und US500.
Format: 5 Zeilen max. Regime, Gold-Bias, SPX-Bias, Risiken, Copier-Empfehlung. Direkt, keine Floskeln.`,
      message: `Regime: ${signal.regime}, VIX: ${signal.vixLevel}, DXY: ${signal.dxyTrend}, Geopolitik: ${signal.geopoliticalRisk} (${signal.geopoliticalAlerts?.join(", ")}), Gold ATR Ratio: ${signal.xauusd?.atrRatio}, SPX ATR Ratio: ${signal.us500?.atrRatio}, Tier-0 Event heute: ${signal.hasTier0Event}`,
      model: MODELS.fast,
      maxTokens: 400,
    });

    return text || "Forecast nicht verfügbar.";
  } catch {
    return "Forecast-Generierung fehlgeschlagen. Copier läuft mit Standard-Parametern.";
  }
}

// ── Gold Spike Anomaly Detection ──────────────────────────────
export function detectGoldSpike(currentPrice: number, priceHistory5min: number[]): boolean {
  if (priceHistory5min.length < 2) return false;
  const lastPrice = priceHistory5min[priceHistory5min.length - 1];
  const move = Math.abs(currentPrice - lastPrice);
  const avgMove = priceHistory5min.reduce((s, p, i) =>
    i > 0 ? s + Math.abs(p - priceHistory5min[i - 1]) : s, 0
  ) / Math.max(priceHistory5min.length - 1, 1);

  return move > avgMove * 4; // 4× larger than average = spike
}

// ── Full Intel Update Pipeline ────────────────────────────────
export async function runIntelUpdate(): Promise<MarketIntelSignal> {
  const db = supabaseAdmin;

  // 1. Check for upcoming Tier 0 events
  const { data: events } = await db
    .from("economic_calendar")
    .select("*")
    .gte("event_time", new Date().toISOString())
    .lte("event_time", new Date(Date.now() + 24 * 3600000).toISOString());

  const hasTier0 = (events ?? []).some(e => e.tier === 0);

  // 2. Geopolitical assessment (from stored headlines or API)
  // In production: fetch from news API. Here: use stored data.
  const { data: geoLog } = await db
    .from("geopolitical_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  const geo = geoLog?.[0] ?? { risk_level: "LOW", risk_score: 5, triggers: [] };

  // 3. Regime detection (simplified — use stored VIX or default)
  const vix = null; // TODO: fetch real VIX
  const dxyTrend = "NEUTRAL";
  const regime = detectRegime(vix, dxyTrend, "NEUTRAL");

  // 4. ATR ratios (default to 1.0 — updated by equity snapshot cron)
  const xauusd = { atr: 300, atrRatio: 1.0, bias: "NEUTRAL", spreadNormal: true };
  const us500 = { atr: 55, atrRatio: 1.0, bias: "NEUTRAL", spreadNormal: true };

  // 5. Composite risk
  const { score, level } = calculateRiskScore(
    geo.risk_score, regime, hasTier0, xauusd.atrRatio, us500.atrRatio
  );

  // 6. Forecast
  const signal: MarketIntelSignal = {
    riskLevel: level,
    riskScore: score,
    regime: regime as any,
    vixLevel: vix,
    dxyTrend: dxyTrend as any,
    geopoliticalRisk: geo.risk_level as any,
    geopoliticalAlerts: geo.triggers ?? [],
    xauusd, us500,
    hasTier0Event: hasTier0,
    forecastText: "",
  };

  signal.forecastText = await generate24hForecast(signal);

  // 7. Store in Supabase
  await db.from("market_intel").insert({
    risk_level: signal.riskLevel,
    risk_score: signal.riskScore,
    regime: signal.regime,
    vix_level: signal.vixLevel,
    dxy_trend: signal.dxyTrend,
    geopolitical_risk: signal.geopoliticalRisk,
    geopolitical_alerts: signal.geopoliticalAlerts,
    xauusd_atr: signal.xauusd.atr,
    xauusd_atr_ratio: signal.xauusd.atrRatio,
    xauusd_bias: signal.xauusd.bias,
    us500_atr: signal.us500.atr,
    us500_atr_ratio: signal.us500.atrRatio,
    us500_bias: signal.us500.bias,
    forecast_text: signal.forecastText,
  });

  log("INFO", `Intel Update: ${signal.riskLevel} (${signal.riskScore}/100) | Regime: ${signal.regime} | Geo: ${signal.geopoliticalRisk}`);

  return signal;
}
