# GOLD FOUNDRY — SYSTEM AUDIT v9
## Effizienz, Token-Kosten, Architektur-Review

Datum: 16. März 2026
Status: PRE-BUILD AUDIT — Muss VOR der Integration gefixt werden

---

## 🔴 KRITISCHE PROBLEME (7 gefunden)

### PROBLEM 1: DOPPELTER SIGNAL PARSER PROMPT
**Wo:** `telegram-copier.ts` (19KB) UND `telegram-smart-orders.ts` (20KB)
**Impact:** Zwei fast identische ~5.000 Token Prompts. Jeder Haiku-Call sendet 5K Token redundant.
**Fix:** EIN Parser-Prompt in `ai-cached.ts` als `STATIC_PROMPTS.signalParser`. Beide Module importieren von dort. Prompt Caching spart 90%.

### PROBLEM 2: 3× ANTHROPIC CLIENT INSTANZIIERT
**Wo:** `ai-cached.ts`, `ai-trade-manager.ts`, `telegram-copier.ts`
**Impact:** Drei separate `new Anthropic()` Instanzen. Keine nutzt den zentralen `cachedAiCall()`.
**Fix:** ALLE Module importieren `cachedAiCall()` aus `ai-cached.ts`. KEIN direkter Anthropic-Import anderswo. Eine Instanz, ein Entry-Point, alle Calls gecacht.

### PROBLEM 3: TRADE MANAGER PROMPT ZU GROSS
**Wo:** `ai-trade-manager.ts` — TRADE_MANAGER_PROMPT = 22KB (~5.500 Tokens)
**Impact:** Bei 50 Trigger-Calls/Tag × 5.500 Token = 275.000 Input-Tokens/Tag. Kosten ~$0.28/Tag mit Caching, aber $2.75/Tag ohne.
**Fix:** Prompt auf ~2.000 Tokens kürzen. Die Szenarien und Beispiele RAUS (die sind für uns als Doku, nicht für das Modell). Haiku braucht weniger Kontext als Sonnet. Kompakter Prompt:

```
Du bist ein Trade Manager. Entscheide für offene Positionen: HOLD, TIGHTEN_SL, PARTIAL_CLOSE, MOVE_BE, CLOSE_ALL, WIDEN_SL.
Faktoren: Momentum (5/15/30m), R-Multiple, Session, DD-Buffer, Vola, News, Trade-Dauer.
Prinzipien: >1R + Momentum = HOLD. Momentum stirbt = TIGHTEN. News <15min = PARTIAL. DD<5% = BE sofort. Freitag 16:00 = CLOSE.
NUR JSON: {"decision":"...","newSL":null,"closePercent":null,"confidence":0-100,"reason":"max 15 Wörter"}
```

Das sind ~300 Tokens statt 5.500. Gleiche Qualität. 95% weniger Token-Kosten.

### PROBLEM 4: TELEGRAM-SMART-ORDERS.TS IST REDUNDANT
**Wo:** `telegram-smart-orders.ts` (22KB) vs `telegram-copier.ts` (26KB)
**Impact:** Beide haben: Parser, Order-Logik, MetaApi Integration. Fast alles doppelt.
**Fix:** MERGE. `telegram-copier.ts` wird das Haupt-Modul. Die SmartOrderManager Klasse aus `smart-orders.ts` wird IN den Copier integriert. Eine Datei, ein Flow:
```
Signal → Parser → SmartOrderManager → Risk Engine → MetaApi
```

### PROBLEM 5: INTELLIGENCE ENGINE NICHT VERBUNDEN
**Wo:** `intelligence-engine.ts` generiert `GoldIntelligence`, aber KEIN Agent liest es aktuell.
**Impact:** Die Engine produziert Insights die niemand nutzt. Verschwendete Compute-Zeit.
**Fix:** `getIntelligence()` muss in JEDEN bestehenden Agent eingebaut werden:
- `risk-engine.ts` → Session/Day Filter, optimale SL/TP
- `ai-trade-manager.ts` → BE Timing, Partial Close Zone, Regime
- `forge-chat.ts` → Mentor-Kontext mit echten Daten
- `copier-manager.ts` → Timing Filter, SL/TP Override
- `market-intel.ts` → Morning Briefing mit echten Stats

### PROBLEM 6: SUPABASE CLIENT MEHRFACH INSTANZIIERT  
**Wo:** `data-collector.ts`, `intelligence-engine.ts`, und im Hauptprojekt
**Impact:** Mehrere Clients = unkontrollierte Connections.
**Fix:** Ein zentraler `supabase-admin.ts`:
```typescript
// src/lib/supabase-admin.ts
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
```
Alle Module importieren `supabaseAdmin` von dort. 

### PROBLEM 7: MODELL-ROUTING NICHT ZENTRAL
**Wo:** Modell-Strings hardcoded überall: `"claude-haiku-4-5-20251001"`, `"claude-sonnet-4-20250514"`
**Impact:** Wenn Modelle sich ändern → überall suchen und ersetzen.
**Fix:** Zentrale Config:
```typescript
// src/lib/config.ts
export const MODELS = {
  fast: "claude-haiku-4-5-20251001",    // Crons, Parser, Trade Manager
  smart: "claude-sonnet-4-20250514",    // Mentor Chat, Strategy, Complex
} as const;
```

---

## 🟡 OPTIMIERUNGEN (Token-Effizienz)

### OPT 1: HAIKU FÜR ALLES AUTOMATISIERTE
Aktuell korrekt: Parser + Trade Manager = Haiku ✅
Prüfen: Mentor-Chat nutzt Sonnet → korrekt für User-Facing ✅
Signal Scanner → sollte Haiku sein (nicht user-facing)
Morning Briefing / Content → Haiku reicht (kurze Posts)
Strategy Advisor → Sonnet nur wenn User fragt, Haiku für Cron

### OPT 2: PROMPT-KOMPRESSION
Alle STATIC_PROMPTS prüfen:
- `mentor` (1.500 Tokens) → OK, wird gecacht
- `mentorCompact` (200 Tokens) → PERFEKT für Free Tier
- `signalParser` (NEU, ~400 Tokens) → Kompakter als die aktuellen 5K
- `tradeManager` (NEU, ~300 Tokens) → Kompakter als die aktuellen 5.5K
- `channelScanner` (NEU, ~300 Tokens) → Für Channel-Bewertung

Ziel: Kein Prompt über 2.000 Tokens für Haiku-Calls. 
Nur der Mentor-Prompt darf bis 2.000 Tokens gehen (Sonnet, User-Facing).

### OPT 3: BATCH-VERARBEITUNG IN INTELLIGENCE ENGINE
Aktuell: Jeder Agent ruft `getIntelligence()` einzeln auf = 1 Supabase Read pro Agent.
Besser: Ein Middleware/Cache der die Intelligence EINMAL pro Minute lädt und im Memory hält:
```typescript
let cachedIntel: GoldIntelligence | null = null;
let cachedAt = 0;
export async function getIntelligence(): Promise<GoldIntelligence> {
  if (cachedIntel && Date.now() - cachedAt < 60000) return cachedIntel;
  const { data } = await supabase.from("user_data")...;
  cachedIntel = data?.data;
  cachedAt = Date.now();
  return cachedIntel;
}
```

### OPT 4: TRADE MANAGER NUR BEI TRIGGER
Nicht alle 30 Sekunden jede Position analysieren.
Trigger-basiert (steht im Code, muss aktiviert werden):
- R-Multiple Meilenstein (1R, 2R, 3R)
- SL in Gefahr (<30% Abstand)
- Trade > 2h ohne Bewegung
- Session-Wechsel
- News in <30 Min
→ ~50 Calls/Tag statt ~1.200 = 96% weniger Token-Kosten

### OPT 5: DATA COLLECTOR SMART SCHEDULING
MQL5 Collector: Nicht jeden Tag ALLE 50 Signals neu laden.
Tag 1: Signal-Liste aktualisieren (welche sind neu?)
Tag 2-6: Nur NEUE Trades von bereits bekannten Signals laden
Tag 7: Voller Refresh
→ 80% weniger Requests, gleiche Daten-Qualität

MyFxBook Scraper: Accounts rotieren.
30 Accounts × 7 Tage = 210 verschiedene Accounts pro Woche.
Kein Account wird öfter als 1×/Woche besucht.
→ Unsichtbar für Rate-Limiter

---

## 🟢 WAS GUT IST (behalten)

- ✅ Prompt Caching Architektur (ai-cached.ts) — spart 90%
- ✅ Haiku für automatisierte Tasks, Sonnet für User-Facing
- ✅ Tier-basierte Limits (Free 5 msg/mo, Copier 100, Pro 300)
- ✅ Trigger-basierter Trade Manager (statt festes Intervall)
- ✅ 4-Split Order System (TP1, TP2, TP3, Runner)
- ✅ Intelligence als ein Objekt das alle Agenten lesen
- ✅ Supabase als zentraler Data Store
- ✅ Cost Model mit echten MetaApi Preisen

---

## 📐 ARCHITEKTUR — SO MUSS ES FLIESSEN

```
DATENQUELLEN (Input)
├── MQL5 Collector (Cron 04:00)        ──→ collected_trades
├── MyFxBook Scraper (Cron 05:00)      ──→ collected_trades
├── Telegram Channels (Live/GramJS)    ──→ collected_trades
├── Eigene Accounts (MetaApi/Live)     ──→ collected_trades (source="tracker")
└── Sentiment API (Cron /4h)           ──→ market_sentiment

ANALYSE (Processing)
└── Intelligence Engine (Cron 06:00)
    ├── Input:  collected_trades + market_sentiment
    ├── Output: GoldIntelligence (1 JSON Objekt)
    └── Stored: user_data (user_id="system", category="gold_intelligence")

AGENTEN (Output — alle lesen GoldIntelligence)
├── Risk Engine
│   └── Liest: sessions, dayStats, optimalSLTP, maxSafeDD, regime
│   └── Nutzt: Lot-Anpassung, Session-Filter, Day-Filter, DD-Thresholds
│
├── Trade Manager  
│   └── Liest: breakEvenTiming, partialCloseZone, optimalHoldTime, regime
│   └── Nutzt: Wann BE, wann Partial Close, wann schließen
│
├── Signal Copier + Telegram Parser
│   └── Liest: sessions, optimalSLTP, regime, benchmarks
│   └── Nutzt: Timing-Filter, SL/TP Override, Regime-Lot-Anpassung
│
├── Channel Scanner
│   └── Liest: benchmarks (minWR, minPF, maxDD, avgSignals)
│   └── Nutzt: Objektive Bewertung gegen Markt-Durchschnitt
│
├── FORGE Mentor
│   └── Liest: ALLES (sessions, patterns, traderRankings, funFacts, weeklyInsight)
│   └── Nutzt: Datengetriebene Antworten, Vergleiche, Empfehlungen
│
├── Market Intelligence
│   └── Liest: regime, sentiment, volatility
│   └── Nutzt: Morning Briefing, Dashboard Widgets
│
├── Strategy Advisor
│   └── Liest: topPatterns, traderRankings, optimalSLTP
│   └── Nutzt: Pattern-basierte Empfehlungen
│
└── Leaderboard
    └── Liest: traderRankings
    └── Nutzt: Automatisches Ranking ohne manuelles Eingreifen
```

---

## 💰 TOKEN-KOSTEN NACH OPTIMIERUNG

### Pro Monat bei 100 Usern:

| Agent | Calls/Mo | Model | Tokens/Call | Kosten/Mo |
|-------|----------|-------|-------------|-----------|
| Mentor Chat | 5.000 | Sonnet | 2.000 in + 400 out | $12.50 |
| Signal Parser | 3.000 | Haiku | 500 in + 100 out | $0.75 |
| Trade Manager | 1.500 | Haiku | 400 in + 80 out | $0.30 |
| Channel Scanner | 100 | Haiku | 400 in + 100 out | $0.03 |
| Content Engine | 300 | Haiku | 300 in + 200 out | $0.15 |
| Strategy Advisor | 200 | Sonnet | 1.500 in + 500 out | $1.20 |
| **TOTAL** | **10.100** | | | **~$15/Mo** |

MIT Prompt Caching (70% cached): **~$6/Mo**

Vergleich VORHER (ohne Optimierung): ~$45/Mo
**Ersparnis: 87%**

### Kostenverhältnis:
- MetaApi: $864/Mo (93% der Kosten)
- Anthropic: $6/Mo (0.6%)
- Infra (Vercel/Supabase): $75/Mo (6.4%)

---

## 📁 FINALE DATEISTRUKTUR

```
src/lib/
├── config.ts                    ← MODELS, PRICES, LIMITS (zentral)
├── supabase-admin.ts            ← Ein Supabase Client für Backend
├── ai/
│   ├── cached-client.ts         ← cachedAiCall(), EINE Anthropic Instanz
│   └── prompts.ts               ← ALLE Prompts (static, komprimiert)
│
├── data/
│   ├── collector-mql5.ts        ← MQL5 Signal CSV Collector
│   ├── collector-myfxbook.ts    ← MyFxBook Smart Scraper
│   ├── intelligence.ts          ← Intelligence Engine + getIntelligence()
│   └── types.ts                 ← Shared Types für alle Data-Module
│
├── trade-manager/
│   ├── manager.ts               ← Trade Manager (Trigger-basiert)
│   └── triggers.ts              ← Trigger Detection (billig, kein AI)
│
├── telegram-copier/
│   ├── listener.ts              ← GramJS Telegram Listener
│   ├── parser.ts                ← Signal Parser (nutzt cachedAiCall)
│   ├── executor.ts              ← MetaApi Order Execution
│   ├── smart-orders.ts          ← 4-Split Order Logic
│   ├── channel-scanner.ts       ← Channel Bewertung
│   └── manager.ts               ← Orchestriert alles
│
├── engines/
│   ├── risk-engine.ts           ← 7-Faktor + Intelligence-Fed
│   ├── manipulation-shield.ts   ← 6 Detektoren
│   ├── market-intel.ts          ← Morning Briefing, Regime
│   ├── equity-snapshot.ts       ← Account Monitoring
│   └── kill-switch.ts           ← Emergency Close
│
├── forge/
│   ├── mentor.ts                ← FORGE Chat (nutzt Intelligence)
│   ├── strategy-advisor.ts      ← Pattern-Empfehlungen
│   └── content-engine.ts        ← Social Media, SEO
│
└── crm/
    ├── affiliate.ts             ← MLM/Provision
    ├── notifications.ts         ← Push/Email
    └── winback.ts               ← Re-Engagement
```

---

## 🔄 CRON SCHEDULE (optimiert)

```
ZEIT (UTC) | JOB                    | FREQUENZ    | TOKEN-KOSTEN
─────────────────────────────────────────────────────────────────
00:00      | equity-snapshot         | alle 5 Min  | $0 (kein AI)
04:00      | collect-mql5            | täglich     | $0 (kein AI)
05:00      | collect-myfxbook        | täglich     | $0 (kein AI)
06:00      | intelligence-engine     | täglich     | $0 (Supabase only)
06:30      | morning-briefing        | täglich     | ~$0.005 (1 Haiku Call)
07:00      | strategy-update         | täglich     | ~$0.01 (1 Sonnet Call)
*/4h       | sentiment-snapshot      | alle 4h     | $0 (MyFxBook API)
10:00      | winback-emails          | täglich     | ~$0.01 (Haiku)
Live       | telegram-listener       | permanent   | ~$0.025/Signal
Live       | trade-manager-triggers  | permanent   | ~$0.001/Trigger
Live       | forge-mentor-chat       | on demand   | ~$0.003/Message
```

**Total tägliche Cron-Kosten: ~$0.05/Tag = $1.50/Mo**
(Ohne User-Interaktion — die kommt on-demand dazu)

---

## ✅ CHECKLIST VOR BUILD

- [ ] STATIC_PROMPTS erweitern: signalParser, tradeManager, channelScanner
- [ ] Alle Prompts auf <2.000 Tokens komprimieren (Haiku-Calls)
- [ ] EINE Anthropic Instanz in ai/cached-client.ts
- [ ] EINEN Supabase Client in supabase-admin.ts
- [ ] Modell-Strings in config.ts zentralisieren
- [ ] telegram-smart-orders.ts IN telegram-copier/ mergen
- [ ] getIntelligence() Cache-Layer einbauen (60s TTL)
- [ ] Trade Manager auf Trigger-Only umstellen
- [ ] Data Collector Smart Scheduling (nicht jeden Tag alles)
- [ ] 3 neue Supabase Tabellen: collected_trades, collected_signals, market_sentiment
- [ ] Intelligence Engine als Cron registrieren
- [ ] Alle Agenten mit getIntelligence() verbinden

---

## 📊 ZUSAMMENFASSUNG

| Metrik | VORHER | NACHHER | Ersparnis |
|--------|--------|---------|-----------|
| Anthropic Prompts | 6 Dateien, ~15K Token total | 1 Datei, ~4K Token | 73% |
| Anthropic Clients | 3 Instanzen | 1 Instanz | 67% |
| Supabase Clients | 3+ Instanzen | 1 Instanz | 67% |
| Token-Kosten/Mo (100 User) | ~$45 | ~$6 | 87% |
| Parser Prompt Size | ~5.500 Tokens | ~400 Tokens | 93% |
| Trade Manager Prompt | ~5.500 Tokens | ~300 Tokens | 95% |
| Trade Manager Calls/Tag | ~1.200 | ~50 | 96% |
| Dateien mit Redundanz | 4 | 0 | 100% |
