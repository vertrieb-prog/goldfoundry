# Cross-Instrument Analysis: XAUUSD × US500

This is Gold Foundry's edge. Most traders handle Gold OR Indices. You trade BOTH. This unlocks hedging, correlation trades, and regime-aware allocation.

## Correlation Dynamics

The XAUUSD/US500 correlation is NOT stable. It flips based on the macro regime:

```
Historical Correlation Ranges:
- Risk-On (normal):        -0.20 to +0.20 (weak/uncorrelated)
- Risk-Off (panic):        -0.50 to -0.70 (strong negative)
- Liquidity Expansion:     +0.30 to +0.60 (both rise together)
- Inflation Scare:         -0.40 to -0.60 (Gold up, Stocks down)
- Dollar Collapse:         +0.40 to +0.70 (both benefit from weak USD)
```

**Current correlation must be CALCULATED from recent trade data, not assumed.**

Formula (rolling 20-day):
```
Correlation = Σ((Gold_return - μ_Gold)(SPX_return - μ_SPX)) / (N × σ_Gold × σ_SPX)
```

## Regime Matrix

| Regime | Trigger | XAUUSD | US500 | Optimal Allocation |
|--------|---------|--------|-------|--------------------|
| Risk-On | VIX<15, Yields stabil | Neutral/Schwach | Stark bullish | US500 70%, Gold 30% |
| Risk-Off | VIX>25, Flucht Safety | Stark bullish | Bearish | Gold 80%, US500 20% oder Short |
| Inflation Scare | CPI hot, Yields spike | Bullish | Bearish | Natural Hedge: Gold Long + US500 Short |
| Liquidity Expansion | Fed dovish, QE | Bullish | Bullish | ACHTUNG: Beide Long = korreliert! Max 3% combined |
| Liquidity Contraction | QT, RRP drain | Mixed | Bearish | Gold relativ stärker, US500 reduzieren |
| Geopolitischer Schock | Krieg, Terror | Spike bullish | Spike bearish | Schnell Gold Long, US500 warten auf Reversal |
| Dollar Crash | DXY<100, Vertrauen weg | Stark bullish | Bullish | Beide Long ok, USD-Hedge |

## Regime Detection Checklist

Vor jeder Analyse prüfen:
```
1. VIX Level:      <15 / 15-25 / 25-35 / >35
2. DXY Trend:      Bullish / Neutral / Bearish (20-Day SMA)
3. US10Y Yield:    Steigend / Stabil / Fallend
4. Fed Guidance:    Hawkish / Neutral / Dovish
5. Last CPI:       Hot / In-Line / Cool
6. Geopolitik:     Eskalation / Stabil / De-Eskalation
```

Wenn ≥3 Faktoren auf RISK-OFF deuten: Gold-Allokation erhöhen, US500 defensiv.
Wenn ≥3 Faktoren auf RISK-ON: US500-Allokation erhöhen, Gold nur als Hedge.

## Hedging-Logik

### Gleichgerichtete Positionen (beide Long oder beide Short)
```
WARNUNG: In einem Regime-Wechsel fallen/steigen beide gleichzeitig.
→ Combined Exposure berechnen: |Gold Notional| + |US500 Notional|
→ Max Combined: 3% des AUM in der gleichen Richtung
→ Wenn > 3%: Sofort eine Seite reduzieren
```

### Gegenläufige Positionen (Gold Long + US500 Short oder umgekehrt)
```
Natural Hedge → Geringeres Portfolio-Risiko
→ Combined Exposure kann höher sein: bis 5% pro Bein
→ ABER: Prüfe ob Regime den Hedge unterstützt
→ Gold Long + US500 Short = "Inflation Trade" — funktioniert nur wenn CPI steigt
```

### Dynamic Hedge Ratio
```
Wenn Gold ATR > 1.5x Durchschnitt UND US500 ATR normal:
→ Gold dominiert das Portfolio-Risiko
→ Gold Lots reduzieren ODER US500 als Gegengewicht erhöhen

Wenn US500 VIX > 25 UND Gold ATR normal:
→ US500 dominiert Risiko
→ US500 Lots reduzieren, Gold als Safe-Haven nutzen
```

## Event-Kalender: Was bewegt BEIDE

### Tier 1 — Beide Instrumente massiv betroffen
```
FOMC Decision + Pressekonferenz:
→ Gold: 100-200 Pips Move. Richtung = hawkish/dovish vs Erwartung
→ US500: 50-150 Points. Gleiche Logik.
→ AKTION: 30min vorher alle Bots pausieren. Keine neuen Positionen.
→ TIMING: Decision 20:00 CET, Pressekonferenz 20:30 CET
→ FALLE: Erste Reaktion oft falsch. Echter Move in der PK.

NFP (Non-Farm Payrolls):
→ Gold: 50-150 Pips. Reagiert über USD-Kanal.
→ US500: 30-80 Points. Reagiert über Macro-Kanal.
→ AKTION: Ab 14:00 CET flat oder enge Positionen
→ TIMING: Erster Freitag im Monat, 14:30 CET
→ PATTERN: Spike → Reversal → echte Richtung nach 30min

CPI/PPI (Inflation Daten):
→ Gold: Hot CPI = bullish (Inflationsschutz). Cool CPI = bearish.
→ US500: Hot CPI = bearish (Rate Hike Fear). Cool CPI = bullish.
→ NATURAL HEDGE: Gold Long + US500 Short vor CPI = Inflation-Play
→ TIMING: Mitte des Monats, 14:30 CET
```

### Tier 2 — Ein Instrument dominant
```
Fed Chair Speeches:
→ Unvorhersehbar. Breite Stops oder flat.
→ Gold reagiert stärker als US500

Jobless Claims (Donnerstag 14:30):
→ US500 reagiert stärker. Gold mild.

ISM/PMI Daten:
→ US500 dominant. Gold nur indirekt über USD.

Geopolitische Eskalation:
→ Gold: Sofort +30-80 Pips in Minuten
→ US500: Sofort -20-50 Points
→ Move hält SELTEN > 48h wenn keine Folge-Eskalation
→ FALLE: Nicht dem Spike nachrennen. Auf Pullback warten.
```

## Combined Portfolio Analyse Template

Bei Portfolio-Level-Fragen IMMER so aufteilen:

```
**PORTFOLIO OVERVIEW — [Zeitraum]**

XAUUSD:
→ P&L: [+/-]$[X] · [N] Trades · WR [X]% · PF [X.XX]
→ Session-Edge: [London/NY/etc.] mit [X]% WR
→ Direction Bias: [Long/Short/Neutral] (Win Rate Long [X]% vs Short [X]%)

US500:
→ P&L: [+/-]$[X] · [N] Trades · WR [X]% · PF [X.XX]
→ Best Session: [US Open/Last Hour/etc.] mit [X]% WR
→ Day-Type Performance: [Trend/Range] besser

COMBINED:
→ Total P&L: $[X]
→ Correlation (20d): [X.XX] → [UNCORRELATED/POSITIVE/NEGATIVE]
→ Combined Exposure: [X]% AUM ([OK/WARNUNG])
→ Regime: [RISK-ON/OFF/INFLATION/LIQUIDITY]
→ Hedge Status: [GEHEDGT/UNGEHEDGT/ÜBEREXPONIERT]

EMPFEHLUNG:
→ [Konkrete Allokations-Anpassung pro Instrument]
```

## Timing Overlap Matrix

Wann laufen beide Märkte gleichzeitig (höchste Korrelation)?

```
08:00-15:30 CET: Nur Gold aktiv (EU-Session). US500 CFD reagiert mild.
                  → Gold-Trades isoliert analysieren.

15:30-16:00 CET: US Open + Gold London Endphase.
                  → HÖCHSTE KORRELATION. Beide reagieren auf US-Daten.
                  → Hedging hier am effektivsten.

16:00-22:00 CET: Beide aktiv. US500 dominiert (Cash Market).
                  → Gold folgt oft US500-Richtung (Risk-On/Off).
                  → Cross-Monitoring kritisch.

22:00-08:00 CET: Beide illiquid. Afterhours/Asian.
                  → Geringes Korrelationsrisiko, aber Gap-Risiko.
```
