# GF Phenex Trading

Adaptive XAUUSD trade copier connected to the **THE TRADING PHENEX** Telegram channel via MetaApi.

## Briefing for Google Jules / Code Review Agents

The **goal** of this project is **adaptive trade management**: signals from the Phenex Telegram channel are copied to a live MetaApi account, and an additional **market scanner** classifies the live regime (trend / range / high-vol / news) so the trade-management logic can be matched to the market phase rather than always using the same static rule set.

**The single most important hypothesis we want validated/improved by an external agent:**
> A static `STAIR_STEP_BE` management is sub-optimal. A market-state-aware switcher (this repo's `phenex-market-scanner.mjs`) selecting between `CHANDELIER_RUN`, `FAST_LOCK`, `WIDE_DEFENSE`, `STAIR_TIGHT`, `EARLY_BE` based on live ATR/ADX/structure/session/news will outperform the static version.

## Repo Layout

| File | Role |
|------|------|
| [phenex-listener.mjs](phenex-listener.mjs) | Telegram → MetaApi copier. Parses signals, splits into 4 orders, manages BE/SL/TP based on trader-channel edits. |
| [phenex-market-scanner.mjs](phenex-market-scanner.mjs) | NEW. Reads OHLC from MetaApi every 30 s, computes ATR(14) / ADX(14) / market structure / session / daily-range, classifies the phase, writes `market-state.json`. Read-only — never sends trades. |
| [ecosystem.config.cjs](ecosystem.config.cjs) | PM2 config (Windows server). Tokens are pulled from env vars — `.env.example` shows required keys. |
| [package.json](package.json) | Minimal deps. Telegram client lib + node 18+ built-in fetch. |

## Live Architecture (current production)

```
Telegram channel "THE TRADING PHENEX"
        │  gramjs polling (1 s)
        ▼
phenex-listener.mjs
   ├── parse signal (BUY/SELL XAUUSD @entry SL:x TPs:y/z/...)
   ├── split into 4 orders, risk-based lot sizing (1 % equity / SL distance)
   ├── HARD-SL guard, pyramiding cap (2 / symbol), recovery filter,
   │   daily-DD cutoff, MetaApi health probe
   ├── stair-step trail (TP1 hit → no SL change, TP2 → SL=TP1, TP3 → SL=TP2)
   └── trader-edit override: "BE", "SECURE", "TRAIL", "PARTIAL n %", "SL <new>"
        ▼
MetaApi REST API   (account ID hidden in env)
        ▼
TegasFX MT5 live account
```

## Phase-Aware Management (proposed in `phenex-market-scanner.mjs`)

Scanner writes `market-state.json` like:

```json
{
  "ts": "2026-05-07T08:00:00.000Z",
  "symbol": "XAUUSD",
  "lastClose": 4724.32,
  "session": "LONDON",
  "atr": { "m5": 0.62, "m15": 1.85 },
  "adx": { "adx": 31.2, "pDI": 18.4, "mDI": 28.1 },
  "structure": "LH-LL",
  "phase": "STRONG_TREND_DOWN",
  "selectedStrategy": "CHANDELIER_RUN",
  "reason": "ADX 31 + LH-LL"
}
```

### Strategy table (current first draft — open to challenge)

| Phase                | Strategy        | Trail rule | TP4-runner? | Re-entry?  |
|----------------------|-----------------|------------|-------------|------------|
| `STRONG_TREND_*`     | CHANDELIER_RUN  | 1.5×ATR    | yes, no TP  | yes, aligned |
| `RANGE`              | FAST_LOCK       | none       | no          | no |
| `HIGH_VOLATILITY`    | WIDE_DEFENSE    | none, BE only on +2×ATR | no | no |
| `EXPANSION`          | STAIR_TIGHT     | tight stair-step after each TP | yes | yes |
| `WEAK_TREND`         | STAIR_STEP      | TP1→noop, TP2→SL=TP1 | yes | conditional |
| pre-news (≤15 min)   | LOCK_DOWN       | force BE on all open | no | blocked |

## What we want from a review agent

1. **Indicator quality** — is the Wilder ADX in `phenex-market-scanner.mjs` numerically stable on M15 candles? (We default to `period=14`.)
2. **Phase classifier** — the rules in `classify()` are first-draft. Suggest more robust thresholds, especially the boundary between `WEAK_TREND` and `RANGE`.
3. **Strategy-to-phase mapping** — argue / refute the table above with backtest reasoning.
4. **News integration** — recommend a free news source we can poll (ForexFactory XML / FXStreet) and how to plug `newsWindow:true` into the scanner.
5. **Backtest harness** — propose how to replay 30 days of `phenex-listener` JSONL log + 30 days of MetaApi M5 candles to score each strategy.
6. **Dangerous edge cases** in the current `phenex-listener` code (signal parser, risk calc, trader-edit detection). Anything that could cause an unintended trade or skipped SL.

## Real example from today (2026-05-07)

```
06:39  Signal: SELL XAUUSD @ 4747.75 SL=4760 TPs=[4736,4680,4660,4630,4580]
06:39  HIGH-RISK trader-warning → lot halved (0.21 → 0.10 per split)
06:39  4 orders filled, avg entry 4738.96, total 0.4 lot, SL 4760
06:42  Drawdown peak: equity −€130
06:47  Trader: "900 pips from best entry" → SECURE: SL → 4733.96
06:56  Trader: "TP1 hit, +1450 pips"     → BREAK_EVEN: SL → 4737.46
06:56  All 4 closed at SL 4737.46 → realized +€52
```

The market kept dropping for 12 more minutes after BE triggered. A `CHANDELIER_RUN` strategy on `STRONG_TREND_DOWN` would not have moved SL to BE; estimated outcome **+€200 to €400** vs. the actual €52.

## Hard rules (do NOT regress)

- Never widen an existing SL.
- Never enter without a SL (HARD-SL-MISS guard).
- Trader edits in the channel always override the scanner-driven strategy.
- Lot sizing is `equity × risk% / SL_distance`, never fixed lots.
- Pyramiding cap stays at 2 positions per symbol.

## License

Private, proprietary. Not for public redistribution.
