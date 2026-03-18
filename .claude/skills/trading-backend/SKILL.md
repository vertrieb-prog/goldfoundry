---
name: trading-backend
description: Write or modify trading backend modules for Gold Foundry. Covers MetaApi integration, risk engine, trade manager, signal parser, prop-firm rules, lot calculation, session timing, and DD management. Use whenever working on any code in src/lib/copier/, src/lib/trade-manager/, src/lib/shield/, or any trading logic.
---

# Trading Backend Module Development

## Import Convention (IMMER)
```typescript
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cachedCall, jsonCall, PROMPTS } from "@/lib/ai/cached-client";
import { MODELS, BROKERS, RISK_THRESHOLDS } from "@/lib/config";
```

## MetaApi Pattern
```typescript
import MetaApi from "metaapi.cloud-sdk";
const api = new MetaApi(process.env.METAAPI_TOKEN!);
const account = await api.metatraderAccountApi.getAccount(accountId);
await account.waitConnected();
const conn = account.getRPCConnection();
await conn.connect();
await conn.waitSynchronized();
// Jetzt: conn.createMarketBuyOrder(), conn.getPositions(), etc.
```

## Lot-Size Berechnung
```typescript
function calculateLots(balance: number, riskPct: number, slPips: number, pipValue: number): number {
  const riskAmount = balance * (riskPct / 100);
  const lots = riskAmount / (slPips * pipValue);
  return Math.round(lots * 100) / 100; // 2 Dezimalstellen
}
// Tag Markets: riskPct = 1.0 (normal)
// Tegas FX: riskPct = 0.5 (halbiert wegen Trailing DD)
```

## Prop-Firm DD Management
```typescript
// VOR jedem Trade prüfen:
const ddBuffer = account.equity - (account.balance * (1 - broker.dd / 100));
const ddPct = (ddBuffer / account.balance) * 100;

if (ddPct < RISK_THRESHOLDS[broker].ddKillSwitch) {
  // KILL SWITCH — alle Trades sofort schließen
  await closeAllPositions(conn);
  return { action: "KILLED", reason: "DD Buffer critical" };
}
if (ddPct < RISK_THRESHOLDS[broker].ddPause) {
  // PAUSE — keine neuen Trades
  return { action: "PAUSED", reason: "DD Buffer low" };
}
if (ddPct < RISK_THRESHOLDS[broker].ddReduceLots) {
  // Lots um 50% reduzieren
  lots *= 0.5;
}
```

## Trade Manager Decisions
Der Trade Manager wird TRIGGER-basiert aufgerufen (nicht alle 30 Sek):
- R-Multiple Meilenstein (1R, 2R, 3R erreicht)
- SL in Gefahr (<30% Abstand zum Preis)
- Trade > 2h ohne signifikante Bewegung
- Session-Wechsel (Asian→London, London→NY)
- News Event in <30 Minuten

Output ist IMMER JSON:
```json
{"decision":"HOLD|TIGHTEN_SL|PARTIAL_CLOSE|MOVE_BE|CLOSE_ALL|WIDEN_SL",
 "newSL":null,"closePercent":null,"confidence":0-100,
 "reason":"max 15 Wörter"}
```

## 4-Split Order System
Jeder Trade wird in 4 Teile gesplittet (je 25%):
- TP1: Konservativ (schließt 25%, SL → BE)
- TP2: Normal (schließt 25%)
- TP3: Extended (schließt 25%)
- Runner: Kein TP, Trailing Stop (25%)

## News-Schutz
15 Min vor und nach: FOMC, NFP, CPI, EZB, BOE, RBA
→ Keine neuen Trades
→ Bestehende Trades: SL auf BE wenn möglich
→ Bei Tegas FX: 30 Min Block (strenger)

## Symbol Mapping
Broker haben unterschiedliche Symbol-Namen:
```
Standard: XAUUSD → Tag: XAUUSD → Tegas: XAUUSD → IC Markets: XAUUSD
Standard: EURUSD → Manche Broker: EURUSDm oder EURUSD.a
```
Immer `symbol_mapping` Tabelle in Supabase konsultieren.

## Token-Effizienz
- Haiku (MODELS.fast) für: Parser, Trade Manager, Channel Scanner, alle Crons
- Sonnet (MODELS.smart) NUR für: FORGE Mentor Chat, Strategy Advisor
- Prompts unter 400 Tokens für Haiku-Calls
- JSON-Output anfordern (spart Output-Tokens)
- cache_control: { type: "ephemeral" } auf System-Prompts

## Error Handling
```typescript
try {
  const result = await conn.createMarketBuyOrder(symbol, lots, sl, tp);
  await supabaseAdmin.from("trades").insert({ ... });
} catch (err) {
  console.error(`[TRADE ERROR] ${symbol} ${lots}L:`, err);
  // Bei Trade-Fehlern: NIEMALS automatisch retry
  // Logge den Fehler, informiere den User
  await supabaseAdmin.from("crm_activities").insert({
    user_id: userId, type: "trade_error", detail: { error: String(err), symbol, lots }
  });
}
```
