# Phantom-Only Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduziere die Gold Foundry Website auf einen einzigen Live-Trader (PHANTOM, neuer TegasFX-Account `e534fb5e-…`). Entferne alle anderen Trader (APEX, RONIN, AEGIS, TITAN, NEXUS, SENTINEL, SPECTRE) aus der UI und schreibe die Landing-Page-Storyline auf "Ein Trader. Ein Asset. Live verifiziert." um.

**Architecture:** UI-Refactor in einer Next.js 14 App-Router-Codebase. Backend (`/api/lp/stats`, Contabo-Server, Sentinel-Bereich) bleibt unberührt. Single source of truth für die Trader-Liste ist `src/lib/trader-config.ts`. Hardcoded Stale-Listen in Dashboard-Pages werden ebenfalls bereinigt.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, framer-motion, Tailwind-utility classes + inline styles. Kein Test-Framework im Frontend → Verifikation = `npm run build` + visueller Smoke-Test im Dev-Server.

**Spec:** [docs/superpowers/specs/2026-05-04-phantom-only-redesign-design.md](../specs/2026-05-04-phantom-only-redesign-design.md)

---

## File Structure

| File | Aktion | Verantwortung danach |
|---|---|---|
| `src/lib/trader-config.ts` | Modify | Single PHANTOM-Eintrag |
| `src/app/page.tsx` | Modify | Neue Hero-Storyline, Profit-Tabelle raus |
| `src/components/landing/StrategyEngine.tsx` | Modify | Single-Trader-Card statt Liste |
| `src/components/landing/PerformanceChart.tsx` | Modify | Account-Pills + SystemsTable raus, nur 1 Curve |
| `src/components/landing/HowItWorks.tsx` | Modify (minimal) | Generische Winrate-Aussage statt "70%+" |
| `src/components/landing/FunnelOverlay.tsx` | Modify (minimal) | Live-Banner ohne `totalGain`/`totalDrawdown` Hard-Coding |
| `src/components/landing/CTASection.tsx` | Keep | Keine Multi-Trader-Logik vorhanden |
| `src/app/dashboard/trader/page.tsx` | Modify | Single PHANTOM-Card, kein hardcoded TRADERS-Array |
| `src/app/dashboard/onboarding/page.tsx` | Modify | Step 3 entfernen oder auf Single-Trader-Auto-Select |

---

## Task 1: Trader-Config auf PHANTOM-only reduzieren

**Files:**
- Modify: `src/lib/trader-config.ts`

- [ ] **Step 1: Trader-Config-Datei vollständig ersetzen**

Ersetze den kompletten Inhalt von `src/lib/trader-config.ts` mit:

```ts
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
  /** Ursprünglicher Deposit in EUR — für Gain-Berechnung wenn Withdrawals gemacht wurden */
  initialDeposit?: number;
  /** Statischer maxDd-Fallback in % falls MetaStats + MyFXBook beide 0 liefern */
  maxDdFallback?: number;
}

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

export function getTraderByMetaApiId(id: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.metaApiId === id);
}

export function getTraderByLogin(login: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.mtLogin === login);
}
```

- [ ] **Step 2: Build prüfen**

Run: `npm run build`
Expected: PASS. Falls Errors auf Felder von gelöschten Tradern zeigen → in nachfolgenden Tasks behoben.

- [ ] **Step 3: Commit**

```bash
git add src/lib/trader-config.ts
git commit -m "refactor(trader-config): reduce to single PHANTOM entry"
```

---

## Task 2: Landing-Page Hero-Storyline neu

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Hero-Headline und Subline ersetzen**

In `src/app/page.tsx`, finde den Hero-Block (ab `{/* ═══ HERO ═══ */}`, ca. Zeile 326). Ersetze die `motion.h1`-Headline und `motion.p`-Subline-Blöcke (Zeilen 344-362) durch:

```tsx
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16, maxWidth: 700 }}>
            Ein Trader. Ein Asset. <span style={{ color: "#d4a537" }}>Live verifiziert.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ color: "#a1a1aa", fontSize: "clamp(16px, 2.5vw, 20px)", marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
            PHANTOM tradet ausschließlich Gold. Live-Account, MetaApi-verifiziert, jede Position transparent.
          </motion.p>
```

- [ ] **Step 2: Trust-Line aktualisieren**

In derselben Datei, finde die Trust-Line `motion.div` (ca. Zeile 399-406). Ersetze das Items-Array durch:

```tsx
            {["Live verifiziert", "Tegas FX White-Label", "100% kostenlos"].map((t) => (
```

(Der Rest des `.map()`-Bodys bleibt gleich.)

- [ ] **Step 3: Loading- und Empty-State-Texte anpassen**

In derselben Datei, finde im Hero-Block den Loading-/Empty-State (ca. Zeile 357-361):

```tsx
            {isLoading
              ? "Lade Live-Daten..."
              : equity > 0
                ? <>{accs.length || 7} Strategien. <span style={{ color: "#22c55e", fontWeight: 700 }}>{winrate}% Winrate.</span> Live verifiziert.</>
                : "7 Strategien. 1 Engine. Live verifiziert."}
```

Da die neue Subline statisch ist (kein `accs.length`-Hinweis mehr), wird dieser ganze Ternary-Block durch die Subline aus Step 1 ersetzt (Step 1 hat bereits den ganzen `<motion.p>`-Block ausgetauscht — diese Zeilen existieren danach nicht mehr).

- [ ] **Step 4: Build prüfen**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(landing): new phantom-only hero storyline"
```

---

## Task 3: Multi-Account-Profit-Tabelle aus Landing-Page entfernen

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Profit-Tabelle-Section komplett löschen**

In `src/app/page.tsx` finde den Block `{/* ═══ PROFIT TABELLE — 24h/72h/7d/30d pro Account (MetaApi) ═══ */}` (ca. Zeile 455). Lösche den kompletten `{accs.length > 0 && (...)}`-Block (ca. Zeile 456-522 — ende beim schließenden `)}` direkt vor `{/* ═══ LIVE TERMINAL ═══ */}`).

Nach der Löschung folgt direkt nach `{/* ═══ 2. PERFORMANCE — Beweis dass es funktioniert ═══ */}`-Block der `<LiveTerminal />`-Block.

- [ ] **Step 2: "Aktive Strategien"-Stat im SocialProof entfernen**

In derselben Datei, finde die `SocialProof`-Funktion (ca. Zeile 256). Im `spStats`-Array (Zeile 261-266) entferne den dritten Eintrag `{ label: "Aktive Strategien", value: String(accs.length || 7), color: "#fafafa" }`. Das Array hat danach 3 statt 4 Einträge.

- [ ] **Step 3: ProfitCalculator-Subline anpassen**

In derselben Datei, in der `ProfitCalculator`-Funktion (ca. Zeile 119-121), ersetze:

```tsx
        Basierend auf PHANTOMs historischer Performance
```

durch:

```tsx
        Basierend auf PHANTOMs Live-Performance — Gold, MetaApi-verifiziert
```

- [ ] **Step 4: Build prüfen**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor(landing): remove multi-account profit table"
```

---

## Task 4: StrategyEngine auf Single-Trader-Card umbauen

**Files:**
- Modify: `src/components/landing/StrategyEngine.tsx`

- [ ] **Step 1: StrategyEngine komplett neu schreiben**

Ersetze den gesamten Inhalt von `src/components/landing/StrategyEngine.tsx` mit:

```tsx
"use client";

import { motion } from "framer-motion";

interface Account {
  name: string;
  color?: string;
  gain: number;
  daily?: number;
  monthly?: number;
  drawdown?: number;
  balance: number;
  equity: number;
  profit: number;
  pnl24h?: number;
  pnl72h?: number;
  pnl7d?: number;
  pnl30d?: number;
  winrate?: number;
  trades?: number;
  active?: boolean;
}

interface Props {
  accounts: Account[];
}

function numColor(v: number) { return v >= 0 ? "#22c55e" : "#ef4444"; }
function fmtMoney(v: number) { return `${Math.abs(Math.round(v)).toLocaleString("de-DE")}€`; }

export default function StrategyEngine({ accounts }: Props) {
  const acc = accounts?.[0];
  const isNew = !acc || (acc.gain === 0 && acc.profit === 0);

  return (
    <section id="strategies" style={{ padding: "80px 20px", maxWidth: 900, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#d4a537", marginBottom: 12, fontWeight: 600 }}>
          Die PHANTOM Engine
        </div>
        <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16, color: "#fafafa" }}>
          <span style={{ background: "linear-gradient(135deg, #d4a537, #f0d060)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Eine Strategie.
          </span>{" "}
          Ein Asset. Volle Transparenz.
        </h2>
        <p style={{ color: "#a1a1aa", fontSize: "clamp(14px, 2vw, 16px)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          PHANTOM tradet ausschließlich Gold (XAUUSD). Live-Account bei Tegas FX, jede Position direkt aus MetaApi gestreamt.
        </p>
      </motion.div>

      {acc && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ background: "rgba(10,8,6,0.7)", border: "1px solid rgba(212,165,55,0.15)", borderRadius: 20, padding: "32px 36px", position: "relative", maxWidth: 640, margin: "0 auto" }}>

          <div style={{ position: "absolute", top: 18, right: 18, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: isNew ? "#6d6045" : "#22c55e", animation: isNew ? "none" : "sp-pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: isNew ? "#6d6045" : "#22c55e", letterSpacing: "0.08em" }}>
              {isNew ? "NEU" : "LIVE"}
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 800, color: "#fafafa", marginBottom: 4 }}>{acc.name}</h3>
          <div style={{ fontSize: 12, color: "#6d6045", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
            XAUUSD · Gold
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "20px 24px", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Gain</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: isNew ? "#6d6045" : numColor(acc.gain) }}>
                {isNew ? "—" : `${acc.gain >= 0 ? "+" : ""}${acc.gain.toFixed(1)}%`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Profit</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: isNew ? "#6d6045" : numColor(acc.profit) }}>
                {isNew ? "—" : <>{acc.profit >= 0 ? "+" : "-"}{fmtMoney(acc.profit)}</>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Drawdown</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: (acc.drawdown ?? 0) > 10 ? "#ef4444" : "#a1a1aa" }}>
                {(acc.drawdown ?? 0) === 0 ? "—" : `${(acc.drawdown ?? 0).toFixed(1)}%`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Balance</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#d4a537" }}>
                {fmtMoney(acc.balance)}
              </div>
            </div>
          </div>

          {(acc.pnl24h ?? acc.daily ?? 0) !== 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(34,197,94,0.06)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.1)" }}>
              <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: numColor(acc.pnl24h ?? acc.daily ?? 0), fontWeight: 600 }}>
                {(acc.pnl24h ?? acc.daily ?? 0) >= 0 ? "+" : ""}{Math.abs(acc.pnl24h ?? 0).toFixed(2)}€ heute
              </span>
            </div>
          )}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 40 }}>
        {[
          { icon: "🎯", title: "Klarer Edge", desc: "Ein Setup, immer wieder. Kein Asset-Hopping, keine Dilettanten-Strategie." },
          { icon: "📊", title: "Ein Asset", desc: "Nur Gold (XAUUSD). Maximale Spezialisierung statt Streuung über 10 Märkte." },
          { icon: "🔍", title: "100% verifiziert", desc: "Live-Account bei Tegas FX, jede Position direkt aus MetaApi. Nichts wird schöngerechnet." },
        ].map((b) => (
          <div key={b.title} style={{ background: "rgba(10,8,6,0.4)", border: "1px solid rgba(212,165,55,0.06)", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{b.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa", marginBottom: 6 }}>{b.title}</div>
            <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.6 }}>{b.desc}</div>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
        style={{ textAlign: "center", marginTop: 40 }}>
        <a href="#performance" style={{ display: "inline-block", padding: "14px 36px", fontSize: 15, fontWeight: 700, color: "#0a0806", background: "linear-gradient(135deg, #d4a537, #f0d060)", borderRadius: 10, textDecoration: "none" }}>
          Live-Performance ansehen
        </a>
      </motion.div>

      <style>{`@keyframes sp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </section>
  );
}
```

- [ ] **Step 2: Build prüfen**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/StrategyEngine.tsx
git commit -m "refactor(strategy-engine): single phantom card with edge story"
```

---

## Task 5: PerformanceChart Multi-Account-UI raus

**Files:**
- Modify: `src/components/landing/PerformanceChart.tsx`

- [ ] **Step 1: Account-Pills-Block entfernen**

In `src/components/landing/PerformanceChart.tsx` finde den `{/* Account pills */}`-Block (ca. Zeile 638-661):

```tsx
            {/* Account pills */}
            {mfx && mfx.accounts.length > 1 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <button
                  onClick={() => setSelectedAccount(null)}
                  ...
                >Alle</button>
                {mfx.accounts.map((a) => (
                  <button ...>{a.name}</button>
                ))}
              </div>
            )}
```

Lösche den kompletten `{mfx && mfx.accounts.length > 1 && (...)}`-Block. Da nur noch ein Account existiert, würde der Block sowieso nicht rendern, aber explizites Entfernen reduziert Toten Code.

- [ ] **Step 2: SystemsTable-Block entfernen**

In derselben Datei, finde den `{/* Systems Table */}`-Block (ca. Zeile 689-699):

```tsx
      {/* Systems Table */}
      {mfx && (
        <div style={{ marginTop: 1 }}>
          <SystemsTable
            accounts={mfx.accounts}
            total={mfx}
            selectedName={selectedAccount}
            onSelect={setSelectedAccount}
          />
        </div>
      )}
```

Lösche diesen kompletten Block.

- [ ] **Step 3: SystemsTable-Funktion und TotalCell-Helper entfernen**

In derselben Datei, lösche die komplette `function SystemsTable(...)` (ca. Zeile 397-476) und die `function TotalCell(...)` (ca. Zeile 233-242). Diese werden nach Step 2 nicht mehr referenziert.

- [ ] **Step 4: TradingPeriods-Funktion ebenfalls entfernen**

Die `function TradingPeriods(...)` (ca. Zeile 244-349) wird in der Datei definiert aber nicht mehr aufgerufen (Profit-Tabelle ist jetzt komplett raus). Lösche die komplette Funktion.

- [ ] **Step 5: Subtext "Auto-Sync" Header anpassen**

Optional: Im Header-Block (ca. Zeile 611-624) den Subtitel `Live-Daten — verifiziert und automatisch synchronisiert` belassen — passt weiterhin.

- [ ] **Step 6: Build prüfen**

Run: `npm run build`
Expected: PASS. Falls TypeScript-Errors über ungenutzte Funktionen oder Imports: nicht-mehr-genutzte Imports (`useMemo` ggf., `LINE_COLORS` für Comparison-Chart bleibt — wird in `tvSeries` verwendet) im Edit korrigieren.

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/PerformanceChart.tsx
git commit -m "refactor(performance-chart): remove multi-account pills and systems table"
```

---

## Task 6: HowItWorks Winrate-Aussage entschärfen

**Files:**
- Modify: `src/components/landing/HowItWorks.tsx`

- [ ] **Step 1: "70%+ Winrate"-Aussage neutralisieren**

In `src/components/landing/HowItWorks.tsx` finde den dritten Step (Zeile 17-20):

```tsx
  {
    icon: "↗",
    title: "Live verdienen",
    desc: "Sieh jeden Trade in Echtzeit. 70%+ Winrate, verifiziert über MyFXBook. Auszahlung jederzeit.",
  },
```

Ersetze die `desc` durch:

```tsx
    desc: "Sieh jeden Trade in Echtzeit. Live über MetaApi verifiziert. Auszahlung jederzeit.",
```

(Grund: Account ist erst seit 2026-05-04 aktiv — kein verlässlicher Winrate-Wert vorhanden, also keine konkrete Zahl behaupten.)

- [ ] **Step 2: Build prüfen**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/HowItWorks.tsx
git commit -m "copy(how-it-works): replace concrete winrate claim with live verification"
```

---

## Task 7: FunnelOverlay Live-Banner robust machen

**Files:**
- Modify: `src/components/landing/FunnelOverlay.tsx`

- [ ] **Step 1: Live-Banner-Display für Gain=0 anpassen**

In `src/components/landing/FunnelOverlay.tsx` finde den Live-Performance-Banner-Block (Zeile 127-141):

```tsx
            <div style={{
              display: "flex", justifyContent: "center", gap: 28, padding: "14px 0", marginBottom: 24,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              {[
                { label: "Live Gain", value: `+${totalGain.toFixed(1)}%`, color: "#22c55e" },
                { label: "Max DD", value: `${maxDd.toFixed(2)}%`, color: "#ef4444" },
              ].map((s) => (
```

Ersetze das Array durch:

```tsx
              {[
                { label: "Live Gain", value: totalGain === 0 ? "—" : `${totalGain >= 0 ? "+" : ""}${totalGain.toFixed(1)}%`, color: totalGain >= 0 ? "#22c55e" : "#ef4444" },
                { label: "Max DD", value: maxDd === 0 ? "—" : `${maxDd.toFixed(2)}%`, color: "#ef4444" },
              ].map((s) => (
```

(Grund: bei frischem Account sind beide Werte 0 und sollten als `—` statt als `+0.0%` angezeigt werden.)

- [ ] **Step 2: Build prüfen**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/FunnelOverlay.tsx
git commit -m "ui(funnel): show em-dash for empty gain/dd instead of +0.0%"
```

---

## Task 8: Dashboard Trader-Page auf Single-Trader umbauen

**Files:**
- Modify: `src/app/dashboard/trader/page.tsx`

- [ ] **Step 1: Hardcoded TRADERS-Array auf PHANTOM-only reduzieren**

In `src/app/dashboard/trader/page.tsx` finde das `TRADERS`-Array (Zeile 6-11) und ersetze es durch einen Import aus `trader-config.ts`:

```tsx
// src/app/dashboard/trader/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { TRADER_CONFIG } from "@/lib/trader-config";

const TRADERS = TRADER_CONFIG.map((t) => ({
  name: t.codename,
  asset: t.asset,
  perf: t.perf,
  wr: t.wr,
  dd: t.maxDd,
  since: t.since,
  color: t.color,
}));

const LEVERAGE_OPTIONS = ["1x", "2x", "4x", "8x", "12x", "24x"];
```

Achtung: Das alte hardcoded `perf: "+1.0%/Tag"` wird durch `t.perf` (`"0%"`) ersetzt. Damit das UI nicht "0%" zeigt, ändere in der UI-Render-Stelle (ca. Zeile 132) das Label "Ø/Tag" zu "Performance" und nutze einen Fallback wenn der Wert "0%" ist.

Finde den `[{ label: "Ø/Tag", value: t.perf }, ...]`-Block (Zeile 132) und ersetze ihn durch:

```tsx
                {[
                  { label: "Performance", value: t.perf === "0%" ? "—" : t.perf },
                  { label: "Win Rate", value: t.wr === "0%" ? "—" : t.wr },
                  { label: "Max DD", value: t.dd === "0%" ? "—" : t.dd },
                  { label: "Seit", value: t.since },
                ].map(st => (
```

- [ ] **Step 2: Heading-Text anpassen**

In derselben Datei, finde Zeile 67-68:

```tsx
          <h1 className="gf-heading text-2xl">Forge Trader</h1>
          <p className="text-sm text-zinc-500 mt-1">Waehle einen Trader und konfiguriere Hebel und Risiko.</p>
```

Ersetze durch:

```tsx
          <h1 className="gf-heading text-2xl">Forge Trader</h1>
          <p className="text-sm text-zinc-500 mt-1">Konfiguriere Hebel und Risiko fuer PHANTOM.</p>
```

- [ ] **Step 3: Build prüfen**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/trader/page.tsx
git commit -m "refactor(dashboard/trader): single phantom card via trader-config"
```

---

## Task 9: Dashboard Onboarding Step 3 vereinfachen

**Files:**
- Modify: `src/app/dashboard/onboarding/page.tsx`

- [ ] **Step 1: Hardcoded TRADERS-Liste auf PHANTOM-only reduzieren**

In `src/app/dashboard/onboarding/page.tsx` finde das `TRADERS`-Array (Zeile 8-13) und ersetze durch:

```tsx
const TRADERS = [
  { id: "phantom", name: "PHANTOM", asset: "XAUUSD", perf: "Live verifiziert", wr: "—" },
];
```

- [ ] **Step 2: Step 3 Auto-Select bei Mount**

In derselben Datei, oben im Component-Body (nach `const [selectedTraders, setSelectedTraders] = useState<string[]>([]);` — Zeile 21) füge hinzu:

```tsx
  // Auto-select PHANTOM (einziger Trader)
  useEffect(() => {
    setSelectedTraders(["phantom"]);
  }, []);
```

Damit ist Step 3 ein One-Click-"Los geht's!"-Schritt — der User muss nicht mehr aktiv auswählen, kann aber abwählen wenn gewünscht.

Stelle sicher, dass `useEffect` aus `react` importiert ist. In Zeile 3 (`import { useState } from "react";`) erweitern auf:

```tsx
import { useState, useEffect } from "react";
```

- [ ] **Step 3: Step 3 Subline anpassen**

In derselben Datei, finde im Step-3-Block (ca. Zeile 226-228):

```tsx
              <h2 className="gf-heading text-2xl mb-2">Waehle deine Trader</h2>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                Mindestens einen Trader aktivieren.
              </p>
```

Ersetze durch:

```tsx
              <h2 className="gf-heading text-2xl mb-2">Dein Trader</h2>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                PHANTOM ist bereits aktiviert.
              </p>
```

- [ ] **Step 4: Build prüfen**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/onboarding/page.tsx
git commit -m "refactor(onboarding): single phantom auto-selected at step 3"
```

---

## Task 10: Visuelle Smoke-Tests + Risikohinweis-Check

**Files:**
- (None — manuelle Verifikation)

- [ ] **Step 1: Dev-Server starten**

Run: `npm run dev`
Expected: Next.js startet auf `http://localhost:3000` ohne Errors.

- [ ] **Step 2: Landing-Page öffnen**

Öffne `http://localhost:3000` im Browser. Prüfe:
- Hero-Headline zeigt: "Ein Trader. Ein Asset. Live verifiziert."
- Subline zeigt: "PHANTOM tradet ausschließlich Gold. Live-Account, MetaApi-verifiziert, jede Position transparent."
- Trust-Line zeigt 3 Items: "Live verifiziert", "Tegas FX White-Label", "100% kostenlos"
- StrategyEngine-Section zeigt EINE PHANTOM-Card (nicht mehrere)
- KEINE Profit-Tabelle "24h/72h/7d/30d" mehr sichtbar
- "Aktive Strategien"-Counter im SocialProof ist weg
- Risikohinweis ist im Footer / am Ende der Page sichtbar

- [ ] **Step 3: API direkt prüfen**

Run: `curl -s http://localhost:3000/api/lp/stats | findstr accounts`
(Alternative für PowerShell: `(Invoke-WebRequest http://localhost:3000/api/lp/stats).Content | ConvertFrom-Json | Select-Object -ExpandProperty accounts`)

Expected: Genau ein Account-Objekt im `accounts`-Array.

- [ ] **Step 4: Dashboard prüfen**

Öffne `http://localhost:3000/dashboard/trader`.
Expected: Eine einzige Trader-Card "PHANTOM" sichtbar — keine NEXUS, SENTINEL, SPECTRE.

Öffne `http://localhost:3000/dashboard/onboarding`.
Expected: Step 3 zeigt nur PHANTOM, ist bereits ausgewählt (Häkchen sichtbar).

- [ ] **Step 5: Sentinel-Bereich Smoke-Test**

Öffne `http://localhost:3000/sentinel`.
Expected: Sentinel-Marketing-Page lädt, alle 6 Produktseiten erreichbar (Guardian, DSS, Copier, Airbag, News-Shield, Trail-Pro). Unverändert.

- [ ] **Step 6: Build final**

Run: `npm run build`
Expected: PASS, kein TypeScript-Error, kein Lint-Error.

- [ ] **Step 7: Commit (nur falls Smoke-Test Anpassungen brachte)**

Falls Step 1-6 Bugs aufdecken, fix inline und commit. Falls alles passt → kein Commit nötig.

```bash
# Optional, nur wenn Fixes
git add -A
git commit -m "fix: smoke-test issues from phantom-only redesign"
```

---

## Self-Review Notes (vom Plan-Autor)

**Spec-Coverage:**
- Section 1 (trader-config) → Task 1 ✓
- Section 2 (Landing-Page Storyline) → Task 2 + 3 ✓
- Section 3 (Komponenten-Cleanup) → Task 4 + 5 + 6 + 7 ✓
- Section 4 (Dashboard) → Task 8 + 9 ✓
- Section 5 (Backend bleibt) → kein Task, intentional ✓
- Section 6 (Build/Verifikation) → Task 10 ✓

**Type-Konsistenz:** `TRADER_CONFIG` Interface bleibt unverändert, alle Imports von `getTraderByMetaApiId` / `getTraderByLogin` weiterhin gültig.

**Bekannte Risiken:**
- `mtLogin: ""` könnte in `getTraderByLogin("")` einen unerwarteten Hit produzieren. Wenn das in API-Routes ein Problem wird, später nachpflegen — vorerst nicht im Scope.
- PerformanceChart `tvSeries`-Logik nutzt noch `selectedAccount`-State, der durch entfernte Pills nicht mehr gesetzt werden kann. State bleibt auf `null`, fällt in den Default-Pfad — kein Bug, nur etwas toter Code-Pfad. Akzeptabel.

---

**Ende des Plans.**
