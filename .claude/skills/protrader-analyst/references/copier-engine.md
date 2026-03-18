# FORGE COPY — AI Autopilot Trade Copier

Kein dummer Copier der 1:1 spiegelt. Ein **autonomes Risiko-Management-System** das in Echtzeit entscheidet: WIE VIEL kopieren, WANN pausieren, WANN Gas geben. Der Copier denkt voraus.

## Firm-Konfigurationen (LIVE — nur 2 Firmen)

### TEGAS FX — 24× Kapital | 5% Trailing DD

```
Kapital:          24× Einzahlung (z.B. $5k → $120k)
Drawdown:         5% TRAILING vom Equity-High-Watermark
Mechanik:         Jedes neue Equity-High verschiebt DD-Grenze nach oben
                  Grenze fällt NIEMALS zurück

MATHE:
→ Start $120k: DD-Grenze = $114,000
→ Equity steigt auf $125k: Neue Grenze = $118,750
→ IMMER nur 5% Luft. Ein 3% Drop = 60% des Buffers weg.

CHARAKTER:        Wie Nitroglycerin — extrem profitabel, aber jeder Fehler ist fatal.
```

### TAG MARKETS — 12× Kapital | 10% Fixed DD

```
Kapital:          12× Einzahlung (z.B. $5k → $60k)
Drawdown:         10% FIXED vom INITIALEN Balance
Mechanik:         DD-Grenze bleibt FÜR IMMER bei $54,000
                  Egal ob Equity auf $80k steigt — Grenze bleibt

MATHE:
→ Start $60k: DD-Grenze = $54,000 (fest)
→ Equity $70k: Buffer = $16,000 (22.9%) — WÄCHST mit Profit!
→ Equity $80k: Buffer = $26,000 (32.5%) — NOCH SICHERER

CHARAKTER:        Wie ein Diesel — langsam starten, dann immer stärker werden.
```

## AI AUTOPILOT — Das Gehirn

Der Copier hat ein zentrales Konzept: den **Risk Multiplier**. Das ist ein Wert zwischen 0.0 (pausiert) und 2.0 (maximale Aggression), der in Echtzeit berechnet wird und die kopierte Lot-Size bestimmt.

```
Kopierte Lots = Master Lots × Basis-Multiplikator × Risk Multiplier

Risk Multiplier = TIME_FACTOR × DD_FACTOR × PERFORMANCE_FACTOR × NEWS_FACTOR × VOLATILITY_FACTOR

Jeder Factor ist ein Wert zwischen 0.0 und 1.5.
Produkt aller Factors = finaler Risk Multiplier.
```

### FACTOR 1: TIME_FACTOR — Tageszeit-Steuerung

**Das ist der Kern eurer Strategie: Nachts läuft der Bot sicher, tagsüber ist es volatiler.**

```typescript
function getTimeFactor(hour: number, firm: FirmProfile): number {
  // hour = aktuelle Stunde in CET (0-23)

  // ══════════════════════════════════════════════
  // NACHT-MODUS (22:00 - 07:00 CET)
  // Bot tradet in ruhiger Asian-Session
  // Geringe Volatilität, enge Ranges, wenig News
  // → RISIKO ERHÖHEN — das ist die sichere Phase
  // ══════════════════════════════════════════════

  if (hour >= 22 || hour < 7) {
    // Tegas 24x: Nachts ist der sicherste Zeitraum
    // Mehr Lots erlaubt weil Volatilität niedrig
    if (firm === 'tegas_24x') return 1.3;  // +30% Lots nachts
    if (firm === 'tag_12x')   return 1.4;  // +40% Lots nachts (mehr Buffer)
  }

  // ══════════════════════════════════════════════
  // LONDON PRE-OPEN (07:00 - 08:00 CET)
  // Transition-Phase. Volatilität steigt.
  // Spreads noch weit, Liquidität baut sich auf.
  // → RISIKO SENKEN — Übergangsphase
  // ══════════════════════════════════════════════

  if (hour === 7) {
    return 0.6;  // -40% — vorsichtig in die London-Session starten
  }

  // ══════════════════════════════════════════════
  // LONDON OPEN (08:00 - 10:00 CET)
  // Höchste Edge-Wahrscheinlichkeit bei Gold
  // ABER auch höchste Intraday-Volatilität
  // → RISIKO MODERAT — guter Edge, aber Vorsicht
  // ══════════════════════════════════════════════

  if (hour >= 8 && hour < 10) {
    if (firm === 'tegas_24x') return 0.8;  // -20% wegen Trailing DD Risiko
    if (firm === 'tag_12x')   return 1.0;  // Normal — Fixed DD verzeiht mehr
  }

  // ══════════════════════════════════════════════
  // LONDON BODY (10:00 - 14:00 CET)
  // Moderate Volatilität, Trends laufen
  // → RISIKO NORMAL
  // ══════════════════════════════════════════════

  if (hour >= 10 && hour < 14) {
    return 0.9;  // Leicht unter Normal — Mid-Session
  }

  // ══════════════════════════════════════════════
  // NY OPEN / US DATEN (14:00 - 16:00 CET)
  // HÖCHSTE GEFAHR. NFP, CPI, Jobless Claims
  // Spreads explodieren, Slippage maximal
  // → RISIKO STARK SENKEN
  // ══════════════════════════════════════════════

  if (hour >= 14 && hour < 16) {
    if (firm === 'tegas_24x') return 0.4;  // -60%! Trailing DD = kein Spielraum
    if (firm === 'tag_12x')   return 0.6;  // -40%
  }

  // ══════════════════════════════════════════════
  // NY BODY (16:00 - 20:00 CET)
  // Moderate Volatilität, Trends können laufen
  // → RISIKO MODERAT
  // ══════════════════════════════════════════════

  if (hour >= 16 && hour < 20) {
    return 0.8;
  }

  // ══════════════════════════════════════════════
  // PRE-NIGHT (20:00 - 22:00 CET)
  // Liquidität dünnt aus, Spreads weiten sich
  // → RISIKO SENKEN — Übergang zur Nacht
  // ══════════════════════════════════════════════

  if (hour >= 20 && hour < 22) {
    return 0.7;
  }

  return 1.0; // Fallback
}
```

**Visualisiert als 24h Risiko-Profil:**
```
CET:  00  01  02  03  04  05  06  07  08  09  10  11  12  13  14  15  16  17  18  19  20  21  22  23
      ───────────────────────────────────────────────────────────────────────────────────────────────
TEGAS █▓  █▓  █▓  █▓  █▓  █▓  █▓  ▒░  ▓▒  ▓▒  ▓░  ▓░  ▓░  ▓░  ░   ░   ▓░  ▓░  ▓░  ▓░  ▒░  ▒░  █▓  █▓
 24x  1.3 1.3 1.3 1.3 1.3 1.3 1.3 0.6 0.8 0.8 0.9 0.9 0.9 0.9 0.4 0.4 0.8 0.8 0.8 0.8 0.7 0.7 1.3 1.3

TAG   ██  ██  ██  ██  ██  ██  ██  ▒░  █░  █░  ▓░  ▓░  ▓░  ▓░  ▒░  ▒░  ▓░  ▓░  ▓░  ▓░  ▒░  ▒░  ██  ██
 12x  1.4 1.4 1.4 1.4 1.4 1.4 1.4 0.6 1.0 1.0 0.9 0.9 0.9 0.9 0.6 0.6 0.8 0.8 0.8 0.8 0.7 0.7 1.4 1.4

      ◄──── NACHT: BOOST ────►   │  London  │  Body   │  NY DANGER │  NY Body  │ Wind │◄─ NACHT ──►
                                  │   Open   │         │    Zone    │           │ Down │
```

### FACTOR 2: NEWS_FACTOR — Automatische News-Pause

```typescript
// Integriert mit einem Wirtschaftskalender (z.B. Forex Factory API / MQL5 Calendar)

interface NewsEvent {
  time: Date;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';    // Forex Factory Classification
  currency: string;                       // 'USD', 'EUR', etc.
  title: string;                          // 'Non-Farm Payrolls', 'CPI', etc.
}

function getNewsFactor(events: NewsEvent[], now: Date, firm: FirmProfile): number {

  for (const event of events) {
    const minutesUntil = (event.time.getTime() - now.getTime()) / 60000;
    const minutesSince = -minutesUntil; // positiv = Event ist vorbei

    // ════════════════════════════════════
    // TIER 1: FOMC, NFP, CPI
    // KOMPLETTE PAUSE
    // ════════════════════════════════════

    if (isTier1Event(event.title)) {
      // 45min VOR bis 30min NACH: KOMPLETTE PAUSE (0.0)
      if (minutesUntil <= 45 && minutesSince <= 30) {
        return 0.0; // ← KEIN Trade. NUULL. NADA.
      }
      // 60-45min vorher: Stark reduziert
      if (minutesUntil <= 60 && minutesUntil > 45) {
        return 0.2;
      }
      // 30-60min nachher: Langsam wieder hochfahren
      if (minutesSince > 30 && minutesSince <= 60) {
        return 0.5;
      }
    }

    // ════════════════════════════════════
    // TIER 2: PPI, ISM, Retail Sales, 
    //         Jobless Claims, Fed Speeches
    // STARKE REDUKTION
    // ════════════════════════════════════

    if (event.impact === 'HIGH' && !isTier1Event(event.title)) {
      if (minutesUntil <= 15 && minutesSince <= 15) {
        if (firm === 'tegas_24x') return 0.0;  // Tegas: Pause auch bei Tier 2
        if (firm === 'tag_12x')   return 0.3;  // Tag: Stark reduziert
      }
      if (minutesUntil <= 30 && minutesUntil > 15) {
        return 0.5;
      }
    }

    // ════════════════════════════════════
    // TIER 3: Medium Impact
    // LEICHTE REDUKTION
    // ════════════════════════════════════

    if (event.impact === 'MEDIUM') {
      if (minutesUntil <= 5 && minutesSince <= 10) {
        return 0.7;  // Nur leichte Reduktion
      }
    }

    // LOW Impact: Ignorieren (Factor = 1.0)
  }

  return 1.0; // Kein Event → volle Fahrt
}

function isTier1Event(title: string): boolean {
  const tier1 = [
    'Non-Farm', 'NFP', 'FOMC', 'Fed Rate', 'Interest Rate Decision',
    'CPI', 'Consumer Price Index', 'Core CPI',
    'ECB Rate', 'BOE Rate', 'BOJ Rate',
  ];
  return tier1.some(t => title.toLowerCase().includes(t.toLowerCase()));
}
```

**News-Pause Visualisiert (Beispiel NFP-Tag):**
```
13:00  13:30  14:00  14:15  14:30  14:45  15:00  15:30
  │      │      │      │    NFP↓    │      │      │
  █      █      ▒      ░    ▬▬▬    ░      ▒      █
 1.0    1.0    0.5    0.2   0.0    0.0    0.5    1.0
                             ↑
                    KOMPLETT PAUSIERT
                    Kein einziger Trade
```

### FACTOR 3: DD_FACTOR — Drawdown-Abhängige Skalierung

```typescript
function getDDFactor(account: SlaveAccount): number {
  const buffer = calculateDDBuffer(account);

  // ══════════ TEGAS 24x (5% Trailing) ══════════
  // EXTREM konservativ — jedes Prozent DD zählt
  if (account.firmProfile === 'tegas_24x') {
    if (buffer > 80) return 1.2;    // Viel Luft → leicht aggressiver
    if (buffer > 60) return 1.0;    // Normal
    if (buffer > 40) return 0.6;    // Vorsicht
    if (buffer > 20) return 0.3;    // Alarm — Micro-Lots
    if (buffer > 10) return 0.1;    // Notfall — Kleinstmöglich
    return 0.0;                      // STOP. Buffer < 10% = Copier AUS.
  }

  // ══════════ TAG 12x (10% Fixed) ══════════
  // Phasen-System — wird mit Profit aggressiver
  if (account.firmProfile === 'tag_12x') {
    const profitPct = ((account.currentEquity - account.initialBalance) / account.initialBalance) * 100;

    // Phase 1: Aufbau (Profit < 3%)
    if (profitPct < 3) {
      if (buffer > 70) return 0.8;
      if (buffer > 50) return 0.5;
      if (buffer > 30) return 0.3;
      return 0.0;
    }
    // Phase 2: Stabilisierung (Profit 3-8%)
    if (profitPct < 8) {
      if (buffer > 60) return 1.0;
      if (buffer > 40) return 0.7;
      if (buffer > 20) return 0.4;
      return 0.0;
    }
    // Phase 3: Komfort (Profit 8-15%)
    if (profitPct < 15) {
      if (buffer > 50) return 1.2;
      if (buffer > 30) return 0.8;
      if (buffer > 15) return 0.5;
      return 0.0;
    }
    // Phase 4: Acceleration (Profit > 15%)
    if (buffer > 40) return 1.5;   // MAXIMUM — Buffer ist groß
    if (buffer > 25) return 1.0;
    if (buffer > 15) return 0.6;
    return 0.0;
  }

  return 1.0;
}
```

### FACTOR 4: PERFORMANCE_FACTOR — Lernt aus letzten Trades

```typescript
function getPerformanceFactor(recentTrades: Trade[], firm: FirmProfile): number {
  if (recentTrades.length < 5) return 0.8; // Zu wenig Daten → konservativ

  const last20 = recentTrades.slice(-20);
  const last5 = recentTrades.slice(-5);

  const wr20 = last20.filter(t => t.profit > 0).length / last20.length;
  const wr5 = last5.filter(t => t.profit > 0).length / last5.length;
  const pf = calculatePF(last20);

  // ══════════ WINNING STREAK DETECTION ══════════
  // Bot läuft heiß → LEICHT mehr Gas geben
  let consecutiveWins = 0;
  for (let i = recentTrades.length - 1; i >= 0; i--) {
    if (recentTrades[i].profit > 0) consecutiveWins++;
    else break;
  }
  const streakBonus = Math.min(consecutiveWins * 0.05, 0.2); // Max +20%

  // ══════════ LOSING STREAK DETECTION ══════════
  // Bot patzt → SOFORT runterschalten
  let consecutiveLosses = 0;
  for (let i = recentTrades.length - 1; i >= 0; i--) {
    if (recentTrades[i].profit <= 0) consecutiveLosses++;
    else break;
  }

  // HARD STOPS bei Losing Streaks:
  if (consecutiveLosses >= 4) return 0.0; // 4 Verluste in Folge → PAUSE
  if (consecutiveLosses >= 3) return 0.2; // 3 Verluste → Micro-Lots
  if (consecutiveLosses >= 2) return 0.5; // 2 Verluste → Halbierung

  // ══════════ PERFORMANCE DEGRADATION ══════════
  if (wr20 < 0.40) return 0.3;            // WR unter 40% über 20 Trades → Alarm
  if (wr20 < 0.50) return 0.6;            // WR unter 50% → deutlich reduzieren
  if (pf < 0.8) return 0.4;               // Profit Factor unter 0.8 → Bot verliert Geld

  // ══════════ NORMAL OPERATION ══════════
  if (wr20 >= 0.65 && pf >= 1.5) return 1.0 + streakBonus;  // Stark → Gas
  if (wr20 >= 0.55 && pf >= 1.2) return 0.9 + streakBonus;  // OK → Normal+
  return 0.8;                                                  // Unterdurchschnittlich → vorsichtig
}
```

### FACTOR 5: VOLATILITY_FACTOR — ATR-basierte Anpassung

```typescript
function getVolatilityFactor(instrument: string, currentATR: number, avgATR20: number): number {
  const ratio = currentATR / avgATR20;

  // ══════════ GOLD (XAUUSD) ══════════
  if (instrument === 'XAUUSD') {
    if (ratio < 0.6)  return 1.2;   // Extrem ruhig → mehr Lots (engere Ranges)
    if (ratio < 0.8)  return 1.1;   // Unterdurchschnittlich ruhig → leicht mehr
    if (ratio < 1.2)  return 1.0;   // Normal
    if (ratio < 1.5)  return 0.7;   // Erhöht → reduzieren
    if (ratio < 2.0)  return 0.4;   // Hoch → stark reduzieren (FOMC-Tag?)
    return 0.0;                      // Extrem → SKIP (Flash Crash Risiko)
  }

  // ══════════ US500 ══════════
  if (instrument === 'US500') {
    if (ratio < 0.6)  return 1.1;
    if (ratio < 0.8)  return 1.0;
    if (ratio < 1.3)  return 0.9;   // Index ist generell volatiler
    if (ratio < 1.8)  return 0.5;
    if (ratio < 2.5)  return 0.2;
    return 0.0;                      // VIX spike → kein Kopieren
  }

  return 1.0;
}
```

### FACTOR 6: WEEKDAY_FACTOR — Wochentags-Anpassung

```typescript
function getWeekdayFactor(day: number, hour: number): number {
  // 0=Sonntag, 1=Montag, ..., 5=Freitag

  if (day === 1) return 0.7;                          // Montag: vorsichtig
  if (day >= 2 && day <= 4) return 1.0;                // Di-Do: volle Kraft
  if (day === 5) {
    if (hour < 14) return 0.9;
    if (hour < 18) return 0.7;
    if (hour < 20) return 0.3;
    return 0.0;                                        // Fr nach 20:00: AUS
  }
  if (day === 0 && hour >= 23) return 0.3;             // So Opening: Micro
  return 0.0;
}
```

### FACTOR 7: INTEL_FACTOR — Market Intelligence (Geopolitik + Regime + Forecast)

Datenquelle: `references/market-intel.md` → FORGE INTEL Engine

```typescript
function getIntelFactor(signal: MarketIntelSignal): number {
  // Geopolitik hat HÖCHSTE Priorität — kann alles überschreiben
  if (signal.geopoliticalRisk === 'CRITICAL') return 0.0; // SOFORT STOPP
  if (signal.geopoliticalRisk === 'HIGH') return 0.4;
  if (signal.geopoliticalRisk === 'ELEVATED') return 0.85;

  // Regime-Faktor
  let factor = signal.regime === 'CRISIS' ? 0.1 :
               signal.regime === 'RISK_OFF' ? 0.7 :
               signal.regime === 'RISK_ON' ? 1.1 :
               0.9;

  // Danger Day (FOMC, NFP etc. heute)
  if (signal.todayEvents.some(e => e.tier === 0)) factor *= 0.5;

  // Spread-Anomalie
  if (!signal.xauusd.spreadNormal || !signal.us500.spreadNormal) factor *= 0.6;

  return Math.max(factor, 0);
}
```

## Finale Risk Multiplier Berechnung

```typescript
interface RiskAssessment {
  timeFactor: number;
  newsFactor: number;
  ddFactor: number;
  performanceFactor: number;
  volatilityFactor: number;
  weekdayFactor: number;
  finalMultiplier: number;
  action: 'COPY' | 'SKIP' | 'REDUCE';
  reasons: string[];
}

function calculateRiskMultiplier(
  account: SlaveAccount,
  instrument: string,
  newsEvents: NewsEvent[],
  recentTrades: Trade[],
  currentATR: number,
  avgATR20: number,
  now: Date
): RiskAssessment {

  const hour = now.getHours(); // CET
  const day = now.getDay();

  const timeFactor = getTimeFactor(hour, account.firmProfile);
  const newsFactor = getNewsFactor(newsEvents, now, account.firmProfile);
  const ddFactor = getDDFactor(account);
  const performanceFactor = getPerformanceFactor(recentTrades, account.firmProfile);
  const volatilityFactor = getVolatilityFactor(instrument, currentATR, avgATR20);
  const weekdayFactor = getWeekdayFactor(day, hour);
  const intelFactor = getIntelFactor(marketIntel); // ← NEU: Geopolitik + Regime

  // Alle 7 Factors multiplizieren
  let final = timeFactor * newsFactor * ddFactor * performanceFactor * volatilityFactor * weekdayFactor * intelFactor;

  // HARD LIMITS
  const maxMultiplier = account.firmProfile === 'tegas_24x' ? 1.3 : 1.8;
  final = Math.min(final, maxMultiplier);
  final = Math.max(final, 0);
  final = Math.round(final * 100) / 100; // 2 Dezimalstellen

  // Reasons sammeln
  const reasons: string[] = [];
  if (timeFactor > 1.0) reasons.push(`Nacht-Boost: ×${timeFactor}`);
  if (timeFactor < 0.8) reasons.push(`Session-Reduktion: ×${timeFactor}`);
  if (newsFactor < 1.0) reasons.push(`News-Filter: ×${newsFactor}`);
  if (newsFactor === 0) reasons.push('NEWS-PAUSE: Komplett gestoppt');
  if (ddFactor < 0.5) reasons.push(`DD-Warnung: Buffer niedrig, ×${ddFactor}`);
  if (ddFactor === 0) reasons.push('DD-EMERGENCY: Copier gestoppt');
  if (performanceFactor < 0.5) reasons.push(`Performance-Alarm: ×${performanceFactor}`);
  if (volatilityFactor < 0.5) reasons.push(`Hohe Volatilität: ×${volatilityFactor}`);
  if (weekdayFactor < 0.8) reasons.push(`Wochentags-Reduktion: ×${weekdayFactor}`);
  if (intelFactor < 0.5) reasons.push(`INTEL-WARNUNG: Geopolitik/Regime, ×${intelFactor}`);
  if (intelFactor === 0) reasons.push('GEOPOLITIK CRITICAL: Copier sofort gestoppt');

  const action = final === 0 ? 'SKIP' : final < 0.5 ? 'REDUCE' : 'COPY';

  return {
    timeFactor, newsFactor, ddFactor, performanceFactor,
    volatilityFactor, weekdayFactor, intelFactor, finalMultiplier: final,
    action, reasons,
  };
}
```

**Beispiel-Szenarien:**

```
SZENARIO 1: Dienstag 03:00, kein Event, Buffer 70%, Winning Streak, Geopolitik LOW
→ Time:1.3 × News:1.0 × DD:1.0 × Perf:1.15 × Vol:1.0 × Day:1.0 × Intel:1.1
→ Final: 1.65 (gecapped 1.3 bei Tegas) → VOLLE FAHRT + NACHT-BOOST + RISK-ON

SZENARIO 2: Freitag 14:25, NFP in 5min, Buffer 45%, Geopolitik ELEVATED
→ Time:0.4 × News:0.0 × DD:0.6 × Perf:1.0 × Vol:1.0 × Day:0.7 × Intel:0.85
→ Final: 0.0 → KOMPLETT PAUSIERT (News = 0, alles andere irrelevant)

SZENARIO 3: Mittwoch 08:30, 3 Verluste in Folge, Ukraine-Eskalation (HIGH)
→ Time:0.8 × News:1.0 × DD:1.0 × Perf:0.2 × Vol:1.0 × Day:1.0 × Intel:0.4
→ Final: 0.064 → SKIP (Losing Streak + Geopolitik = doppelter Stop)

SZENARIO 4: Donnerstag 02:00, Tag Markets Phase 4, Buffer 35%, alles ruhig
→ Time:1.4 × News:1.0 × DD:1.5 × Perf:1.0 × Vol:1.1 × Day:1.0 × Intel:1.1
→ Final: 2.54 (gecapped 1.8) → MAXIMALE AGGRESSION (Nacht + Phase 4 + Risk-On)

SZENARIO 5: Montag 09:00, Geopolitik CRITICAL (Nuklear-Drohung), VIX 42
→ Time:0.8 × News:1.0 × DD:1.0 × Perf:1.0 × Vol:0.2 × Day:0.7 × Intel:0.0
→ Final: 0.0 → SOFORT STOPP. Alle Positionen schließen. Copier AUS.
```

## Lot-Berechnung nach Risk Multiplier

```typescript
function calculateCopyLots(
  masterLots: number,
  stopPips: number,
  account: SlaveAccount,
  riskAssessment: RiskAssessment,
  instrument: string
): number {

  if (riskAssessment.action === 'SKIP') return 0;

  const pipValue = instrument === 'XAUUSD' ? 10 : getUS500PipValue(account);

  // Basis: Risk-Budget pro Trade
  const maxRiskPct = account.firmProfile === 'tegas_24x' ? 0.003 : 0.005; // 0.3% / 0.5%
  const riskBudget = account.currentEquity * maxRiskPct;

  // Adjustiert durch AI Multiplier
  const adjustedBudget = riskBudget * riskAssessment.finalMultiplier;

  // Lots berechnen
  let lots = adjustedBudget / (stopPips * pipValue);

  // SAFETY CAPS
  const maxLots = account.firmProfile === 'tegas_24x' ? 5.0 : 10.0;
  lots = Math.min(lots, maxLots);
  lots = Math.min(lots, masterLots * 3); // Nie mehr als 3× Master
  lots = Math.floor(lots * 100) / 100;   // Auf 0.01 abrunden (nie aufrunden!)

  return Math.max(lots, 0);
}
```

## MetaApi Infrastruktur

### Master Listener (Streaming)

```typescript
class MasterTradeListener {
  async onDealAdded(deal) {
    if (deal.entryType === 'DEAL_ENTRY_IN') {
      // Neue Position → an alle Slaves kopieren
      await forgeCopyEngine.processNewTrade({
        instrument: deal.symbol,
        direction: deal.type,
        lots: deal.volume,
        stopLoss: deal.stopLoss,
        takeProfit: deal.takeProfit,
        magic: deal.magic,
        positionId: deal.positionId,
      });
    }
    if (deal.entryType === 'DEAL_ENTRY_OUT') {
      // Position geschlossen → Slaves schließen
      await forgeCopyEngine.processCloseTrade({ positionId: deal.positionId });
    }
  }
  async onOrderUpdated(order) {
    // SL/TP Änderung → auf Slaves synchronisieren
    if (order.stopLoss || order.takeProfit) {
      await forgeCopyEngine.processSLTPUpdate({
        positionId: order.positionId,
        stopLoss: order.stopLoss,
        takeProfit: order.takeProfit,
      });
    }
  }
}
```

### Slave Executor

```typescript
async function executeCopyTrade(slaveAccountId: string, trade: Signal, lots: number): Promise<CopyResult> {
  const connection = await getSlaveConnection(slaveAccountId);
  const info = await connection.getAccountInformation();

  // Final Safety
  if (lots <= 0) return { status: 'SKIPPED', reason: 'LOTS_ZERO' };
  if (info.freeMargin < lots * getRequiredMargin(trade.instrument)) {
    return { status: 'SKIPPED', reason: 'INSUFFICIENT_MARGIN' };
  }

  const method = trade.direction === 'DEAL_TYPE_BUY' ? 'createMarketBuyOrder' : 'createMarketSellOrder';
  const result = await connection[method](
    trade.instrument, lots, trade.stopLoss, trade.takeProfit,
    { comment: `FC-${trade.positionId}`, magic: trade.magic + 100000 }
  );

  return { status: 'COPIED', orderId: result.orderId, lots };
}
```

### User Onboarding

```typescript
// POST /api/copier/connect
export async function POST(request: Request) {
  const { userId, firmProfile, brokerServer, mtLogin, mtPassword, platform } = await request.json();

  const account = await api.metatraderAccountApi.createAccount({
    name: `GF-${firmProfile}-${mtLogin}`,
    type: 'cloud', login: mtLogin, password: mtPassword,
    server: brokerServer, platform, application: 'MetaApi',
  });
  await account.deploy();
  await account.waitConnected();

  const connection = account.getRPCConnection();
  await connection.connect();
  await connection.waitSynchronized();
  const info = await connection.getAccountInformation();

  await supabase.from('slave_accounts').insert({
    user_id: userId, metaapi_account_id: account.id,
    firm_profile: firmProfile, // 'tegas_24x' oder 'tag_12x'
    broker_server: brokerServer, mt_login: mtLogin, platform,
    initial_balance: info.balance, current_equity: info.equity,
    dd_limit: firmProfile === 'tegas_24x'
      ? info.equity * 0.95  // Trailing: 5% vom aktuellen Equity
      : info.balance * 0.90, // Fixed: 10% vom Initial
    dd_type: firmProfile === 'tegas_24x' ? 'trailing' : 'fixed',
    equity_high: info.equity,
    phase: firmProfile === 'tag_12x' ? 1 : null,
    copier_active: true,
  });

  return Response.json({ success: true, balance: info.balance, server: info.server });
}
```

## Supabase Schema

```sql
CREATE TABLE slave_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  metaapi_account_id TEXT NOT NULL UNIQUE,
  firm_profile TEXT NOT NULL CHECK (firm_profile IN ('tegas_24x','tag_12x')),
  broker_server TEXT NOT NULL,
  mt_login TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('mt4','mt5')),
  initial_balance DECIMAL NOT NULL,
  current_equity DECIMAL NOT NULL,
  equity_high DECIMAL NOT NULL,
  dd_limit DECIMAL NOT NULL,
  dd_type TEXT NOT NULL CHECK (dd_type IN ('trailing','fixed')),
  phase INTEGER DEFAULT 1,
  copier_active BOOLEAN DEFAULT true,
  copier_paused_reason TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE copier_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_position_id TEXT NOT NULL,
  slave_account_id UUID REFERENCES slave_accounts(id),
  firm_profile TEXT NOT NULL,
  instrument TEXT NOT NULL,
  direction TEXT NOT NULL,
  master_lots DECIMAL NOT NULL,
  calculated_lots DECIMAL,
  action TEXT NOT NULL CHECK (action IN ('COPIED','SKIPPED','REDUCED','CLOSED','FAILED')),
  skip_reason TEXT,
  risk_assessment JSONB NOT NULL,
  dd_buffer_pct DECIMAL NOT NULL,
  execution_time_ms INTEGER,
  pnl_result DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE equity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slave_account_id UUID REFERENCES slave_accounts(id),
  equity DECIMAL NOT NULL,
  balance DECIMAL NOT NULL,
  floating_pnl DECIMAL NOT NULL,
  equity_high DECIMAL NOT NULL,
  dd_buffer_pct DECIMAL NOT NULL,
  risk_multiplier DECIMAL NOT NULL,  -- Aktueller AI Multiplier
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Dashboard Widget — Copier Status

```
┌─────────────────────────────────────────────────────────────┐
│ FORGE COPY · AI AUTOPILOT                           ● LIVE │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ INTEL: ██ YELLOW (38/100) · Risk-Off · Geopolitik ELEVATED │
│ VIX 22.4 · DXY Bullish · Ukraine Watch                     │
│                                                             │
│ TEGAS 24x "Aggro"                                          │
│ Equity: $122,400 | Buffer: 4.1% 🔴 DD-EMERGENCY           │
│ AI: 0.00× → PAUSIERT (Buffer<10% + Geopolitik ELEVATED)   │
│ 7 Factors: T:0.8 N:1.0 D:0.0 P:0.9 V:1.0 W:1.0 I:0.85   │
│ Heute: 3 Kopiert / 2 Geskippt | P&L: -$480                │
│                                                             │
│ TAG 12x "Fixed" · Phase 3                                  │
│ Equity: $68,200 | Buffer: 20.9% ⚡ CAUTION                 │
│ AI: 1.04× → AKTIV (Nacht-Boost × Risk-Off Reduktion)      │
│ 7 Factors: T:1.4 N:1.0 D:1.0 P:0.9 V:0.9 W:1.0 I:0.85   │
│ Heute: 5 Kopiert / 0 Geskippt | P&L: +$920                │
│                                                             │
│ TIMELINE:                                                   │
│ ├ JETZT    Nacht-Boost ✦ Intel: ELEVATED (-15%)            │
│ ├ 07:00    Transition → 0.6×                               │
│ ├ 14:15    Claims → AUTO-PAUSE 15min                       │
│ ├ 16:00    Fed Waller → Reduktion 10min                    │
│ └ 22:00    Nacht-Boost → 1.3× (wenn Intel stabil)         │
│                                                             │
│ FORECAST: Gold bullish $2,150 Support. US500 neutral.      │
│ 3 Fed-Speaker heute. Geopolitik auf Watch.                  │
└─────────────────────────────────────────────────────────────┘
```
