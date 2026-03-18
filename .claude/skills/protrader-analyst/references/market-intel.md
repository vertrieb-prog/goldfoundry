# FORGE INTEL — Market Intelligence & Forecast Engine

Die Copier AI ist nur so gut wie ihre Daten. Dieses Modul liefert dem FORGE COPY Autopilot **in Echtzeit** die Informationen die er braucht um Risiko zu steuern: News-Kalender, Geopolitik, Markt-Regime, Sentiment. Alles fließt als Signal in den Risk Multiplier.

## Architektur

```
DATENQUELLEN (Automatisch, alle 5 Minuten):
├── Economic Calendar API     → NFP, CPI, FOMC Termine + Prognosen
├── News Sentiment API        → Schlagzeilen-Analyse (Krieg, Sanktionen, Crashes)
├── Market Data (MetaApi)     → ATR, Preis, Spread, Volumen
├── VIX Level                 → Fear & Greed Signal
└── DXY / US10Y               → Makro-Regime

         │
         ▼
┌─────────────────────────────────────┐
│       FORGE INTEL ENGINE            │
│                                     │
│  1. Event Scoring (Calendar)        │
│  2. Geopolitical Risk Index         │
│  3. Market Regime Classification    │
│  4. Volatility Forecast             │
│  5. Session Quality Score           │
│                                     │
│  OUTPUT: MarketIntelSignal          │
│  → Wird alle 5min an FORGE COPY    │
│    und FORGE AI geliefert           │
└─────────────────────────────────────┘
         │
         ▼
   FORGE COPY Engine (Risk Multiplier)
   FORGE AI Chat (Kontext für Analysen)
   Dashboard (Live Market Widget)
```

## Signal-Output Format

```typescript
interface MarketIntelSignal {
  timestamp: string;

  // ── Composite Risk Level ──────────────────
  riskLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'BLACK';
  riskScore: number;          // 0-100 (0=maximale Sicherheit, 100=maximale Gefahr)
  riskMultiplierOverride: number; // Direkter Override für den Copier (0.0 - 1.0)

  // ── Economic Calendar ─────────────────────
  nextEvent: EventInfo | null;
  todayEvents: EventInfo[];
  eventRiskWindow: boolean;   // true = gerade in einem Event-Fenster

  // ── Geopolitik ────────────────────────────
  geopoliticalRisk: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  geopoliticalAlerts: string[];

  // ── Market Regime ─────────────────────────
  regime: 'RISK_ON' | 'RISK_OFF' | 'TRANSITIONING' | 'CRISIS';
  vixLevel: number;
  dxyTrend: 'BULLISH' | 'NEUTRAL' | 'BEARISH';

  // ── Instrument-Specific ───────────────────
  xauusd: InstrumentIntel;
  us500: InstrumentIntel;

  // ── Forecast ──────────────────────────────
  forecast24h: string;        // Natürlichsprachige Prognose
  recommendedAction: string;  // "Normal trading" / "Reduce risk" / "PAUSE"
}

interface InstrumentIntel {
  atr14: number;
  atrRatio: number;           // vs 20-Day Avg (1.0 = normal)
  spread: number;             // Aktueller Spread
  spreadNormal: boolean;      // false = ungewöhnlich weit
  volatilityForecast: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
  bias: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
}
```

## Modul 1: Economic Calendar Engine

### Datenquelle

```typescript
// Optionen (in Reihenfolge der Qualität):
// 1. MQL5 Economic Calendar (kostenlos via MetaApi)
// 2. Forex Factory Scraper (als Fallback)
// 3. Investing.com Calendar API

// MetaApi hat einen integrierten Economic Calendar:
const calendar = await api.metatraderAccountApi
  .getAccount(accountId)
  .getRPCConnection()
  .getEconomicCalendar(startDate, endDate);

// Alternativ: eigene Supabase-Tabelle die täglich um 06:00 CET gefüllt wird
```

### Event-Klassifizierung

```
TIER 0 — SYSTEM SHUTDOWN (Copier = 0.0):
├── FOMC Rate Decision + Pressekonferenz
├── Non-Farm Payrolls (NFP)
├── US CPI (Core + Headline)
├── EZB Rate Decision
├── BOE Rate Decision
└── Unplanned: Flash Crash, Exchange Halt, Black Swan

TIER 1 — HEAVY REDUCTION (Copier = 0.0 - 0.2):
├── US PPI
├── US Retail Sales
├── ISM Manufacturing / Services
├── Fed Chair Powell Speeches
├── US GDP (Advance, Preliminary, Final)
├── Core PCE Price Index
├── EZB Pressekonferenz
└── BOJ Rate Decision

TIER 2 — MODERATE REDUCTION (Copier = 0.5 - 0.7):
├── Jobless Claims (jeden Donnerstag)
├── ADP Employment
├── Consumer Confidence
├── Durable Goods Orders
├── Philadelphia Fed Manufacturing
├── Fed Governors Speeches
├── EU/UK CPI
└── China PMI (Nacht-Einfluss auf Gold)

TIER 3 — SLIGHT CAUTION (Copier = 0.8):
├── Housing Data
├── Trade Balance
├── Industrial Production
├── JOLTS Job Openings
└── Leading Indicators
```

### Event-Window Berechnung

```typescript
function calculateEventWindow(event: CalendarEvent): EventWindow {
  const tier = classifyEvent(event);

  // Wie lange VOR und NACH dem Event pausieren/reduzieren?
  const windows = {
    TIER_0: { pauseBefore: 45, pauseAfter: 30, reduceBefore: 60, reduceAfter: 60 },
    TIER_1: { pauseBefore: 15, pauseAfter: 15, reduceBefore: 30, reduceAfter: 30 },
    TIER_2: { pauseBefore: 5,  pauseAfter: 10, reduceBefore: 15, reduceAfter: 15 },
    TIER_3: { pauseBefore: 0,  pauseAfter: 5,  reduceBefore: 5,  reduceAfter: 10 },
  };

  return windows[tier];
}

// SPEZIALFALL: Mehrere Events am selben Tag
// Wenn Tier 0 + Tier 1 am selben Tag → ganzer Tag auf Copier 0.3 max
// "NFP-Tag ist kein Trading-Tag. Punkt."
function isDangerDay(events: CalendarEvent[]): boolean {
  const hasTier0 = events.some(e => classifyEvent(e) === 'TIER_0');
  const tier1Count = events.filter(e => classifyEvent(e) === 'TIER_1').length;
  return hasTier0 || tier1Count >= 3;
}
```

## Modul 2: Geopolitical Risk Index

### Real-Time Geopolitik-Scoring

```typescript
// Datenquellen:
// 1. News API (newsapi.org / GDELT) — Schlagzeilen der letzten 4 Stunden
// 2. Anthropic API — Claude analysiert die Schlagzeilen und scored das Risiko
// 3. Gold-Preisreaktion als Proxy (plötzlicher Spike = Geopolitik)

interface GeopoliticalAssessment {
  level: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  score: number;          // 0-100
  triggers: string[];     // "Ukraine escalation", "Iran-Israel tensions"
  goldImpact: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  us500Impact: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  copierMultiplier: number; // Override
}

async function assessGeopoliticalRisk(): Promise<GeopoliticalAssessment> {
  // 1. Headlines holen (letzte 4 Stunden)
  const headlines = await fetchRecentHeadlines({
    keywords: ['war', 'military', 'strike', 'sanctions', 'nuclear',
               'invasion', 'escalation', 'conflict', 'attack', 'missile',
               'emergency', 'crisis', 'crash', 'collapse', 'default'],
    sources: ['reuters', 'bloomberg', 'bbc', 'cnbc', 'ft'],
    hours: 4,
  });

  // 2. Claude analysiert die Headlines
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: `Du bist ein geopolitischer Risikoanalyst für einen Trading-Copier.
Analysiere die Schlagzeilen und bewerte:
- Geopolitisches Risiko-Level (LOW/ELEVATED/HIGH/CRITICAL)
- Score 0-100
- Impact auf XAUUSD (Gold steigt bei Risiko)
- Impact auf US500 (Aktien fallen bei Risiko)
- Copier-Multiplikator (1.0=normal, 0.5=reduzieren, 0.0=stoppen)
Antworte NUR als JSON.`,
    messages: [{ role: 'user', content: `Headlines:\n${headlines.join('\n')}` }],
  });

  return JSON.parse(analysis.content[0].text);
}
```

### Geopolitik → Copier Mapping

```
LOW (Score 0-20):
→ Keine geopolitischen Spannungen dominant
→ Copier: 1.0 (kein Einfluss)
→ Normal: 90% der Zeit

ELEVATED (Score 20-45):
→ Spannungen vorhanden aber kontrolliert (z.B. laufender Konflikt ohne Eskalation)
→ Copier: 0.9 (leichte Vorsicht)
→ Gold-Bias: Leicht bullish
→ Beispiel: Ukraine-Krieg im Stellungskrieg, Iran-Verhandlungen

HIGH (Score 45-75):
→ Aktive Eskalation, Sanktionsankündigungen, Truppenbewegungen
→ Copier: 0.5 - 0.7 (deutliche Reduktion)
→ Gold: Stark bullish
→ US500: Bearish
→ Beispiel: Neue Front eröffnet, große Sanktionspakete, Taiwan-Krise

CRITICAL (Score 75-100):
→ Akuter militärischer Konflikt, Atomdrohungen, Markt-Panik
→ Copier: 0.0 - 0.2 (fast oder komplett pausiert)
→ Gold: Spike. ABER: Auch Spike = Slippage-Risiko!
→ US500: Crash. Gaps. Circuit Breaker möglich.
→ Beispiel: Direkter Angriff auf NATO-Land, Nukleartest, Finanzsystem-Kollaps
→ AKTION: ALLE Positionen schließen. Flat gehen. Warten.
```

### Automatische Geo-Events

```typescript
// Bestimmte Keywords triggern SOFORTIGE Copier-Reaktion
// ohne auf den 5-Minuten-Zyklus zu warten

const INSTANT_TRIGGERS = {
  COPIER_STOP: [
    'nuclear strike', 'nuclear attack', 'world war',
    'market crash', 'circuit breaker', 'exchange halted',
    'flash crash', 'black monday', 'lehman',
  ],
  COPIER_REDUCE_70: [
    'military strike', 'invasion', 'declaration of war',
    'emergency session', 'martial law',
    'bank run', 'sovereign default',
  ],
  COPIER_REDUCE_50: [
    'sanctions package', 'military escalation', 'troop deployment',
    'missile launch', 'airspace closed',
    'credit downgrade', 'currency crisis',
  ],
};

// Gold-Preis als Echtzeit-Geopolitik-Proxy
// Wenn Gold in 5 Minuten > 30 Pips springt OHNE News-Event → Geopolitik!
function detectGoldSpikeAnomaly(priceData: PriceCandle[]): boolean {
  const last5min = getLastNMinutes(priceData, 5);
  const move = Math.abs(last5min.close - last5min.open);
  const avgMove = getAvg5MinMove(priceData, 100); // Letzten 100 Candles
  return move > avgMove * 4; // 4× größer als normal
}
```

## Modul 3: Market Regime Detection

```typescript
interface MarketRegime {
  regime: 'RISK_ON' | 'RISK_OFF' | 'TRANSITIONING' | 'CRISIS';
  confidence: number;       // 0-100%
  duration: string;         // "seit 3 Tagen", "seit 2 Stunden"
  xauusdBias: 'LONG' | 'NEUTRAL' | 'SHORT';
  us500Bias: 'LONG' | 'NEUTRAL' | 'SHORT';
  copierBoost: number;      // Zusätzlicher Faktor basierend auf Regime
}

function detectRegime(data: MarketData): MarketRegime {
  const { vix, dxy20SMA, us10y, goldATR, spxATR, goldPrice, spxPrice } = data;

  // ══════════ CRISIS MODE ══════════
  // VIX > 35 ODER Gold Flash-Spike ODER US500 -3% intraday
  if (vix > 35 || data.spxDailyReturn < -3 || data.goldSpikeDetected) {
    return {
      regime: 'CRISIS',
      confidence: 90,
      duration: detectRegimeDuration(data, 'CRISIS'),
      xauusdBias: 'LONG',      // Gold = Safe Haven
      us500Bias: 'SHORT',       // Aktien crashen
      copierBoost: 0.2,         // MASSIV reduzieren. Slippage-Risiko extrem.
    };
  }

  // ══════════ RISK OFF ══════════
  // VIX 25-35, DXY steigt, Yields fallen, Gold steigt
  if (vix > 25 || (data.dxyTrend === 'BULLISH' && data.yieldTrend === 'FALLING')) {
    return {
      regime: 'RISK_OFF',
      confidence: 75,
      duration: detectRegimeDuration(data, 'RISK_OFF'),
      xauusdBias: 'LONG',
      us500Bias: 'SHORT',
      copierBoost: 0.6,         // Gold-Longs kopieren, US500 vorsichtig
    };
  }

  // ══════════ RISK ON ══════════
  // VIX < 18, DXY stabil/fallend, Aktien steigen
  if (vix < 18 && data.spxTrend === 'BULLISH') {
    return {
      regime: 'RISK_ON',
      confidence: 70,
      duration: detectRegimeDuration(data, 'RISK_ON'),
      xauusdBias: 'NEUTRAL',    // Gold geht seitwärts in Risk-On
      us500Bias: 'LONG',
      copierBoost: 1.1,          // Leichter Boost — Märkte ruhig
    };
  }

  // ══════════ TRANSITIONING ══════════
  return {
    regime: 'TRANSITIONING',
    confidence: 50,
    duration: detectRegimeDuration(data, 'TRANSITIONING'),
    xauusdBias: 'NEUTRAL',
    us500Bias: 'NEUTRAL',
    copierBoost: 0.8,            // Etwas vorsichtiger in Übergangsphasen
  };
}
```

## Modul 4: 24h Forecast Generator

```typescript
// Wird jeden Morgen um 07:00 CET generiert UND bei Material-Änderungen aktualisiert

async function generate24hForecast(intel: MarketIntelSignal): Promise<string> {
  const prompt = `
Du bist FORGE INTEL, der Market Intelligence Arm von Gold Foundry.
Erstelle eine 24h-Prognose für XAUUSD und US500.

AKTUELLE DATEN:
- VIX: ${intel.vixLevel}
- DXY Trend: ${intel.dxyTrend}
- Regime: ${intel.regime}
- Geopolitik: ${intel.geopoliticalRisk} (${intel.geopoliticalAlerts.join(', ')})
- XAUUSD ATR Ratio: ${intel.xauusd.atrRatio} (${intel.xauusd.volatilityForecast})
- US500 ATR Ratio: ${intel.us500.atrRatio}
- Heutige Events: ${intel.todayEvents.map(e => e.title + ' ' + e.time).join(', ')}
- Nächstes Event: ${intel.nextEvent?.title} in ${intel.nextEvent?.minutesUntil}min

FORMAT (kurz, direkt, keine Floskeln):
1. REGIME & BIAS (1 Satz)
2. XAUUSD Prognose (2 Sätze: Richtung + Key-Level)
3. US500 Prognose (2 Sätze)
4. RISIKEN heute (Events + Geopolitik)
5. COPIER-EMPFEHLUNG (1 Satz: wann Gas geben, wann bremsen)
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
}
```

**Beispiel-Output:**
```
FORGE INTEL — 14. März 2025 07:00 CET

REGIME: Risk-Off Transition. VIX bei 22.4, DXY bullish, Yields fallen.

XAUUSD: Bullish Bias. Gold hat $2,150 als Support bestätigt, nächstes 
Target $2,185. ATR erhöht (1.3× Avg) — erwarte 300+ Pip Range. 
London Open dürfte den Ton angeben.

US500: Bearish-Neutral. Pre-Market flat nach gestrigem -0.8%. 
Support bei 5,120, Resistance 5,180. Gap-Fill von gestern möglich. 
Last Hour wird entscheidend.

RISIKEN: Jobless Claims 14:30 CET (Tier 2). Drei Fed-Speakers 
heute (16:00, 17:30, 19:00). Ukraine: erhöhte Militäraktivität 
an Südfront — Gold-Spike-Risiko wenn Eskalation.

COPIER: Nacht-Boost bis 07:00 ✦ | Ab 14:15 runterfahren (Claims) | 
Fed-Speakers = jeweils 15min Reduktion. Geopolitik auf ELEVATED — 
Basis-Multiplikator -10%.
```

## Integration in FORGE COPY Risk Multiplier

Der bestehende Risk Multiplier bekommt einen **7. Faktor**: INTEL_FACTOR

```typescript
// VORHER: 6 Factors
Risk Multiplier = TIME × NEWS × DD × PERFORMANCE × VOLATILITY × WEEKDAY

// NACHHER: 7 Factors
Risk Multiplier = TIME × NEWS × DD × PERFORMANCE × VOLATILITY × WEEKDAY × INTEL

function getIntelFactor(signal: MarketIntelSignal): number {
  // Composite aus allen Intel-Modulen

  // 1. Geopolitik Override (höchste Priorität)
  if (signal.geopoliticalRisk === 'CRITICAL') return 0.0;
  if (signal.geopoliticalRisk === 'HIGH') return 0.4;
  if (signal.geopoliticalRisk === 'ELEVATED') return 0.85;

  // 2. Regime-basierter Boost/Reduction
  let factor = signal.regime === 'CRISIS' ? 0.1 :
               signal.regime === 'RISK_OFF' ? 0.7 :
               signal.regime === 'RISK_ON' ? 1.1 :
               0.9; // TRANSITIONING

  // 3. Danger Day Check (mehrere Events)
  if (signal.todayEvents.some(e => classifyEvent(e) === 'TIER_0')) {
    factor *= 0.5; // Ganzer Tag auf halber Kraft wegen Tier 0 Event
  }

  // 4. Spread-Anomalie Check
  if (!signal.xauusd.spreadNormal || !signal.us500.spreadNormal) {
    factor *= 0.6; // Weite Spreads = schlechte Execution
  }

  return Math.max(factor, 0);
}
```

## Cron Schedule — Wann läuft was

```
06:00 CET — Economic Calendar laden (Tages-Events)
06:30 CET — Geopolitik-Scan (Headlines der letzten 12h)
07:00 CET — 24h Forecast generieren → Dashboard + Copier
07:00 CET — Risk Level berechnen → Copier startet mit korrektem Level

Alle 5 Minuten:
  → Equity Snapshots aller Slave-Accounts
  → ATR + Spread Check (XAUUSD + US500)
  → Event-Window Check (sind wir in einem Event-Fenster?)
  → Geopolitik Quick-Check (nur Instant Triggers)
  → Risk Level Update → Copier Multiplier Update

Alle 60 Minuten:
  → Voller Geopolitik-Scan (Claude Headline-Analyse)
  → Regime-Detection Update (VIX, DXY, Yields)
  → Forecast Update (wenn Material-Änderung)

Instant (Event-basiert):
  → Gold Spike > 30 Pips in 5min → Sofort Geopolitik-Check
  → VIX > 30 → Sofort Regime-Update → Copier Reduktion
  → Master Trade Event → Sofort alle Factors berechnen
```

## Dashboard Widget — FORGE INTEL Live

```
┌─────────────────────────────────────────────────────────────┐
│ FORGE INTEL · LIVE                                  07:42 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ RISK LEVEL:  ██ YELLOW (Score: 38/100)                     │
│ Regime:      Risk-Off Transition | VIX 22.4                │
│ Geopolitik:  ELEVATED — Ukraine Südfront Aktivität          │
│                                                             │
│ XAUUSD:  ATR 342 Pips (1.3× Avg) · Spread 14 ✓ · BULLISH │
│ US500:   ATR 62 Pts (1.1× Avg) · Spread 0.6 ✓ · NEUTRAL  │
│                                                             │
│ HEUTE:                                                      │
│ ├ 14:30  Jobless Claims ⚡ Tier 2 → Copier 0.5 ab 14:15   │
│ ├ 16:00  Fed Waller Speech ⚡ → Copier 0.7 ab 15:50       │
│ ├ 17:30  Fed Barkin Speech ⚡ → Copier 0.7 ab 17:20       │
│ └ 19:00  Fed Bostic Speech ⚡ → Copier 0.7 ab 18:50       │
│                                                             │
│ COPIER AUTOPILOT:                                           │
│ Jetzt:    Nacht-Boost Phase ✦ Multiplier 1.2×              │
│ 07:00:    Transition → 0.6×                                │
│ 08:00:    London Open → 0.8×                               │
│ 14:15:    Claims Pause → 0.5×                              │
│ 22:00:    Nacht-Boost → 1.3×                               │
│                                                             │
│ FORECAST: Gold bullish, $2,150 Support hält. US500          │
│ neutral-bearish. 3 Fed-Speaker = Vorsicht am Nachmittag.   │
│ Geopolitik auf Watch — Nacht-Session bevorzugen.            │
└─────────────────────────────────────────────────────────────┘
```

## Supabase Tabellen

```sql
CREATE TABLE market_intel_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_level TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_multiplier_override DECIMAL NOT NULL,
  regime TEXT NOT NULL,
  vix_level DECIMAL,
  dxy_trend TEXT,
  geopolitical_risk TEXT NOT NULL,
  geopolitical_alerts TEXT[],
  xauusd_atr DECIMAL,
  xauusd_atr_ratio DECIMAL,
  xauusd_spread DECIMAL,
  xauusd_bias TEXT,
  us500_atr DECIMAL,
  us500_atr_ratio DECIMAL,
  us500_spread DECIMAL,
  us500_bias TEXT,
  forecast_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE economic_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_time TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  currency TEXT NOT NULL,
  impact TEXT NOT NULL CHECK (impact IN ('LOW','MEDIUM','HIGH')),
  tier INTEGER NOT NULL CHECK (tier BETWEEN 0 AND 3),
  forecast TEXT,
  previous TEXT,
  actual TEXT,                    -- Wird nach Release geupdated
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE geopolitical_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_level TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  triggers TEXT[] NOT NULL,
  headlines JSONB,
  ai_analysis TEXT,
  copier_action TEXT NOT NULL,   -- 'NONE', 'REDUCE', 'PAUSE'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_intel_signals ON market_intel_signals(created_at DESC);
CREATE INDEX idx_calendar_time ON economic_calendar(event_time);
CREATE INDEX idx_geo_log ON geopolitical_log(created_at DESC);
```
