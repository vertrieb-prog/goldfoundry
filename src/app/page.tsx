"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LiveStatsBar from "@/components/landing/LiveStatsBar";
import HowItWorks from "@/components/landing/HowItWorks";
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
          Berechnung basiert auf historischer Performance. Keine Garantie fuer zukuenftige Ergebnisse.
        </p>
      </motion.div>
    </section>
  );
}

/* ─── Leverage Cards with 3D ─── */
function LeverageCards({ onStart }: { onStart: () => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const plans = [
    { leverage: "8x", dd: "20%", ddType: "Fix", risk: "Konservativ", color: "#22c55e", desc: "Grosser Puffer. Ideal fuer Anfaenger.", monthly: "~8-15%", icon: "\u{1F6E1}\uFE0F" },
    { leverage: "12x", dd: "10%", ddType: "Trailing", risk: "Balanced", color: "#d4a537", desc: "Bester Kompromiss aus Rendite und Sicherheit.", monthly: "~12-25%", icon: "\u2696\uFE0F", popular: true },
    { leverage: "24x", dd: "5%", ddType: "Fix", risk: "Aggressiv", color: "#f97316", desc: "Maximale Rendite. Fuer erfahrene Trader.", monthly: "~20-40%", icon: "\u{1F680}" },
  ];

  return (
    <section style={{ padding: "80px 20px", maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
        Waehle dein <span style={{ color: "#d4a537" }}>Risikoprofil</span>
      </h2>
      <p style={{ textAlign: "center", color: "#a1a1aa", marginBottom: 40, fontSize: 15 }}>
        Mehr Hebel = mehr Gewinn, aber strikteres Drawdown-Limit.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
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
                <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: plan.color, fontWeight: 600 }}>Waehlen &rarr;</div>
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

  const mono = "'JetBrains Mono', monospace";
  const cellStyle = { padding: "10px 16px", fontFamily: mono, fontSize: 13 };
  const headerCell = { padding: "8px 16px", fontSize: 11, fontWeight: 600 as const, color: "#8a7a5a", textTransform: "uppercase" as const, letterSpacing: "0.08em" };
  const numColor = (v: number) => v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#e0d4b8";

  return (
    <section style={{ padding: "48px 20px", maxWidth: 960, margin: "0 auto" }}>
      {/* Section Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>Portfolio Performance</h2>
          <p style={{ fontSize: 13, color: "#8a7a5a" }}>Live-Daten — automatisch aktualisiert</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#8a7a5a" }}>Live</span>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1,
        background: "rgba(212,165,55,0.06)", borderRadius: "10px 10px 0 0", overflow: "hidden", marginBottom: 1,
      }}>
        {[
          { label: "Total Gain", value: `+${mfx.totalGain.toFixed(2)}%`, color: "#22c55e" },
          { label: "Portfolio", value: `$${Math.round(mfx.totalEquity).toLocaleString("en-US")}`, color: "#e0d4b8" },
          { label: "Profit", value: `+$${mfx.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "#22c55e" },
          { label: "Monatlich", value: `${mfx.totalMonthly.toFixed(2)}%`, color: "#22c55e" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#0a0906", padding: "16px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Systems Table */}
      <div style={{ background: "#0a0906", border: "1px solid rgba(212,165,55,0.08)", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
        {/* Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid rgba(212,165,55,0.08)" }}>
          {["Name", "Gain", "Daily", "Monthly", "Drawdown", "Balance", "Profit", "Pips"].map((h) => (
            <div key={h} style={headerCell}>{h}</div>
          ))}
        </div>

        {/* Account Rows */}
        {mfx.accounts.map((acc, i) => (
          <div key={acc.name} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
            borderBottom: i < mfx.accounts.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
          }}>
            <div style={{ ...cellStyle, color: "#e0d4b8", fontWeight: 600 }}>{acc.name}</div>
            <div style={{ ...cellStyle, color: numColor(acc.gain) }}>+{acc.gain.toFixed(2)}%</div>
            <div style={{ ...cellStyle, color: numColor(acc.daily) }}>{acc.daily.toFixed(2)}%</div>
            <div style={{ ...cellStyle, color: numColor(acc.monthly) }}>{acc.monthly.toFixed(2)}%</div>
            <div style={{ ...cellStyle, color: "#ef4444" }}>{acc.drawdown.toFixed(2)}%</div>
            <div style={{ ...cellStyle, color: "#e0d4b8" }}>${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ ...cellStyle, color: numColor(acc.profit) }}>${acc.profit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ ...cellStyle, color: "#e0d4b8" }}>{acc.pips.toLocaleString("en-US")}</div>
          </div>
        ))}

        {/* Total Row */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
          borderTop: "1px solid rgba(212,165,55,0.12)", background: "rgba(212,165,55,0.03)",
        }}>
          <div style={{ ...cellStyle, color: "#d4a537", fontWeight: 700 }}>Total</div>
          <div style={{ ...cellStyle, color: "#22c55e", fontWeight: 700 }}>+{mfx.totalGain.toFixed(2)}%</div>
          <div style={{ ...cellStyle, color: "#22c55e", fontWeight: 700 }}>{mfx.totalDaily.toFixed(2)}%</div>
          <div style={{ ...cellStyle, color: "#22c55e", fontWeight: 700 }}>{mfx.totalMonthly.toFixed(2)}%</div>
          <div style={{ ...cellStyle, color: "#ef4444", fontWeight: 700 }}>{mfx.totalDrawdown.toFixed(2)}%</div>
          <div style={{ ...cellStyle, color: "#e0d4b8", fontWeight: 700 }}>${mfx.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style={{ ...cellStyle, color: "#22c55e", fontWeight: 700 }}>${mfx.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div style={{ ...cellStyle, color: "#d4a537", fontWeight: 700 }}>{mfx.accounts.reduce((s, a) => s + a.pips, 0).toLocaleString("en-US")}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#52525b" }}>
        Verifizierte Live-Performance — Daten werden alle 5 Minuten aktualisiert
      </div>
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
  const todayPnl = stats?.todayPnl ?? 0;
  const gain = mfx?.totalGain ?? stats?.gain ?? 0;

  return (
    <div style={{ background: "#040302", color: "#fafafa", minHeight: "100vh", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      <HeroBackground3D />

      <div style={{ position: "relative", zIndex: 1 }}>
      <LandingNavbar />
      <FloatingCTA onOpen={openFunnel} />
      <FunnelOverlay open={funnelOpen} onClose={() => setFunnelOpen(false)} liveData={stats?.myfxbook ? { totalGain: stats.myfxbook.totalGain, totalMonthly: stats.myfxbook.totalMonthly, totalEquity: stats.myfxbook.totalEquity, totalProfit: stats.myfxbook.totalProfit, totalDrawdown: stats.myfxbook.totalDrawdown, totalDaily: stats.myfxbook.totalDaily } : null} />

      {/* ═══ HERO ═══ */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 20px 40px", position: "relative" }}>
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
            PHANTOM tradet Gold.{" "}
            <span style={{ background: "linear-gradient(135deg, #d4a537, #f0d060)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Du verdienst.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ color: "#a1a1aa", fontSize: "clamp(16px, 2.5vw, 20px)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
            {equity > 0
              ? <><span style={{ color: "#22c55e", fontWeight: 700 }}>+{gain.toFixed(0)}% Gain</span> &mdash; vollautomatisch, verifiziert</>
              : "KI-gesteuertes Gold Trading \u2014 vollautomatisch"}
          </motion.p>

          {/* Live Counters */}
          {stats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }}>
              {[
                { label: "Equity", value: <><span>$</span><AnimCounter end={equity} /></>, color: "#d4a537" },
                { label: "Heute", value: <><span>{todayPnl >= 0 ? "+" : "-"}$</span><AnimCounter end={Math.abs(todayPnl)} /></>, color: todayPnl >= 0 ? "#22c55e" : "#ef4444" },
                { label: "Gain", value: <><span>+</span><AnimCounter end={Math.round(gain)} suffix="%" /></>, color: "#22c55e" },
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
            {["Reguliert via Tegas FX", "0.71% Max DD", "100% Kostenlos"].map((t) => (
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
          equity={stats.myfxbook?.totalEquity ?? stats.equity}
          todayPnl={stats.todayPnl}
          winrate={stats.winrate}
          maxDd={stats.myfxbook?.totalDrawdown ?? stats.maxDd}
          activePositions={stats.activePositions}
        />
      )}

      {/* ═══ SOCIAL PROOF ═══ */}
      <SocialProof gain={gain} equity={equity} myfxbook={stats?.myfxbook} />

      {/* ═══ HOW IT WORKS ═══ */}
      <HowItWorks />

      {/* ═══ PERFORMANCE (MyFXBook Style) ═══ */}
      <div id="performance">
        <PerformanceChart
          growthCurve={stats?.growthCurve ?? []} drawdownCurve={stats?.drawdownCurve ?? []}
          equityCurve={stats?.equityCurve ?? []} recentTrades={stats?.recentTrades ?? []}
          gain={stats?.gain ?? 0} maxDd={stats?.maxDd ?? 0}
          todayTrades={stats?.todayTrades ?? 0} winrate={stats?.winrate ?? 0}
          myfxbook={stats?.myfxbook}
        />
      </div>

      {/* ═══ PROFIT CALCULATOR ═══ */}
      {/* ProfitCalculator removed — funnel handles this now */}

      {/* ═══ LEVERAGE / DD MODELL ═══ */}
      <LeverageCards onStart={openFunnel} />

      {/* ═══ TEGAS FX ═══ */}
      <section style={{ padding: "80px 20px", maxWidth: 1000, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ background: "rgba(10,8,6,0.7)", border: "1px solid rgba(212,165,55,0.1)", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#d4a537", marginBottom: 16, fontWeight: 600 }}>Unser Broker-Partner</div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>Tegas FX</h2>
          <p style={{ color: "#a1a1aa", fontSize: 15, marginBottom: 32, maxWidth: 600, margin: "0 auto 32px" }}>
            Regulierter ECN/STP Broker mit MISA-Lizenz. Gold Foundry vermittelt nur die Technologie — dein Kapital liegt sicher bei Tegas FX.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginBottom: 32 }}>
            {[
              { icon: "🏛️", title: "MISA Lizenziert", desc: "BFX2024226, Comoros" },
              { icon: "🔒", title: "Segregierte Gelder", desc: "Dein Geld, dein Konto" },
              { icon: "⚡", title: "ECN/STP", desc: "Kein Dealing Desk" },
              { icon: "💰", title: "100% Kostenlos", desc: "Wir sind nur Tech-Vermittler" },
            ].map((item) => (
              <div key={item.title} style={{ padding: 16 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#6d6045" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ TRUST ═══ */}
      <TrustCards />

      {/* ═══ FUNNEL ═══ */}
      <CTASection />

      </div>{/* end glass-section */}
      </div>
    </div>
  );
}
