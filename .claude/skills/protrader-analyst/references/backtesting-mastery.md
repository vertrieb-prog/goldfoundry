# Backtesting Mastery — XAUUSD & US500

Du testest keine Strategien. Du BEWEIST oder WIDERLEGST Edges. Backtesting ist Wissenschaft, nicht Hoffnung. Jeder Backtest der nicht statistisch rigoros ist, ist wertlos — schlimmer noch, er gibt falsches Vertrauen.

## Die Backtesting-Philosophie

```
REGEL 1: Ein Backtest beweist NICHTS — er widerlegt nur.
         → Guter Backtest = "diese Strategie hat möglicherweise einen Edge"
         → Schlechter Backtest = "diese Strategie hat DEFINITIV keinen Edge"
         → Kein Backtest = Glücksspiel

REGEL 2: Jeder Backtest LÜGT — die Frage ist nur wie sehr.
         → Spreads sind im Backtest zu eng (kein Slippage-Modell)
         → Fills sind im Backtest zu gut (kein Liquiditätsproblem)
         → Regime im Backtest ≠ Regime in der Zukunft

REGEL 3: Wenn eine Strategie im Backtest nur "ok" ist → LIVE wird sie SCHLECHTER.
         → Erwarte 20-40% Performance-Degradation im Live-Trading
         → Eine Strategie muss im Backtest DOMINIEREN um live zu überleben
```

## Backtesting-Frameworks für Gold Foundry

### Framework 1: Historical Trade Replay

Die einfachste Methode. Nimm die realen Trades aus MetaApi und analysiere sie retrospektiv.

```
DATENQUELLE: trades_history[] aus Supabase
ZEITRAUM:    Mindestens 3 Monate oder 100+ Trades (was zuerst kommt)

ANALYSE-SCHRITTE:
1. Trades nach Instrument splitten (XAUUSD / US500)
2. Trades nach Session splitten (Asian/London/NY)
3. Trades nach Direction splitten (Long/Short)
4. Trades nach Wochentag splitten
5. Trades nach Volatilitäts-Regime splitten (ATR hoch/normal/niedrig)
6. Für jede Kombination: WR, PF, Expectancy, Avg R berechnen
7. Identifiziere: Wo ist der Edge? Wo ist KEIN Edge?
```

**Output-Format:**
```
**BACKTEST REPORT — [STRATEGIE] — [ZEITRAUM]**

Gesamt:     [N] Trades · WR [X]% · PF [X.XX] · Expectancy $[X]/Trade

XAUUSD Breakdown:
→ London Long:   [N]T · WR [X]% · PF [X.XX] · Avg +$[X] ← [EDGE/KEIN EDGE]
→ London Short:  [N]T · WR [X]% · PF [X.XX] · Avg +$[X]
→ NY Long:       [N]T · WR [X]% · PF [X.XX] · Avg +$[X]
→ NY Short:      [N]T · WR [X]% · PF [X.XX] · Avg +$[X]
→ Asian Long:    [N]T · WR [X]% · PF [X.XX] · Avg -$[X] ← VERMEIDEN
→ Asian Short:   [N]T · WR [X]% · PF [X.XX] · Avg -$[X] ← VERMEIDEN

US500 Breakdown:
→ US Open Long:  [N]T · WR [X]% · PF [X.XX] · Avg +$[X]
→ US Open Short: [N]T · WR [X]% · PF [X.XX] · Avg +$[X]
→ Midday:        [N]T · WR [X]% · PF [X.XX] · Avg -$[X] ← VERMEIDEN
→ Last Hour:     [N]T · WR [X]% · PF [X.XX] · Avg +$[X]

EDGE MAP:
✦ Stärkster Edge:   [Instrument] [Session] [Direction] — PF [X.XX], [N] Trades
⚠️ Kein Edge:       [Instrument] [Session] [Direction] — PF [X.XX] < 1.0
🔴 Negativer Edge:  [Instrument] [Session] [Direction] — PF [X.XX], SOFORT STOPPEN
```

### Framework 2: Strategy Parameter Backtest

Wenn ein Bot Parameter hat (Stop Loss, Take Profit, Grid Spacing, etc.) — teste sie systematisch.

```
PARAMETER-SWEEP:

Für einen XAUUSD Scalper:
→ Stop Loss:    Test Range 15-50 Pips in 5-Pip-Schritten (8 Varianten)
→ Take Profit:  Test Range 10-60 Pips in 5-Pip-Schritten (11 Varianten)
→ Session:      Asian / London / NY / Overlap (4 Varianten)
→ Direction:    Long Only / Short Only / Both (3 Varianten)
→ Total:        8 × 11 × 4 × 3 = 1,056 Kombinationen

Für jeden Parametersatz berechne:
→ Net P&L, WR, PF, Sharpe, Max DD, Calmar Ratio
→ Prop-Firm Pass Rate (hätte diese Strategie die Challenge bestanden?)

SORTIEREN nach: Calmar Ratio (Return / Max DD) — DAS ist die Prop-Firm-Metrik
NICHT nach: Absoluter Profit (irrelevant wenn DD zu hoch)
```

**Overfitting-Schutz:**
```
WARNUNG: Parameter-Optimierung = Overfitting-Risiko!

GEGENMASSNAHMEN:
1. Walk-Forward Analysis (siehe Framework 3)
2. Out-of-Sample Test: Optimiere auf 60% der Daten, teste auf 40%
3. Robustheits-Check: Die besten Parameter-NACHBARN müssen auch profitabel sein
   → Wenn SL=25 profitabel aber SL=20 und SL=30 nicht → Overfitting!
   → "Insel-Parameter" = Falle
4. Min 30 Trades pro Parametersatz für Signifikanz
```

### Framework 3: Walk-Forward Analysis (WFA)

Der GOLDSTANDARD für Backtesting. Verhindert Overfitting.

```
KONZEPT:
→ Optimiere auf einem Zeitfenster, teste auf dem NÄCHSTEN
→ Schiebe das Fenster vorwärts, wiederhole
→ Nur wenn die Out-of-Sample Ergebnisse gut sind = echte Strategie

SETUP für XAUUSD (6 Monate Daten):

Window 1: Optimize Monat 1-3 → Test Monat 4
Window 2: Optimize Monat 2-4 → Test Monat 5
Window 3: Optimize Monat 3-5 → Test Monat 6

ERGEBNIS:
→ In-Sample Performance:  PF [X.XX], WR [X]%, Sharpe [X.XX]
→ Out-of-Sample Performance: PF [X.XX], WR [X]%, Sharpe [X.XX]

BEWERTUNG:
→ OOS Performance ≥ 70% von IS: ✦ Robuste Strategie
→ OOS Performance 50-70% von IS: ⚡ Akzeptabel, aber monitoren
→ OOS Performance < 50% von IS: 🔴 Overfitted. Nicht traden.
```

### Framework 4: Monte Carlo Simulation

Beantwortet: "Was ist das WORST CASE Szenario für diese Strategie?"

```
METHODE:
1. Nimm die realen Trade-Ergebnisse (z.B. 200 Trades)
2. Mische sie zufällig (Random Shuffle) — 10,000 Mal
3. Für jede Permutation: Berechne Equity Curve + Max DD
4. Ergebnis: Verteilung aller möglichen Drawdowns

OUTPUT:
→ Median Max DD:        [X]% (50. Perzentil — wahrscheinlichstes Szenario)
→ 90. Perzentil DD:     [X]% (1 von 10 Chance, dass es SO schlecht wird)
→ 95. Perzentil DD:     [X]% (Worst Case für Prop-Firm Planung)
→ 99. Perzentil DD:     [X]% (Schwarzer Schwan)

PROP-FIRM CHECK:
→ Wenn 95. Perzentil DD > 8%: Strategie ist zu riskant für 10% DD-Limit
→ Wenn 95. Perzentil DD > 4%: Strategie ist zu riskant für 5% Daily DD-Limit
→ IMMER 2% Puffer einplanen für Slippage und Live-Degradation
```

**Monte Carlo für Prop-Firm Challenge:**
```
Frage: "Wie wahrscheinlich ist es, dass ich die Challenge bestehe?"

SIMULATION:
1. Nimm die Trade-Distribution (Winners/Losers + Größen)
2. Simuliere 10,000 Challenge-Verläufe
3. Für jeden: Erreicht Profit-Target BEVOR DD-Limit?

OUTPUT:
→ Challenge Pass Rate:     [X]%
→ Durchschn. Dauer:        [X] Trading-Tage
→ Durchschn. Max DD:       [X]%
→ Consistency Score:        [X] (Median)
→ Wahrscheinlichkeit Blow: [X]%

BEWERTUNG:
→ Pass Rate > 80%: ✦ Strategie ist Challenge-geeignet
→ Pass Rate 60-80%: ⚡ Borderline — Parameter optimieren
→ Pass Rate < 60%: 🔴 Nicht geeignet. Andere Strategie wählen.
```

### Framework 5: Regime-Conditioned Backtest

Standard-Backtests ignorieren Marktregime. Das ist der #1 Fehler.

```
METHODE:
1. Klassifiziere jeden historischen Tag in ein Regime:
   → Trending (ADX > 25)
   → Ranging (ADX < 20)
   → High Vol (ATR > 1.5× Durchschnitt)
   → Low Vol (ATR < 0.7× Durchschnitt)
   → Risk-Off (VIX > 25 oder Gold Spike)
   → Risk-On (VIX < 15 und Aktien steigend)

2. Backteste die Strategie SEPARAT pro Regime

3. Erstelle eine Regime-Performance-Matrix:

XAUUSD Scalper:
→ Trending:   PF 1.92, WR 68% — OK
→ Ranging:    PF 3.41, WR 78% — ✦ OPTIMAL
→ High Vol:   PF 0.87, WR 52% — 🔴 VERLIERT
→ Low Vol:    PF 2.88, WR 74% — ✦ GUT

ERKENNTNIS: Bot NUR in Ranging + Low Vol Sessions laufen lassen.
In High Vol (z.B. FOMC-Tage): PAUSIEREN.
```

## XAUUSD-Spezifische Backtest-Parameter

### Realistische Kosten-Modellierung

```
XAUUSD Kostenmodell (MUSS im Backtest enthalten sein):

Spread:
→ Asian:     22 Pips (Durchschnitt)
→ London:    12 Pips
→ NY:        14 Pips
→ News:      45 Pips (!)
→ Weekend:   35 Pips (Sonntagabend Opening)

Slippage:
→ Normal:    1-3 Pips
→ Fast Market: 5-10 Pips
→ News:      10-25 Pips (!)

Swap (Long):
→ ~$8-15 pro Lot pro Nacht (Broker-abhängig)

Commission:
→ Typisch: $3-7 pro Lot Round-Turn

GESAMT-KOSTEN PRO TRADE (Scalper, 1.0 Lot, London):
→ Spread: 12 Pips × $10 = $120
→ Slippage: 2 Pips × $10 = $20
→ Commission: $5
→ TOTAL: ~$145 pro Round-Turn bei 1.0 Lot

Ein Backtest OHNE diese Kosten ist WERTLOS.
Ein "profitabler" Scalper mit 15 Pips Avg Gewinn
hat nach Kosten nur 15 - 14.5 = 0.5 Pips echten Profit → NICHT profitabel!
```

### XAUUSD Backtest-Zeiträume

```
MINIMUM für Signifikanz:
→ Scalper: 3 Monate oder 200+ Trades
→ Swing: 6 Monate oder 100+ Trades
→ Grid: 6 Monate (MUSS mindestens 2 High-Vol Events enthalten)

EMPFOHLENE ZEITRÄUME:
→ 2023-2024: Gold-Breakout-Phase ($1,800 → $2,400). Trending.
→ 2022 H2: Starker USD, Gold unter Druck. Bearish.
→ 2024 H2: Konsolidierung $2,300-$2,500. Ranging.
→ COVID Mar 2020: Flash Crash + Recovery. Stress-Test.

GOLDEN RULE: Wenn die Strategie in 2022 H2 UND 2024 H1 profitabel ist
→ Sie funktioniert in BEIDEN Regimen → robuster Edge.
```

## US500-Spezifische Backtest-Parameter

### Realistische Kosten-Modellierung

```
US500 Kostenmodell:

Spread:
→ Haupthandelszeit (15:30-22:00): 0.5-1.0 Points
→ Pre-Market (08:00-15:30): 1.5-3.0 Points
→ Afterhours (22:00-08:00): 3-8 Points
→ News: 5-15 Points

Slippage:
→ Normal: 0.3-1.0 Points
→ Fast Market: 2-5 Points
→ Gap (Overnight): 10-50 Points (!)

Commission:
→ Typisch: $2-5 pro Round-Turn

GESAMT-KOSTEN PRO TRADE (ORB, US Open):
→ Spread: 0.8 Points × Point Value
→ Slippage: 0.5 Points × Point Value
→ Commission: $3
→ TOTAL: ~1.3 Points + $3
```

### US500 Backtest-Zeiträume

```
EMPFOHLEN:
→ 2023: Bull Market, Low VIX. Trend-Strategien dominant.
→ 2022: Bear Market, High VIX. Mean-Reversion und Shorts.
→ 2024 H1: Mega-Rally (AI Hype). Breakout-Strategien.
→ 2020 Mar: COVID Crash. Stress-Test.
→ 2018 Q4: Vol-Explosion. Grid-Stress-Test.

MUSS ENTHALTEN: Mindestens 1 Crash-Phase + 1 Rally-Phase.
Sonst ist der Backtest nur für ein Regime gültig.
```

## Statistische Signifikanz — Wann ist ein Edge REAL?

### Minimum Sample Sizes

```
Für Win-Rate-Aussagen:
→ 30 Trades: Grobe Tendenz erkennbar (Konfidenzintervall ±15%)
→ 100 Trades: Solide Aussage (Konfidenzintervall ±8%)
→ 200 Trades: Hohe Sicherheit (Konfidenzintervall ±5%)

BEISPIEL:
→ 20 Trades, 70% WR: Echte WR liegt wahrscheinlich zwischen 48-88% → NUTZLOS
→ 100 Trades, 70% WR: Echte WR liegt wahrscheinlich zwischen 61-78% → BRAUCHBAR
→ 200 Trades, 70% WR: Echte WR liegt wahrscheinlich zwischen 64-76% → GUT
```

### T-Test für Profitabilität

```
Frage: "Ist die Strategie STATISTISCH SIGNIFIKANT profitabel?"

H0 (Nullhypothese): Durchschnittlicher Profit pro Trade = 0 (kein Edge)
H1 (Alternativhypothese): Durchschnittlicher Profit > 0 (Edge existiert)

t = (Avg Profit - 0) / (StdDev / √N)

→ t > 1.65 (p < 0.05): Edge wahrscheinlich real (95% Konfidenz)
→ t > 2.33 (p < 0.01): Edge sehr wahrscheinlich real (99% Konfidenz)
→ t < 1.65: KEIN statistisch signifikanter Edge nachweisbar

BEISPIEL:
→ 100 Trades, Avg Profit $48, StdDev $320
→ t = 48 / (320 / √100) = 48 / 32 = 1.50
→ t < 1.65 → KEIN signifikanter Edge! Trotz positivem Durchschnitt!

FORGE AI berechnet das automatisch und warnt:
"⚠️ Der positive Durchschnitt von $48/Trade ist statistisch NICHT signifikant
(t=1.50, p=0.068). Du brauchst entweder mehr Trades oder einen größeren Edge."
```

### Profit Factor Signifikanz

```
PF-Bewertung nach Sample Size:

Bei 30 Trades:
→ PF > 3.0 nötig um sicher zu sein (hohe Varianz bei kleinem Sample)

Bei 100 Trades:
→ PF > 1.5 ist wahrscheinlich real

Bei 200+ Trades:
→ PF > 1.3 ist wahrscheinlich real

FAUSTREGEL: Je kleiner das Sample, desto höher muss der PF sein.
"PF 1.8 bei 30 Trades" ist WENIGER überzeugend als "PF 1.3 bei 500 Trades"
```

## Prop-Firm Challenge Simulation

### Challenge-Backtest Framework

```
SETUP:
→ Account: $100,000
→ Target: 8% ($8,000)
→ Max Daily DD: 5% ($5,000)
→ Max Total DD: 10% ($10,000)
→ Consistency: Bester Tag < 30%
→ Min Days: 5

METHODE:
1. Nimm die Trade-Ergebnisse aus dem Backtest
2. Simuliere eine Challenge:
   - Starte bei $100,000
   - Spiele Trades chronologisch durch
   - Prüfe JEDEN Tag: Daily DD verletzt? Total DD verletzt?
   - Wenn Target erreicht BEVOR DD-Limit → BESTANDEN
   - Wenn DD-Limit BEVOR Target → GESCHEITERT
   - Prüfe am Ende: Consistency Rule erfüllt?

3. Wiederhole mit verschiedenen Startpunkten (Rolling Window):
   - Starte Challenge ab Tag 1, Tag 2, Tag 3, ... Tag N
   - Für jeden Start: Pass/Fail?

OUTPUT:
→ Challenge Pass Rate:     [X]% (über alle Startpunkte)
→ Avg Days to Pass:        [X] Tage
→ Avg Max DD during Pass:  [X]%
→ Consistency Violations:  [X]% der Passes verletzt Consistency
→ Worst DD before Pass:    [X]% (knappster Durchgang)

BEWERTUNG:
→ Pass Rate > 80% UND Consistency Clean > 90%: ✦ CHALLENGE-READY
→ Pass Rate 60-80%: ⚡ Optimierung nötig (Lots, Sessions, Limits)
→ Pass Rate < 60%: 🔴 NICHT challenge-ready. Strategie überarbeiten.
```

### Funded Account Survival Simulation

```
FRAGE: "Wie lange überlebt diese Strategie als Funded Account?"

SIMULATION:
1. Starte bei $100,000 (nach bestandener Challenge)
2. Spiele Trades über 12 Monate
3. Monatliche Payouts: 70% des Monatsgewinns wird ausgezahlt
4. DD-Reset: Jeden Monat startet Daily DD bei 0
5. Total DD: Kumulativ (KEIN Reset bei den meisten Firms)

OUTPUT:
→ 3-Month Survival Rate:    [X]%
→ 6-Month Survival Rate:    [X]%
→ 12-Month Survival Rate:   [X]%
→ Avg Monthly Payout:       $[X]
→ Avg Time to Blow:         [X] Monate (wenn geblasen)
→ Worst Monthly DD:         [X]%

ZIEL:
→ 12-Month Survival > 85%: ✦ Nachhaltige Strategie
→ 12-Month Survival 70-85%: ⚡ Risikomanagement verschärfen
→ 12-Month Survival < 70%: 🔴 Strategie nicht funded-tauglich
```

## Backtest-Report Template (FORGE AI Output)

```
═══════════════════════════════════════════════
FORGE AI BACKTEST REPORT
[STRATEGIE NAME] · [INSTRUMENT] · [ZEITRAUM]
═══════════════════════════════════════════════

1. EXECUTIVE SUMMARY
→ Trades: [N] · Zeitraum: [START] - [END]
→ Verdict: [✦ EDGE BESTÄTIGT / ⚠️ GRENZWERTIG / 🔴 KEIN EDGE]

2. PERFORMANCE
→ Net P&L:      $[X] ([Y]%)
→ Win Rate:     [X]% ± [Konfidenzintervall]%
→ Profit Factor: [X.XX]
→ Expectancy:   $[X]/Trade
→ Sharpe:       [X.XX] (annualisiert)
→ Calmar:       [X.XX] (Return/MaxDD)
→ T-Stat:       [X.XX] (p=[X.XXX]) → [SIGNIFIKANT/NICHT SIGNIFIKANT]

3. DRAWDOWN ANALYSE
→ Max DD:       [X]% (Datum: [DATE])
→ Avg DD:       [X]%
→ DD Recovery:  Avg [X] Tage
→ Monte Carlo 95th: [X]% (Worst Case)

4. SESSION/REGIME SPLIT
[Tabelle mit Performance pro Session und Regime]

5. PROP-FIRM SIMULATION
→ Challenge Pass Rate:  [X]%
→ Avg Days to Pass:     [X]
→ Consistency Clean:    [X]%
→ 12M Survival Rate:    [X]%
→ Avg Monthly Payout:   $[X]

6. KOSTEN-IMPACT
→ Brutto Profit:       $[X]
→ Spread-Kosten:       $[X] ([Y]% vom Brutto)
→ Slippage-Schätzung:  $[X] ([Y]% vom Brutto)
→ Swap-Kosten:         $[X] ([Y]% vom Brutto)
→ Netto nach Kosten:   $[X]
→ Kosten-Ratio:        [Y]% → [OK/WARNUNG/ZU HOCH]

7. EMPFEHLUNG
→ [LIVE GEHEN / OPTIMIEREN / VERWERFEN]
→ Optimale Parameter: [SL, TP, Session, Direction]
→ Empfohlene Lot Size: [X] (bei [Y]% Risk pro Trade)
→ Empfohlenes Playbook: [Foundry Method / Low & Slow / Sprint]
→ Nächster Schritt: [Forward-Test X Wochen / Parameter anpassen / Verwerfen]

═══════════════════════════════════════════════
```

## Die 7 Todsünden des Backtesting

```
1. SURVIVOR BIAS
   → Nur Strategien testen die "gut aussehen" → Confirmation Bias
   → FIX: Teste ALLE Varianten, auch die die schlecht aussehen

2. LOOK-AHEAD BIAS
   → Informationen nutzen die zum Zeitpunkt des Trades nicht verfügbar waren
   → Beispiel: "Ich hätte vor NFP verkauft weil NFP schlecht war"
   → FIX: Strict chronologische Simulation. Kein Zukunftswissen.

3. OVERFITTING
   → 15 Parameter auf 50 Trades optimiert → perfekter Backtest, desaströses Live
   → FIX: Walk-Forward, Out-of-Sample, Nachbar-Robustheit

4. KOSTEN IGNORIEREN
   → "Strategie macht 12 Pips pro Trade!" — aber Spread + Slippage = 14 Pips
   → FIX: Realistische Kostenmodelle (siehe oben)

5. FALSCHES SAMPLE
   → Nur in einem Regime getestet (nur Bull Market, nur Low Vol)
   → FIX: Multi-Regime-Test. Muss in mindestens 2 Regimen profitabel sein.

6. SAMPLE SIZE ZU KLEIN
   → "15 Trades, 80% Win Rate!" → Statistisch bedeutungslos
   → FIX: Min 100 Trades für solide Aussagen

7. EQUITY CURVE FITTING
   → "Ich hätte hier aufgehört und dort wieder angefangen" → Cherry-Picking
   → FIX: Kontinuierliche Equity Curve. Keine Pausen. Keine Restarts.
```
