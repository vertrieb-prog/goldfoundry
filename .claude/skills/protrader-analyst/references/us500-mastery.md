# US500 — S&P 500 Index Mastery Reference

## Fundamentale Treiber

**#1 Fed Policy**
- DER Treiber. Rate Cuts → bullish. Rate Hikes → bearish.
- Markt preist 3-6 Monate voraus ein. Die ÜBERRASCHUNG zählt.
- Fed Funds Futures und CME FedWatch Tool als Erwartungs-Proxy
- Dot Plot (quartalsweise) definiert die mittelfristige Richtung

**#2 Earnings**
- Q1 (Apr), Q2 (Jul), Q3 (Okt), Q4 (Jan)
- Magnificent 7: AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA = ~30% des Index
- Ein NVDA-Miss bewegt den GESAMTEN US500
- Forward P/E als Bewertungs-Check: >22 = stretched, <18 = undervalued (historisch)

**#3 VIX (CBOE Volatility Index)**
- "Angst-Index". Inverse Korrelation -0.85
- VIX < 15: Complacency. Gut für Longs, aber Crash-Risiko baut sich auf
- VIX 15-25: Normal. Directional Trading ok
- VIX 25-35: Erhöhte Angst. Kontra-Signale werden gut
- VIX > 35: Panik. Nur für Spezialisten. Mean-Reversion-Setups
- VIX-Spikes > 40: Historisch gute Long-Entries 1-3 Tage später

**#4 Makrodaten (Impact-Reihenfolge)**
1. NFP (Non-Farm Payrolls) — Erster Freitag im Monat, 14:30 CET
2. CPI (Consumer Price Index) — Mitte des Monats, 14:30 CET
3. PPI (Producer Price Index) — Kurz nach CPI
4. ISM Manufacturing/Services — Erster/Dritter des Monats
5. Retail Sales — Mitte des Monats
6. Jobless Claims — Jeden Donnerstag, 14:30 CET

**#5 Liquidität**
- Fed Balance Sheet: Schrumpfend (QT) = bearish, Wachsend (QE) = bullish
- Reverse Repo (RRP): Sinkend = Liquidität fließt in Markt = bullish
- TGA (Treasury General Account): Steigend = Liquidität abgesaugt = bearish
- **Seit 2020 DER beste Prediktor für US500-Richtung**

**#6 Options Market / Gamma Exposure (GEX)**
- Positive GEX: Dealer hedgen → dämpft Volatilität → Range-bound
- Negative GEX: Dealer hedgen → VERSTÄRKT Moves → Trend-Tage
- 0DTE Options (Same-Day Expiry) haben Intraday-Dynamik massiv verändert
- Max Pain Level als Magnet für Freitags-Close (Options Expiry)

## Technische Charakteristik

```
Tägliche Range (ATR 14):     40-80 Punkte
Spread Haupthandelszeit:      0.4-0.8 Points
Spread Afterhours:            2-5 Points
Spread um News:               3-15 Points
Punkt-Wert (CFD, typisch):   Broker-abhängig, meist $1/pt bei 0.01 Lot
Psychological Levels:         Runde 100er (5,100, 5,200) und 1000er
Opening Range:                Erste 30min nach US Open = Richtungsgeber
VWAP:                         DER wichtigste Intraday-Indikator
Market Profile:               Initial Balance (erste 60min) definiert Range-/Trend-Day
```

## Session-Verhalten

### Pre-Market / European Session (08:00-15:30 CET)
- CFD-Handel auf Futures-Basis
- Reagiert auf EU-Daten und Asian Session
- Moderate Liquidität
- London-Trader positionieren sich für US Open
- **Empfehlung:** Vorsichtig handeln. Richtung kann sich bei US Open umkehren.

### US Open (15:30-16:00 CET) ✦ PRIME TIME
- Höchste Volatilität des Tages
- **Opening Range Breakout (ORB)** ist eine der profitabelsten Strategien
- **Gap-Fill Rate: 60-70%** der Overnight-Gaps werden am selben Tag geschlossen
- Cash Market öffnet → massives Volumen
- **Empfehlung:** Hier Hauptvolumen platzieren.

### Power Hour Setup (15:30-17:00 CET)
- Initiale Richtung wird etabliert
- Reversal-Zone: 16:30-17:00 CET wenn erster Move übertrieben
- Pattern: Initial spike → Pullback to VWAP → Continuation oder Reversal

### Midday Lull (17:00-19:00 CET)
- Lunchtime in NYC
- Geringstes Volumen des Tages
- Chop-Zone. Viele Fake-Breakouts.
- **Empfehlung:** VERMEIDEN für Scalping. Grid-Bots können funktionieren.

### Afternoon Session (19:00-21:00 CET)
- Volumen steigt wieder
- Institutional Flows
- Oft Trend-Continuation vom Vormittag

### Last Hour / MOC (21:00-22:00 CET) ✦ SECOND PRIME
- Market on Close Orders
- Institutional Rebalancing
- Massive Volumen-Spikes in letzten 15 Minuten
- Trend-Continuation oder finaler Reversal
- **Empfehlung:** Gute Phase für Momentum-Trades.

### Afterhours (22:00-15:30 CET)
- Dünne Liquidität
- Earnings-Reactions passieren hier (After-Market Reports)
- **Gap-Risiko für Overnight-Positionen**
- **Empfehlung:** Positionen vor 22:00 reduzieren oder Stops weiten.

## Day-Type Classification

Erkenne den Tag-Typ in den ersten 60 Minuten:

**Trend Day (15-20% der Tage):**
- Öffnet an einem Extrem, schließt am anderen
- Initial Balance klein → Breakout → No Pullback
- Signal: Starkes Open mit Volumen, keine Mean-Reversion zum VWAP
- **Aktion:** Trend folgen. Nicht faden.

**Range Day (50-60% der Tage):**
- Öffnet in der Mitte, pendelt zwischen IB High und Low
- VWAP ist der Magnet
- **Aktion:** Mean-Reversion. Fade die Extremes. Grid-Bots performen gut.

**Reversal Day (20-25% der Tage):**
- Starker Open in eine Richtung, dann komplette Umkehr
- Oft nach Overnight-News die übertrieben wurden
- Signal: Strong move gefolgt von Rückkehr unter/über VWAP
- **Aktion:** Warten auf Bestätigung. Nicht dem ersten Move trauen.

## Analyse-Template bei US500-Fragen

```
**US500 Performance — [Zeitraum]**

→ Trades:          [N] ([long_count] Long, [short_count] Short)
→ Net P&L:         [+/-]$[amount] ([points] Points netto)
→ Win Rate:        [X.X]% (Long: [X]%, Short: [X]%)
→ Avg Winner:      +$[amount] (+[pts] Points)
→ Avg Loser:       -$[amount] (-[pts] Points)
→ R:R:             1:[X.X]
→ Profit Faktor:   [X.XX]
→ Expectancy:      $[X] pro Trade

**Session-Split:**
→ Pre-US:    [N]T, WR [X]%, Avg $[X]
→ US Open:   [N]T, WR [X]%, Avg $[X]  [← typisch stärkste]
→ Midday:    [N]T, WR [X]%, Avg $[X]  [← typisch schwächste]
→ Last Hour: [N]T, WR [X]%, Avg $[X]

**Kontext:**
→ ATR(14): [X] Points ([NIEDRIG/NORMAL/HOCH])
→ VIX: [X] ([COMPLACENT/NORMAL/ELEVATED/PANIC])
→ Day Type: [TREND/RANGE/REVERSAL]
→ GEX: [POSITIVE/NEGATIVE]
→ Nächstes Event: [EVENT] um [TIME] CET
```

## Saisonalität

- **"Sell in May":** Statistisch leicht bearish Mai-Oktober
- **November-April:** Historisch stärkste Phase
- **September:** Schwächster Monat historisch
- **Santa Rally:** Letzte 5 Handelstage + erste 2 des neuen Jahres: +1.3% avg
- **Quad Witching:** 3. Freitag in März/Juni/Sept/Dez — extreme Vol + Volume
- **FOMC-Wochen:** Tendenz bullish AM Tag der Entscheidung, volatil danach
- **Earnings Season Start:** Erste 2 Wochen oft bullish (Erwartungen eingepreist)

## Bekannte Fallstricke

1. **Overnight Gaps:** US500 CFD kann am Montag 30-80 Points vom Freitags-Close eröffnen. Grid-Bots mit engem Grid = sofort underwater.
2. **Flash Crashes:** 2010, 2015, 2018, 2020 — alle passierten in Minuten. US500 kann 100+ Points in 10 Minuten fallen. Immer Hard Stops.
3. **0DTE Options Pinning:** Am Freitag können 0DTE Options den Index an einen Strike-Preis "pinnen". Breakout-Strategien versagen dann.
4. **Earnings After-Hours:** Ein NVDA/AAPL Miss um 22:15 CET kann einen 50-Point Gap am nächsten Morgen erzeugen. Vor großen Tech-Earnings: reduzieren.
5. **Fed Day Trap:** Erste Reaktion auf FOMC (16:00 CET) ist oft FALSCH. Der echte Move kommt in der Pressekonferenz (16:30) oder am nächsten Tag.
6. **Liquidity Vacuum:** Zwischen Weihnachten und Neujahr: extrem dünne Liquidität. 10-Point-Moves auf einzelne Orders. Bots können falsche Signale generieren.
