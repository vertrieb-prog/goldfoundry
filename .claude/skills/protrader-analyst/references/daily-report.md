# Daily Morning Report — XAUUSD & US500

Structure for the 08:00 CET automated morning briefing.

## Report Sequence (EXACT order, no skipping)

### 1. FORGE BRIEFING · [Datum] — Executive Summary (3 Sätze)
One-sentence verdict. Critical finding. Key action.

### 2. INSTRUMENT SCORECARD (NEU: Pro-Instrument-Split)

```
**XAUUSD — Letzte 24h**
→ P&L: [+/-]$[X] · [N] Trades · WR [X]% · PF [X.XX]
→ Avg Winner: +[X] Pips · Avg Loser: -[X] Pips · R:R [X:X]
→ Best Session: [London/NY] · Direction Edge: [Long/Short/Neutral]
→ ATR(14): [X] Pips ([vs 20d avg: NORMAL/HIGH/LOW])

**US500 — Letzte 24h**
→ P&L: [+/-]$[X] · [N] Trades · WR [X]% · PF [X.XX]
→ Avg Winner: +[X] Points · Avg Loser: -[X] Points
→ Day Type: [TREND/RANGE/REVERSAL]
→ VIX Close: [X] ([COMPLACENT/NORMAL/ELEVATED])
```

### 3. ACCOUNT-BY-ACCOUNT mit Instrument-Split

Pro Account:
```
**[NAME]** · [Strategy] · [Status Badge]
→ XAUUSD: [N]T, $[X], WR [X]%
→ US500:  [N]T, $[X], WR [X]%
→ Combined DD: [X]%/[MAX]% (Buffer [X]%)
→ [One-line Assessment]
```

### 4. TOP & BOTTOM TRADES (mit Instrument-Tag)
```
🏆 Top 3:
1. XAUUSD LONG → +$[X] (+[pips]pips) · [BOT] · London Session · [Warum gut]
2. US500 SHORT → +$[X] (+[pts]pts) · [BOT] · US Open · [Warum gut]
3. ...

💀 Bottom 3:
1. XAUUSD SHORT → -$[X] (-[pips]pips) · [BOT] · Asian Session · [Warum schlecht]
...
```

### 5. CROSS-INSTRUMENT CHECK
```
→ Korrelation (20d): [X.XX] ([INTERPRETATION])
→ Combined Exposure: $[X] Long, $[X] Short
→ Regime: [RISK-ON/OFF/INFLATION/LIQUIDITY]
→ Hedge Status: [GEHEDGT/UNGEHEDGT/RISIKO]
```

### 6. RISK RADAR
```
→ Offene Positionen: [N]× XAUUSD ($[floating]), [N]× US500 ($[floating])
→ DD-Proximity: [Account] bei [X]% von [MAX]%
→ Nächste Events: [EVENT] um [TIME] — [IMPACT auf Gold / US500]
→ Weekend Exposure: [JA/NEIN] — [Risiko wenn JA]
```

### 7. HANDLUNGSEMPFEHLUNGEN (max 5, pro Instrument)
```
1. 🔴 [INSTRUMENT]: [Aktion] → [Begründung]
2. ⚠️ [INSTRUMENT]: [Aktion] → [Begründung]
3. ✦ [INSTRUMENT]: [Aktion] → [Begründung]
...
```

### 8. CHALLENGE TRACKER (wenn in Challenge-Phase)
```
**CHALLENGE STATUS — Tag [N]/[MAX]**
Fortschritt:     [████████░░░░░] [X]% ($[earned] von $[target])
DD genutzt:      $[X] von $[max] (Buffer: [Y]%)
Consistency:     Score [Z] (Bester Tag: $[X] = [Y]% vom Total)
Heute erlaubt:   Max $[daily_cap] Profit · Max $[daily_risk] Risk
Lot-Empfehlung:  XAUUSD [X] Lots (bei [Y] Pip Stop) · US500 [X] Size
Tages-Plan:      [Setup-Empfehlung basierend auf Regime + Fortschritt]
```

## Tone
Kein "Guten Morgen". Kein Filler. Daten und Entscheidungen. Trader liest das um 08:00 vor dem London Open.
