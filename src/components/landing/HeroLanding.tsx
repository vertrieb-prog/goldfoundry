"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const GoldScene = dynamic(() => import("./GoldScene"), { ssr: false });

// Animated counter
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 2000;
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{count.toLocaleString("de-DE")}{suffix}</span>;
}

// Scroll reveal hook
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Section({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function HeroLanding() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navOpacity = Math.min(scrollY / 200, 0.95);

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "var(--gf-obsidian)" }}>
      {/* 3D Background */}
      <GoldScene />

      {/* Grid overlay */}
      <div className="gf-grid-bg fixed inset-0 z-[1] opacity-30" />

      {/* Floating Navigation */}
      <nav
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-500"
        style={{
          background: `rgba(9,9,11,${navOpacity})`,
          backdropFilter: scrollY > 50 ? "blur(24px) saturate(1.4)" : "none",
          border: `1px solid rgba(250,239,112,${navOpacity * 0.1})`,
          boxShadow: scrollY > 50 ? "0 8px 40px rgba(0,0,0,0.5)" : "none",
        }}
      >
        <Link href="/" className="px-3 py-1.5 text-sm font-bold gf-gold-text tracking-wider">GF</Link>
        <div className="hidden md:flex items-center gap-1">
          {["Features", "Pricing", "Partner"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              {item}
            </a>
          ))}
        </div>
        <Link
          href="/auth/register"
          className="ml-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
          style={{ background: "var(--gf-gold)", color: "var(--gf-obsidian)" }}
        >
          Starten
        </Link>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Badge */}
        <div className="gf-badge mb-8" style={{ animation: "fadeIn 1s ease 0.2s both" }}>
          Automatisiertes Trading
        </div>

        {/* Headline */}
        <h1
          className="gf-heading text-5xl md:text-7xl lg:text-8xl max-w-5xl leading-[0.95]"
          style={{ animation: "fadeIn 1s ease 0.4s both" }}
        >
          Dein Trading.{" "}
          <span className="gf-gold-text">Automatisch.</span>
          <br />
          Gesch&uuml;tzt.
        </h1>

        {/* Subtitle */}
        <p
          className="mt-6 text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed"
          style={{ animation: "fadeIn 1s ease 0.6s both" }}
        >
          Smart Copier kopiert Trades. Risk Shield sch&uuml;tzt dein Kapital.
          FORGE Mentor optimiert deine Strategie. Alles auf Autopilot.
        </p>

        {/* CTA */}
        <div
          className="flex flex-wrap gap-4 mt-10 justify-center"
          style={{ animation: "fadeIn 1s ease 0.8s both" }}
        >
          <Link href="/auth/register" className="gf-btn gf-btn-shimmer gf-btn-breathe text-base px-8 py-4">
            Kostenlos starten &rarr;
          </Link>
          <Link href="#features" className="gf-btn-outline text-base px-8 py-4">
            Wie es funktioniert
          </Link>
        </div>

        {/* Stats bar */}
        <div
          className="mt-16 flex flex-wrap gap-8 md:gap-16 justify-center"
          style={{ animation: "fadeIn 1s ease 1s both" }}
        >
          {[
            { value: <Counter target={847} />, label: "Trades kopiert" },
            { value: <Counter target={71} suffix="%" />, label: "Win Rate" },
            { value: <Counter target={24} suffix="/5" />, label: "Stunden aktiv" },
            { value: <><Counter target={7} />x</>, label: "Risk Faktoren" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold gf-gold-text font-['Outfit']">{s.value}</div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-[2px] font-mono mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: "float 3s ease-in-out infinite" }}>
          <div className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 rounded-full bg-[var(--gf-gold)]" style={{ animation: "fadeIn 1.5s ease infinite alternate" }} />
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF TICKER ═══════════════════════════════ */}
      <section className="relative z-10 py-12 overflow-hidden gf-mask-sides">
        <div className="gf-marquee-track">
          {[...Array(2)].map((_, set) => (
            <div key={set} className="flex gap-16 items-center shrink-0">
              {["XAUUSD +2.4%", "US500 Autopilot", "71% Win Rate", "24/5 Live", "7-Faktor Shield", "AI Mentor", "Prop-Firm Ready", "Ab \u20ac2/Mo", "XAUUSD +2.4%", "US500 Autopilot", "71% Win Rate"].map((t, i) => (
                <span key={`${set}-${i}`} className="text-sm text-zinc-600 whitespace-nowrap font-mono tracking-wider">{t}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section id="features" className="relative z-10 gf-section">
        <Section>
          <div className="text-center mb-16">
            <div className="gf-eyebrow mb-4">{"\u25c6"} Features</div>
            <h2 className="gf-heading text-4xl md:text-5xl mb-4">Alles was du brauchst.</h2>
            <p className="text-zinc-500 max-w-lg mx-auto">Ein System. Drei Engines. Dein Trading l&auml;uft auf Autopilot w&auml;hrend du lebst.</p>
          </div>
        </Section>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: "\u26a1", title: "Smart Copier", tag: "CORE",
              desc: "Kopiert Trades automatisch von profitablen Master-Accounts auf dein Konto. Intelligentes Lot-Sizing passt sich deinem Kapital an.",
              features: ["Automatisch 24/5", "Multi-Account", "Prop-Firm kompatibel"],
            },
            {
              icon: "\ud83d\udee1\ufe0f", title: "Risk Shield", tag: "SCHUTZ",
              desc: "7-Faktor Risk Engine analysiert Drawdown, News, Volatilit\u00e4t, Session und mehr. Sch\u00fctzt dein Kapital in Echtzeit.",
              features: ["7 Risiko-Faktoren", "Auto Lot-Reduktion", "DD-Schutz"],
            },
            {
              icon: "\ud83e\udde0", title: "FORGE Mentor", tag: "KI",
              desc: "Dein pers\u00f6nlicher KI-Trading-Mentor. Beantwortet Fragen, analysiert Trades und optimiert deine Strategie.",
              features: ["24/7 verf\u00fcgbar", "Personalisiert", "Markt-Analyse"],
            },
          ].map((f, i) => (
            <Section key={f.title} delay={i * 0.1}>
              <div className="gf-panel gf-gradient-border gf-refract p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="gf-icon-ring text-2xl">{f.icon}</div>
                  <span className="text-[9px] font-mono tracking-[2px] text-[var(--gf-gold)] opacity-60">{f.tag}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-6 flex-1">{f.desc}</p>
                <div className="space-y-2">
                  {f.features.map(feat => (
                    <div key={feat} className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="text-[var(--gf-gold)] text-[10px]">{"\u2713"}</span> {feat}
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          ))}
        </div>

        {/* Extra features row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { icon: "\ud83d\udce1", title: "Telegram Copier", desc: "Signal-Channels automatisch kopieren" },
            { icon: "\ud83d\udcca", title: "Live Tracking", desc: "Equity, P&L, Win Rate in Echtzeit" },
            { icon: "\ud83d\udcb0", title: "Partner System", desc: "Bis zu 50% Provision verdienen" },
            { icon: "\ud83c\udfc6", title: "Leaderboard", desc: "Top Trader im Ranking" },
          ].map((f, i) => (
            <Section key={f.title} delay={i * 0.05}>
              <div className="gf-panel p-5 text-center">
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
                <div className="text-[11px] text-zinc-500">{f.desc}</div>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════ */}
      <section className="relative z-10 gf-section">
        <div className="gf-separator mb-16" />
        <Section>
          <div className="text-center mb-16">
            <div className="gf-eyebrow mb-4">{"\u25c6"} So funktioniert es</div>
            <h2 className="gf-heading text-4xl md:text-5xl mb-4">In 3 Schritten live.</h2>
          </div>
        </Section>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { num: "01", title: "Account erstellen", desc: "Registriere dich kostenlos. Dauert 30 Sekunden.", icon: "\ud83d\udcdd" },
            { num: "02", title: "Broker verbinden", desc: "Gib dein MT4/MT5 Investor-Passwort ein. Read-Only, sicher.", icon: "\ud83d\udd17" },
            { num: "03", title: "Copier aktivieren", desc: "Ein Klick. Der Smart Copier startet. Risk Shield sch\u00fctzt ab Tag 1.", icon: "\ud83d\ude80" },
          ].map((s, i) => (
            <Section key={s.num} delay={i * 0.15}>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl" style={{ background: "rgba(250,239,112,0.06)", border: "1px solid rgba(250,239,112,0.15)" }}>
                  {s.icon}
                </div>
                <div className="text-[10px] font-mono text-[var(--gf-gold)] tracking-[3px] mb-2">{s.num}</div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500">{s.desc}</p>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* ══ TRADER PROFILES ═════════════════════════════════ */}
      <section className="relative z-10 gf-section">
        <div className="gf-separator mb-16" />
        <Section>
          <div className="text-center mb-16">
            <div className="gf-eyebrow mb-4">{"\u25c6"} Unsere Trader</div>
            <h2 className="gf-heading text-4xl md:text-5xl mb-4">Profis traden. Du kopierst.</h2>
            <p className="text-zinc-500 max-w-lg mx-auto">3 verifizierte Trader mit 3 Jahren Track Record. W&auml;hle deinen Favoriten.</p>
          </div>
        </Section>
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            { name: "GoldForge Alpha", asset: "XAUUSD", color: "#FAEF70", perf: "+1%/Tag", dd: "4.5%", wr: "72%", pf: "2.1", desc: "Gold-Spezialist. Konservativ. Prop-Firm optimiert." },
            { name: "TechForge", asset: "NAS100", color: "#3b82f6", perf: "+0.8%/Tag", dd: "5.2%", wr: "68%", pf: "1.9", desc: "Nasdaq-Spezialist. US-Session fokussiert." },
            { name: "IndexForge", asset: "US500", color: "#22c55e", perf: "+0.7%/Tag", dd: "4.8%", wr: "70%", pf: "2.0", desc: "S&P 500 Spezialist. London + NY Session." },
          ].map((t, i) => (
            <Section key={t.name} delay={i * 0.1}>
              <div className="gf-panel p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: `${t.color}15`, border: `2px solid ${t.color}30`, color: t.color }}>
                    {t.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: `${t.color}15`, color: t.color }}>{t.asset}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mb-4">{t.desc}</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 rounded-lg text-center" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                    <div className="text-lg font-bold" style={{ color: "var(--gf-green)" }}>{t.perf}</div>
                    <div className="text-[8px] font-mono text-zinc-600">PERFORMANCE</div>
                  </div>
                  <div className="p-2 rounded-lg text-center" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                    <div className="text-lg font-bold text-white">{t.wr}</div>
                    <div className="text-[8px] font-mono text-zinc-600">WIN RATE</div>
                  </div>
                  <div className="p-2 rounded-lg text-center" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                    <div className="text-lg font-bold" style={{ color: "var(--gf-gold)" }}>{t.dd}</div>
                    <div className="text-[8px] font-mono text-zinc-600">MAX DD</div>
                  </div>
                  <div className="p-2 rounded-lg text-center" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                    <div className="text-lg font-bold text-white">{t.pf}</div>
                    <div className="text-[8px] font-mono text-zinc-600">PROFIT FACTOR</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  3 Jahre verifiziert &middot; Prop-Firm geeignet
                </div>
              </div>
            </Section>
          ))}
        </div>
        <Section delay={0.3}>
          <p className="text-center text-xs text-zinc-600 mt-6">Alle Trader: Tegas FX (24&times;) + TAG Markets (12&times;) kompatibel. 100% der Gewinne geh&ouml;ren dir.</p>
        </Section>
      </section>

      {/* ══ SIGNAL PIPELINE ═══════════════════════════════════ */}
      <section className="relative z-10 gf-section">
        <div className="gf-separator mb-16" />
        <Section>
          <div className="text-center mb-12">
            <div className="gf-eyebrow mb-4">{"\u25c6"} Signal Pipeline</div>
            <h2 className="gf-heading text-4xl md:text-5xl mb-4">Von Signal zu Trade. Unter 2 Sekunden.</h2>
          </div>
        </Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { step: "01", icon: "\ud83d\udce8", title: "Signal kommt", desc: "Telegram-Channel sendet ein Trading-Signal", color: "#4d9fff" },
            { step: "02", icon: "\ud83e\udd16", title: "KI parsed sofort", desc: "Entry, Stop-Loss und Ziele erkannt in 200ms", color: "#FAEF70" },
            { step: "03", icon: "\ud83d\udee1\ufe0f", title: "7 Checks laufen", desc: "Risk Engine pr\u00fcft ob der Trade sicher ist", color: "#00e6a0" },
            { step: "04", icon: "\u26a1", title: "Trade ausgef\u00fchrt", desc: "4 Orders mit gestaffelten Gewinn-Zielen", color: "#f0d060" },
          ].map((s, i) => (
            <Section key={s.step} delay={i * 0.12}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: `${s.color}12`, border: `1px solid ${s.color}25`, boxShadow: `0 0 20px ${s.color}10` }}>
                  {s.icon}
                </div>
                <div className="text-[9px] font-mono tracking-[3px] mb-1" style={{ color: s.color }}>STEP {s.step}</div>
                <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
                <p className="text-[11px] text-zinc-500">{s.desc}</p>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* ══ LIVE TRADE TIMELINE ═══════════════════════════════ */}
      <section className="relative z-10 gf-section">
        <div className="gf-separator mb-16" />
        <Section>
          <div className="text-center mb-12">
            <div className="gf-eyebrow mb-4">{"\u25c6"} Live Beispiel</div>
            <h2 className="gf-heading text-4xl md:text-5xl mb-4">So sieht ein Trade aus.</h2>
            <p className="text-zinc-500">Echtes Beispiel. Vollautomatisch. Kein manuelles Eingreifen.</p>
          </div>
        </Section>
        <div className="max-w-2xl mx-auto relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 rounded-full" style={{ background: "rgba(250,239,112,0.12)" }} />
          {[
            { time: "09:14", icon: "\ud83d\udce8", text: "Signal erkannt", detail: "BUY XAUUSD @ 2341.50", color: "#4d9fff", profit: "" },
            { time: "09:14", icon: "\ud83d\udee1\ufe0f", text: "Risk Engine: COPY", detail: "Multiplier 0.92 \u00b7 DD Buffer 72%", color: "#00e6a0", profit: "" },
            { time: "09:14", icon: "\u26a1", text: "4 Orders platziert", detail: "0.42L + 0.26L + 0.21L + 0.16L", color: "#FAEF70", profit: "" },
            { time: "09:28", icon: "\u2713", text: "Gewinn-Ziel 1 erreicht", detail: "Auto-Breakeven \u2014 0% Risiko", color: "#22c55e", profit: "+\u20ac273" },
            { time: "09:41", icon: "\u2713", text: "Gewinn-Ziel 2 erreicht", detail: "KI: Stop-Loss nachgezogen", color: "#22c55e", profit: "+\u20ac351" },
            { time: "09:55", icon: "\u2713", text: "Gewinn-Ziel 3 erreicht", detail: "Trailing Stop aktiv", color: "#22c55e", profit: "+\u20ac430" },
            { time: "10:12", icon: "\ud83c\udfc6", text: "Trade komplett", detail: "4/4 Ziele erreicht \u00b7 0% Risiko nach Ziel 1", color: "#FAEF70", profit: "+\u20ac1.485", highlight: true },
          ].map((e, i) => (
            <Section key={i} delay={i * 0.1}>
              <div className={`flex items-start gap-4 ml-2 mb-4 p-4 rounded-xl relative ${e.highlight ? "" : ""}`} style={e.highlight ? { background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" } : {}}>
                {/* Dot */}
                <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5 -ml-[22px] z-10" style={{ background: e.color, border: "3px solid var(--gf-obsidian)", boxShadow: `0 0 8px ${e.color}40` }} />
                {/* Time */}
                <span className="text-[10px] font-mono text-zinc-600 w-10 flex-shrink-0 mt-0.5">{e.time}</span>
                {/* Icon */}
                <span className="text-base flex-shrink-0">{e.icon}</span>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{e.text}</div>
                  <div className="text-xs text-zinc-500">{e.detail}</div>
                </div>
                {/* Profit */}
                {e.profit && <span className={`font-bold font-mono flex-shrink-0 ${e.highlight ? "text-lg" : "text-sm"}`} style={{ color: "var(--gf-green)" }}>{e.profit}</span>}
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 gf-section">
        <div className="gf-separator mb-16" />
        <Section>
          <div className="text-center mb-16">
            <div className="gf-eyebrow mb-4">{"\u25c6"} Pricing</div>
            <h2 className="gf-heading text-4xl md:text-5xl mb-4">Einfach. Transparent.</h2>
            <p className="text-zinc-500">Starte kostenlos. Upgrade wenn du bereit bist.</p>
          </div>
        </Section>

        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { name: "Free", price: "\u20ac0", period: "/mo", desc: "Dashboard + FORGE Mentor testen", features: ["Dashboard Zugang", "FORGE Mentor (3/Tag)", "Market \u00dcbersicht", "Community"], cta: "Kostenlos starten" },
            { name: "Smart Copier", price: "\u20ac6", period: "1. Monat", desc: "Automatisches Trading mit Risk Shield", features: ["Alles aus Free", "Smart Copier", "3 Trading-Konten", "7-Faktor Risk Shield", "Telegram Signale", "Priority Support"], cta: "Copier aktivieren", popular: true, originalPrice: "\u20ac29/mo" },
            { name: "Pro", price: "\u20ac16", period: "1. Monat", desc: "Unbegrenzt + Prop-Firm + Partner", features: ["Alles aus Copier", "Unbegrenzte Konten", "Prop-Firm Modus", "Strategy Lab", "1:1 Support", "Partner Dashboard"], cta: "Pro starten", originalPrice: "\u20ac79/mo" },
          ].map((plan, i) => (
            <Section key={plan.name} delay={i * 0.1}>
              <div className={`gf-panel p-8 relative ${plan.popular ? "gf-gradient-border" : ""}`} style={plan.popular ? { border: "2px solid rgba(250,239,112,0.3)" } : {}}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold tracking-wider" style={{ background: "var(--gf-gold)", color: "var(--gf-obsidian)" }}>
                    BELIEBT
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold gf-gold-text font-['Outfit']">{plan.price}</span>
                    <span className="text-sm text-zinc-500">{plan.period}</span>
                  </div>
                  {plan.originalPrice && <span className="text-xs text-zinc-600 line-through">{plan.originalPrice}</span>}
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className="text-[var(--gf-gold)] text-xs">{"\u2713"}</span> {f}
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/register"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${plan.popular ? "gf-btn w-full" : "gf-btn-outline w-full"}`}
                >
                  {plan.cta} &rarr;
                </Link>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* ══ PARTNER CTA ═══════════════════════════════════════ */}
      <section id="partner" className="relative z-10 gf-section">
        <div className="gf-separator mb-16" />
        <Section>
          <div className="gf-panel p-12 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(250,239,112,0.04), var(--gf-panel))", border: "1px solid rgba(250,239,112,0.15)" }}>
            <div className="gf-orb gf-orb-gold" style={{ width: 400, height: 400, top: "-30%", right: "-10%" }} />
            <div className="relative z-10">
              <div className="gf-eyebrow mb-4">{"\u25c6"} Partner Programm</div>
              <h2 className="gf-heading text-3xl md:text-4xl mb-4">Verdiene bis zu 50% Provision.</h2>
              <p className="text-zinc-500 max-w-lg mx-auto mb-8">Empfehle Gold Foundry weiter und verdiene monatlich wiederkehrende Provisionen. Kein Limit.</p>
              <Link href="/auth/register" className="gf-btn text-base px-8 py-4">Partner werden &rarr;</Link>
            </div>
          </div>
        </Section>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════ */}
      <section className="relative z-10 gf-section text-center">
        <Section>
          <h2 className="gf-heading text-4xl md:text-5xl mb-4">Bereit f&uuml;r Autopilot?</h2>
          <p className="text-zinc-500 max-w-md mx-auto mb-8">Erstelle deinen Account in 30 Sekunden. Kostenlos. Keine Kreditkarte.</p>
          <Link href="/auth/register" className="gf-btn gf-btn-shimmer gf-btn-breathe text-lg px-10 py-5">
            Jetzt starten &rarr;
          </Link>
        </Section>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t" style={{ borderColor: "var(--gf-border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <span className="text-lg font-bold gf-gold-text tracking-wider">GOLD FOUNDRY</span>
              <p className="text-xs text-zinc-600 mt-2 leading-relaxed">Automatisiertes Trading mit professionellem Risikomanagement.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Produkt</h4>
              <div className="space-y-2">
                {["Smart Copier", "Risk Shield", "FORGE Mentor", "Telegram Copier"].map(l => (
                  <Link key={l} href={`/${l.toLowerCase().replace(/ /g, "-")}`} className="block text-xs text-zinc-600 hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Ressourcen</h4>
              <div className="space-y-2">
                {[["Pricing", "/pricing"], ["Partner", "/partner"], ["Leaderboard", "/leaderboard"], ["Wissen", "/wissen"]].map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs text-zinc-600 hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Legal</h4>
              <div className="space-y-2">
                {[["AGB", "/agb"], ["Datenschutz", "/datenschutz"], ["Impressum", "/impressum"], ["Risikohinweis", "/risk-disclaimer"]].map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs text-zinc-600 hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="gf-separator mb-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-zinc-700 max-w-2xl text-center md:text-left leading-relaxed">
              Risikohinweis: Der Handel mit Forex, CFDs und Kryptow&auml;hrungen birgt erhebliche Risiken und kann zum Verlust des eingesetzten Kapitals f&uuml;hren. Vergangene Ergebnisse sind kein Indikator f&uuml;r zuk&uuml;nftige Performance. Gold Foundry ist kein Broker und bietet keine Anlageberatung.
            </p>
            <p className="text-[10px] text-zinc-700">&copy; 2024 Gold Foundry</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
