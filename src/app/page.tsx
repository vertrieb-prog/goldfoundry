"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import GoldFoundryLogo from "@/components/GoldFoundryLogo";

/* ─── DESIGN SYSTEM ─── */
const T = {
  bg: "#040302", bg2: "#0a0806", bg3: "#110e09",
  gold: "#d4a537", goldDk: "#9e7a1f", goldLt: "#f0d060",
  text: "#cec0a0", dim: "#6d6045", bright: "#fff6e4",
  red: "#ff5045",
  border: "rgba(212,165,55,0.08)",
  glow: "rgba(212,165,55,0.15)",
  glass: "rgba(10,8,6,0.7)",
  mono: "'JetBrains Mono', monospace",
  sans: "'Outfit', sans-serif",
  grad: "linear-gradient(135deg, #d4a537, #f0d060)",
};

const SECTION_PAD: React.CSSProperties = { padding: "80px 20px", maxWidth: 1100, margin: "0 auto" };
const GLASS: React.CSSProperties = { background: T.glass, backdropFilter: "blur(12px)", border: `1px solid rgba(212,165,55,0.1)`, borderRadius: 16 };

/* ─── HELPER: Counter ─── */
function Counter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = end / 40;
        const id = setInterval(() => {
          start += step;
          if (start >= end) { setVal(end); clearInterval(id); }
          else setVal(Math.floor(start));
        }, 30);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref} style={{ fontFamily: T.mono, fontWeight: 700, color: T.gold }}>{prefix}{val.toLocaleString("de-DE")}{suffix}</span>;
}

/* ─── HELPER: Reveal ─── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(30px)", transition: `all 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

/* ─── HELPER: FloatingCTA ─── */
function FloatingCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.25);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100 }}>
      <a href="#register" style={{ background: T.grad, color: T.bg, padding: "12px 24px", borderRadius: 99, fontWeight: 700, textDecoration: "none", boxShadow: `0 4px 20px ${T.glow}`, fontFamily: T.sans, fontSize: 14 }}>
        Kostenlos starten
      </a>
    </div>
  );
}

/* ─── HELPER: FAQ Accordion ─── */
function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(-1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => setOpen(open === i ? -1 : i)} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: T.bright, fontWeight: 600, fontSize: 15 }}>{item.q}</span>
            <span style={{ color: T.gold, transform: open === i ? "rotate(45deg)" : "none", transition: "0.3s", fontSize: 22, lineHeight: 1 }}>+</span>
          </div>
          {open === i && <p style={{ color: T.text, marginTop: 12, lineHeight: 1.7, fontSize: 14 }}>{item.a}</p>}
        </div>
      ))}
    </div>
  );
}

/* ─── MINI SVG EQUITY CURVE ─── */
function MiniCurve({ data, color, label, gain }: { data: number[]; color: string; label: string; gain: string }) {
  const w = 320, h = 80;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min)) * (h - 10) - 5}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 80 }}>
      <defs>
        <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#g-${label})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />
      <text x="6" y="14" fill={T.dim} fontSize="9" fontFamily={T.mono}>{label}</text>
      <text x={w - 6} y="14" fill={color} fontSize="10" fontFamily={T.mono} textAnchor="end">{gain}</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [scrollPct, setScrollPct] = useState(0);

  /* ─ Scroll progress ─ */
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ─ Leverage calculator state ─ */
  const [levMode, setLevMode] = useState<"8x" | "24x">("8x");
  const [capital, setCapital] = useState(5000);
  const [months, setMonths] = useState(6);
  const leverage = levMode === "8x" ? 8 : 24;
  const effective = capital * leverage;
  const daily = effective * 0.01;
  const monthly = daily * 20;
  const total = monthly * months;
  const maxLoss = capital * 0.05;

  /* ─ Register form ─ */
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAccepted, setRegAccepted] = useState(false);
  const [regStatus, setRegStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [regError, setRegError] = useState("");

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!regAccepted) return;
    setRegStatus("loading");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, fullName: regName, password: crypto.randomUUID().slice(0, 12) }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Fehler"); }
      setRegStatus("ok");
    } catch (err: unknown) {
      setRegStatus("error");
      setRegError(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  };

  /* ─ Strategies expand ─ */
  const [showStrats, setShowStrats] = useState(false);

  /* ─ Equity curve data ─ */
  const heroData = [45, 42, 48, 44, 50, 47, 53, 49, 55, 52, 58, 54, 60, 56, 62, 58, 65, 61, 68, 64, 70, 66, 72, 68];

  return (
    <>
      {/* ─── GLOBAL STYLES ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        body { margin: 0; background: ${T.bg}; color: ${T.text}; font-family: ${T.sans}; overflow-x: hidden; }
        body::before {
          content: ''; position: fixed; inset: 0; z-index: 9999; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 128px 128px;
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.goldDk}; border-radius: 4px; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        * { box-sizing: border-box; }
        a { color: inherit; }
      `}</style>

      {/* ─── SCROLL PROGRESS BAR ─── */}
      <div style={{ position: "fixed", top: 0, left: 0, height: 2, width: `${scrollPct}%`, background: T.grad, zIndex: 1000 }} />

      <FloatingCTA />

      <main style={{ fontFamily: T.sans }}>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 1: HERO
           ═══════════════════════════════════════════════════════════════ */}
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 20px 40px", position: "relative", overflow: "hidden" }}>
          {/* BG glow */}
          <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, borderRadius: "50%", background: `radial-gradient(circle, ${T.gold}0F 0%, transparent 70%)`, pointerEvents: "none" }} />

          <Reveal>
            <GoldFoundryLogo size={36} showText />
          </Reveal>

          {/* Badge */}
          <Reveal delay={0.1}>
            <div style={{ display: "inline-block", border: `1px solid ${T.gold}`, borderRadius: 99, padding: "6px 18px", marginTop: 24, marginBottom: 32 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: T.gold }}>
                INSTANT FUNDING &middot; BIS ZU $500.000 &middot; REGULIERTER BROKER
              </span>
            </div>
          </Reveal>

          {/* H1 */}
          <Reveal delay={0.2}>
            <h1 style={{ margin: 0, lineHeight: 1.15 }}>
              <span style={{ display: "block", fontSize: "clamp(28px, 5vw, 48px)", fontFamily: T.sans, fontWeight: 800, color: T.bright }}>
                4 Profi-Trader.
              </span>
              <span style={{ display: "block", fontSize: "clamp(28px, 5vw, 48px)", fontFamily: T.sans, fontWeight: 800, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Durchschnittlich +1% am Tag.
              </span>
              <span style={{ display: "block", fontSize: "clamp(24px, 4vw, 40px)", fontFamily: T.sans, fontWeight: 800, color: T.bright }}>
                Geschützt von 13 KI-Strategien.
              </span>
            </h1>
          </Reveal>

          {/* Subline */}
          <Reveal delay={0.3}>
            <p style={{ maxWidth: 600, margin: "20px auto 0", color: T.dim, fontSize: 16, lineHeight: 1.7 }}>
              Du wählst den Trader — unsere KI-Engine übernimmt den Rest. 13 Strategien. 9 Sicherheitssysteme. Kein EA. Kein VPS. Kostenlos.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={0.4}>
            <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
              <a href="#register" style={{ background: T.grad, color: T.bg, padding: "14px 32px", borderRadius: 99, fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
                Kostenlos registrieren
              </a>
              <a href="#engine" style={{ border: `1px solid ${T.gold}`, color: T.gold, padding: "14px 32px", borderRadius: 99, fontWeight: 600, textDecoration: "none", background: "transparent", fontSize: 15 }}>
                So funktioniert&apos;s &darr;
              </a>
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={0.5}>
            <div style={{ display: "flex", gap: 32, marginTop: 48, flexWrap: "wrap", justifyContent: "center", fontSize: 14 }}>
              <div><Counter end={1} prefix="+" suffix="% Ø/Tag" /></div>
              <div><Counter end={72} suffix="% Win Rate" /></div>
              <div><Counter end={4200} suffix="+ Trades" /></div>
              <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.gold }}>Seit 2022</div>
            </div>
          </Reveal>

          {/* Equity Curve SVG */}
          <Reveal delay={0.6}>
            <div style={{ maxWidth: 500, width: "100%", margin: "40px auto 0" }}>
              <svg viewBox="0 0 400 100" style={{ width: "100%", height: "auto" }}>
                <defs>
                  <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.gold} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={T.gold} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const d = heroData;
                  const w = 400, h = 100, pad = 10;
                  const mn = Math.min(...d), mx = Math.max(...d);
                  const pts = d.map((v, i) => `${(i / (d.length - 1)) * w},${h - pad - ((v - mn) / (mx - mn)) * (h - 2 * pad)}`).join(" ");
                  return (
                    <>
                      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#hero-fill)" />
                      <polyline points={pts} fill="none" stroke={T.gold} strokeWidth="2.5" strokeLinejoin="round" />
                    </>
                  );
                })()}
                <text x="8" y="16" fill={T.dim} fontSize="10" fontFamily={T.mono}>GOLDFORGE &middot; LIVE</text>
                <text x="392" y="16" fill={T.gold} fontSize="11" fontFamily={T.mono} textAnchor="end">+142%</text>
              </svg>
              <p style={{ fontSize: 10, color: T.dim, marginTop: 4, textAlign: "center" }}>
                Demo-Daten &middot; Vergangene Performance ist keine Garantie
              </p>
            </div>
          </Reveal>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 2: TICKER + TRUST
           ═══════════════════════════════════════════════════════════════ */}
        <section style={{ overflow: "hidden", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "14px 0" }}>
          <div style={{ display: "flex", animation: "ticker 20s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
            {[0, 1].map((dup) => (
              <div key={dup} style={{ display: "flex", gap: 32, paddingRight: 32, fontSize: 13, fontFamily: T.mono, fontWeight: 600 }}>
                <span><span style={{ color: T.gold }}>XAUUSD +1.4R</span> <span style={{ color: T.gold }}>&#x2713;</span></span>
                <span><span style={{ color: T.gold }}>US500 +0.8R</span> <span style={{ color: T.gold }}>&#x2713;</span></span>
                <span><span style={{ color: T.red }}>EURUSD -0.3R</span> <span style={{ color: T.red }}>&#x2717;</span></span>
                <span><span style={{ color: T.gold }}>XAUUSD +2.1R</span> <span style={{ color: T.gold }}>&#x2713;</span></span>
                <span><span style={{ color: T.gold }}>DAX40 +1.2R</span> <span style={{ color: T.gold }}>&#x2713;</span></span>
                <span><span style={{ color: T.red }}>GBPJPY -0.5R</span> <span style={{ color: T.red }}>&#x2717;</span></span>
                <span><span style={{ color: T.gold }}>NAS100 +0.9R</span> <span style={{ color: T.gold }}>&#x2713;</span></span>
                <span><span style={{ color: T.gold }}>XAUUSD +0.6R</span> <span style={{ color: T.gold }}>&#x2713;</span></span>
              </div>
            ))}
          </div>
        </section>

        {/* Trust cards */}
        <section style={{ ...SECTION_PAD, paddingTop: 48, paddingBottom: 48 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { t: "Regulierter Broker", d: "Tegas FX \u00b7 MISA lizenziert \u00b7 DBS Singapore" },
              { t: "13 KI-Strategien", d: "DCA, Recovery, Trailing, Grid + 9 weitere" },
              { t: "Dein Geld ist sicher", d: "Kein Zugriff durch Gold Foundry. Segregated." },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ ...GLASS, padding: "24px 28px" }}>
                  <div style={{ color: T.gold, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{c.t}</div>
                  <div style={{ color: T.text, fontSize: 13 }}>{c.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 3: KI-ENGINE
           ═══════════════════════════════════════════════════════════════ */}
        <section id="engine" style={{ ...SECTION_PAD, background: T.bg2 }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: T.bright, textAlign: "center", margin: 0 }}>
              Jeder Trade wird von unserer KI überwacht.
            </h2>
            <p style={{ color: T.dim, textAlign: "center", marginTop: 12, fontSize: 15 }}>
              Andere Copier kopieren blind. Unsere Engine denkt mit.
            </p>
          </Reveal>

          {/* 5 Steps */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 48 }}>
            {[
              { n: "01", t: "EINSTIEG", d: "KI bewertet Score 0-100. Unter 70 = geblockt." },
              { n: "02", t: "ABSICHERUNG", d: "Günstiger nachkaufen wenn Trade gegen dich läuft." },
              { n: "03", t: "NOTFALL-PLAN", d: "Gegenorder begrenzt den Verlust." },
              { n: "04", t: "GEWINNE SICHERN", d: "Stop Loss zieht automatisch nach." },
              { n: "05", t: "NOTAUS", d: "Kill Switch schließt alles bei Drawdown-Limit." },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{ ...GLASS, padding: "24px 20px" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 800, color: T.gold, marginBottom: 8 }}>{s.n}</div>
                  <div style={{ fontWeight: 700, color: T.bright, fontSize: 13, letterSpacing: "0.05em", marginBottom: 6 }}>{s.t}</div>
                  <div style={{ color: T.text, fontSize: 13, lineHeight: 1.6 }}>{s.d}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Expandable strategies */}
          <Reveal delay={0.3}>
            <div style={{ marginTop: 40, textAlign: "center" }}>
              <button onClick={() => setShowStrats(!showStrats)} style={{ background: "transparent", border: `1px solid ${T.gold}`, color: T.gold, padding: "10px 24px", borderRadius: 99, fontWeight: 600, cursor: "pointer", fontSize: 14, fontFamily: T.sans }}>
                {showStrats ? "Weniger anzeigen" : "Alle 13 Strategien"}
              </button>
              {showStrats && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 20 }}>
                  {["Smart DCA", "Zone Recovery", "Step Trail", "ATR Trail", "Mode Detection", "Grid Scalping", "Signal Scoring", "Anti-Tilt", "Pyramiding", "Smart Re-Entry", "Time Decay", "Volume Check", "Correlation Guard"].map((s) => (
                    <span key={s} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: T.text, fontFamily: T.mono }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* Safety pills */}
          <Reveal delay={0.4}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 32 }}>
              {["Race Lock", "SafeAPI", "Weekend Guard", "Session Filter", "Spread Check", "ATR Min", "Fill Track", "TP Gap", "Cache"].map((p) => (
                <span key={p} style={{ background: `${T.gold}12`, border: `1px solid ${T.gold}30`, borderRadius: 99, padding: "4px 14px", fontSize: 11, color: T.gold, fontWeight: 600 }}>{p}</span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 4: 4 TRADER
           ═══════════════════════════════════════════════════════════════ */}
        <section id="trader" style={SECTION_PAD}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: T.bright, textAlign: "center", margin: 0 }}>
              Unsere Trader. Echte Ergebnisse.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginTop: 48 }}>
            {[
              { name: "GoldForge", sub: "Der Gold-Spezialist", asset: "XAUUSD", perf: "+1.0%/Tag", wr: "72% WR", dd: "4.5% DD", since: "seit 2022", color: T.gold, data: [30, 28, 35, 32, 38, 36, 42, 39, 45, 43, 50, 47, 52, 49, 55, 53], gain: "+142%" },
              { name: "TechForge", sub: "Der Index-Sniper", asset: "US500", perf: "+0.7%/Tag", wr: "68% WR", dd: "3.8% DD", since: "seit 2023", color: "#3b82f6", data: [20, 22, 21, 25, 24, 28, 27, 31, 29, 33, 32, 36, 34, 38, 37, 40], gain: "+98%" },
              { name: "IndexForge", sub: "Der Europa-Trader", asset: "DAX40", perf: "+0.8%/Tag", wr: "65% WR", dd: "5.2% DD", since: "seit 2023", color: "#a855f7", data: [18, 20, 19, 23, 21, 26, 24, 28, 26, 30, 29, 33, 31, 35, 33, 37], gain: "+112%" },
              { name: "ForexForge", sub: "Der Marathon-Läufer", asset: "EURUSD", perf: "+0.5%/Tag", wr: "74% WR", dd: "3.2% DD", since: "seit 2022", color: "#22c55e", data: [15, 16, 17, 18, 17, 19, 20, 21, 22, 23, 22, 24, 25, 26, 27, 28], gain: "+87%" },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ ...GLASS, padding: 24, transition: "box-shadow 0.3s" }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${T.glow}`; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: T.bright, fontSize: 18 }}>{t.name}</div>
                      <div style={{ color: T.dim, fontSize: 12 }}>{t.sub}</div>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.dim, background: T.bg3, padding: "2px 8px", borderRadius: 6 }}>{t.asset}</span>
                  </div>
                  <MiniCurve data={t.data} color={t.color} label={t.name} gain={t.gain} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 12, fontSize: 12, textAlign: "center" }}>
                    <div><div style={{ color: T.gold, fontWeight: 700, fontFamily: T.mono }}>{t.perf}</div><div style={{ color: T.dim, fontSize: 10 }}>Ø Gewinn</div></div>
                    <div><div style={{ color: T.bright, fontWeight: 600 }}>{t.wr}</div><div style={{ color: T.dim, fontSize: 10 }}>Win Rate</div></div>
                    <div><div style={{ color: T.bright, fontWeight: 600 }}>{t.dd}</div><div style={{ color: T.dim, fontSize: 10 }}>Max DD</div></div>
                    <div><div style={{ color: T.bright, fontWeight: 600 }}>{t.since}</div><div style={{ color: T.dim, fontSize: 10 }}>Aktiv</div></div>
                  </div>
                  <a href="#register" style={{ display: "block", textAlign: "center", marginTop: 16, background: T.grad, color: T.bg, padding: "10px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
                    Kostenlos kopieren
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
          <p style={{ fontSize: 11, color: T.dim, textAlign: "center", marginTop: 20 }}>
            Vergangene Performance ist keine Garantie für zukünftige Ergebnisse.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 5: HEBEL-RECHNER
           ═══════════════════════════════════════════════════════════════ */}
        <section id="rechner" style={{ ...SECTION_PAD, background: T.bg2 }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: T.bright, textAlign: "center", margin: 0 }}>
              Rechne dir aus was möglich ist.
            </h2>
            <p style={{ color: T.dim, textAlign: "center", marginTop: 12, fontSize: 15 }}>
              8x oder 24x Hebel. Beide mit 5% Max Drawdown.
            </p>
          </Reveal>

          <div style={{ maxWidth: 600, margin: "40px auto 0" }}>
            {/* Toggle */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
              {(["8x", "24x"] as const).map((m) => (
                <button key={m} onClick={() => setLevMode(m)} style={{
                  padding: "10px 28px", borderRadius: 99, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: T.sans, border: "none",
                  background: levMode === m ? T.grad : "transparent",
                  color: levMode === m ? T.bg : T.gold,
                  ...(levMode !== m ? { border: `1px solid ${T.gold}` } : {}),
                }}>
                  {m} Hebel
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ color: T.text, fontSize: 13 }}>Kapital</label>
                <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.gold }}>{capital.toLocaleString("de-DE")} &euro;</span>
              </div>
              <input type="range" min={500} max={100000} step={500} value={capital} onChange={(e) => setCapital(+e.target.value)}
                style={{ width: "100%", accentColor: T.gold }} />
            </div>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ color: T.text, fontSize: 13 }}>Monate</label>
                <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.gold }}>{months}</span>
              </div>
              <input type="range" min={1} max={12} step={1} value={months} onChange={(e) => setMonths(+e.target.value)}
                style={{ width: "100%", accentColor: T.gold }} />
            </div>

            {/* Results */}
            <div style={{ ...GLASS, padding: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <div style={{ color: T.dim, fontSize: 11, marginBottom: 4 }}>Effektives Kapital</div>
                  <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.gold, fontSize: 20 }}>{effective.toLocaleString("de-DE")} &euro;</div>
                </div>
                <div>
                  <div style={{ color: T.dim, fontSize: 11, marginBottom: 4 }}>&Oslash; Tagesgewinn</div>
                  <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.gold, fontSize: 20 }}>{daily.toLocaleString("de-DE", { maximumFractionDigits: 0 })} &euro;</div>
                </div>
                <div>
                  <div style={{ color: T.dim, fontSize: 11, marginBottom: 4 }}>&Oslash; Monatsgewinn</div>
                  <div style={{ fontFamily: T.mono, fontWeight: 700, color: T.gold, fontSize: 20 }}>{monthly.toLocaleString("de-DE", { maximumFractionDigits: 0 })} &euro;</div>
                </div>
                <div>
                  <div style={{ color: T.dim, fontSize: 11, marginBottom: 4 }}>Gesamt nach {months} Monate{months > 1 ? "n" : ""}</div>
                  <div style={{ fontFamily: T.mono, fontWeight: 800, fontSize: 38, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {total.toLocaleString("de-DE", { maximumFractionDigits: 0 })} &euro;
                  </div>
                </div>
              </div>

              {/* Risk box */}
              <div style={{ border: `1px solid ${T.red}`, borderRadius: 12, padding: "14px 18px", marginTop: 8 }}>
                <div style={{ color: T.red, fontWeight: 700, fontFamily: T.mono, fontSize: 15, marginBottom: 4 }}>
                  Max Verlust (5% DD): -{maxLoss.toLocaleString("de-DE")} &euro;
                </div>
                <div style={{ color: T.dim, fontSize: 12 }}>
                  Kill Switch schließt automatisch bei 5% Drawdown.
                </div>
              </div>
            </div>

            <p style={{ fontSize: 11, color: T.dim, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
              Basierend auf &Oslash; 1%/Tag. KEINE Garantie. Hebel verstärkt Gewinne UND Verluste.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 6: VERGLEICH
           ═══════════════════════════════════════════════════════════════ */}
        <section style={SECTION_PAD}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: T.bright, textAlign: "center", margin: 0 }}>
              Vergiss alles was du über Copier weißt.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginTop: 48 }}>
            {/* Left - Andere */}
            <Reveal delay={0.1}>
              <div style={{ ...GLASS, padding: 28, borderColor: `${T.red}30` }}>
                <div style={{ color: T.red, fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Andere Copier</div>
                {["EA installieren", "VPS mieten (30 &euro;/Mo)", "MetaTrader 5 offen lassen", "Lots manuell berechnen", "News überwachen", "SL nachziehen"].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}`, color: T.dim, fontSize: 14 }}>
                    <span style={{ color: T.red }}>&#x2717;</span>
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </div>
                ))}
                <div style={{ marginTop: 20, color: T.red, fontWeight: 700, fontFamily: T.mono, fontSize: 16 }}>
                  Gesamt: 80-230 &euro;/Monat
                </div>
              </div>
            </Reveal>

            {/* Right - Gold Foundry */}
            <Reveal delay={0.2}>
              <div style={{ ...GLASS, padding: 28, borderColor: `${T.gold}30`, boxShadow: `0 0 40px ${T.glow}` }}>
                <div style={{ color: T.gold, fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Gold Foundry</div>
                {["Registrieren", "Trader wählen", "Fertig."].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}`, color: T.bright, fontSize: 14 }}>
                    <span style={{ color: T.gold }}>&#x2713;</span>
                    <span>{item}</span>
                  </div>
                ))}
                <div style={{ marginTop: 20, fontWeight: 800, fontFamily: T.mono, fontSize: 28, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Gesamt: 0 &euro;
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 7: INSTANT FUNDING
           ═══════════════════════════════════════════════════════════════ */}
        <section style={{ ...SECTION_PAD, background: T.bg2 }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: T.bright, textAlign: "center", margin: 0 }}>
              Kein Kapital? Kein Problem.
            </h2>
            <p style={{ color: T.dim, textAlign: "center", marginTop: 12, fontSize: 15 }}>
              Sofort echtes Kapital. Keine Challenge. Bis zu $500.000.
            </p>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 40 }}>
            {[
              { t: "Sofort starten", d: "Keine Evaluation" },
              { t: "Bis $500k", d: "Skalierbar" },
              { t: "Bis 90% Gewinn", d: "Behalten" },
            ].map((c, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ ...GLASS, padding: "28px 24px", textAlign: "center" }}>
                  <div style={{ color: T.gold, fontWeight: 700, fontSize: 20, marginBottom: 6 }}>{c.t}</div>
                  <div style={{ color: T.text, fontSize: 14 }}>{c.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <p style={{ fontSize: 11, color: T.dim, textAlign: "center", marginTop: 20 }}>
            Konditionen gemäß Tegas FX Instant Funding Programm.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 8: TEGAS FX
           ═══════════════════════════════════════════════════════════════ */}
        <section style={SECTION_PAD}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: T.bright, textAlign: "center", margin: 0 }}>
              Dein Broker: Tegas FX
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginTop: 32 }}>
              {["MISA Reguliert", "A-Book", "7ms Execution", "DBS Segregated", "1:200 Leverage"].map((s) => (
                <span key={s} style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, color: T.bright }}>{s}</span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div style={{ maxWidth: 700, margin: "32px auto 0", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7, marginBottom: 16 }}>
                tegasFX Limited, Bonovo Road, Fomboni, Comoros. MISA License BFX2024226.
              </p>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7, marginBottom: 24 }}>
                Gold Foundry hat keinen Zugriff auf dein Kapital oder deine Trades.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {["\u2713 AML/KYC Compliant", "\u2713 Segregated Funds", "\u2713 A-Book Execution", "\u2713 No-Last-Look"].map((p) => (
                  <span key={p} style={{ background: `${T.gold}10`, border: `1px solid ${T.gold}25`, borderRadius: 99, padding: "6px 16px", fontSize: 12, color: T.gold, fontWeight: 600 }}>{p}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 9: WARUM KOSTENLOS
           ═══════════════════════════════════════════════════════════════ */}
        <section style={{ ...SECTION_PAD, background: T.bg2 }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: T.bright, textAlign: "center", margin: 0 }}>
              Warum ist Gold Foundry kostenlos?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ maxWidth: 650, margin: "24px auto 0", textAlign: "center", fontSize: 15, color: T.text, lineHeight: 1.8 }}>
              Wir verdienen vom Broker — nicht von dir. Tegas FX zahlt uns eine Vermittlungsprovision für jeden aktiven Trader.
              Du zahlst nie etwas an Gold Foundry. Kein Abo. Kein Kleingedrucktes. Null Euro.
            </p>
          </Reveal>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 10: REGISTRIERUNG
           ═══════════════════════════════════════════════════════════════ */}
        <section id="register" style={SECTION_PAD}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: T.bright, textAlign: "center", margin: 0 }}>
              In 2 Minuten startklar.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, marginTop: 48, alignItems: "start" }}>
            {/* Left: Checklist */}
            <Reveal delay={0.1}>
              <div>
                {[
                  "Kostenlos registrieren",
                  "Tegas FX Konto eröffnen",
                  "Einzahlen ab 250 \u20ac",
                  "Trader wählen",
                  "Engine läuft automatisch",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.border}`, fontSize: 15 }}>
                    <span style={{ color: T.gold, fontWeight: 700, fontSize: 18 }}>&#x2713;</span>
                    <span style={{ color: T.bright }}>{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Right: Form */}
            <Reveal delay={0.2}>
              <div style={{ ...GLASS, padding: 28 }}>
                {regStatus === "ok" ? (
                  <div style={{ padding: 20, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>Erfolgreich!</div>
                    <div style={{ color: T.text, fontSize: 14 }}>Prüfe dein E-Mail Postfach.</div>
                  </div>
                ) : (
                  <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 12, color: T.dim, marginBottom: 6 }}>Vorname</label>
                      <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.bright, fontSize: 14, fontFamily: T.sans, outline: "none" }}
                        placeholder="Max" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 12, color: T.dim, marginBottom: 6 }}>Email</label>
                      <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.bright, fontSize: 14, fontFamily: T.sans, outline: "none" }}
                        placeholder="max@beispiel.de" />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontSize: 12, color: T.dim, marginBottom: 6 }}>Telefon <span style={{ color: T.dim }}>(optional)</span></label>
                      <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.bright, fontSize: 14, fontFamily: T.sans, outline: "none" }}
                        placeholder="+49 ..." />
                    </div>

                    {/* Checkbox */}
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 20 }}>
                      <input type="checkbox" checked={regAccepted} onChange={(e) => setRegAccepted(e.target.checked)}
                        style={{ marginTop: 3, accentColor: T.gold }} />
                      <span style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>
                        Ich akzeptiere die{" "}
                        <Link href="/agb" style={{ color: T.gold, textDecoration: "underline" }}>AGB</Link>,{" "}
                        den <Link href="/risikohinweis" style={{ color: T.gold, textDecoration: "underline" }}>Risikohinweis</Link>{" "}
                        und die <Link href="/datenschutz" style={{ color: T.gold, textDecoration: "underline" }}>Datenschutzerklärung</Link>.
                      </span>
                    </label>

                    {regStatus === "error" && (
                      <div style={{ color: T.red, fontSize: 13, marginBottom: 12 }}>{regError}</div>
                    )}

                    <button type="submit" disabled={!regAccepted || regStatus === "loading"}
                      style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: regAccepted ? T.grad : T.bg3, color: regAccepted ? T.bg : T.dim, fontWeight: 700, fontSize: 15, cursor: regAccepted ? "pointer" : "not-allowed", fontFamily: T.sans }}>
                      {regStatus === "loading" ? "Wird registriert..." : "Kostenlos registrieren"}
                    </button>

                    <p style={{ fontSize: 11, color: T.dim, textAlign: "center", marginTop: 12 }}>
                      Anleitung zur Tegas-Kontoeröffnung per Email.
                    </p>
                  </form>
                )}
              </div>
            </Reveal>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 32, flexWrap: "wrap", fontSize: 13 }}>
            {["\u2713 Reguliert", "\u2713 Kein Abo", "\u2713 Jederzeit kündbar"].map((b) => (
              <span key={b} style={{ color: T.gold, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           SECTION 11: FAQ
           ═══════════════════════════════════════════════════════════════ */}
        <section id="faq" style={{ ...SECTION_PAD, background: T.bg2 }}>
          <Reveal>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: T.bright, textAlign: "center", margin: "0 0 40px" }}>
              Häufige Fragen
            </h2>
          </Reveal>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <FAQ items={[
              { q: "Was macht Gold Foundry?", a: "Gold Foundry ist ein Technologie-Anbieter für KI-gesteuertes Trade Management. Wir sind kein Broker und kein Finanzdienstleister. Alle Trades laufen über Tegas FX (MISA lizenziert)." },
              { q: "Warum ist Gold Foundry kostenlos?", a: "Tegas FX zahlt uns eine Vermittlungsprovision. Du zahlst keinen Cent an Gold Foundry — kein Abo, keine Performance Fee, keine versteckten Kosten." },
              { q: "Was bedeutet 8x und 24x Hebel?", a: "Dein Kapital wird multipliziert. 1.000 \u20ac mit 8x Hebel = 8.000 \u20ac Handelskraft. Beide Optionen haben 5% Max Drawdown — der Kill Switch schließt automatisch." },
              { q: "Was ist Instant Funding?", a: "Du bekommst sofort echtes Kapital von Tegas FX — ohne Challenge oder Wartezeit. Bis zu $500.000. Du behältst bis zu 90% der Gewinne." },
              { q: "Was passiert bei Verlusten?", a: "13 KI-Strategien und 9 Sicherheitssysteme schützen jeden Trade. Bei 5% Drawdown greift der Kill Switch — alle Positionen werden sofort geschlossen." },
              { q: "Brauche ich Trading-Erfahrung?", a: "Nein. Du wählst einen Trader, die KI macht den Rest. Kein EA, kein VPS, kein MetaTrader 5-Wissen nötig." },
            ]} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════════════════════════════ */}
        <footer style={{ padding: "48px 20px 32px", background: T.bg, borderTop: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {/* Risk disclaimer */}
            <p style={{ fontSize: 11, color: T.dim, lineHeight: 1.8, marginBottom: 32, textAlign: "center" }}>
              CFDs sind komplexe Instrumente und bergen ein hohes Risiko. 74-89% der Kleinanleger verlieren Geld beim CFD-Handel. Vergangene Performance ist keine Garantie für zukünftige Ergebnisse. Gold Foundry ist ein Produkt der PhoenixOne AI UG (haftungsbeschränkt), Leipzig — ein Technologie-Anbieter, kein Finanzdienstleister. Alle Trades werden über Tegas FX ausgeführt (tegasFX Limited, MISA License BFX2024226, Bonovo Road, Fomboni, Comoros). Gold Foundry hat keinen Zugriff auf Kundengelder. Handeln Sie nur mit Kapital, dessen Verlust Sie sich leisten können.
            </p>

            {/* Links */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
              {[
                { label: "Impressum", href: "/impressum" },
                { label: "Datenschutz", href: "/datenschutz" },
                { label: "AGB", href: "/agb" },
                { label: "Risikohinweis", href: "/risikohinweis" },
              ].map((l) => (
                <Link key={l.href} href={l.href} style={{ color: T.dim, fontSize: 12, textDecoration: "none" }}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Copyright */}
            <p style={{ fontSize: 11, color: T.dim, textAlign: "center" }}>
              &copy; 2026 Gold Foundry &middot; PhoenixOne AI UG (haftungsbeschränkt) &middot; Tegas FX (MISA)
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
