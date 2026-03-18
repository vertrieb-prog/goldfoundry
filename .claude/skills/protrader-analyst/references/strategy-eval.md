# Strategy Evaluation — XAUUSD & US500

## Strategy Type Benchmarks

### Gold Scalper (XAUUSD)
```
Expected WR:      65-80%
Expected PF:      1.8-3.5
Expected Sharpe:  1.5-3.0
Normal DD:        2-5%
Frequency:        15-50 trades/day
Best Session:     London Open (08:00-10:00 CET)
Red Flags:        WR < 60%, PF < 1.5, Asian Session trades > 20%
Kill Signal:      Sharpe < 1.0 über 50+ Trades
```

### Gold Swing (XAUUSD)
```
Expected WR:      50-70%
Expected PF:      2.5-5.0+
Expected Sharpe:  1.5-3.0
Normal DD:        2-6%
Frequency:        1-5 trades/week
Best Session:     London/NY Entry, hold for hours/days
Red Flags:        Hold time > 5 days (Swap frisst Profit), PF < 2.0
Kill Signal:      3 consecutive losers > 2R each
```

### Gold Grid (XAUUSD)
```
Expected WR:      75-90%
Expected PF:      2.5-5.0
Expected Sharpe:  1.0-2.5
Normal DD:        3-8% (but TAIL RISK!)
Frequency:        Very high
Best Regime:      Ranging Gold (ADX < 20)
Red Flags:        Floating > 3% balance, > 15 open positions
Kill Signal:      Grid spacing < ATR/4 (zu eng für aktuelle Vol)
WARNUNG:          Grids auf Gold sind GEFÄHRLICH bei Trend-Tagen. Ein 300-Pip FOMC Move kann das gesamte Grid auslöschen.
```

### US500 Trend Follower
```
Expected WR:      40-55%
Expected PF:      2.0-4.0
Expected Sharpe:  1.0-2.5
Normal DD:        3-8%
Frequency:        2-10 trades/week
Best Regime:      Trending market (ADX > 25), Low VIX
Red Flags:        PF < 1.5 (Winners müssen groß sein), WR < 35%
Kill Signal:      Sharpe < 0.8 über 30+ Trades
```

### US500 Mean-Reversion / Scalper
```
Expected WR:      60-75%
Expected PF:      1.5-3.0
Expected Sharpe:  1.5-3.0
Normal DD:        2-5%
Frequency:        10-40 trades/day
Best Regime:      Range days (60% aller Tage), positive GEX
Red Flags:        Verluste an Trend-Tagen > 50% des Monatsgewinns
Kill Signal:      3 Trend-Tage in Folge mit Verlusten > 2R
```

### US500 Opening Range Breakout (ORB)
```
Expected WR:      45-60%
Expected PF:      2.0-3.5
Expected Sharpe:  1.5-2.5
Normal DD:        2-4%
Frequency:        1 trade/day (15:30-16:00 CET)
Best Regime:      Volatility expansion, negative GEX
Red Flags:        Nicht profitabel an Range-Tagen (expected, aber monitoren)
Kill Signal:      WR < 40% über 30 Trades
```

## Tier System (Composite Score)

```
Score = (Sharpe × 30) + (Calmar × 20) + (WR × 0.3) + (PF_norm × 20)

S-Tier (>80):  ELITE — Allokation erhöhen
A-Tier (60-80): STARK — Halten
B-Tier (40-60): AVERAGE — Monitoren, Parameter prüfen
C-Tier (20-40): SCHWACH — Reduzieren, untersuchen
F-Tier (<20):   FAILING — Abschalten oder Komplett-Rebuild
```

## Regime-Passend?

Vor JEDER Strategie-Bewertung prüfen:

```
Aktuelles Regime → Erwartete Performance der Strategie-Art:

Gold Scalper + Gold ranging (ATR < 250):      ✦ Optimal
Gold Scalper + Gold trending (ATR > 400):     ⚠️ Schwieriger, aber ok mit Stops
Gold Grid + Gold ranging:                      ✦ Optimal
Gold Grid + Gold trending:                     🔴 GEFÄHRLICH — Pausieren
Gold Swing + Gold trending:                    ✦ Optimal
Gold Swing + Gold ranging:                     ⚡ Weniger Setups, geduldig bleiben

US500 Trend + VIX < 15, ADX > 25:            ✦ Optimal
US500 Trend + VIX > 25, choppy:              ⚠️ Schwierig
US500 Mean-Revert + Range Day:                ✦ Optimal
US500 Mean-Revert + Trend Day:                🔴 Verlustreich
US500 ORB + High Vol, negative GEX:           ✦ Optimal
US500 ORB + Low Vol, positive GEX (pinning):  ⚠️ Fake breakouts
```

**Wenn ein Bot underperformt: CHECK REGIME FIRST.**
Ein Gold-Grid in einem FOMC-Trend ist nicht kaputt. Es ist im falschen Regime.

## Allocation Optimization

### Instrument-Level Allocation
```
Gold-fokussierte Bots: Max 60% des AUM in Gold-Exposure
US500-fokussierte Bots: Max 60% des AUM in Index-Exposure
Overlap (wenn gleichgerichtet): Max 80% combined

Wenn XAUUSD und US500 Bots gleichzeitig Risk-On:
→ Gesamtexposure > 5% in gleicher Richtung? → Reduzieren
```

### Reallocation Rules
1. Max 20% AUM pro einzelne Umschichtung
2. Phase über 3-5 Tage
3. Nie eine verlustbringende Strategie mit Gewinner-Kapital füttern
4. Minimum-Diversifikation: Kein Single-Bot > 40% AUM
5. Instrument-Check: Nicht alles in Gold verschieben nur weil Gold läuft

## Response Pattern

1. **Tier List** — Ranking mit Composite Scores
2. **Instrument-Split** — Wie performt der Bot auf XAUUSD vs US500?
3. **Regime Check** — Passt das aktuelle Marktumfeld zur Strategie?
4. **Benchmark** — Jeder Bot vs sein Typ-Benchmark
5. **Statistische Validierung** — T-Test Signifikanz, Konfidenzintervall der WR, Sample Size Check. Siehe `references/backtesting-mastery.md` für Methodik.
6. **Allocation** — Current vs Optimal
7. **Actions** — "Bot X: Lots auf Y, Session auf Z beschränken"
8. **Backtest-Empfehlung** — Wenn Daten dünn (<50 Trades): "Walk-Forward-Test mit 3 Monaten Daten empfohlen bevor Allokation erhöht wird."
