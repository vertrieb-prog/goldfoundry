# XAUUSD — Gold Mastery Reference

## Fundamentale Treiber

**#1 Realzinsen (US 10Y TIPS)**
- Gold korreliert invers mit realen Renditen. Korrelation: -0.82 bis -0.91
- Realzinsen fallen → Gold steigt. Das ist der Anker.
- Tracking: FRED Datenbank, 10Y TIPS Yield

**#2 US Dollar (DXY)**
- Inverse Korrelation -0.80 bis -0.90
- Dollar schwach = Gold stark
- AUSNAHME: In Panik-Phasen steigen beide (safe-haven demand übertrumpft USD-Korrelation)

**#3 Zentralbank-Käufe**
- China, Indien, Türkei, Polen = Hauptkäufer
- 2023/2024: >1,000 Tonnen Netto. Rekord. Struktureller Demand.
- Das ist der Grund warum Gold trotz hoher Realzinsen 2023-2024 gestiegen ist → altes Modell broken

**#4 Geopolitik**
- Krieg, Sanktionen, De-Dollarisierung → Gold profitiert
- ABER: Eingepreiste Krisen bewegen Gold NICHT mehr. Nur Eskalation zählt.

**#5 Inflation Expectations**
- 5Y/10Y Breakeven Rate. Steigende Erwartungen → bullish
- Unterscheide: Demand-Pull Inflation (Gold neutral) vs Cost-Push (Gold bullish)

**#6 ETF Flows**
- GLD, IAU Holdings als Sentiment-Indikator
- Outflows ≠ automatisch bearish wenn Zentralbanken physisch kaufen

## Technische Charakteristik

```
Tägliche Range (ATR 14):     250-450 Pips (regime-abhängig)
Spread Asian:                 15-25 Pips
Spread London/NY:             8-15 Pips
Spread um News:               30-80 Pips (!)
Pip-Wert 0.01 Lot:           $0.10
Pip-Wert 0.10 Lot:           $1.00
Pip-Wert 1.00 Lot:           $10.00
Tick Size:                    0.01
Psychological Levels:         Runde $100 ($2,100, $2,200, etc.)
Fibonacci:                    38.2% und 61.8% funktionieren überdurchschnittlich
VWAP:                         Respektiert auf H1-H4
Volume Profile:               POC und VA Edges als S/R
```

## Session-Verhalten (KRITISCH für Analyse)

### Asian Session (00:00-08:00 CET)
- Geringe Liquidität, weite Spreads
- Range-Bound in 80% der Fälle
- BOJ/PBOC News können Moves triggern
- **Empfehlung:** VERMEIDEN für Scalping. Swing-Entries nur bei Key-Levels.
- **Typische Range:** 80-150 Pips

### London Open (08:00-09:30 CET) ✦ PRIME TIME
- DIE Session für Gold
- Liquidity Sweep der Asian-Range → Trend-Initiation
- **73% der profitablen Gold-Trades starten hier**
- Pattern: Fake-Break einer Asian-Range-Seite, dann Reversal + Trend
- **Empfehlung:** Hier Hauptvolumen platzieren. Scalping und Trend-Entries.

### London Body (09:30-14:00 CET)
- Trend-Continuation oder Konsolidierung
- Gute Phase für Grid-Bots und Trend-Follower
- Wenn London Open keinen klaren Trend erzeugt: Range-Day wahrscheinlich

### NY Open/Overlap (14:00-16:00 CET) ✦ SECOND PRIME
- Zweiter großer Move
- US-Daten landen hier (CPI, NFP, Jobless Claims)
- Höchste Volatilität des Tages
- **Spreads können auf 30+ Pips spiken**
- **Empfehlung:** Bots vor 14:30 (Datenpunkt) pausieren oder mit Event-Filter

### London Close / LBMA Fix (16:00-16:30 CET)
- Gold-Fix bei LBMA
- Kurzzeitige Anomalien möglich
- Institutional Flows

### NY Body (16:00-20:00 CET)
- Oft Reversal oder Continuation des London-Trends
- Liquidität nimmt ab nach 18:00
- Gute Phase für Mean-Reversion wenn London übertrieben hat

### Afterhours (20:00-00:00 CET)
- Dünne Liquidität, weite Spreads
- Nur für Overnight-Swings mit weiten Stops

## Analyse-Template bei XAUUSD-Fragen

```
**XAUUSD Performance — [Zeitraum]**

→ Trades:          [N] ([long_count] Long, [short_count] Short)
→ Net P&L:         [+/-]$[amount] ([pips] Pips netto)
→ Win Rate:        [X.X]% (Long: [X]%, Short: [X]%)
→ Avg Winner:      +$[amount] (+[pips] Pips)
→ Avg Loser:       -$[amount] (-[pips] Pips)
→ R:R:             1:[X.X]
→ Profit Faktor:   [X.XX]
→ Expectancy:      $[X] pro Trade

**Session-Split:**
→ Asian:   [N]T, WR [X]%, Avg $[X]  [VERMEIDEN/OK/GUT]
→ London:  [N]T, WR [X]%, Avg $[X]  [← stärkste/schwächste]
→ NY:      [N]T, WR [X]%, Avg $[X]
→ Overlap: [N]T, WR [X]%, Avg $[X]

**Kontext:**
→ ATR(14): [X] Pips ([NIEDRIG/NORMAL/HOCH] vs 20-Day Avg)
→ DXY Trend: [Bullish/Bearish/Neutral]
→ Nächstes Event: [EVENT] um [TIME] CET
```

## Saisonalität

- **Jan-Feb:** Historisch bullish (Lunar New Year, Indien Hochzeitssaison)
- **Aug-Sep:** Oft Konsolidierung
- **Nov-Dez:** Mixed, Jahresend-Rebalancing
- **FOMC-Wochen:** Vol-Explosion, Richtung = Dot-Plot vs Erwartung

## Bekannte Fallstricke

1. **Gold-Gaps am Montag:** Sonntag 23:00 CET Opening kann 20-50 Pips von Freitags-Close entfernt sein. Grid-Bots können in Trouble geraten.
2. **Flash Crashes:** Gold hat 2-3x pro Jahr einen 100+ Pip Move in <5 Minuten. Meist ausgelöst durch Stop-Cascades in der Asian Session. Immer Stops haben.
3. **Spread-Widening bei News:** NFP kann Gold-Spreads auf 80 Pips treiben. Ein Bot der Market Orders nutzt verliert sofort $80 pro Lot allein durch Spread.
4. **Swap-Kosten:** Gold-Longs kosten Swap (Finanzierungskosten). Bei Swing-Trades über mehrere Tage: Swap in P&L-Berechnung einbeziehen.
5. **Correlation Flip:** Gold kann plötzlich MIT dem Dollar steigen wenn Liquiditätskrise → beide sind Safe Haven. Das bricht viele Correlation-basierte Bots.
