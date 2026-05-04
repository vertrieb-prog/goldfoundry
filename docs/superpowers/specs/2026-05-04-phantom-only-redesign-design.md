# Phantom-Only Redesign — Design Spec

**Datum:** 2026-05-04
**Scope:** Gold Foundry Website (Landing + Dashboard) auf einen einzigen Trader (PHANTOM) reduzieren. Backend-Architektur (API, Cron, Contabo-Server) bleibt unberührt. Sentinel-Bereich bleibt unverändert.
**Trigger:** Nur noch ein Live-Trader (neuer PHANTOM-Account `e534fb5e-c8f7-44e3-a4f9-ab49b3e76d77`, "PHANTOM Ronja TegasFX", aktiv seit 2026-05-04). Die alten 4 Trader (APEX, RONIN, AEGIS, TITAN) sind raus.

## Ziel

Landing-Page und Dashboard erzählen eine fokussierte Solo-Trader-Story. Statt "7 Strategien · 1 Engine" wird daraus "Ein Trader. Ein Asset. Live verifiziert." Die UI zeigt überall nur noch PHANTOM und seine Live-Daten.

## Architektur — was sich ändert

### `src/lib/trader-config.ts`

Reduktion von 5 auf 1 Eintrag. Helper-Funktionen `getTraderByMetaApiId` / `getTraderByLogin` bleiben (werden in API-Routes verwendet).

```ts
export const TRADER_CONFIG: TraderConfig[] = [
  {
    codename: "PHANTOM",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#d4a537",
    perf: "0%",
    wr: "0%",
    maxDd: "0%",
    since: "2026",
    metaApiId: "e534fb5e-c8f7-44e3-a4f9-ab49b3e76d77",
    mtLogin: "",
  },
];
```

`perf` / `wr` / `maxDd` sind Fallback-Strings für UI-Komponenten, die ohne Live-Daten rendern. Echte Zahlen kommen aus MetaStats über `/api/lp/stats`.

`mtLogin` bleibt vorerst leer und wird beim ersten Boot oder manuell nachgepflegt, sobald aus MetaApi bekannt.

### `src/app/page.tsx` — Landing Page (komplette Storyline-Überarbeitung)

**Hero:**
- Headline: `Ein Trader. Ein Asset. Live verifiziert.`
- Subline: `PHANTOM tradet ausschließlich Gold. Live-Account, MetaApi-verifiziert, jede Position transparent.`
- Badge oben: `PHANTOM · GOLD TRADER · LIVE` (bleibt)
- Live-Counters bleiben: Portfolio (Equity), 72h-Profit, Winrate

**Was raus kommt:**
- "7 Strategien"-Counter und Multi-Strategie-Texte
- "Aktive Strategien"-Stat in `SocialProof`
- Profit-Tabelle (24h/72h/7d/30d pro Account) in `page.tsx` Zeile ~456-522 — komplett entfernt
- "Gleiche Engine, unterschiedliches Risiko"-Subtext bei `LeverageCards`
- `ProfitCalculator`-Subline "Basierend auf PHANTOMs historischer Performance" wird zu `Basierend auf PHANTOMs Live-Performance` (oder bleibt — "PHANTOM" ist ja jetzt der einzige Trader)

**Was rein kommt / angepasst:**
- Neue Section "Warum nur Gold?" zwischen `StrategyEngine` und `PerformanceChart`. Drei Bullets: Klarer Edge, kein Asset-Hopping, ein Setup das immer wieder triggert. Reine Marketing-Section, ~120 Zeilen oder weniger.
- Trust-Line bekommt aktualisierte Items: `Live verifiziert · Tegas FX White-Label · 100% kostenlos`
- LeverageCards bleiben unverändert (Hebel sind Risk-Profile, nicht Trader)

### `src/components/landing/StrategyEngine.tsx`

Umbau auf Single-Trader-Darstellung. Statt einer Liste von 5 Trader-Cards rendert die Komponente eine prominente PHANTOM-Card mit Live-Stats und Strategie-Beschreibung.

### `src/components/landing/PerformanceChart.tsx`

Multi-Account-Logik (`myfxbook.accounts.map`) raus. Chart zeigt nur die eine Equity-/Drawdown-/Growth-Curve, die bereits aus `/api/lp/stats` kommt.

### `src/components/landing/HowItWorks.tsx`

Texte auf "PHANTOM" / "Gold" anpassen. Wenn dort "5 Trader" oder "Multi-Strategie" steht — raus.

### `src/components/landing/CTASection.tsx`

Texte prüfen, jede Multi-Trader-Referenz entfernen.

### `src/components/landing/FunnelOverlay.tsx`

Trader-Auswahl-Schritt raus, falls vorhanden. Es gibt nur PHANTOM, keine Auswahl mehr nötig.

### `src/components/landing/LiveStatsBar.tsx`

Bleibt unverändert — zeigt bereits Aggregat-Stats, die jetzt halt nur noch von einem Account kommen.

### `src/app/dashboard/trader/page.tsx`

- Trader-Auswahl entfernen (Liste, Filter, Tabs für mehrere Trader)
- Direkt PHANTOM-Detail-View rendern
- Wenn die Seite vorher eine Übersicht aller Trader war → wird zur Phantom-Profil-Seite

### `src/app/dashboard/onboarding/page.tsx`

Trader-Auswahl-Schritt entfernen. User wird automatisch auf PHANTOM gesetzt.

### `src/app/dashboard/page.tsx` (Dashboard-Home)

Falls dort eine "Wähle deinen Trader"-Sektion existiert — raus.

## Was unverändert bleibt

- **`src/app/api/lp/stats/route.ts`** — iteriert weiter über `TRADER_CONFIG`, läuft halt nur noch einmal durch. Kein Code-Change nötig.
- **`src/app/sentinel/`** — komplette Phantom-Suite-Marketing-Welt (Guardian, DSS, Copier, Airbag, News-Shield, Trail-Pro). Eigenständige MQL5-Listing-Story, hat keinen Bezug zur Trader-Liste.
- **Contabo-Server** — `phenex-listener.mjs` läuft bereits mit dem neuen `e534fb5e-...`-Account. Keine Änderung dort.
- **Admin-Bereich** (`src/app/admin/`) — Trader-Listing zeigt halt nur noch einen Eintrag. Kein Code-Change.
- **Risikohinweis** auf Landing-Page bleibt sichtbar (CLAUDE.md-Pflicht).

## Datenfluss

```
Contabo phenex-listener.mjs (e534fb5e-...)
    ↓ (Trades auf TegasFX MT-Server)
MetaApi (Cloud)
    ↓ (Live-Polling alle 30s)
src/app/api/lp/stats/route.ts
    ↓ (JSON-Aggregate)
src/app/page.tsx + src/app/dashboard/*
```

## Storyline-Vorher/Nachher

| Element | Vorher | Nachher |
|---|---|---|
| Hero-Headline | `{X}€ Portfolio.` | `Ein Trader. Ein Asset. Live verifiziert.` |
| Subline | "7 Strategien. {wr}% Winrate. Live verifiziert." | "PHANTOM tradet ausschließlich Gold. Live-Account, MetaApi-verifiziert, jede Position transparent." |
| Trust-Items | "Live verifiziert · {wr}% Winrate · 100% Kostenlos" | "Live verifiziert · Tegas FX White-Label · 100% kostenlos" |
| StrategyEngine | 5 Trader-Cards | 1 PHANTOM-Card mit ausführlicher Strategie-Erklärung |
| Profit-Tabelle | 5 Reihen + Total | komplett entfernt |
| "Aktive Strategien" Counter | `7` | entfernt |

## Verifikation

1. `npm run build` läuft ohne Fehler durch.
2. `npm run dev` starten, `http://localhost:3000` öffnen:
   - Hero zeigt neue Headline / Subline.
   - Keine Profit-Tabelle mehr sichtbar.
   - StrategyEngine zeigt nur PHANTOM.
   - LiveStatsBar zeigt sinnvolle Werte (kein 0/0/0/0).
   - Risikohinweis im Footer / am Ende der Page sichtbar.
3. `curl http://localhost:3000/api/lp/stats | jq '.accounts | length'` → muss `1` sein.
4. Dashboard `/dashboard/trader` öffnen — keine Trader-Auswahl, direkt Phantom-Detail.
5. Onboarding `/dashboard/onboarding` öffnen — kein Trader-Auswahl-Schritt.
6. Sentinel `/sentinel` öffnen — unverändert, weiterhin alle 6 Produktseiten erreichbar.

## Out of Scope

- Backend-Refactoring der `lp/stats`-Route (läuft schon korrekt)
- Sentinel-Marketing-Pages (separate Welt)
- Admin-UI-Polishing (nur 1 Trader im Listing — egal)
- Cron-Jobs / Risk-Engine / Trade-Manager (Contabo-Server-Land)
- Datenbank-Migrations (kein Schema-Change nötig)

## Risiken

- **MetaStats-Daten am Tag 1:** Account ist erst seit 2026-05-04 aktiv. Wenn die `/api/lp/stats`-Route noch keine historischen Curves liefert, sind PerformanceChart und Profit-Counter leer. UI muss damit graceful umgehen (Fallback-Texte, "Sammeln läuft").
- **Stale Imports:** Komponenten könnten Felder importieren, die nach dem Multi-Account-Cleanup nicht mehr existieren. `npm run build` sollte das fangen — aber jeder Build-Error ist ein potenzieller Hinweis auf vergessene Reste.
- **`mtLogin` ist leer:** Wenn API-Routes auf `mtLogin` deferenzieren, müssen sie das robust handhaben. Vor dem Deploy: `mtLogin` aus MetaApi pullen und in `trader-config.ts` setzen.
