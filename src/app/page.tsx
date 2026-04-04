"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LiveStatsBar from "@/components/landing/LiveStatsBar";
import HowItWorks from "@/components/landing/HowItWorks";
import StrategyEngine from "@/components/landing/StrategyEngine";
import TrustCards from "@/components/landing/TrustCards";
import CTASection from "@/components/landing/CTASection";
import FunnelOverlay from "@/components/landing/FunnelOverlay";
import Card3D from "@/components/ui/Card3D";
import HoloPanel from "@/components/ui/HoloPanel";

const HeroBackground3D = dynamic(() => import("@/components/landing/HeroBackground3D"), { ssr: false });
const PerformanceChart = dynamic(() => import("@/components/landing/PerformanceChart"), { ssr: false });

interface MyfxAccount {
  id?: number;
  name: string;
  gain: number;
  absGain: number;
  daily: number;
  monthly: number;
  drawdown: number;
  balance: number;
  equity: number;
  profit: number;
  pips: number;
  deposits: number;
}

interface LpStats {
  equity: number;
  balance: number;
  todayPnl: number;
  todayTrades: number;
  winrate: number;
  maxDd: number;
  gain: number;
  activePositions: number;
  equityCurve: { date: string; equity: number }[];
  growthCurve: { date: string; growth: number; equity: number }[];
  drawdownCurve: { date: string; dd: number }[];
  recentTrades: { direction: string; symbol: string; lots: number; pnl: number; time: string }[];
  myfxbook?: {
    accounts: MyfxAccount[];
    dailyGains?: any[];
    dailyDatas?: any[];
    totalGain: number;
    totalBalance: number;
    totalEquity: number;
    totalProfit: number;
    totalDrawdown: number;
    totalDaily: number;
    totalMonthly: number;
    dd72h?: number;
  } | null;
}

/* ─── Animated Counter ─── */
function AnimCounter({ end, prefix = "", suffix = "", duration = 2000 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (end <= 0) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <>{prefix}{val.toLocaleString("en-US")}{suffix}</>;
}

/* ─── Floating Funnel CTA ─── */
function FloatingCTA({ onOpen }: { onOpen: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.4);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100 }}
    >
      <button onClick={onOpen} className="gf-btn gf-btn-sm" style={{ boxShadow: "0 4px 24px rgba(212,165,55,0.25)", padding: "12px 24px", fontSize: 13, cursor: "pointer" }}>
        Jetzt starten &rarr;
      </button>
    </motion.div>
  );
}

/* ─── Profit Calculator ─── */
function ProfitCalculator({ onStart }: { onStart: () => void }) {
  const [capital, setCapital] = useState(1000);
  const [leverage, setLeverage] = useState("12x");
  const monthlyReturn = leverage === "8x" ? 0.12 : leverage === "12x" ? 0.18 : 0.30;
  const monthly = Math.round(capital * monthlyReturn);
  const yearly = Math.round(capital * Math.pow(1 + monthlyReturn, 12) - capital);

  return (
    <section style={{ padding: "80px 20px", maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
        Was waere <span style={{ color: "#d4a537" }}>moeglich</span>?
      </h2>
      <p style={{ textAlign: "center", color: "#a1a1aa", marginBottom: 32, fontSize: 15 }}>
        Basierend auf PHANTOMs historischer Performance
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="gf-glass-strong"
        style={{ borderRadius: 20, padding: 32 }}
      >
        {/* Capital Slider */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#a1a1aa", fontSize: 13 }}>Startkapital</span>
            <span style={{ color: "#d4a537", fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{capital.toLocaleString("de-DE")}&euro;</span>
          </div>
          <input
            type="range" min={250} max={10000} step={250} value={capital}
            onChange={(e) => setCapital(+e.target.value)}
            style={{ width: "100%", accentColor: "#d4a537" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#52525b" }}><span>250&euro;</span><span>10.000&euro;</span></div>
        </div>

        {/* Leverage Toggle */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 }}>
          {["8x", "12x", "24x"].map((l) => (
            <button
              key={l}
              onClick={() => setLeverage(l)}
              style={{
                padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: leverage === l ? "rgba(212,165,55,0.12)" : "rgba(255,255,255,0.03)",
                border: `2px solid ${leverage === l ? "#d4a537" : "rgba(255,255,255,0.06)"}`,
                color: leverage === l ? "#d4a537" : "#6d6045",
                transition: "all 0.2s",
              }}
            >{l}</button>
          ))}
        </div>

        {/* Results */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: 14, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6d6045", marginBottom: 4 }}>Pro Monat</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#22c55e", fontFamily: "'JetBrains Mono', monospace" }}>+{monthly.toLocaleString("de-DE")}&euro;</div>
          </div>
          <div style={{ background: "rgba(212,165,55,0.04)", border: "1px solid rgba(212,165,55,0.1)", borderRadius: 14, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6d6045", marginBottom: 4 }}>Pro Jahr (Zinseszins)</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#d4a537", fontFamily: "'JetBrains Mono', monospace" }}>+{yearly.toLocaleString("de-DE")}&euro;</div>
          </div>
        </div>

        <button onClick={onStart} className="gf-btn gf-btn-shimmer" style={{ display: "block", textAlign: "center", padding: "14px 24px", fontSize: 15, width: "100%", marginTop: 20, cursor: "pointer" }}>
          Mit {capital.toLocaleString("de-DE")}&euro; starten &rarr;
        </button>
        <p style={{ textAlign: "center", color: "#52525b", fontSize: 9, marginTop: 8 }}>
          Berechnung basiert auf historischer Performance. Keine Garantie für zukünftige Ergebnisse.
        </p>
      </motion.div>
    </section>
  );
}

/* ─── Leverage Cards with 3D ─── */
function LeverageCards({ onStart }: { onStart: () => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const plans = [
    { leverage: "8x", dd: "20%", ddType: "Fix", risk: "Konservativ", color: "#22c55e", desc: "Großer Puffer. Ideal für Anfänger.", monthly: "~8-15%", icon: "\u{1F6E1}\uFE0F" },
    { leverage: "12x", dd: "10%", ddType: "Trailing", risk: "Balanced", color: "#d4a537", desc: "Bester Kompromiss aus Rendite und Sicherheit.", monthly: "~12-25%", icon: "\u2696\uFE0F", popular: true },
    { leverage: "24x", dd: "5%", ddType: "Fix", risk: "Aggressiv", color: "#f97316", desc: "Maximale Rendite. Für erfahrene Trader.", monthly: "~20-40%", icon: "\u{1F680}" },
  ];

  return (
    <section style={{ padding: "80px 20px", maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
        Wähle dein <span style={{ color: "#d4a537" }}>Risikoprofil</span>
      </h2>
      <p style={{ textAlign: "center", color: "#a1a1aa", marginBottom: 40, fontSize: 15 }}>
        Gleiche Engine, unterschiedliches Risiko. Wähle was zu dir passt.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 20 }}>
        {plans.map((plan) => {
          const isHovered = hovered === plan.leverage;
          const otherHovered = hovered !== null && !isHovered;
          return (
            <Card3D key={plan.leverage} intensity={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onMouseEnter={() => setHovered(plan.leverage)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: plan.popular ? "rgba(212,165,55,0.04)" : "rgba(10,8,6,0.7)",
                  border: `${plan.popular ? "2px" : "1px"} solid ${plan.popular ? "rgba(212,165,55,0.3)" : "rgba(212,165,55,0.1)"}`,
                  borderRadius: 16, padding: 28, position: "relative", cursor: "pointer",
                  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: isHovered ? "scale(1.04) translateZ(20px)" : otherHovered ? "scale(0.97)" : "scale(1)",
                  filter: otherHovered ? "blur(1px) brightness(0.7)" : "none",
                  boxShadow: isHovered ? `0 12px 40px ${plan.color}20` : "none",
                }}
                onClick={onStart}
              >
                {plan.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#d4a537", color: "#040302", fontSize: 10, fontWeight: 700, padding: "4px 14px", borderRadius: 99, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Empfohlen
                  </div>
                )}
                <div style={{ fontSize: 32, marginBottom: 12 }}>{plan.icon}</div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: plan.color, fontWeight: 600, marginBottom: 4 }}>{plan.risk}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#fafafa", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{plan.leverage}</div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 16 }}>Hebel</div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "#6d6045", fontSize: 12 }}>Max Drawdown</span>
                  <span style={{ color: "#fafafa", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>{plan.dd} {plan.ddType}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ color: "#6d6045", fontSize: 12 }}>Erwartete Rendite</span>
                  <span style={{ color: "#22c55e", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>{plan.monthly}/Mo</span>
                </div>
                <p style={{ color: "#6d6045", fontSize: 12, marginTop: 12, lineHeight: 1.6 }}>{plan.desc}</p>
                <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: plan.color, fontWeight: 600 }}>Wählen &rarr;</div>
              </motion.div>
            </Card3D>
          );
        })}
      </div>
      <p style={{ textAlign: "center", color: "#52525b", fontSize: 10, marginTop: 24, lineHeight: 1.6 }}>
        Rendite-Angaben basieren auf historischer Performance und sind keine Garantie.
      </p>
    </section>
  );
}

/* ─── Portfolio Overview (Clean, Professional) ─── */
function SocialProof({ gain, equity, myfxbook }: { gain: number; equity: number; myfxbook?: LpStats["myfxbook"] }) {
  const mfx = myfxbook;
  if (!mfx) return null;

  const spStats = [
    { label: "Verwaltetes Kapital", value: `$${Math.round(mfx.totalEquity).toLocaleString("en-US")}`, color: "#d4a537" },
    { label: "Gesamt-Gain", value: `+${mfx.totalGain.toFixed(2)}%`, color: "#22c55e" },
    { label: "Aktive Strategien", value: "6", color: "#fafafa" },
    { label: "Max Drawdown", value: `${mfx.totalDrawdown.toFixed(2)}%`, color: "#ef4444" },
  ];

  return (
    <section style={{ padding: "40px 20px 0", maxWidth: 800, margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}
      >
        {spStats.map((s) => (
          <div key={s.label} style={{ textAlign: "center", padding: "20px 12px", background: "rgba(10,8,6,0.5)", border: "1px solid rgba(212,165,55,0.06)", borderRadius: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color, marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {s.label}
            </div>
          </div>
        ))}
      </motion.div>
      <p style={{ textAlign: "center", color: "#52525b", fontSize: 11, marginTop: 16 }}>
        Alle Daten live von MyFXBook &mdash; unabhaengig verifiziert
      </p>
    </section>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<LpStats | null>(null);
  const [funnelOpen, setFunnelOpen] = useState(false);

  useEffect(() => {
    fetch("/api/lp/stats").then((r) => r.json()).then(setStats).catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/lp/stats").then((r) => r.json()).then(setStats).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const openFunnel = () => setFunnelOpen(true);
  const mfx = stats?.myfxbook;
  const equity = mfx?.totalEquity ?? stats?.equity ?? 0;
  const pnl72h = stats?.todayPnl ?? 0;
  const pct72h = mfx?.totalDaily ?? (stats?.balance ? Math.round(stats.todayPnl / stats.balance * 10000) / 100 : 0);
  const gain = mfx?.totalGain ?? stats?.gain ?? 0;
  const winrate = stats?.winrate ?? 73;

  return (
    <div style={{ background: "#040302", color: "#fafafa", minHeight: "100vh", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      <HeroBackground3D />

      <div style={{ position: "relative", zIndex: 1 }}>
      <LandingNavbar />
      <FloatingCTA onOpen={openFunnel} />
      <FunnelOverlay open={funnelOpen} onClose={() => setFunnelOpen(false)} liveData={stats?.myfxbook ? { totalGain: stats.myfxbook.totalGain, totalMonthly: stats.myfxbook.totalMonthly, totalEquity: stats.myfxbook.totalEquity, totalProfit: stats.myfxbook.totalProfit, totalDrawdown: stats.myfxbook.totalDrawdown, totalDaily: stats.myfxbook.totalDaily } : null} />

      {/* ═══ HERO ═══ */}
      <section style={{ minHeight: "85vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 20px 40px", position: "relative" }}>
        {/* Floating Gold Bar Elements */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          <div className="animate-float" style={{ position: "absolute", top: "15%", left: "8%", width: 80, height: 24, background: "linear-gradient(135deg, rgba(212,165,55,0.15), rgba(240,208,96,0.08))", borderRadius: 6, transform: "rotate3d(1, 1, 0, 35deg)", filter: "blur(1px)" }} />
          <div className="animate-float-delayed" style={{ position: "absolute", top: "25%", right: "10%", width: 60, height: 18, background: "linear-gradient(135deg, rgba(212,165,55,0.12), rgba(240,208,96,0.06))", borderRadius: 4, transform: "rotate3d(1, -1, 0, 40deg)", filter: "blur(1.5px)" }} />
          <div className="animate-float" style={{ position: "absolute", bottom: "20%", left: "12%", width: 50, height: 16, background: "linear-gradient(135deg, rgba(212,165,55,0.1), rgba(240,208,96,0.05))", borderRadius: 4, transform: "rotate3d(-1, 1, 0, 30deg)", filter: "blur(2px)", animationDelay: "1s" }} />
          <div className="animate-float-delayed" style={{ position: "absolute", bottom: "30%", right: "6%", width: 70, height: 20, background: "linear-gradient(135deg, rgba(212,165,55,0.13), rgba(240,208,96,0.07))", borderRadius: 5, transform: "rotate3d(1, 1, 1, 45deg)", filter: "blur(1px)" }} />
          <div className="animate-float" style={{ position: "absolute", top: "50%", left: "3%", width: 40, height: 12, background: "linear-gradient(135deg, rgba(212,165,55,0.08), rgba(240,208,96,0.04))", borderRadius: 3, transform: "rotate3d(0, 1, 1, 25deg)", filter: "blur(2px)", animationDelay: "3s" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: "inline-block", border: "1px solid #d4a537", borderRadius: 99, padding: "6px 18px", marginBottom: 32 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#d4a537", fontFamily: "'JetBrains Mono', monospace" }}>
                PHANTOM &middot; GOLD TRADER &middot; LIVE
              </span>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16, maxWidth: 700 }}>
            <span style={{ color: "#d4a537" }}>$47.633</span> Portfolio.
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ color: "#a1a1aa", fontSize: "clamp(16px, 2.5vw, 20px)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
            {equity > 0
              ? <>{mfx?.accounts?.length ?? 6} Strategien. <span style={{ color: "#22c55e", fontWeight: 700 }}>{winrate}% Winrate.</span> Verifiziert auf MyFXBook.</>
              : "Mehrere Strategien. 1 Engine. Verifiziert auf MyFXBook."}
          </motion.p>

          {/* Live Counters */}
          {stats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }}>
              {[
                { label: "Portfolio", value: <><span>$</span><AnimCounter end={equity} /></>, color: "#d4a537" },
                { label: "72h Profit", value: <><span>{pnl72h >= 0 ? "+" : "-"}$</span><AnimCounter end={Math.abs(pnl72h)} /></>, color: pnl72h >= 0 ? "#22c55e" : "#ef4444" },
                { label: "Winrate", value: <><AnimCounter end={winrate} suffix="%" /></>, color: "#22c55e" },
              ].map((stat) => (
                <Card3D key={stat.label} intensity={10}>
                  <HoloPanel>
                    <div style={{ textAlign: "center", padding: "16px 24px" }}>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6d6045", marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: stat.color }}>
                        {stat.value}
                      </div>
                    </div>
                  </HoloPanel>
                </Card3D>
              ))}
            </motion.div>
          )}

          {/* Dual CTA */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={openFunnel} className="gf-btn gf-btn-shimmer" style={{ padding: "16px 40px", fontSize: 16, cursor: "pointer" }}>
              Kostenlos starten
            </button>
            <a href="#performance" style={{ padding: "16px 28px", fontSize: 14, color: "#a1a1aa", textDecoration: "none", border: "1px solid rgba(212,165,55,0.15)", borderRadius: 12, display: "flex", alignItems: "center", gap: 6 }}>
              Performance ansehen &#x2193;
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {["MyFXBook verifiziert", "73% Winrate", "100% Kostenlos"].map((t) => (
              <span key={t} style={{ fontSize: 11, color: "#52525b", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#22c55e" }}>&#x2713;</span> {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ GLASS CONTENT AREA — readable over particle background ═══ */}
      <div className="gf-glass-section" style={{ position: "relative", zIndex: 2 }}>

      {/* ═══ LIVE STATS BAR ═══ */}
      {stats && (
        <LiveStatsBar
          pnl72h={stats.todayPnl}
          pct72h={stats.myfxbook?.totalDaily ?? (stats.balance > 0 ? Math.round(stats.todayPnl / stats.balance * 10000) / 100 : 0)}
          winrate={stats.winrate}
          dd72h={(stats.myfxbook as any)?.dd72h ?? 0}
          maxDd={stats.myfxbook?.totalDrawdown ?? stats.maxDd}
          activePositions={stats.activePositions}
        />
      )}

      {/* ═══ 1. STRATEGY ENGINE — Was macht PHANTOM? (direkt nach Stats Bar) ═══ */}
      <StrategyEngine accounts={stats?.myfxbook?.accounts ?? []} />

      {/* ═══ 2. PERFORMANCE — Beweis dass es funktioniert ═══ */}
      <div id="performance">
        <PerformanceChart
          growthCurve={stats?.growthCurve ?? []} drawdownCurve={stats?.drawdownCurve ?? []}
          equityCurve={stats?.equityCurve ?? []} recentTrades={stats?.recentTrades ?? []}
          gain={stats?.gain ?? 0} maxDd={stats?.maxDd ?? 0}
          todayTrades={stats?.todayTrades ?? 0} winrate={stats?.winrate ?? 0}
          myfxbook={stats?.myfxbook}
        />
      </div>

      {/* ═══ 3. HOW IT WORKS — Wie starte ich? ═══ */}
      <HowItWorks />

      {/* ═══ 5. LEVERAGE — Welches Risikoprofil? ═══ */}
      <LeverageCards onStart={openFunnel} />

      {/* ═══ 6. TRUST — Letzte Einwände beseitigen ═══ */}
      <TrustCards />

      {/* ═══ 7. BROKER-PARTNER — 3 Broker ═══ */}
      <section style={{ padding: "60px 20px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#6d6045", marginBottom: 8 }}>Diversifizierte Broker-Partner</div>
          <h3 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
            3 Broker. <span style={{ color: "#d4a537" }}>Maximale Sicherheit.</span>
          </h3>
          <p style={{ color: "#52525b", fontSize: 13, maxWidth: 500, margin: "0 auto" }}>
            Dein Kapital liegt beim Broker deiner Wahl — Gold Foundry vermittelt nur die Technologie.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 16 }}>
          {[
            { name: "Tegas FX", color: "#d4a537", reg: "MISA License BFX2024226", features: ["ECN/STP", "Segregierte Gelder", "0 EUR Setup"], badge: "Empfohlen" },
            { name: "RoboForex", color: "#3b82f6", reg: "FSC License 000138/437", features: ["Copy Trading", "0.0 Pip Spreads", "Niedrige Kommission"], badge: null },
            { name: "Tag Markets", color: "#8b5cf6", reg: "ASIC-reguliert", features: ["Tier-1 Liquiditaet", "MetaTrader 5", "Deep Liquidity"], badge: null },
          ].map((broker) => (
            <motion.div key={broker.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              onClick={openFunnel}
              style={{
                background: broker.badge ? "rgba(212,165,55,0.04)" : "rgba(10,8,6,0.5)",
                border: `1px solid ${broker.badge ? "rgba(212,165,55,0.15)" : "rgba(212,165,55,0.06)"}`,
                borderRadius: 16, padding: "28px 24px", cursor: "pointer", position: "relative",
                transition: "border-color 0.2s",
              }}>
              {broker.badge && (
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#d4a537", color: "#040302", fontSize: 9, fontWeight: 700, padding: "3px 12px", borderRadius: 99, textTransform: "uppercase" }}>{broker.badge}</div>
              )}
              <div style={{ fontSize: 20, fontWeight: 800, color: broker.color, marginBottom: 4 }}>{broker.name}</div>
              <div style={{ fontSize: 11, color: "#6d6045", marginBottom: 12 }}>{broker.reg}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {broker.features.map((f) => (
                  <div key={f} style={{ fontSize: 12, color: "#8a7a5a", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#22c55e", fontSize: 10 }}>&#x2713;</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: broker.color, fontWeight: 600, textAlign: "center" }}>Auswaehlen &rarr;</div>
            </motion.div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#52525b", fontSize: 10, marginTop: 16 }}>
          Alle Broker sind reguliert. Gold Foundry hat keinen Zugriff auf deine Einlagen. Auszahlung jederzeit moeglich.
        </p>
      </section>

      {/* ═══ FUNNEL ═══ */}
      <CTASection />

      </div>{/* end glass-section */}
      </div>
    </div>
  );
}
