# GOLD FOUNDRY — PROJEKTPLAN: 5 NEUE FEATURES + 8 EXTRA TOOLS
## Vom All-in-One Trading Tool zum ULTIMATIVEN Trading-Ökosystem

---

## 💰 TOOLS WOFÜR TRADER AKTUELL EXTRA ZAHLEN

Trader zahlen aktuell für jedes Tool einzeln. Wir packen ALLES rein:

| Tool | Markt-Preis | Was es tut | Bei uns |
|------|------------|------------|---------|
| TradeZella | $19-69/Mo | Trade Journal + Analytics | ✅ GRATIS inkl. |
| Edgewonk | $69-179/Mo | Psychologie-basiertes Journal | ✅ GRATIS inkl. |
| TradersConnect | $20-50/Mo | Trade Copier | ✅ Kern-Produkt |
| Social Trader Tools | $20-50/Mo | Trade Copier + Signals | ✅ Kern-Produkt |
| Prop Firm App | $15-30/Mo | Challenge Tracker | ✅ GRATIS inkl. |
| ForexFactory Pro | $30/Mo | Economic Calendar + Alerts | ✅ GRATIS inkl. |
| TradingView Screener | $15-60/Mo | Market Scanner | ✅ Basis inkl. |
| Myfxbook AutoTrade | Kostenlos | Signal Copy (langsam) | ✅ Schneller + besser |
| Trade Ideas | $84-228/Mo | AI Market Scanner | ✅ Basis inkl. |
| VPS (QuantVPS etc.) | $25-50/Mo | Server für Copier | ✅ NICHT NÖTIG (Cloud) |

**Was Trader aktuell zahlen: $300-700/Mo für alle Tools zusammen.**
**Gold Foundry: €29-149/Mo. ALLES drin.**

Das ist der Pitch: "Hör auf $500/Mo für 8 verschiedene Tools zu zahlen.
Gold Foundry hat alles in einem. Ab €29."

---

## 📋 PROJEKTPLAN: 5 NEUE KILLER-FEATURES

### FEATURE 1: PROP FIRM CHALLENGE TRACKER
**Priorität:** KRITISCH — DAS Verkaufs-Argument
**Aufwand:** 3-4h

#### Was es tut:
Zeigt in Echtzeit den Fortschritt einer Prop-Firm Challenge.
Verbunden mit Risk Engine (passt Lots an), Kill Switch (schützt automatisch),
und Intelligence Engine (gibt Empfehlungen).

#### Backend (src/lib/challenge-tracker/tracker.ts):
```
Funktionen:
- getChallengeProgress(accountId) → Progress Objekt
- calculateDailyBudget(progress) → "Du darfst heute max $340 riskieren"
- getDaysRemaining(progress) → Countdown
- getRecommendation(progress, intelligence) → AI-Empfehlung
- checkRules(progress) → Welche Rules fast verletzt?
```

#### Datenbank:
```sql
CREATE TABLE IF NOT EXISTS challenge_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id),
  prop_firm TEXT NOT NULL,           -- 'tag_markets', 'tegas_fx', etc.
  challenge_type TEXT NOT NULL,      -- 'phase1', 'phase2', 'funded'
  profit_target DECIMAL,            -- z.B. 10.0 (%)
  max_dd DECIMAL,                   -- z.B. 10.0 (%)
  daily_loss_limit DECIMAL,         -- z.B. 5.0 (%)
  time_limit_days INTEGER,          -- z.B. 30
  max_trades_per_day INTEGER,       -- z.B. 4
  start_date TIMESTAMPTZ,
  start_balance DECIMAL,
  status TEXT DEFAULT 'active',     -- active, passed, failed
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Frontend (src/app/dashboard/challenge/page.tsx):
- Progress Bar (% zum Profit Target)
- DD-Budget Anzeige (mit Farbe: grün/gelb/rot)
- Tage-Countdown
- Trades-Budget heute
- Daily P&L vs Limit
- AI-Empfehlung (1 Satz)
- Risk Engine Status (aktiv/pausiert/reduziert)

#### Verbindungen:
- Risk Engine: Liest Challenge Config → passt Lots an
- Kill Switch: Challenge-spezifische DD-Limits
- Trade Manager: "Du hast heute noch 2 Trades Budget"
- Intelligence: "Basierend auf 4.200 Challenges: Trader mit deinem
  Fortschritt bestehen zu 78% wenn sie konservativ bleiben."
- Master Cron: Tägliches Update (Equity Snapshot prüft Challenge-Status)
- Email: Alert wenn Challenge bestanden/gefailed
- Leaderboard: Challenge-Wins werden gerankt

#### Claude Code Prompt:
```
Erstelle das Prop Firm Challenge Tracker Feature:
1. Erstelle src/lib/challenge-tracker/tracker.ts mit den Funktionen
   getChallengeProgress, calculateDailyBudget, getDaysRemaining, getRecommendation
2. Erstelle die challenge_configs Tabelle in supabase/migrations/006_challenge_tracker.sql
3. Erstelle src/app/dashboard/challenge/page.tsx als Dashboard Widget
4. Verbinde mit Risk Engine: Lies Challenge Config in der Lot-Berechnung
5. Verbinde mit Kill Switch: Challenge-DD-Limits nutzen
6. Teste mit npm run build
```

---

### FEATURE 2: AUTO TRADE JOURNAL
**Priorität:** HOCH — Ersetzt $19-179/Mo Tools
**Aufwand:** 2-3h

#### Was es tut:
Jeder Trade wird automatisch dokumentiert. AI schreibt Kommentar.
Pattern-Erkennung über Zeit. PDF/CSV Export.

#### Backend (src/lib/journal/auto-journal.ts):
```
Funktionen:
- onTradeClose(trade) → Generiert Journal-Eintrag mit AI-Kommentar
- getDailyJournal(userId, date) → Alle Trades + Summary
- getWeeklyPatterns(userId) → "Du verlierst 70% in Asian Session"
- exportPDF(userId, dateRange) → PDF Download
- exportCSV(userId, dateRange) → CSV Download
```

#### Wie es funktioniert:
```
Trade wird geschlossen (MetaApi Webhook/Polling)
→ Trigger: onTradeClose()
→ Lade Trade-Details: Symbol, Direction, Entry, Exit, P&L, Duration, Session
→ Lade Intelligence: Was war der Markt-Kontext?
→ AI Kommentar (Haiku, ~50 Tokens):
   "Sauberer London-Breakout. Entry am Order Block. SL war eng 
    aber hat gehalten. TP2 bei 2.1R geschlossen."
→ Speichere in journal_entries Tabelle
→ Am Ende des Tages: Daily Summary automatisch
```

#### Datenbank:
```sql
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  trade_id UUID REFERENCES trades(id),
  symbol TEXT,
  direction TEXT,
  entry_price DECIMAL,
  exit_price DECIMAL,
  pnl DECIMAL,
  r_multiple DECIMAL,
  duration_minutes INTEGER,
  session TEXT,                      -- 'asian', 'london', 'newyork'
  ai_comment TEXT,
  tags TEXT[],                       -- ['breakout', 'trend', 'reversal']
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Frontend:
- src/app/dashboard/journal/page.tsx — Tages-/Wochen-Ansicht
- Jeder Trade mit AI-Kommentar
- Tags: Breakout, Trend, Counter-Trend, News, Scalp
- Statistiken: Win Rate pro Tag/Session/Tag-der-Woche
- Pattern Alerts: "Du verlierst 73% deiner Freitag-Trades"
- Export Buttons: PDF, CSV

#### Claude Code Prompt:
```
Erstelle das Auto Trade Journal Feature:
1. src/lib/journal/auto-journal.ts mit onTradeClose, getDailyJournal, getWeeklyPatterns
2. supabase/migrations/007_journal.sql mit journal_entries Tabelle
3. src/app/dashboard/journal/page.tsx für die UI
4. Verbinde onTradeClose mit dem Trade-Close Event (Equity Snapshot Cron erkennt geschlossene Trades)
5. AI-Kommentar via cachedCall + Haiku
6. Teste mit npm run build
```

---

### FEATURE 3: ECONOMIC CALENDAR + AUTO-RULES
**Priorität:** HOCH — Jeder Trader braucht das
**Aufwand:** 2h

#### Datenquelle:
ForexFactory hat keine offizielle API, ABER:
- Investing.com Economic Calendar (scrapen oder API)
- Oder: Eigene Tabelle mit den 20 wichtigsten Events
  (FOMC, NFP, CPI, EZB, BOE, RBA — Termine sind Monate vorher bekannt)

#### Backend (src/lib/calendar/economic-calendar.ts):
```
Funktionen:
- getTodayEvents() → [{time, event, impact, currency, forecast, previous}]
- getUpcomingHighImpact(hours) → Events in den nächsten X Stunden
- shouldBlockTrading(symbol) → true/false basierend auf Events
- getAutoRules() → Aktuelle Trading-Einschränkungen
```

#### Auto-Rules Logik:
```
HIGH IMPACT Event (FOMC, NFP, CPI):
  15 Min vorher → Keine neuen Trades
  15 Min nachher → Keine neuen Trades
  Bestehende Trades → SL auf BE wenn möglich
  
MEDIUM IMPACT:
  5 Min vorher/nachher → Lots 50% reduziert
  
LOW IMPACT:
  Keine Einschränkung
  
SPEZIAL (Tegas FX):
  HIGH IMPACT → 30 Min Block statt 15
```

#### Frontend:
- Dashboard Widget mit Tages-Events
- Farb-Code: Rot (High), Gelb (Medium), Grau (Low)
- Countdown bis nächstem Event
- Status: "Trading aktiv" / "Pausiert wegen US CPI"

#### Verbindung mit Risk Engine:
Risk Engine ruft `shouldBlockTrading(symbol)` VOR jedem Trade auf.
Wenn true → Trade wird NICHT ausgeführt. User bekommt Notification.

---

### FEATURE 4: MOMENTUM SCALING
**Priorität:** MITTEL — Einzigartiges Feature
**Aufwand:** 1h

#### Backend (in src/lib/copier/risk-engine.ts erweitern):
```typescript
interface MomentumConfig {
  enabled: boolean;
  baseRisk: number;          // 1.0%
  winStreakBonus: number;     // 0.2% pro Win
  maxRisk: number;           // 1.5% Cap
  resetOnLoss: boolean;      // true
  ddOverride: number;        // Deaktivieren wenn DD-Buffer < 5%
}

function calculateMomentumRisk(config: MomentumConfig, recentTrades: Trade[]): number {
  if (!config.enabled) return config.baseRisk;
  
  // Zähle konsekutive Wins (von hinten)
  let streak = 0;
  for (let i = recentTrades.length - 1; i >= 0; i--) {
    if (recentTrades[i].pnl > 0) streak++;
    else break;
  }
  
  // Risiko berechnen
  const bonus = Math.min(streak * config.winStreakBonus, config.maxRisk - config.baseRisk);
  return config.baseRisk + bonus;
}
```

#### Config pro Broker:
```
Tag Markets: base 1.0%, bonus 0.2%, cap 1.5%, ddOverride 5%
Tegas FX:   base 0.5%, bonus 0.1%, cap 0.75%, ddOverride 3%
Standard:   base 1.5%, bonus 0.3%, cap 2.0%, ddOverride 10%
```

#### Frontend:
- Settings-Toggle: "Momentum Scaling: An/Aus"
- Anzeige im Dashboard: "Aktuelles Risiko: 1.4% (Streak: 3 Wins)"
- Visuell: Flammen-Icon bei aktiver Streak 🔥

---

### FEATURE 5: MULTI-ACCOUNT DASHBOARD
**Priorität:** MITTEL — Für Power-User mit mehreren Prop Firms
**Aufwand:** 2-3h

#### Backend (src/lib/multi-account/aggregator.ts):
```
Funktionen:
- getAllAccounts(userId) → Array mit allen verbundenen Accounts
- getAggregatedStats(userId) → Total Balance, Total P&L, Overall DD
- getAccountStatus(accountId) → Challenge Progress oder Funded Status
- getCriticalAlerts(userId) → Accounts die Aufmerksamkeit brauchen
```

#### Frontend (src/app/dashboard/accounts/page.tsx):
```
┌─────────────────────────────────────────────┐
│ 📊 Alle Accounts                            │
│                                             │
│ ┌─── Tag Markets $50K ─────────────────┐    │
│ │ Phase 1 · 73% · +$3.650 · DD 6.8%  │    │
│ │ Status: ✅ ON TRACK                  │    │
│ └──────────────────────────────────────┘    │
│                                             │
│ ┌─── Tegas FX $25K ────────────────────┐   │
│ │ Funded · +$1.250 · DD 3.1%          │    │
│ │ Status: ⚠️ DD LOW — Lots reduziert  │    │
│ └──────────────────────────────────────┘    │
│                                             │
│ ┌─── Tag Markets $100K ────────────────┐   │
│ │ Phase 2 · 22% · +$2.200 · DD 8.1%  │    │
│ │ Status: ✅ HEALTHY                   │    │
│ └──────────────────────────────────────┘    │
│                                             │
│ TOTAL: $175K · +$7.100 heute · 3 Active    │
│                                             │
│ [Alle kopieren] [Einzeln managen] [Export]  │
└─────────────────────────────────────────────┘
```

#### Verbindungen:
- Challenge Tracker: Zeigt Progress pro Account
- Risk Engine: DD-Status pro Account (farbcodiert)
- Trade Manager: "Account X hat DD-Warnung — Lots dort reduziert"
- Copy: "Kopiere auf ALLE Accounts" oder "Nur auf Account X"

---

## 🎁 8 EXTRA TOOLS DIE WIR GRATIS MITLIEFERN

### EXTRA 1: Prop Firm Vergleichs-Tool
**Was Leute zahlen:** Prop Firm Match, Prop Firm App = Affiliate-basiert
**Wir:** Eigene Vergleichs-Seite mit 50+ Prop Firms.
```
/tools/prop-firm-vergleich
Sortiere nach: Preis, DD-Limit, Profit Split, Plattform
Empfehlung basierend auf deinem Profil
```
**Warum:** Killer SEO-Seite + Lead-Magnet + Affiliate-Einnahmen von Prop Firms.
**Aufwand:** 2h (Datenbank + UI + SEO-Seite)

### EXTRA 2: Lot-Size Calculator
**Was Leute zahlen:** Eigenständige Apps für $5-15/Mo
**Wir:** Im Dashboard eingebaut.
```
Input: Balance, Risk %, SL in Pips, Symbol
Output: Optimale Lot-Größe
Bonus: Zeigt Broker-spezifisch (Tag vs Tegas vs Standard)
```
**Aufwand:** 30 Min (schon als LP geplant, nur ins Dashboard)

### EXTRA 3: Profit Calculator
**Was Leute zahlen:** Gibt es als Standalone-Tools
**Wir:** Im Dashboard + als SEO Landing Page.
```
Input: Startkapital, monatliche Performance %, Monate
Output: Compound Growth Chart + "So viel hättest du gemacht"
```
**Aufwand:** Schon gebaut (Calculator LP), nur ins Dashboard kopieren

### EXTRA 4: Risk/Reward Visualizer
**Was Leute zahlen:** In Premium-Journalen ($69-179/Mo)
**Wir:** Pro Trade im Journal anzeigen.
```
Visuell: Entry → SL (rot) → TP1/TP2/TP3 (grün)
R:R Ratio grafisch dargestellt
Vergleich mit dem Intelligence Engine Optimum
```
**Aufwand:** 1h (SVG/Canvas im Journal)

### EXTRA 5: Session Timer
**Was Leute zahlen:** Nix, aber gibt es als Widget
**Wir:** Im Dashboard immer sichtbar.
```
🟢 LONDON SESSION (aktiv seit 2h 15m)
   Endet in: 5h 45m
   Nächste: NEW YORK in 3h 30m
   XAUUSD Vola heute: +47 Pips (überdurchschnittlich)
```
**Aufwand:** 30 Min (UTC-basiert, statische Zeiten)

### EXTRA 6: Drawdown Calculator
**Was Leute zahlen:** In Prop Firm Apps eingebaut
**Wir:** Im Challenge Tracker integriert.
```
"Wenn du jetzt 3 Trades mit 1% Risiko verlierst:
 DD wäre bei 9.1% (Limit: 10%)
 → Du hättest noch $900 Buffer
 → Empfehlung: Risiko auf 0.5% reduzieren"
```
**Aufwand:** 30 Min (Mathematik, kein AI nötig)

### EXTRA 7: Korrelations-Matrix
**Was Leute zahlen:** In Premium-Plattformen
**Wir:** Dashboard Widget.
```
         XAUUSD  EURUSD  GBPUSD  US500
XAUUSD   1.00   -0.45    -0.32   -0.58
EURUSD  -0.45    1.00     0.87    0.31
GBPUSD  -0.32    0.87     1.00    0.28
US500   -0.58    0.31     0.28    1.00

⚠️ Du hast XAUUSD + EURUSD offen = gut (negativ korreliert)
⚠️ EURUSD + GBPUSD wäre schlecht (0.87 Korrelation!)
```
**Aufwand:** 1h (Daten aus Intelligence Engine)

### EXTRA 8: Trade Replay
**Was Leute zahlen:** TradeZella $69/Mo hat das
**Wir:** Im Journal eingebaut.
```
Zeige den Chart-Verlauf eines vergangenen Trades:
- Entry Zeitpunkt markiert
- SL/TP Level eingezeichnet
- Preis-Bewegung animiert
- "Hier hättest du besser bei 1.8R teilweise schließen sollen"
```
**Aufwand:** 3-4h (Chart-Daten von MetaApi + Canvas Rendering)
→ Phase 2, nicht für Launch nötig

---

## 📅 PROJEKTPLAN: REIHENFOLGE

### TAG 1 (morgen): Integration + Basis
```
Morgens:  Claude Code → Autonomer Prompt → Module integrieren
Mittags:  /review → Prüfen
Abends:   /deploy → Vercel
```

### TAG 2: Challenge Tracker + Journal
```
Claude Code Prompt:
"Baue den Prop Firm Challenge Tracker (Feature 1) und
 das Auto Trade Journal (Feature 2).
 Migration 006 + 007, Backend Module, Dashboard Widgets.
 Arbeite autonom."
```

### TAG 3: Calendar + Momentum + Multi-Account
```
Claude Code Prompt:
"Baue den Economic Calendar (Feature 3), 
 Momentum Scaling (Feature 4),
 und das Multi-Account Dashboard (Feature 5).
 Verbinde Calendar mit Risk Engine.
 Arbeite autonom."
```

### TAG 4: Extra Tools
```
Claude Code Prompt:
"Baue die Extra Tools:
 - Prop Firm Vergleich (/tools/prop-firm-vergleich)
 - Lot Size Calculator (Dashboard Widget)
 - Session Timer (Dashboard Widget)
 - Drawdown Calculator (im Challenge Tracker)
 - Korrelations-Matrix (Dashboard Widget)
 Arbeite autonom."
```

### TAG 5: Polish + Launch
```
- /review → 15-Punkte Check
- /audit → Trading Safety
- Security: Rate Limiting + Sentry
- Vercel: Alle ENV Vars
- goldfoundry.de Domain verbinden
- LIVE 🚀
```

---

## 💎 DER GOLD FOUNDRY PITCH (für die Website)

"Hör auf $500/Mo für 8 verschiedene Trading-Tools zu zahlen.

Gold Foundry ist das ERSTE All-in-One Trading-Ökosystem:
✅ Smart Copier (ersetzt TradersConnect — $50/Mo)
✅ Signal Suite (ersetzt 4xSolutions — $30/Mo)
✅ Trade Journal (ersetzt TradeZella — $69/Mo)
✅ Challenge Tracker (ersetzt Prop Firm App — $30/Mo)
✅ Risk Shield (ersetzt manuelles DD-Management)
✅ Economic Calendar (ersetzt ForexFactory Pro — $30/Mo)
✅ AI Mentor (gibt es nirgendwo anders)
✅ Lot Calculator, Korrelation, Session Timer — ALLES inkl.

Ab €29/Mo. Erster Monat 80% Rabatt: nur €6.

Was du einzeln für €500+/Mo bezahlst, bekommst du hier für €29."
