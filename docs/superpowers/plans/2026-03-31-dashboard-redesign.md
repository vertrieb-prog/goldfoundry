# Dashboard Redesign "Mission Control" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Komplettes Dashboard-Redesign von 60/40 Chat-Split zu Full-Width "Mission Control" mit echten MetaApi-Daten, neuen Trader-Codenames (PHANTOM/NEXUS/SENTINEL/SPECTRE), prominentem DD Shield, und PhoenixOne-level Design-Qualitaet.

**Architecture:** Full-width Dashboard mit 3 vertikalen Sektionen (KPI Hero Bar, 2x2 Trader Grid, Trades+Equity Split). Ein neuer aggregierter API-Endpoint `/api/dashboard/overview` sammelt alle Daten. FORGE Chat wird auf eigene Seite verschoben. Framer Motion fuer Animationen, Radial Gradients fuer Glows, Monospace fuer Zahlen.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, Framer Motion (neu), MetaApi REST API, Supabase

**Spec:** `docs/superpowers/specs/2026-03-31-dashboard-redesign-design.md`

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `src/lib/trader-config.ts` | TRADER_CONFIG Konstante mit Codenames, Farben, MetaApi-IDs |
| `src/app/api/dashboard/overview/route.ts` | Aggregierter Dashboard-API-Endpoint |
| `src/components/dashboard/KpiHeroBar.tsx` | 3 KPI Cards (Equity, P&L, DD Shield) |
| `src/components/dashboard/TraderGrid.tsx` | 2x2 Trader Cards mit Equity Curves |
| `src/components/dashboard/TraderCard.tsx` | Einzelne Trader Card Komponente |
| `src/components/dashboard/RecentTrades.tsx` | Letzte Trades Liste |
| `src/components/dashboard/EquityCurve.tsx` | Portfolio Equity Area Chart |
| `src/components/dashboard/DdShield.tsx` | DD Shield Komponente mit Pro-Trader Breakdown |
| `src/components/ui/animated-number.tsx` | Animated Value Counter |
| `src/components/ui/mini-chart.tsx` | Wiederverwendbare Mini SVG Equity Curve |

### Modified Files
| File | Changes |
|------|---------|
| `src/app/dashboard/page.tsx` | Komplett neu — Mission Control Layout |
| `src/app/dashboard/layout.tsx` | Nav-Update: "Command Center" + Chat eigene Seite |
| `src/app/dashboard/chat/page.tsx` | FORGE Chat als eigene Seite (Code aus page.tsx verschieben) |
| `src/app/dashboard/trader/page.tsx` | Neue Codenames aus TRADER_CONFIG |
| `src/components/landing/TraderProfiles.tsx` | Neue Codenames |
| `src/app/page.tsx` | LP: Neue Codenames + Kostenmodell-Text fix |
| `src/components/landing/FAQSection.tsx` | Neue Codenames in FAQ-Text |
| `src/components/landing/KostenlosSection.tsx` | Kostenmodell-Text konsistent machen |
| `package.json` | framer-motion dependency hinzufuegen |

---

## Task 1: Framer Motion installieren + TRADER_CONFIG erstellen

**Files:**
- Modify: `package.json`
- Create: `src/lib/trader-config.ts`

- [ ] **Step 1: Framer Motion installieren**

Run: `cd 'C:/Users/DDV GmbH/Downloads/goldfoundry-complete/metatrader-portal' && npm install framer-motion`
Expected: Added framer-motion to dependencies

- [ ] **Step 2: TRADER_CONFIG Konstante erstellen**

Create `src/lib/trader-config.ts`:

```typescript
export interface TraderConfig {
  codename: string;
  asset: string;
  assetLabel: string;
  color: string;
  perf: string;
  wr: string;
  maxDd: string;
  since: string;
  metaApiId: string;
  mtLogin: string;
}

export const TRADER_CONFIG: TraderConfig[] = [
  {
    codename: "PHANTOM",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#d4a537",
    perf: "+1.0%/Tag",
    wr: "72%",
    maxDd: "4.5%",
    since: "2022",
    metaApiId: "cb652594-04e0-4123-a89b-7528250958ed",
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
    metaApiId: "85755595-b2ec-498c-8fbf-ee62cafd3cc6",
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
    metaApiId: "66d8fe15-368b-4e3c-8c6c-ed32bea5b56b",
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
    metaApiId: "02f08a16-ae02-40f4-9195-2c62ec52e8eb",
    mtLogin: "50701707",
  },
];

export function getTraderByMetaApiId(id: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.metaApiId === id);
}

export function getTraderByLogin(login: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.mtLogin === login);
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/lib/trader-config.ts
git commit -m "feat: add framer-motion + TRADER_CONFIG with codenames"
```

---

## Task 2: Dashboard Overview API Endpoint

**Files:**
- Create: `src/app/api/dashboard/overview/route.ts`

- [ ] **Step 1: Prüfe bestehende API-Patterns**

Read these files to understand the auth pattern and MetaApi usage:
- `src/app/api/copier/status/route.ts`
- `src/app/api/engine/health/route.ts`

- [ ] **Step 2: Erstelle den aggregierten Endpoint**

Create `src/app/api/dashboard/overview/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { TRADER_CONFIG, getTraderByMetaApiId } from "@/lib/trader-config";

const METAAPI_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";

async function fetchMetaApi(accountId: string, path: string, token: string) {
  const res = await fetch(
    `${METAAPI_BASE}/users/current/accounts/${accountId}${path}`,
    {
      headers: { "auth-token": token },
      next: { revalidate: 30 },
    }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = process.env.METAAPI_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "MetaApi token missing" },
        { status: 500 }
      );
    }

    // Fetch all account data in parallel
    const accountPromises = TRADER_CONFIG.map(async (trader) => {
      const [accountInfo, deals] = await Promise.all([
        fetchMetaApi(trader.metaApiId, "/account-information", token),
        fetchMetaApi(
          trader.metaApiId,
          `/history-deals/by-time-range?startTime=${getStartOfDay()}&endTime=${new Date().toISOString()}`,
          token
        ),
      ]);

      const todayProfit = deals
        ? deals
            .filter((d: any) => d.type === "DEAL_TYPE_SELL" || d.type === "DEAL_TYPE_BUY")
            .reduce((sum: number, d: any) => sum + (d.profit || 0), 0)
        : 0;

      const equity = accountInfo?.equity || 0;
      const balance = accountInfo?.balance || 0;
      const equityHigh = balance; // Simplified — real equityHigh from DB if available

      return {
        codename: trader.codename,
        asset: trader.asset,
        assetLabel: trader.assetLabel,
        color: trader.color,
        active: accountInfo !== null,
        todayProfit: Math.round(todayProfit * 100) / 100,
        equity,
        balance,
        ddUsed: equityHigh > 0 ? ((equityHigh - equity) / equityHigh) * 100 : 0,
        ddBuffer:
          equityHigh > 0
            ? 5 - ((equityHigh - equity) / equityHigh) * 100
            : 5,
        deals: deals || [],
      };
    });

    const accounts = await Promise.all(accountPromises);

    // Aggregate KPIs
    const totalEquity = accounts.reduce((s, a) => s + a.equity, 0);
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const todayPnl = accounts.reduce((s, a) => s + a.todayProfit, 0);
    const todayTrades = accounts.reduce((s, a) => s + a.deals.length, 0);

    // Max DD across all accounts
    const worstDdBuffer = Math.min(...accounts.map((a) => a.ddBuffer));
    const equityHigh = Math.max(...accounts.map((a) => a.balance));

    // Recent trades (all accounts, sorted by time, last 20)
    const recentTrades = accounts
      .flatMap((a) =>
        a.deals
          .filter(
            (d: any) =>
              d.type === "DEAL_TYPE_SELL" || d.type === "DEAL_TYPE_BUY"
          )
          .map((d: any) => ({
            direction: d.type === "DEAL_TYPE_BUY" ? "BUY" : "SELL",
            symbol: d.symbol?.replace(".pro", "") || d.symbol,
            pnl: Math.round((d.profit || 0) * 100) / 100,
            trader: a.codename,
            traderColor: a.color,
            time: d.time,
            lots: d.volume || 0,
          }))
      )
      .sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      )
      .slice(0, 20);

    // Trader summaries (without raw deals)
    const traders = accounts.map(
      ({ deals, ...rest }) => rest
    );

    // Equity curve: fetch 30-day history for all accounts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const equityCurvePromises = TRADER_CONFIG.map((trader) =>
      fetchMetaApi(
        trader.metaApiId,
        `/history-deals/by-time-range?startTime=${thirtyDaysAgo.toISOString()}&endTime=${new Date().toISOString()}`,
        token
      )
    );
    const allDealsArrays = await Promise.all(equityCurvePromises);

    // Build daily equity curve from deals
    const dailyPnl = new Map<string, number>();
    allDealsArrays.forEach((deals) => {
      if (!deals) return;
      deals.forEach((d: any) => {
        if (d.profit === undefined) return;
        const day = new Date(d.time).toISOString().split("T")[0];
        dailyPnl.set(day, (dailyPnl.get(day) || 0) + d.profit);
      });
    });

    // Sort by date, build cumulative curve
    const sortedDays = [...dailyPnl.entries()].sort(([a], [b]) =>
      a.localeCompare(b)
    );
    let cumulative = totalBalance - todayPnl; // Approximate starting point
    const equityCurveData = sortedDays.map(([date, pnl]) => {
      cumulative += pnl;
      return { date, equity: Math.round(cumulative * 100) / 100 };
    });

    const periodPnl =
      equityCurveData.length > 0
        ? equityCurveData[equityCurveData.length - 1].equity -
          equityCurveData[0].equity
        : 0;
    const periodChange =
      equityCurveData.length > 0 && equityCurveData[0].equity > 0
        ? (periodPnl / equityCurveData[0].equity) * 100
        : 0;

    return NextResponse.json({
      kpis: {
        totalEquity: Math.round(totalEquity * 100) / 100,
        totalBalance: Math.round(totalBalance * 100) / 100,
        equityChange:
          totalBalance > 0
            ? Math.round(((totalEquity - totalBalance) / totalBalance) * 10000) /
              100
            : 0,
        todayPnl: Math.round(todayPnl * 100) / 100,
        todayTrades,
        ddBuffer: Math.round(worstDdBuffer * 100) / 100,
        ddLimit: 5.0,
        equityHigh: Math.round(equityHigh * 100) / 100,
      },
      traders,
      recentTrades,
      equityCurve: {
        datapoints: equityCurveData,
        periodChange: Math.round(periodChange * 100) / 100,
        periodPnl: Math.round(periodPnl * 100) / 100,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getStartOfDay(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
```

- [ ] **Step 3: Test den Endpoint manuell**

Run: `cd 'C:/Users/DDV GmbH/Downloads/goldfoundry-complete/metatrader-portal' && npm run dev`

Open: `http://localhost:3000/api/dashboard/overview`

Expected: JSON mit kpis, traders, recentTrades, equityCurve Feldern. Wenn kein User eingeloggt, 401. Prüfe dass alle 4 Trader-Codenames in der Response sind.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/dashboard/overview/route.ts
git commit -m "feat: add aggregated dashboard overview API endpoint"
```

---

## Task 3: UI Utility-Komponenten (AnimatedNumber + MiniChart)

**Files:**
- Create: `src/components/ui/animated-number.tsx`
- Create: `src/components/ui/mini-chart.tsx`

- [ ] **Step 1: AnimatedNumber Komponente**

Create `src/components/ui/animated-number.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 2,
  className = "",
  duration = 1,
}: AnimatedNumberProps) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) =>
    `${prefix}${current.toFixed(decimals)}${suffix}`
  );
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest;
      }
    });
    return unsubscribe;
  }, [display]);

  return <span ref={ref} className={className} />;
}
```

- [ ] **Step 2: MiniChart Komponente (SVG Area Chart)**

Create `src/components/ui/mini-chart.tsx`:

```tsx
"use client";

import { useMemo } from "react";

interface MiniChartProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  className?: string;
  showGradient?: boolean;
}

export function MiniChart({
  data,
  color,
  width = 200,
  height = 50,
  className = "",
  showGradient = true,
}: MiniChartProps) {
  const { path, area, gradientId } = useMemo(() => {
    if (data.length < 2) return { path: "", area: "", gradientId: "" };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: height - padding - ((v - min) / range) * (height - padding * 2),
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    const id = `gradient-${color.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;

    return { path: linePath, area: areaPath, gradientId: id };
  }, [data, color, width, height]);

  if (data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-xs opacity-40 ${className}`}
        style={{ width, height }}
      >
        Keine Daten
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ width: "100%", height }}
    >
      {showGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
      )}
      {showGradient && (
        <path d={area} fill={`url(#${gradientId})`} />
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/animated-number.tsx src/components/ui/mini-chart.tsx
git commit -m "feat: add AnimatedNumber + MiniChart UI components"
```

---

## Task 4: DD Shield Komponente

**Files:**
- Create: `src/components/dashboard/DdShield.tsx`

- [ ] **Step 1: DD Shield mit Pro-Trader Breakdown**

Create `src/components/dashboard/DdShield.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";

interface TraderDd {
  codename: string;
  color: string;
  ddUsed: number;
  ddBuffer: number;
}

interface DdShieldProps {
  ddBuffer: number;
  ddLimit: number;
  equityHigh: number;
  traders: TraderDd[];
}

function getDdColor(buffer: number): string {
  if (buffer > 2) return "#22c55e"; // Gruen
  if (buffer > 1) return "#eab308"; // Gelb
  return "#ef4444"; // Rot
}

function DdBar({
  label,
  buffer,
  limit,
  color,
  barColor,
}: {
  label: string;
  buffer: number;
  limit: number;
  color: string;
  barColor: string;
}) {
  const usedPercent = Math.max(0, Math.min(100, ((limit - buffer) / limit) * 100));
  const bufferPercent = 100 - usedPercent;

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[10px] font-mono font-bold w-20 shrink-0"
        style={{ color }}
      >
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${bufferPercent}%` }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      <span
        className="text-xs font-mono font-medium w-12 text-right"
        style={{ color: barColor }}
      >
        {buffer.toFixed(1)}%
      </span>
    </div>
  );
}

export function DdShield({ ddBuffer, ddLimit, equityHigh, traders }: DdShieldProps) {
  const overallColor = getDdColor(ddBuffer);

  return (
    <div className="gf-panel p-5 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${overallColor}40, transparent 60%)`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{
                background: `${overallColor}15`,
                color: overallColor,
              }}
            >
              &#9748;
            </div>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                DD Shield
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-600">
              Max DD: {ddLimit}% &middot; Peak: &euro;{equityHigh.toLocaleString("de-DE")}
            </span>
          </div>
        </div>

        {/* Main Buffer Bar */}
        <DdBar
          label="GESAMT"
          buffer={ddBuffer}
          limit={ddLimit}
          color="#fafafa"
          barColor={overallColor}
        />

        {/* Separator */}
        <div className="h-px bg-white/5 my-3" />

        {/* Per-Trader Breakdown */}
        <div className="flex flex-col gap-2">
          {traders.map((t) => (
            <DdBar
              key={t.codename}
              label={t.codename}
              buffer={t.ddBuffer}
              limit={ddLimit}
              color={t.color}
              barColor={getDdColor(t.ddBuffer)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/DdShield.tsx
git commit -m "feat: add DD Shield component with per-trader breakdown"
```

---

## Task 5: KPI Hero Bar Komponente

**Files:**
- Create: `src/components/dashboard/KpiHeroBar.tsx`

- [ ] **Step 1: Erstelle KpiHeroBar**

Create `src/components/dashboard/KpiHeroBar.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { DdShield } from "@/components/dashboard/DdShield";

interface KpiData {
  totalEquity: number;
  equityChange: number;
  todayPnl: number;
  todayTrades: number;
  ddBuffer: number;
  ddLimit: number;
  equityHigh: number;
}

interface TraderDd {
  codename: string;
  color: string;
  ddUsed: number;
  ddBuffer: number;
}

interface KpiHeroBarProps {
  kpis: KpiData;
  traders: TraderDd[];
  isDemo?: boolean;
}

export function KpiHeroBar({ kpis, traders, isDemo = true }: KpiHeroBarProps) {
  const pnlPositive = kpis.todayPnl >= 0;
  const equityPositive = kpis.equityChange >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-3">
      {/* Card 1: Total Equity */}
      <motion.div
        className="gf-panel p-5 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {equityPositive && (
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, #d4a537 0%, transparent 60%)",
            }}
          />
        )}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Equity
            </span>
            {isDemo && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                DEMO
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-[#fafafa]">
            <AnimatedNumber value={kpis.totalEquity} prefix="€" decimals={0} />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-xs font-mono"
              style={{ color: equityPositive ? "#22c55e" : "#ef4444" }}
            >
              {equityPositive ? "▲" : "▼"} {equityPositive ? "+" : ""}
              {kpis.equityChange.toFixed(1)}%
            </span>
            <span className="text-[10px] text-zinc-600">heute</span>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Today P&L */}
      <motion.div
        className="gf-panel p-5 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${pnlPositive ? "#22c55e" : "#ef4444"}40, transparent 60%)`,
          }}
        />
        <div className="relative z-10">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Heute P&amp;L
          </span>
          <div
            className="text-2xl font-bold font-mono mt-1"
            style={{ color: pnlPositive ? "#22c55e" : "#ef4444" }}
          >
            <AnimatedNumber
              value={kpis.todayPnl}
              prefix={pnlPositive ? "+€" : "€"}
              decimals={0}
            />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-zinc-500">
              {kpis.todayTrades} Trades
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 3: DD Shield (doppelt breit) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <DdShield
          ddBuffer={kpis.ddBuffer}
          ddLimit={kpis.ddLimit}
          equityHigh={kpis.equityHigh}
          traders={traders}
        />
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/KpiHeroBar.tsx
git commit -m "feat: add KPI Hero Bar with Equity, P&L, DD Shield"
```

---

## Task 6: Trader Card + Trader Grid

**Files:**
- Create: `src/components/dashboard/TraderCard.tsx`
- Create: `src/components/dashboard/TraderGrid.tsx`

- [ ] **Step 1: TraderCard Komponente**

Create `src/components/dashboard/TraderCard.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { MiniChart } from "@/components/ui/mini-chart";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface TraderCardProps {
  codename: string;
  asset: string;
  assetLabel: string;
  color: string;
  perf: string;
  wr: string;
  maxDd: string;
  since: string;
  active: boolean;
  todayProfit: number;
  ddBuffer: number;
  ddLimit: number;
  equityCurve: number[];
}

function getDdColor(buffer: number): string {
  if (buffer > 2) return "#22c55e";
  if (buffer > 1) return "#eab308";
  return "#ef4444";
}

export function TraderCard({
  codename,
  asset,
  assetLabel,
  color,
  perf,
  wr,
  maxDd,
  since,
  active,
  todayProfit,
  ddBuffer,
  ddLimit,
  equityCurve,
}: TraderCardProps) {
  const profitPositive = todayProfit >= 0;
  const ddCritical = ddBuffer < 1;
  const borderColor = ddCritical ? "#ef4444" : color;
  const ddColor = getDdColor(ddBuffer);
  const bufferPercent = Math.max(0, (ddBuffer / ddLimit) * 100);

  return (
    <motion.div
      className="gf-panel p-5 relative overflow-hidden"
      style={{ borderColor: `${borderColor}30` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -2 }}
      transition={{ duration: 0.3 }}
    >
      {/* Radial glow in trader color */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, ${color}, transparent 60%)`,
        }}
      />

      {/* Left accent border */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: borderColor }}
      />

      <div className="relative z-10 pl-2">
        {/* Header: Codename + Status */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <span
              className="text-base font-bold font-mono tracking-wide"
              style={{ color }}
            >
              {codename}
            </span>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {asset} &middot; {assetLabel}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: active ? "#22c55e" : "#52525b",
                boxShadow: active ? "0 0 6px #22c55e60" : "none",
              }}
            />
            <span
              className="text-[9px] font-medium uppercase"
              style={{ color: active ? "#22c55e" : "#52525b" }}
            >
              {active ? "Active" : "Paused"}
            </span>
          </div>
        </div>

        {/* Today Profit + Avg Performance */}
        <div className="flex items-baseline justify-between mt-3 mb-2">
          <div
            className="text-lg font-bold font-mono"
            style={{ color: profitPositive ? "#22c55e" : "#ef4444" }}
          >
            <AnimatedNumber
              value={todayProfit}
              prefix={profitPositive ? "+€" : "€"}
              decimals={2}
            />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">{perf}</span>
        </div>

        {/* Mini Equity Curve */}
        <div className="my-3">
          <MiniChart data={equityCurve} color={color} height={40} />
        </div>

        {/* DD Mini Bar */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] text-zinc-600 w-6">DD</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: ddColor }}
              initial={{ width: 0 }}
              animate={{ width: `${bufferPercent}%` }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
          <span
            className="text-[9px] font-mono w-10 text-right"
            style={{ color: ddColor }}
          >
            {ddBuffer.toFixed(1)}%
          </span>
        </div>

        {/* Stats Footer */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-500 border-t border-white/5 pt-2">
          <span>
            WR <strong className="text-zinc-300">{wr}</strong>
          </span>
          <span className="text-zinc-700">&middot;</span>
          <span>
            Max DD <strong className="text-zinc-300">{maxDd}</strong>
          </span>
          <span className="text-zinc-700">&middot;</span>
          <span>
            Seit <strong className="text-zinc-300">{since}</strong>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: TraderGrid Wrapper**

Create `src/components/dashboard/TraderGrid.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { TraderCard } from "@/components/dashboard/TraderCard";
import { TRADER_CONFIG } from "@/lib/trader-config";

interface TraderData {
  codename: string;
  active: boolean;
  todayProfit: number;
  ddBuffer: number;
  ddUsed: number;
  equityCurve?: number[];
}

interface TraderGridProps {
  traders: TraderData[];
  ddLimit: number;
}

export function TraderGrid({ traders, ddLimit }: TraderGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-3"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {TRADER_CONFIG.map((config) => {
        const data = traders.find((t) => t.codename === config.codename);
        return (
          <TraderCard
            key={config.codename}
            codename={config.codename}
            asset={config.asset}
            assetLabel={config.assetLabel}
            color={config.color}
            perf={config.perf}
            wr={config.wr}
            maxDd={config.maxDd}
            since={config.since}
            active={data?.active ?? false}
            todayProfit={data?.todayProfit ?? 0}
            ddBuffer={data?.ddBuffer ?? ddLimit}
            ddLimit={ddLimit}
            equityCurve={data?.equityCurve ?? []}
          />
        );
      })}
    </motion.div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/TraderCard.tsx src/components/dashboard/TraderGrid.tsx
git commit -m "feat: add TraderCard + TraderGrid with codenames and live data"
```

---

## Task 7: Recent Trades + Portfolio Equity Curve

**Files:**
- Create: `src/components/dashboard/RecentTrades.tsx`
- Create: `src/components/dashboard/EquityCurve.tsx`

- [ ] **Step 1: RecentTrades Komponente**

Create `src/components/dashboard/RecentTrades.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface Trade {
  direction: "BUY" | "SELL";
  symbol: string;
  pnl: number;
  trader: string;
  traderColor: string;
  time: string;
  lots: number;
}

interface RecentTradesProps {
  trades: Trade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  const [limit, setLimit] = useState(10);
  const visible = trades.slice(0, limit);

  return (
    <div className="gf-panel p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Letzte Trades
        </span>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-zinc-400"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      {/* Trade List */}
      <div className="flex-1 overflow-auto space-y-2">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-zinc-600">
            Noch keine Trades heute
          </div>
        ) : (
          visible.map((trade, i) => (
            <motion.div
              key={`${trade.time}-${i}`}
              className="flex items-center gap-3 py-1.5 border-b border-white/[0.03] last:border-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Direction Badge */}
              <span
                className="text-[9px] font-bold font-mono w-8 text-center py-0.5 rounded"
                style={{
                  background:
                    trade.direction === "BUY"
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(239,68,68,0.1)",
                  color:
                    trade.direction === "BUY" ? "#22c55e" : "#ef4444",
                }}
              >
                {trade.direction}
              </span>

              {/* Symbol */}
              <span className="text-xs font-mono font-medium text-zinc-200 w-16">
                {trade.symbol}
              </span>

              {/* P&L */}
              <span
                className="text-xs font-mono font-bold flex-1 text-right"
                style={{
                  color: trade.pnl >= 0 ? "#22c55e" : "#ef4444",
                }}
              >
                {trade.pnl >= 0 ? "+" : ""}€{trade.pnl.toFixed(2)}
              </span>

              {/* Trader + Time */}
              <div className="text-right w-24">
                <div className="flex items-center justify-end gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: trade.traderColor }}
                  />
                  <span
                    className="text-[9px] font-mono"
                    style={{ color: trade.traderColor }}
                  >
                    {trade.trader}
                  </span>
                </div>
                <span className="text-[9px] text-zinc-600 font-mono">
                  {new Date(trade.time).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  &middot; {trade.lots}L
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: EquityCurve Komponente (Portfolio-Level)**

Create `src/components/dashboard/EquityCurve.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { MiniChart } from "@/components/ui/mini-chart";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface DataPoint {
  date: string;
  equity: number;
}

interface EquityCurveProps {
  datapoints: DataPoint[];
  periodChange: number;
  periodPnl: number;
  currentEquity: number;
}

export function EquityCurve({
  datapoints,
  periodChange,
  periodPnl,
  currentEquity,
}: EquityCurveProps) {
  const [period, setPeriod] = useState<"7" | "30" | "90" | "all">("30");

  const filtered = useMemo(() => {
    if (period === "all") return datapoints;
    const days = parseInt(period);
    return datapoints.slice(-days);
  }, [datapoints, period]);

  const values = filtered.map((d) => d.equity);
  const isPositive = periodPnl >= 0;

  return (
    <div className="gf-panel p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Portfolio Equity
        </span>
        <div className="flex gap-1">
          {(["7", "30", "90", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[9px] px-2 py-0.5 rounded font-mono transition-colors ${
                period === p
                  ? "bg-[#d4a537]/15 text-[#d4a537]"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {p === "all" ? "All" : `${p}T`}
            </button>
          ))}
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-3">
        <div className="text-xl font-bold font-mono text-[#fafafa]">
          <AnimatedNumber value={currentEquity} prefix="€" decimals={0} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-xs font-mono"
            style={{ color: isPositive ? "#22c55e" : "#ef4444" }}
          >
            {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}€
            {periodPnl.toFixed(0)} ({isPositive ? "+" : ""}
            {periodChange.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[120px]">
        <MiniChart
          data={values}
          color="#d4a537"
          height={120}
          showGradient
        />
      </div>

      {/* X-Axis Labels */}
      {filtered.length > 0 && (
        <div className="flex justify-between mt-1 text-[9px] font-mono text-zinc-600">
          <span>
            {new Date(filtered[0].date).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "short",
            })}
          </span>
          {filtered.length > 2 && (
            <span>
              {new Date(
                filtered[Math.floor(filtered.length / 2)].date
              ).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
          <span>
            {new Date(
              filtered[filtered.length - 1].date
            ).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/RecentTrades.tsx src/components/dashboard/EquityCurve.tsx
git commit -m "feat: add RecentTrades + EquityCurve components with live data"
```

---

## Task 8: Dashboard Page Komplett Neu

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Lese die aktuelle page.tsx**

Read `src/app/dashboard/page.tsx` vollstaendig um den bestehenden Code zu verstehen.

- [ ] **Step 2: Ersetze die komplette page.tsx**

Replace the entire content of `src/app/dashboard/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KpiHeroBar } from "@/components/dashboard/KpiHeroBar";
import { TraderGrid } from "@/components/dashboard/TraderGrid";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { EquityCurve } from "@/components/dashboard/EquityCurve";

interface DashboardData {
  kpis: {
    totalEquity: number;
    totalBalance: number;
    equityChange: number;
    todayPnl: number;
    todayTrades: number;
    ddBuffer: number;
    ddLimit: number;
    equityHigh: number;
  };
  traders: {
    codename: string;
    asset: string;
    assetLabel: string;
    color: string;
    active: boolean;
    todayProfit: number;
    equity: number;
    balance: number;
    ddUsed: number;
    ddBuffer: number;
  }[];
  recentTrades: {
    direction: "BUY" | "SELL";
    symbol: string;
    pnl: number;
    trader: string;
    traderColor: string;
    time: string;
    lots: number;
  }[];
  equityCurve: {
    datapoints: { date: string; equity: number }[];
    periodChange: number;
    periodPnl: number;
  };
  lastUpdated: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard/overview");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4a537]/30 border-t-[#d4a537] rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-mono">
            Lade Command Center...
          </span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="gf-panel p-8 text-center max-w-sm">
          <div className="text-2xl mb-2">&#9888;</div>
          <div className="text-sm text-zinc-400 mb-1">
            Daten konnten nicht geladen werden
          </div>
          <div className="text-[10px] text-zinc-600 font-mono mb-4">
            {error}
          </div>
          <button
            onClick={fetchDashboard}
            className="text-xs px-4 py-2 rounded-lg bg-[#d4a537]/10 text-[#d4a537] hover:bg-[#d4a537]/20 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#fafafa]">Command Center</h1>
          <p className="text-[10px] text-zinc-600 font-mono">
            Zuletzt aktualisiert:{" "}
            {new Date(data.lastUpdated).toLocaleTimeString("de-DE")}
          </p>
        </div>
        {/* Scanline-style live indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#22c55e] animate-ping opacity-40" />
          </div>
          <span className="text-[10px] font-mono text-[#22c55e]">LIVE</span>
        </div>
      </div>

      {/* Sektion 1: KPI Hero Bar */}
      <KpiHeroBar
        kpis={data.kpis}
        traders={data.traders.map((t) => ({
          codename: t.codename,
          color: t.color,
          ddUsed: t.ddUsed,
          ddBuffer: t.ddBuffer,
        }))}
      />

      {/* Sektion 2: Trader Grid */}
      <TraderGrid traders={data.traders} ddLimit={data.kpis.ddLimit} />

      {/* Sektion 3: Trades + Equity Curve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RecentTrades trades={data.recentTrades} />
        <EquityCurve
          datapoints={data.equityCurve.datapoints}
          periodChange={data.equityCurve.periodChange}
          periodPnl={data.equityCurve.periodPnl}
          currentEquity={data.kpis.totalEquity}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Pruefe dass die Seite korrekt rendert**

Run: `npm run dev`
Open: `http://localhost:3000/dashboard`
Expected: Mission Control Layout mit 3 Sektionen, keine Console-Errors. Loading State zeigt goldenen Spinner. Danach KPIs, 4 Trader Cards, Trades + Equity Curve.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: replace dashboard with Mission Control layout"
```

---

## Task 9: Navigation Update + Chat Eigene Seite

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/app/dashboard/chat/page.tsx` (oder Create falls nicht existent)

- [ ] **Step 1: Lese layout.tsx**

Read `src/app/dashboard/layout.tsx` to understand the current nav structure.

- [ ] **Step 2: Update Navigation**

In `src/app/dashboard/layout.tsx`, find the navigation items array and update:

1. Rename "Uebersicht" (or similar) to "Command Center"
2. Ensure "FORGE Mentor" links to `/dashboard/chat` (eigene Seite)
3. Verify the nav icon for Command Center uses a diamond or command icon

The exact edit depends on the current nav structure — read first, then:
- Replace the label "Übersicht" or "Uebersicht" with "Command Center"
- Ensure chat/FORGE Mentor is in the HILFE section pointing to `/dashboard/chat`

- [ ] **Step 3: Sicherstellen dass chat/page.tsx den ForgeChat rendert**

Read `src/app/dashboard/chat/page.tsx`. If it already renders the ForgeChat component, this is done. If not, update it to import and render ForgeChat as a full-page component:

```tsx
import ForgeChat from "@/components/ForgeChat";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <ForgeChat />
    </div>
  );
}
```

- [ ] **Step 4: Pruefe Navigation**

Run: `npm run dev`
- Click "Command Center" → should show new dashboard
- Click "FORGE Mentor" → should show chat on own page
- All other nav links still work

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/layout.tsx src/app/dashboard/chat/page.tsx
git commit -m "feat: update nav — Command Center + Chat as own page"
```

---

## Task 10: Landing Page Fixes (Trader Names + Kostenmodell)

**Files:**
- Modify: `src/components/landing/TraderProfiles.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/landing/FAQSection.tsx`
- Modify: `src/components/landing/KostenlosSection.tsx`
- Modify: `src/app/dashboard/trader/page.tsx`
- Modify: `src/app/dashboard/onboarding/page.tsx`

- [ ] **Step 1: Lese alle 6 Dateien die Trader-Namen enthalten**

Read each file, find the TRADERS / FORGE_TRADERS arrays or hardcoded name strings.

- [ ] **Step 2: Update TraderProfiles.tsx**

Replace old names with new codenames. Import from `@/lib/trader-config` where possible, or update the local array:
- "GoldForge" → "PHANTOM"
- "TechForge" → "NEXUS"  
- "IndexForge" → "SENTINEL"
- "ForexForge" → "SPECTRE"

Keep all other properties (asset, perf, wr, dd, since, color) the same — they match the TRADER_CONFIG.

- [ ] **Step 3: Update page.tsx (Landing Page)**

Find all occurrences of "GoldForge", "TechForge", "IndexForge", "ForexForge" in `src/app/page.tsx` and replace with the new codenames.

Also update the equity curve label from "GOLDFORGE · LIVE +142%" to "PHANTOM · LIVE +142%".

- [ ] **Step 4: Update FAQSection.tsx**

Find mentions of "GoldForge" in FAQ text and replace with "PHANTOM" or the general term "Forge Trader".

- [ ] **Step 5: Fix Kostenmodell-Text**

In `src/components/landing/KostenlosSection.tsx`, make the text consistent. The correct model is:
- 100% kostenlos fuer den User
- GoldFoundry verdient ueber Tegas FX: IB-Kommission ($3.50/Lot) + 40% Profit Share (vom Broker, nicht vom User)

Replace the text at line ~65:
```
Old: "Du zahlst nur 40% deiner Gewinne — und nur wenn du im Plus bist."
New: "100% kostenlos für dich. Tegas FX vergütet uns als Technologie-Partner — du zahlst nichts."
```

Ensure FAQ section stays consistent with this messaging.

- [ ] **Step 6: Update trader/page.tsx + onboarding/page.tsx**

Replace old trader names in both dashboard pages. Import from `@/lib/trader-config` if they have local TRADERS arrays.

- [ ] **Step 7: Pruefe Landing Page**

Run: `npm run dev`
Open: `http://localhost:3000`
- Check all 4 trader names show new codenames
- Check Kostenlos section text is consistent
- Check FAQ section text is consistent
- No broken references to old names

- [ ] **Step 8: Commit**

```bash
git add src/components/landing/TraderProfiles.tsx src/app/page.tsx src/components/landing/FAQSection.tsx src/components/landing/KostenlosSection.tsx src/app/dashboard/trader/page.tsx src/app/dashboard/onboarding/page.tsx
git commit -m "fix: update trader codenames + fix cost model text on LP"
```

---

## Task 11: Build Check + Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run build**

```bash
cd 'C:/Users/DDV GmbH/Downloads/goldfoundry-complete/metatrader-portal' && npm run build
```

Expected: Build succeeds with no TypeScript errors. Fix any errors that come up.

- [ ] **Step 2: Visual Check — Dashboard**

Run: `npm run dev`
Open: `http://localhost:3000/dashboard`

Verify:
- [ ] KPI Hero Bar shows 3 cards (Equity, P&L, DD Shield double-wide)
- [ ] DD Shield shows per-trader breakdown with color bars
- [ ] 4 Trader Cards in 2x2 grid with codenames (PHANTOM, NEXUS, SENTINEL, SPECTRE)
- [ ] Each Trader Card has mini equity curve, today profit, DD bar
- [ ] Recent Trades list shows real trades with trader color dots
- [ ] Portfolio Equity Curve shows area chart with gold gradient
- [ ] LIVE indicator pulsing green
- [ ] Last Updated timestamp visible
- [ ] Loading spinner shows on initial load
- [ ] Error state shows retry button if API fails
- [ ] Framer Motion animations play on load (stagger, fade-up)

- [ ] **Step 3: Visual Check — Navigation**

- [ ] "Command Center" in sidebar nav
- [ ] FORGE Mentor on own page at /dashboard/chat
- [ ] All other nav links still functional

- [ ] **Step 4: Visual Check — Landing Page**

Open: `http://localhost:3000`
- [ ] All 4 trader names updated to codenames
- [ ] Kostenlos section text consistent
- [ ] FAQ text consistent
- [ ] No broken references to old "GoldForge" etc.

- [ ] **Step 5: Final Commit**

```bash
git add -A
git commit -m "chore: fix any remaining build issues from dashboard redesign"
```

Only if there were actual fixes needed in step 1.
