---
name: telegram-integration
description: Build or modify the Telegram Signal Copier system. Covers GramJS listener, signal parsing with AI, channel scanning for scam detection, smart order execution, delayed SL/TP updates, and message handling. Use when working on src/lib/telegram-copier/ or any Telegram-related feature.
---

# Telegram Signal Copier System

## Architecture
```
Telegram Channel → GramJS Listener → AI Parser (Haiku) → Risk Engine → MetaApi Executor
                                         ↓
                                  Channel Scanner (Bewertung)
```

## GramJS Setup
```typescript
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
// WICHTIG: telegram ist Server-only. NIE in Client-Komponenten importieren.
const client = new TelegramClient(
  new StringSession(process.env.TELEGRAM_SESSION!),
  parseInt(process.env.TELEGRAM_API_ID!),
  process.env.TELEGRAM_API_HASH!,
  { connectionRetries: 5 }
);
```

## Signal Parsing
Nutze `PROMPTS.signalParser` + `jsonCall()`:
```typescript
const parsed = await jsonCall({
  prompt: PROMPTS.signalParser,
  message: rawTelegramMessage,
  model: MODELS.fast,  // Haiku — schnell + günstig
});
// parsed = { action, symbol, entryPrice, stopLoss, takeProfits[], confidence, ... }
```

Parser versteht JEDES Format:
- "BUY GOLD 2148 SL 2138 TP 2158 2165 2175"
- "xau long sl 38 tp 58 65"
- "buy xauusd" (ohne SL/TP → wartet auf Update)
- "sl 2138 tp 2152" (Modification einer bestehenden Position)
- "close half" / "be" / "breakeven" (Partial Close / Move BE)

## Channel Scanner
Bewertet Channels BEVOR Signale kopiert werden:
- Win Rate (30/60/90 Tage)
- Fake Detection (editierte/gelöschte Signale)
- R:R Check
- Signal-Frequenz (zu viele = Spam)
- Drawdown-Simulation
- Affiliate-Erkennung

Output: `{ legit: true/false, score: 0-100, redFlags: [...] }`

## Smart Orders
- 4-Split: TP1/TP2/TP3/Runner je 25%
- Delayed SL/TP: Trader schickt erst "buy xau" dann später "sl 2138 tp 2152"
- Auto-BE nach TP1 Hit
- Trailing Runner mit dynamischem Abstand
- "be" Command → Move all to Breakeven
- "close half" → Partial Close 50%

## Datenbank
- `telegram_channels` — Channel-Status, Scan-Ergebnis, Win Rate
- `telegram_signals` — Jedes Signal mit parsed JSON + Execution Result
