# Risk Analysis — XAUUSD & US500 Specific

## Instrument-Specific Risk Profiles

### XAUUSD Risk Characteristics
```
Worst-Case Move (5min):    80-150 Pips (Flash Crash Scenario)
Worst-Case Move (1h):      200-400 Pips (NFP/FOMC)
Typical Slippage:          2-5 Pips (normal), 10-30 Pips (news)
Swap Cost (Long):          ~$5-15/lot/day (varies by broker)
Weekend Gap Risk:          20-80 Pips
Pip Value at 1.0 Lot:     $10.00
```

**Position Size Formula (XAUUSD):**
```
Max Lots = (Account Balance × Max Risk %) / (Stop Loss in Pips × $10)

Example: $100,000 × 1% Risk = $1,000 budget
Stop: 30 Pips → $1,000 / (30 × $10) = 3.33 lots max
```

**DD Stress Test (XAUUSD):**
```
Scenario: What if Gold drops 300 Pips (typical FOMC move)?
Impact = Open Lots × 300 × $10 per lot
If Impact > 50% of remaining DD Buffer → REDUCE IMMEDIATELY
```

### US500 Risk Characteristics
```
Worst-Case Move (5min):    30-60 Points (Flash Crash)
Worst-Case Move (1h):      80-200 Points (Black Swan)
Typical Slippage:          0.5-2 Points (normal), 5-15 Points (news)
Overnight Gap:             10-50 Points (typical), 80+ (earnings/geopolitik)
Point Value:               Broker-specific (check contract spec)
```

**Position Size Formula (US500):**
```
Max Size = (Account Balance × Max Risk %) / (Stop Loss in Points × Point Value)
```

**DD Stress Test (US500):**
```
Scenario A: 100-Point overnight gap (Earnings Miss)
Scenario B: 200-Point intraday crash (VIX spike to 40)
Calculate: Open Position × Scenario Points × Point Value
If > 50% DD Buffer → Reduce before US Close
```

## Combined Portfolio Risk

### Step 1: Calculate Per-Instrument Exposure
```
XAUUSD Exposure = Total Open XAUUSD Lots × Current Price × Contract Size
US500 Exposure = Total Open US500 Size × Current Level × Point Value
Combined = |XAUUSD Exposure| + |US500 Exposure|
```

### Step 2: Direction Analysis
```
If XAUUSD Net Long AND US500 Net Long → "Gleichgerichtet Risk-On"
If XAUUSD Net Long AND US500 Net Short → "Inflation Hedge"
If XAUUSD Net Short AND US500 Net Long → "Risk-On, Anti-Gold"
If XAUUSD Net Short AND US500 Net Short → "Gleichgerichtet Risk-Off"
```

Gleichgerichtete Positionen = höheres Regime-Risiko.

### Step 3: Worst-Case Portfolio Scenario
```
XAUUSD Worst Case: [Open Lots] × [ATR × 2] × $10
US500 Worst Case:  [Open Size] × [ATR × 2] × Point Value
Combined WCS:      XAUUSD WCS + US500 WCS (if same regime direction)
                   MAX(XAUUSD WCS, US500 WCS) (if hedged)

If Combined WCS > DD Buffer → ALERT CRITICAL
```

## DD Buffer & Action Framework

| Buffer | Level | XAUUSD Action | US500 Action |
|--------|-------|---------------|--------------|
| >70% | ✦ NOMINAL | Normal lots, full sessions | Normal, overnight ok |
| 40-70% | ⚡ CAUTION | -30% lots, skip Asian | -30%, no overnight holds |
| 20-40% | ⚠️ WARNING | -60% lots, London only | -60%, US Open only, no gaps |
| <20% | 🔴 CRITICAL | PAUSE Gold. 0 lots. | PAUSE. 0 positions. |

## Event Risk Calendar

Always check and include in risk analysis:
```
Before London Open (08:00):
→ Any GBP/EUR data? (mild Gold impact)
→ Asian Session anomalies?

Before NY Open (14:30-15:30):
→ US Data releases? (NFP, CPI, Retail Sales)
→ If YES: Calculate event-risk buffer needed

Before Close (22:00):
→ Any after-hours earnings? (US500 gap risk)
→ Fed speakers overnight? (Gold gap risk)

Weekend:
→ Geopolitical risk elevated? (reduce Friday EOD)
→ G7/G20/OPEC meetings? (potential Monday gap)
```

## Response Pattern

1. **DD Status per Account** — Badges, numbers, one line each
2. **Instrument Exposure** — XAUUSD lots + US500 size + direction
3. **Correlation State** — Hedged or exposed?
4. **Worst-Case Scenario** — Quantified in dollars
5. **Event Calendar** — Next 24h risks
6. **Action Items** — Numbered, by instrument, specific lots
