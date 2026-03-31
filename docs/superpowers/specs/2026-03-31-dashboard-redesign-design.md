# GoldFoundry Dashboard Redesign — "Mission Control"

**Datum:** 2026-03-31
**Status:** Approved
**Autor:** Eric + Claude

---

## Motivation

Das aktuelle Dashboard hat ein 60/40 Split-Layout (Chat links, KPIs rechts), das alle wichtigen Informationen in 40% der Breite quetscht. Die Trader-Namen sind unklar ("GoldForge" mit Einbuchstaben-Icons), DD Buffer erscheint in Rot obwohl er normal ist, Equity Curve zeigt statische Demo-Daten, und die Trades-Box ist leer. Das Dashboard muss zum professionellen Command Center werden.

## Entscheidungen

| Frage | Entscheidung |
|-------|-------------|
| Dashboard-Typ | Command Center (volle Breite, Chat wird eigene Seite) |
| Trader-Namen | Codename-Style: PHANTOM, NEXUS, SENTINEL, SPECTRE |
| DD-Darstellung | Invertierter Fortschrittsbalken (zeigt verbleibenden Buffer) |
| Datenquellen | MetaApi REST API (kostenlos, schon im Plan enthalten) |
| Chat-Platzierung | Eigene Seite im Navigation-Menu |

---

## Architektur

### Layout: Volle Breite, 3 Sektionen vertikal

```
┌─────────────────────────────────────────────────────────┐
│  EQUITY (1fr)     │  TODAY P&L (1fr)  │  DD SHIELD (2fr) │  Sektion 1
├─────────────────────────┬───────────────────────────────┤
│  PHANTOM (XAUUSD)       │  NEXUS (US500)                │
│  +€485 · WR 72% · DD   │  +€210 · WR 68% · DD          │  Sektion 2
├─────────────────────────┼───────────────────────────────┤
│  SENTINEL (DAX40)       │  SPECTRE (EURUSD)             │
│  +€180 · WR 65% · DD   │  +€95 · WR 74% · DD           │
├─────────────────────────┴───────────────────────────────┤
│  LETZTE TRADES (50%)    │  PORTFOLIO EQUITY CURVE (50%) │  Sektion 3
└─────────────────────────────────────────────────────────┘
```

---

## Sektion 1: KPI Hero Bar

Grid: `grid-cols-[1fr_1fr_2fr]` (DD Shield doppelt breit)

### Card 1 — Total Equity
- Grosse Zahl: z.B. "€26.102"
- Darunter: Tages-Trend als Pfeil + Prozent ("▲ +2.4%")
- Badge: "DEMO" (orange) oder "LIVE" (gruen)
- Hintergrund: Subtle Gold-Gradient bei positivem Trend
- Datenquelle: `/api/copier/status` → Summe aller Account-Equities

### Card 2 — Heutiges P&L
- Grosse Zahl: "+€312" (gruen) oder "-€48" (rot)
- Darunter: Anzahl Trades heute ("5 Trades")
- Mini-Sparkline der heutigen P&L-Entwicklung
- Datenquelle: `/api/copier/status` → `todayPnl` aggregiert

### Card 3 — DD Shield (doppelt breit)
- Grosser Gesamt-Buffer-Balken: Zeigt **verbleibenden** Buffer
  - Beispiel: 5% Limit, 3.9% genutzt → Balken zeigt "1.1% Buffer verbleibend"
- Pro-Trader DD Breakdown:
  ```
  PHANTOM  ██████░░  1.1%
  NEXUS    ████████░  0.5%
  SENTINEL ███████░░  0.8%
  SPECTRE  █████████  0.2%
  ```
- Max DD Limit + Peak Equity (Equity High) sichtbar
- Farb-Ampel: Gruen (>2% Buffer), Gelb (1-2% Buffer), Rot (<1% Buffer)
- Warnsymbol wenn einzelner Trader >3% DD hat
- Datenquelle: `/api/copier/status` → `ddBuffer`, `ddLimit`, `equityHigh`

---

## Sektion 2: Trader Grid

Grid: `grid-cols-2`, 4 Karten

### 4 Forge Trader

| Codename | Asset | Klarname | Farbe |
|----------|-------|----------|-------|
| PHANTOM | XAUUSD | Gold | #d4a537 |
| NEXUS | US500 | S&P 500 | #3b82f6 |
| SENTINEL | DAX40 | Deutscher Leitindex | #a855f7 |
| SPECTRE | EURUSD | Euro/Dollar | #22c55e |

### Card-Aufbau pro Trader

```
┌──────────────────────────────┐
│  ◆ PHANTOM          ACTIVE   │  Codename + Status-Badge (gruen/grau Dot)
│    XAUUSD · Gold              │  Asset-Symbol + Klarname
│                               │
│  +€485.20        +1.0%/Tag   │  Heutiger Profit (echt) + Avg Performance
│                               │
│  ~~~mini equity curve~~~~~   │  Echte Kurve, MetaApi, letzte 30 Tage
│                               │
│  DD ████░░ 1.1%              │  DD Mini-Balken mit Buffer-Anzeige
│  WR 72%  │  DD 4.5%  │ 2022  │  Stats-Leiste
└──────────────────────────────┘
```

**Verhalten:**
- Trader-Farbe als linker Border-Accent und Icon-Farbe
- Status-Badge: Gruener Dot + "ACTIVE" oder grauer Dot + "PAUSED"
- Heutiger Profit: Echte Zahl aus MetaApi Deal-History, gruen/rot gefaerbt
- Mini Equity Curve: 30-Tage echte Daten aus MetaApi
- DD Mini-Balken: Gleiche Ampel-Logik wie DD Shield
- **Card-Border wird rot wenn DD >4%** (ueberschreibt Trader-Farbe)

**Datenquellen:**
- Heutiger Profit: MetaApi `/history-deals/by-time-range` (heute)
- Equity Curve: MetaApi `/history-deals/by-time-range` (30 Tage) → kumulativ berechnen
- DD: `/api/copier/status` pro Account
- Stats (WR, Avg, Since): Hardcoded Array (wie bisher, spaeter aus DB)

---

## Sektion 3: Unterer Bereich

Grid: `grid-cols-2` (50/50 Split)

### Links — Letzte Trades

```
┌─────────────────────────────┐
│  LETZTE TRADES          10▾  │  Titel + Anzahl-Filter (5/10/20)
│                              │
│  ◆ BUY  XAUUSD   +€85.20   │  Richtung + Symbol + P&L
│    PHANTOM · 14:32 · 0.04L  │  Trader-Codename + Zeit + Lots
│                              │
│  ◆ SELL US500    +€42.10    │
│    NEXUS · 14:31 · 0.02L    │
│                              │
│  ◆ BUY  EURUSD   -€18.50   │  Rot bei Verlust
│    SPECTRE · 14:28 · 0.01L  │
└─────────────────────────────┘
```

- Echte Trades aus MetaApi Deal-History (alle Konten, sortiert nach Zeit)
- Farbiger Dot vor Codename in Trader-Farbe
- BUY/SELL Badge farbig (gruen/rot)
- P&L rechtsbuendig, gruen/rot
- Scrollbar wenn mehr Trades als sichtbar
- Datenquelle: MetaApi `/history-deals/by-time-range`

### Rechts — Portfolio Equity Curve

```
┌─────────────────────────────┐
│  PORTFOLIO EQUITY    30T▾   │  Titel + Zeitraum-Filter (7T/30T/90T/All)
│                              │
│  €26.102                     │  Aktueller Wert
│  ▲ +€1.924 (+8.0%)          │  Veraenderung im Zeitraum
│                              │
│  ┌─────────────────────┐    │
│  │    ╱‾‾‾╲    ╱‾‾‾‾   │    │  Area Chart
│  │   ╱     ╲  ╱        │    │  Gold-Gradient Fill
│  │  ╱       ╲╱         │    │  (#d4a537 → transparent)
│  │ ╱                    │    │
│  └─────────────────────┘    │
│  Mar 1        Mar 15  Mar 31 │  X-Achse mit Daten
└─────────────────────────────┘
```

- Echte Equity-Daten aggregiert ueber alle 4 Konten
- Area Chart mit SVG, Gold-Gradient Fill
- Hover-Tooltip zeigt Datum + exakten Wert
- Zeitraum-Filter: 7T, 30T, 90T, All
- Datenquelle: MetaApi Deal-History → kumulative P&L-Berechnung

---

## Navigation-Aenderung

FORGE Mentor Chat wird aus dem Dashboard entfernt und bekommt eigene Seite:

**Sidebar-Nav aktualisiert:**
```
MAIN
  ◆ Command Center     ← umbenannt von "Uebersicht"
TRADING
  📊 Trader
  🛡️ KI-Engine
  📋 Trades
KONTO
  💰 Konto
  📊 Rechner
HILFE
  🧠 FORGE Mentor      ← eigene Seite (vorher im Dashboard embedded)
  💬 Support
SYSTEM
  ⚙️ Einstellungen
```

---

## API-Aenderungen

### Neuer Endpoint: `/api/dashboard/overview`

Aggregiert alle Dashboard-Daten in einem Call:

```typescript
// Response
{
  kpis: {
    totalEquity: number,        // Summe aller Konten
    equityChange: number,       // % Veraenderung heute
    todayPnl: number,           // Summe P&L heute
    todayTrades: number,        // Anzahl Trades heute
    ddBuffer: number,           // Gesamt-DD Buffer %
    ddLimit: number,            // DD Limit %
    equityHigh: number,         // Peak Equity
  },
  traders: [
    {
      codename: string,         // "PHANTOM", "NEXUS", etc.
      asset: string,            // "XAUUSD"
      assetLabel: string,       // "Gold"
      color: string,            // "#d4a537"
      active: boolean,
      todayProfit: number,      // Echte Zahl aus MetaApi
      ddBuffer: number,         // Pro-Trader DD Buffer
      ddUsed: number,           // Pro-Trader DD genutzt
      equityCurve: number[],    // 30 Datenpunkte
    }
  ],
  recentTrades: [
    {
      direction: "BUY" | "SELL",
      symbol: string,
      pnl: number,
      trader: string,           // Codename
      traderColor: string,
      time: string,             // ISO timestamp
      lots: number,
    }
  ],
  equityCurve: {
    datapoints: { date: string, equity: number }[],
    periodChange: number,       // % Veraenderung
    periodPnl: number,          // Absoluter P&L
  }
}
```

**Daten-Aggregation im Endpoint:**
1. Lade Account-Status aus `/api/copier/status` (bestehend)
2. Lade MetaApi Deal-History fuer heute (alle 4 Konten)
3. Lade MetaApi Deal-History fuer 30 Tage (Equity Curve)
4. Mappe Accounts → Trader-Codenames via MetaApi-ID
5. Berechne kumulative Equity Curve

### Account → Trader Mapping

```typescript
const TRADER_CONFIG = [
  {
    codename: "PHANTOM",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#d4a537",
    perf: "+1.0%/Tag",
    wr: "72%",
    maxDd: "4.5%",
    since: "2022",
    metaApiId: "cb652594-04e0-4123-a89b-7528250958ed",  // Phenex
    mtLogin: "50707464",
  },
  {
    codename: "NEXUS",
    asset: "US500",
    assetLabel: "S&P 500",
    color: "#3b82f6",
    perf: "+0.7%/Tag",
    wr: "68%",
    maxDd: "3.8%",
    since: "2023",
    metaApiId: "85755595-b2ec-498c-8fbf-ee62cafd3cc6",  // Elite
    mtLogin: "50684429",
  },
  {
    codename: "SENTINEL",
    asset: "DAX40",
    assetLabel: "Deutscher Leitindex",
    color: "#a855f7",
    perf: "+0.8%/Tag",
    wr: "65%",
    maxDd: "5.2%",
    since: "2023",
    metaApiId: "66d8fe15-368b-4e3c-8c6c-ed32bea5b56b",  // Copy-Demo
    mtLogin: "50701689",
  },
  {
    codename: "SPECTRE",
    asset: "EURUSD",
    assetLabel: "Euro/Dollar",
    color: "#22c55e",
    perf: "+0.5%/Tag",
    wr: "74%",
    maxDd: "3.2%",
    since: "2022",
    metaApiId: "02f08a16-ae02-40f4-9195-2c62ec52e8eb",  // Copy-Demo 2
    mtLogin: "50701707",
  },
];
```

---

## Design-System (bestehendes Theme erweitert)

### Bestehende Variablen (keine Aenderung)
- `--gf-obsidian: #040302` (Hintergrund)
- `--gf-panel: #131316` (Card-Hintergrund)
- `--gf-gold: #d4a537` (Accent)
- `--gf-green: #22c55e` / `--gf-red: #ef4444`

### Neue Variablen
- `--gf-dd-green: #22c55e` (DD Buffer >2%)
- `--gf-dd-yellow: #eab308` (DD Buffer 1-2%)
- `--gf-dd-red: #ef4444` (DD Buffer <1%)

### Responsive Breakpoints
- Desktop (>1024px): Volles 3-Spalten KPI Grid + 2x2 Trader Grid + 50/50 Split
- Tablet (768-1024px): 2-Spalten KPI (DD Shield volle Breite darunter) + 2x1 Trader + Stack
- Mobile (<768px): Alles gestackt, 1 Spalte

---

## Scope-Abgrenzung

**In Scope:**
- Dashboard page.tsx komplett neu
- Neuer API-Endpoint `/api/dashboard/overview`
- TRADER_CONFIG Konstante mit Codenames + MetaApi Mapping
- Navigation-Update (Chat → eigene Seite)
- DD Shield Komponente
- Trader Cards mit echten Daten
- Letzte Trades mit echten MetaApi Deals
- Portfolio Equity Curve mit echten Daten

**Out of Scope:**
- FORGE Mentor Chat Funktionalitaet (bleibt gleich, wird nur verschoben)
- Trader Page Redesign (separat)
- Engine Monitor Redesign (separat)
- Account Tracking Page (separat)
- Mobile-First Redesign (responsive ja, aber Desktop-Priority)
