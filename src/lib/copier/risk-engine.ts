// src/lib/copier/risk-engine.ts
// ============================================================
// FORGE COPY — 7-Factor AI Risk Multiplier
// ============================================================

export interface RiskAssessment {
  timeFactor: number;
  newsFactor: number;
  ddFactor: number;
  performanceFactor: number;
  volatilityFactor: number;
  weekdayFactor: number;
  intelFactor: number;
  finalMultiplier: number;
  action: "COPY" | "SKIP" | "REDUCE";
  reasons: string[];
}

interface SlaveAccount {
  firmProfile: "tegas_24x" | "tag_12x";
  currentEquity: number;
  initialBalance: number;
  equityHigh: number;
  ddLimit: number;
  ddType: "trailing" | "fixed";
  phase: number | null;
}

interface MarketIntel {
  geopoliticalRisk: string;
  regime: string;
  riskScore: number;
  xauusdSpreadNormal: boolean;
  us500SpreadNormal: boolean;
  hasTier0Event: boolean;
}

interface Trade {
  profit: number;
}

// ── FACTOR 1: TIME ────────────────────────────────────────────
export function getTimeFactor(hour: number, firm: string): number {
  // Nacht-Boost (22:00-07:00) — ruhige Asian Session
  if (hour >= 22 || hour < 7) return firm === "tegas_24x" ? 1.3 : 1.4;
  // London Pre-Open
  if (hour === 7) return 0.6;
  // London Open
  if (hour >= 8 && hour < 10) return firm === "tegas_24x" ? 0.8 : 1.0;
  // London Body
  if (hour >= 10 && hour < 14) return 0.9;
  // NY DANGER ZONE
  if (hour >= 14 && hour < 16) return firm === "tegas_24x" ? 0.4 : 0.6;
  // NY Body
  if (hour >= 16 && hour < 20) return 0.8;
  // Pre-Night
  if (hour >= 20 && hour < 22) return 0.7;
  return 1.0;
}

// ── FACTOR 2: NEWS ────────────────────────────────────────────
export function getNewsFactor(
  events: Array<{ time: Date; tier: number; title: string }>,
  now: Date,
  firm: string
): number {
  for (const event of events) {
    const minUntil = (event.time.getTime() - now.getTime()) / 60000;
    const minSince = -minUntil;

    // Tier 0 (FOMC, NFP, CPI) — COMPLETE PAUSE
    if (event.tier === 0) {
      if (minUntil <= 45 && minSince <= 30) return 0.0;
      if (minUntil <= 60 && minUntil > 45) return 0.2;
      if (minSince > 30 && minSince <= 60) return 0.5;
    }
    // Tier 1 (PPI, ISM, etc)
    if (event.tier === 1) {
      if (minUntil <= 15 && minSince <= 15) return firm === "tegas_24x" ? 0.0 : 0.3;
      if (minUntil <= 30 && minUntil > 15) return 0.5;
    }
    // Tier 2
    if (event.tier === 2) {
      if (minUntil <= 5 && minSince <= 10) return 0.7;
    }
  }
  return 1.0;
}

// ── FACTOR 3: DRAWDOWN ────────────────────────────────────────
export function getDDFactor(account: SlaveAccount): number {
  const buffer = account.currentEquity > 0
    ? ((account.currentEquity - account.ddLimit) / account.currentEquity) * 100
    : 0;

  if (account.firmProfile === "tegas_24x") {
    if (buffer > 80) return 1.2;
    if (buffer > 60) return 1.0;
    if (buffer > 40) return 0.6;
    if (buffer > 20) return 0.3;
    if (buffer > 10) return 0.1;
    return 0.0; // EMERGENCY STOP
  }

  // Tag Markets — Phase system
  const profitPct = ((account.currentEquity - account.initialBalance) / account.initialBalance) * 100;

  if (profitPct < 3) { // Phase 1
    if (buffer > 70) return 0.8;
    if (buffer > 50) return 0.5;
    if (buffer > 30) return 0.3;
    return 0.0;
  }
  if (profitPct < 8) { // Phase 2
    if (buffer > 60) return 1.0;
    if (buffer > 40) return 0.7;
    if (buffer > 20) return 0.4;
    return 0.0;
  }
  if (profitPct < 15) { // Phase 3
    if (buffer > 50) return 1.2;
    if (buffer > 30) return 0.8;
    if (buffer > 15) return 0.5;
    return 0.0;
  }
  // Phase 4 (>15%)
  if (buffer > 40) return 1.5;
  if (buffer > 25) return 1.0;
  if (buffer > 15) return 0.6;
  return 0.0;
}

// ── FACTOR 4: PERFORMANCE ─────────────────────────────────────
export function getPerformanceFactor(recentTrades: Trade[]): number {
  if (recentTrades.length < 5) return 0.8;

  const last20 = recentTrades.slice(-20);
  const wr = last20.filter(t => t.profit > 0).length / last20.length;

  // Consecutive loss detection
  let consLosses = 0;
  for (let i = recentTrades.length - 1; i >= 0; i--) {
    if (recentTrades[i].profit <= 0) consLosses++;
    else break;
  }

  if (consLosses >= 4) return 0.0; // 4 losses = PAUSE
  if (consLosses >= 3) return 0.2;
  if (consLosses >= 2) return 0.5;

  // Consecutive win bonus
  let consWins = 0;
  for (let i = recentTrades.length - 1; i >= 0; i--) {
    if (recentTrades[i].profit > 0) consWins++;
    else break;
  }
  const streakBonus = Math.min(consWins * 0.05, 0.2);

  if (wr < 0.40) return 0.3;
  if (wr < 0.50) return 0.6;
  if (wr >= 0.65) return 1.0 + streakBonus;
  if (wr >= 0.55) return 0.9 + streakBonus;
  return 0.8;
}

// ── FACTOR 5: VOLATILITY ──────────────────────────────────────
export function getVolatilityFactor(instrument: string, atrRatio: number): number {
  if (instrument === "XAUUSD") {
    if (atrRatio < 0.6) return 1.2;
    if (atrRatio < 0.8) return 1.1;
    if (atrRatio < 1.2) return 1.0;
    if (atrRatio < 1.5) return 0.7;
    if (atrRatio < 2.0) return 0.4;
    return 0.0;
  }
  // US500
  if (atrRatio < 0.6) return 1.1;
  if (atrRatio < 0.8) return 1.0;
  if (atrRatio < 1.3) return 0.9;
  if (atrRatio < 1.8) return 0.5;
  if (atrRatio < 2.5) return 0.2;
  return 0.0;
}

// ── FACTOR 6: WEEKDAY ─────────────────────────────────────────
export function getWeekdayFactor(day: number, hour: number): number {
  if (day === 1) return 0.7;                       // Monday
  if (day >= 2 && day <= 4) return 1.0;            // Tue-Thu
  if (day === 5) {                                  // Friday
    if (hour < 14) return 0.9;
    if (hour < 18) return 0.7;
    if (hour < 20) return 0.3;
    return 0.0;
  }
  if (day === 0 && hour >= 23) return 0.3;          // Sunday open
  return 0.0;
}

// ── FACTOR 7: INTEL ───────────────────────────────────────────
export function getIntelFactor(intel: MarketIntel | null): number {
  if (!intel) return 0.9; // No data = slight caution

  if (intel.geopoliticalRisk === "CRITICAL") return 0.0;
  if (intel.geopoliticalRisk === "HIGH") return 0.4;
  if (intel.geopoliticalRisk === "ELEVATED") return 0.85;

  let factor = intel.regime === "CRISIS" ? 0.1 :
               intel.regime === "RISK_OFF" ? 0.7 :
               intel.regime === "RISK_ON" ? 1.1 : 0.9;

  if (intel.hasTier0Event) factor *= 0.5;
  if (!intel.xauusdSpreadNormal || !intel.us500SpreadNormal) factor *= 0.6;

  return Math.max(factor, 0);
}

// ── COMPOSITE CALCULATION ─────────────────────────────────────
export function calculateRiskMultiplier(
  account: SlaveAccount,
  instrument: string,
  events: Array<{ time: Date; tier: number; title: string }>,
  recentTrades: Trade[],
  atrRatio: number,
  intel: MarketIntel | null,
  now: Date = new Date()
): RiskAssessment {
  const hour = now.getHours();
  const day = now.getDay();

  const tf = getTimeFactor(hour, account.firmProfile);
  const nf = getNewsFactor(events, now, account.firmProfile);
  const df = getDDFactor(account);
  const pf = getPerformanceFactor(recentTrades);
  const vf = getVolatilityFactor(instrument, atrRatio);
  const wf = getWeekdayFactor(day, hour);
  const inf = getIntelFactor(intel);

  let final = tf * nf * df * pf * vf * wf * inf;

  // Hard limits
  const max = account.firmProfile === "tegas_24x" ? 1.3 : 1.8;
  final = Math.min(Math.max(final, 0), max);
  final = Math.round(final * 100) / 100;

  const reasons: string[] = [];
  if (tf > 1.0) reasons.push(`Nacht-Boost ×${tf}`);
  if (tf < 0.8) reasons.push(`Session-Reduktion ×${tf}`);
  if (nf < 1.0) reasons.push(nf === 0 ? "NEWS-PAUSE: Gestoppt" : `News-Filter ×${nf}`);
  if (df < 0.5) reasons.push(df === 0 ? "DD-EMERGENCY: Gestoppt" : `DD-Warnung ×${df}`);
  if (pf < 0.5) reasons.push(pf === 0 ? "LOSING STREAK: Gestoppt" : `Performance-Alarm ×${pf}`);
  if (vf < 0.5) reasons.push(vf === 0 ? "EXTREME VOL: Gestoppt" : `Hohe Volatilität ×${vf}`);
  if (wf < 0.8) reasons.push(`Wochentag ×${wf}`);
  if (inf < 0.5) reasons.push(inf === 0 ? "GEOPOLITIK CRITICAL" : `Intel-Warnung ×${inf}`);

  const action = final === 0 ? "SKIP" : final < 0.5 ? "REDUCE" : "COPY";

  return {
    timeFactor: tf, newsFactor: nf, ddFactor: df, performanceFactor: pf,
    volatilityFactor: vf, weekdayFactor: wf, intelFactor: inf,
    finalMultiplier: final, action, reasons,
  };
}

// ── LOT CALCULATOR ────────────────────────────────────────────
export function calculateCopyLots(
  masterLots: number,
  stopPips: number,
  equity: number,
  firmProfile: string,
  riskMultiplier: number,
  instrument: string
): number {
  if (riskMultiplier <= 0) return 0;

  const pipValue = instrument === "XAUUSD" ? 10 : 1; // Adjust for broker
  const maxRiskPct = firmProfile === "tegas_24x" ? 0.003 : 0.005;
  const riskBudget = equity * maxRiskPct * riskMultiplier;

  let lots = stopPips > 0 ? riskBudget / (stopPips * pipValue) : masterLots * riskMultiplier;

  // Safety caps
  const maxLots = firmProfile === "tegas_24x" ? 5.0 : 10.0;
  lots = Math.min(lots, maxLots, masterLots * 3);
  lots = Math.floor(lots * 100) / 100; // Round DOWN

  return Math.max(lots, 0);
}
