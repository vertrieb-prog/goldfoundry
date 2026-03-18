# Anomaly Detection — XAUUSD & US500

Proactive scanning. Silent when normal. Loud when not.

## XAUUSD-Specific Anomalies

### Gold Flash Crash Pattern
```
Trigger: Gold drops >80 Pips in <10 minutes
Frequency: 2-3× per year, often Asian Session
Impact: Stop cascades, liquidity vacuum, spread explosion
Detection: Sudden spike in closed trades (all stops hit simultaneously)

Action:
→ Sofort alle Gold-Bots pausieren
→ Spread-Normalisierung abwarten (15-30min)
→ Prüfen ob Grid-Bots in Underwater-Positionen gefangen sind
→ Oft Bounce danach → nicht sofort reverse traden
```

### Gold Spread Anomaly
```
Trigger: Spread > 2× Normal für die aktuelle Session
Normal: Asian 15-25 Pips, London 8-15 Pips, NY 10-18 Pips
Alert: Asian > 40, London > 25, NY > 30

Causes: Holiday thin liquidity, pre-NFP, geopolitical shock
Impact: Scalper verlieren sofort durch Entry-Cost
Action: Scalping-Bots pausieren bis Spread normalisiert
```

### Gold Session Drift
```
Trigger: >25% der Trades in einer Session mit WR < 40%
Example: Bot tradet Asian Session mit 33% WR obwohl London 78% WR hat
Impact: Vermeidbare Verluste durch falsche Session-Exposure
Action: Bot auf profitable Sessions beschränken
```

### Gold Swap Bleed
```
Trigger: Kumulative Swap-Kosten > 10% des Bruttogewinns
Common: Gold-Long-Positionen über mehrere Tage
Impact: Schleichender P&L-Verlust
Detection: Net P&L sinkt obwohl Win Rate stabil bleibt
Action: Haltezeit verkürzen oder Swap-freien Broker prüfen
```

### Gold Correlation Flip
```
Trigger: DXY-Gold Korrelation dreht von negativ auf positiv
Normal: -0.80 bis -0.90
Anomaly: > -0.30 oder positiv
Meaning: Liquiditätskrise oder Safe-Haven-Überlauf
Impact: Korrelations-basierte Bots brechen
Action: Warnung aussprechen, Lot-Reduktion
```

## US500-Specific Anomalies

### Gap Risk Detection
```
Trigger: Overnight-Position offen + High-Impact Event (Earnings, Fed)
Risk: Gaps von 30-80 Points möglich
Detection: Offene US500-Positionen nach 22:00 CET

Action:
→ Berechne: Position × Avg Gap (30 pts) × Point Value
→ Wenn > 30% DD-Buffer → Warnung
→ Vor großen Tech-Earnings (NVDA, AAPL): Immer flat gehen
```

### VIX Spike Alert
```
Trigger: VIX steigt >20% intraday
Impact: Regime-Wechsel von Risk-On zu Risk-Off
Detection: VIX Level-Checks bei jedem Daten-Refresh

Action:
→ US500-Long-Bots auf Pause
→ Bestehende Longs enger stoppen
→ Gold-Long als Hedge erwägen
→ VIX > 35: Historisch guter Long-Entry 1-3 Tage später
```

### Opening Range Failure
```
Trigger: ORB-Bot hat >3 konsekutive Verluste
Possible Cause: Positive GEX (Dealer pinning), Range-Day Regime
Detection: Rolling 5-Trade WR für ORB < 30%

Action:
→ GEX-Regime prüfen (positive GEX = ORB weniger effektiv)
→ Lots halbieren bis Regime-Bestätigung
→ Nicht paniken: ORBs haben natürliche Losing Streaks
```

### Midday Chop Trap
```
Trigger: Bot tradet aktiv in 17:00-19:00 CET (Midday Lull)
Impact: Choppy Price Action, viele Fake-Breakouts
Detection: >20% der Trades in Midday Session mit <45% WR

Action:
→ Bot-Parameter: Session-Filter auf 15:30-17:00 + 21:00-22:00
→ Midday nur für Grid-Bots (Mean-Reversion)
```

### Friday Expiry Pinning
```
Trigger: US500 bewegt sich Freitagnachmittag kaum (0DTE Pinning)
Impact: Breakout-Strategien generieren Fake-Signals
Detection: Freitag-Range < 50% von Donnerstag-Range

Action:
→ Breakout/ORB Bots am Freitag nach 18:00 CET pausieren
→ Mean-Reversion/Grid Bots können profitieren
```

## Cross-Instrument Anomalies

### Correlation Breakdown
```
Trigger: 10-Day rolling Korrelation weicht >0.4 vom 90-Day Durchschnitt ab
Example: Historisch -0.30, plötzlich +0.50 (beide steigen zusammen)
Meaning: Regime-Shift. Wahrscheinlich Liquiditäts-getrieben.
Impact: Natural Hedges funktionieren nicht mehr

Action:
→ Combined Exposure sofort berechnen
→ Wenn beide gleich gerichtet: eine Seite reduzieren
→ Regime-Matrix konsultieren für neuen Kontext
```

### Simultaneous DD Spike
```
Trigger: XAUUSD-Bot UND US500-Bot verlieren gleichzeitig >1% in 4h
Meaning: Marktbreites Event (z.B. Liquidity Drain, Flash Crash)
Impact: Portfolio-DD beschleunigt doppelt so schnell

Action:
→ SOFORT alle Bots pausieren
→ Event identifizieren (News? Liquidität? Technisch?)
→ Erst nach Stabilisierung (30-60min) schrittweise reopenen
→ Gold zuerst (oft Recovery schneller als Index)
```

### Hedging Drift
```
Trigger: Portfolio war gehedgt (Gold Long + US500 Short), aber ein Bein wurde geclosed
Result: Ungewollte Netto-Exposure
Detection: Direction-Analyse nach jedem Trade-Close

Action:
→ Warnung: "HEDGE BROKEN — Gold ist jetzt ungehedgt Long"
→ Entweder US500-Bein wieder aufbauen oder Gold reduzieren
```

## Severity Classification

| Level | Trigger | Action |
|-------|---------|--------|
| 📊 INFO | Patterns, Saisonalität, Korrelationsshifts | Im Tagesreport erwähnen |
| ⚠️ WARNING | Performance-Abfall, Session-Drift, Spread-Anomalie | In jeder Antwort highlighten |
| 🔴 CRITICAL | DD-Beschleunigung, Flash Crash, Gap-Risiko | Satz #1 in JEDER Antwort |
| 🚨 EMERGENCY | Margin Call Proximity, DD Limit Breach | Override alle andere Analyse |

## Auto-Scan Reihenfolge (bei jedem Daten-Refresh)

```
1. 🚨 Margin/DD Check (alle Accounts)
2. 🔴 DD-Velocity (beschleunigt sich der Drawdown?)
3. ⚠️ Floating Loss Cluster (Grid-Positionen underwater?)
4. ⚠️ Gap Risk (offene Positionen vor Event/Weekend?)
5. ⚠️ Correlation State (Gold+US500 gleichgerichtet?)
6. 📊 Performance Deviation (WR/PF unter Benchmark?)
7. 📊 Session/Time Anomalies (Trades in falscher Session?)
8. 📊 Instrument-Specific Patterns (VIX spike, Gold spread, etc.)
```
