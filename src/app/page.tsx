import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { PRICING, RISK_DISCLAIMER } from "@/lib/config";
import LandingInteractive, {
  AnimatedCounter,
  CouponField,
  PlanButton,
} from "@/components/landing/LandingInteractive";

export const metadata: Metadata = {
  title: "Gold Foundry — Dein Trading. Automatisch. Geschützt.",
  description:
    "Smart Copier, FORGE Mentor, 7-Faktor Risk Shield. Automatisiertes Trading mit professionellem Risikomanagement. Ab €2/Monat.",
};

const landingStyles = `
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }
  .revealed {
    opacity: 1;
    transform: translateY(0);
  }
  @keyframes drawCurve {
    from { stroke-dashoffset: 800; }
    to { stroke-dashoffset: 0; }
  }
  .equity-curve {
    stroke-dasharray: 800;
    stroke-dashoffset: 800;
    animation: drawCurve 3s ease-out forwards;
    animation-delay: 0.5s;
  }
  @keyframes particleFloat {
    0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
    10% { opacity: 0.6; }
    90% { opacity: 0.2; }
    50% { transform: translateY(-120px) translateX(30px); }
  }
  .particle {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #d4a537;
    border-radius: 50%;
    pointer-events: none;
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 20px rgba(212,165,55,0.1); }
    50% { box-shadow: 0 0 40px rgba(212,165,55,0.25); }
  }
  @keyframes timelinePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
  }
  @keyframes gaugeFill {
    from { width: 0%; }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .shimmer-text {
    background: linear-gradient(90deg, #d4a537 0%, #fff8e8 40%, #d4a537 80%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }
  @keyframes barGrow {
    from { height: 0; }
  }
`;

const MONTHS = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
const PERF = [8.2, 6.1, 11.3, 9.7, 5.4, 12.8, 7.6, 10.1, 8.9, 6.3, 14.2, 9.5];
const MAX_PERF = 15;

export default function LandingPage() {
  const plans = PRICING.plans;
  const risk = RISK_DISCLAIMER.de;

  return (
    <div className="min-h-screen bg-[#040302] text-[#fff8e8] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />
      <LandingInteractive />

      {/* ═══ 1. HERO ═══ */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${8 + i * 8}%`,
                bottom: "10%",
                animation: `particleFloat ${4 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(212,165,55,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <p className="text-[#d4a537] text-sm font-semibold tracking-[0.3em] uppercase mb-6">Gold Foundry</p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.1] mb-6">
            Dein Trading.<br />
            <span className="shimmer-text">Automatisch.</span><br />
            Geschützt.
          </h1>
          <p className="text-lg sm:text-xl text-[#fff8e8]/70 max-w-2xl mx-auto mb-10">
            Smart Copier + 7-Faktor Risk Shield. Trades werden kopiert, verwaltet und geschützt — in unter 50ms.
          </p>

          {/* Equity Curve */}
          <div className="max-w-lg mx-auto mb-10">
            <svg viewBox="0 0 400 120" className="w-full" aria-label="Equity Curve">
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#d4a537" />
                </linearGradient>
              </defs>
              <path d="M10,100 Q50,95 80,85 T140,70 T200,50 T260,55 T300,35 T350,20 L390,10" fill="none" stroke="url(#curveGrad)" strokeWidth="2.5" className="equity-curve" />
              <path d="M10,100 Q50,95 80,85 T140,70 T200,50 T260,55 T300,35 T350,20 L390,10 L390,120 L10,120 Z" fill="url(#curveGrad)" opacity="0.05" />
            </svg>
          </div>

          {/* Counters */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mb-12">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-[#d4a537]"><AnimatedCounter target={12} prefix="€" suffix="M+" /></div>
              <div className="text-xs text-[#fff8e8]/50 mt-1">Volumen kopiert</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-[#d4a537]"><AnimatedCounter target={2400} suffix="+" /></div>
              <div className="text-xs text-[#fff8e8]/50 mt-1">Trader</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-[#22c55e]"><AnimatedCounter target={72} suffix="%" /></div>
              <div className="text-xs text-[#fff8e8]/50 mt-1">Win Rate</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#pricing" className="px-8 py-4 rounded-xl bg-[#d4a537] text-[#040302] font-bold text-base hover:bg-[#e8b84a] transition-all duration-200 hover:scale-[1.02]">
              Plan wählen — 80% Rabatt
            </a>
            <a href="#produkte" className="px-8 py-4 rounded-xl border border-[#d4a537]/30 text-[#d4a537] font-semibold text-base hover:bg-[#d4a537]/10 transition-all duration-200">
              Produkte entdecken
            </a>
          </div>
        </div>
      </section>

      {/* ═══ 2. ZWEI PRODUKTE ═══ */}
      <section id="produkte" className="px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-4">Zwei Strategien. Ein Ziel.</h2>
          <p className="reveal text-[#fff8e8]/60 text-center mb-16 max-w-xl mx-auto">Wähle den Stil, der zu dir passt — oder kombiniere beide.</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="reveal rounded-2xl border border-[#22c55e]/20 bg-gradient-to-b from-[#22c55e]/5 to-transparent p-8 relative overflow-hidden" style={{ animation: "pulseGlow 4s ease-in-out infinite" }}>
              <div className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase bg-[#22c55e]/20 text-[#22c55e] px-3 py-1 rounded-full">Konservativ</div>
              <h3 className="text-2xl font-bold mb-2">Smart Copier</h3>
              <p className="text-[#fff8e8]/60 text-sm mb-6">Automatische Kopie mit 7-Faktor Risk Engine. Stabil, kontrolliert, prop-firm-tauglich.</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center"><div className="text-xl font-black text-[#22c55e]">+1%</div><div className="text-[10px] text-[#fff8e8]/40">pro Tag</div></div>
                <div className="text-center"><div className="text-xl font-black text-[#22c55e]">4.5%</div><div className="text-[10px] text-[#fff8e8]/40">Max DD</div></div>
                <div className="text-center"><div className="text-xl font-black text-[#22c55e]">72%</div><div className="text-[10px] text-[#fff8e8]/40">Win Rate</div></div>
              </div>
              <ul className="space-y-2 text-sm text-[#fff8e8]/70">
                <li>&#10003; 7-Faktor Risk Shield aktiv</li>
                <li>&#10003; Nacht-Boost + News-Pause</li>
                <li>&#10003; Prop-Firm kompatibel</li>
              </ul>
            </div>
            <div className="reveal rounded-2xl border border-[#d4a537]/20 bg-gradient-to-b from-[#d4a537]/5 to-transparent p-8 relative overflow-hidden" style={{ animation: "pulseGlow 4s ease-in-out infinite", animationDelay: "2s" }}>
              <div className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase bg-[#d4a537]/20 text-[#d4a537] px-3 py-1 rounded-full">Aggressiv</div>
              <h3 className="text-2xl font-bold mb-2">Telegram Signal Copier</h3>
              <p className="text-[#fff8e8]/60 text-sm mb-6">Kopiert Signale aus Telegram-Gruppen direkt auf dein Konto. Managed, aggressiv, maximaler Hebel.</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center"><div className="text-xl font-black text-[#d4a537]">+3-4%</div><div className="text-[10px] text-[#fff8e8]/40">pro Tag</div></div>
                <div className="text-center"><div className="text-xl font-black text-[#d4a537]">25-40%</div><div className="text-[10px] text-[#fff8e8]/40">DD Bereich</div></div>
                <div className="text-center"><div className="text-xl font-black text-[#d4a537]">Managed</div><div className="text-[10px] text-[#fff8e8]/40">Vollautomatisch</div></div>
              </div>
              <ul className="space-y-2 text-sm text-[#fff8e8]/70">
                <li>&#10003; Multi-Signal-Parsing</li>
                <li>&#10003; Auto Risk Adjustment</li>
                <li>&#10003; Telegram-Gruppen Support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. SIGNAL PIPELINE ═══ */}
      <section className="px-4 py-24 bg-gradient-to-b from-transparent via-[#d4a537]/[0.02] to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-4">Signal Pipeline</h2>
          <p className="reveal text-[#fff8e8]/60 text-center mb-16">Vom Signal zum Trade in unter 50ms.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Signal kommt", desc: "Telegram, EA oder manuell — das Signal wird empfangen.", icon: "📡" },
              { step: "02", title: "Parsed", desc: "Symbol, Richtung, SL, TP werden extrahiert und validiert.", icon: "🔍" },
              { step: "03", title: "Risk Check", desc: "7-Faktor Engine prüft: DD, News, Zeit, Volatilität, Performance.", icon: "🛡️" },
              { step: "04", title: "Smart Orders", desc: "4-Split Position mit dynamischem SL/TP und Lot-Sizing.", icon: "⚡" },
            ].map((s) => (
              <div key={s.step} className="reveal text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#d4a537]/10 border border-[#d4a537]/20 flex items-center justify-center text-2xl mb-4">{s.icon}</div>
                <div className="text-[10px] text-[#d4a537] font-bold tracking-widest mb-1">STEP {s.step}</div>
                <h3 className="font-bold text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-[#fff8e8]/50">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="hidden md:block relative h-1 max-w-3xl mx-auto -mt-[88px] mb-20">
            <div className="absolute inset-0 bg-gradient-to-r from-[#d4a537]/0 via-[#d4a537]/30 to-[#d4a537]/0 rounded-full" />
          </div>
        </div>
      </section>

      {/* ═══ 4. TRADE MANAGEMENT ═══ */}
      <section className="px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-4">Intelligentes Trade Management</h2>
          <p className="reveal text-[#fff8e8]/60 text-center mb-16">5 Szenarien, die dein Kapital schützen.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { trigger: "Momentum stirbt", action: "TIGHTEN", desc: "SL wird nachgezogen, Risiko reduziert", color: "#d4a537" },
              { trigger: "News Event", action: "PARTIAL", desc: "50% Position wird geschlossen", color: "#3b82f6" },
              { trigger: "DD niedrig", action: "REDUCE", desc: "Lot-Size automatisch verkleinert", color: "#ef4444" },
              { trigger: "TP erreicht", action: "BREAKEVEN", desc: "SL auf Entry, Rest läuft", color: "#22c55e" },
              { trigger: "Freitag 20:00", action: "CLOSE", desc: "Alle Positionen geschlossen", color: "#a855f7" },
            ].map((s) => (
              <div key={s.action} className="reveal rounded-xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
                <div className="text-xs text-[#fff8e8]/40 mb-2">{s.trigger}</div>
                <div className="font-mono font-bold text-lg mb-1" style={{ color: s.color }}>{s.action}</div>
                <p className="text-xs text-[#fff8e8]/50">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 5. LIVE TRADE TIMELINE ═══ */}
      <section className="px-4 py-24 bg-gradient-to-b from-transparent via-[#22c55e]/[0.02] to-transparent">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-4">Live Trade Timeline</h2>
          <p className="reveal text-[#fff8e8]/60 text-center mb-16">So sieht ein typischer Smart Copier Trade aus.</p>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#d4a537] via-[#22c55e] to-[#d4a537]/0" />
            {[
              { time: "09:14", event: "Signal empfangen", detail: "XAUUSD BUY @ 2.341,50", color: "#d4a537" },
              { time: "09:14", event: "Risk Check bestanden", detail: "DD: 1.2% | News: Clear | Vol: Normal", color: "#22c55e" },
              { time: "09:14", event: "4 Orders platziert", detail: "0.42L + 0.26L + 0.21L + 0.16L = 1.05L", color: "#3b82f6" },
              { time: "09:28", event: "TP1 getroffen", detail: "0.42L @ 2.348 → +€273 | Auto-Breakeven", color: "#22c55e" },
              { time: "09:41", event: "TP2 getroffen", detail: "0.26L @ 2.355 → +€351 | SL nachgezogen", color: "#22c55e" },
              { time: "09:55", event: "TP3 getroffen", detail: "0.21L @ 2.362 → +€430 | Trailing aktiv", color: "#d4a537" },
              { time: "10:12", event: "Runner geschlossen", detail: "Trailing SL @ 2.368,20 → +€431", color: "#a855f7" },
            ].map((step, i) => (
              <div key={i} className="reveal relative flex items-start gap-6 mb-8 last:mb-0">
                <div className="relative z-10 w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: step.color, boxShadow: `0 0 12px ${step.color}40`, animation: "timelinePulse 2s ease-in-out infinite", animationDelay: `${i * 0.3}s` }} />
                <div>
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-mono text-xs text-[#fff8e8]/40">{step.time}</span>
                    <span className="font-semibold text-sm">{step.event}</span>
                  </div>
                  <p className="text-xs text-[#fff8e8]/50 font-mono">{step.detail}</p>
                </div>
              </div>
            ))}
            <div className="reveal ml-12 mt-8 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-6 text-center">
              <div className="text-3xl font-black text-[#22c55e]">+€1.485</div>
              <div className="text-xs text-[#fff8e8]/50 mt-1">Gesamtergebnis in 58 Minuten</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 6. TRACK RECORD ═══ */}
      <section className="px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-4">Track Record</h2>
          <p className="reveal text-[#fff8e8]/60 text-center mb-16">Verifizierte Performance. Keine Versprechen — Daten.</p>

          <div className="reveal flex flex-col sm:flex-row items-center gap-6 mb-12 justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4a537] to-[#d4a537]/40 flex items-center justify-center text-2xl font-black text-[#040302]">GF</div>
            <div className="text-center sm:text-left">
              <div className="font-bold text-lg">Gold Foundry Master</div>
              <div className="text-sm text-[#fff8e8]/50">4 Jahre Erfahrung &middot; Forex + Gold &middot; +1% pro Tag Durchschnitt</div>
            </div>
          </div>

          {/* 12-Month Bar Chart — FIXED */}
          <div className="reveal rounded-2xl border border-white/5 bg-white/[0.02] p-8 mb-8">
            <div className="text-xs text-[#fff8e8]/40 mb-6 font-semibold tracking-widest uppercase">Monatliche Performance (%)</div>
            <div className="flex items-end gap-2 sm:gap-3" style={{ height: "200px" }}>
              {PERF.map((val, i) => {
                const barHeight = Math.round((val / MAX_PERF) * 160);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[10px] text-[#22c55e] font-mono font-bold mb-1">{val}%</span>
                    <div
                      className="w-full rounded-t-md"
                      style={{
                        height: `${barHeight}px`,
                        background: "linear-gradient(to top, rgba(34,197,94,0.4), rgba(34,197,94,0.9))",
                        animation: `barGrow 0.8s ease-out forwards`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                    <span className="text-[10px] text-[#fff8e8]/30 mt-2">{MONTHS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="reveal grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Gesamt-Performance", value: "+110.1%", color: "#22c55e" },
              { label: "Max Drawdown", value: "4.5%", color: "#ef4444" },
              { label: "Sharpe Ratio", value: "2.8", color: "#d4a537" },
              { label: "Trades/Monat", value: "~85", color: "#3b82f6" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-[#fff8e8]/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 7. 7-FAKTOR RISK SHIELD ═══ */}
      <section className="px-4 py-24 bg-gradient-to-b from-transparent via-[#d4a537]/[0.02] to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-4">7-Faktor Risk Shield</h2>
          <p className="reveal text-[#fff8e8]/60 text-center mb-16">Jeder Trade durchläuft 7 Sicherheitsprüfungen.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { code: "TIME", label: "Handelszeit", desc: "Kein Trading außerhalb der Sessions", fill: 95 },
              { code: "NEWS", label: "News Filter", desc: "Automatische Pause bei High-Impact Events", fill: 90 },
              { code: "DD", label: "Drawdown Guard", desc: "Lot-Reduktion bei steigendem DD", fill: 88 },
              { code: "PERF", label: "Performance Lock", desc: "Tagesgewinn sichern, Verluste begrenzen", fill: 85 },
              { code: "VOL", label: "Volatilitätscheck", desc: "Spread-Anomalien und Flash Crashes erkennen", fill: 92 },
              { code: "DAY", label: "Tagesschluss", desc: "Freitag 20:00 → alle Positionen geschlossen", fill: 100 },
              { code: "INTEL", label: "Market Intel", desc: "Regime-Detection und Geopolitik-Scanner", fill: 82 },
            ].map((f) => (
              <div key={f.code} className="reveal rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-mono font-bold text-[#d4a537] bg-[#d4a537]/10 px-2 py-0.5 rounded">{f.code}</span>
                  <span className="font-semibold text-sm">{f.label}</span>
                </div>
                <p className="text-xs text-[#fff8e8]/50 mb-3">{f.desc}</p>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#d4a537] to-[#22c55e]" style={{ width: `${f.fill}%`, animation: "gaugeFill 1.5s ease-out forwards" }} />
                </div>
                <div className="text-right text-[9px] text-[#fff8e8]/30 mt-1">{f.fill}% Schutzlevel</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 8. NACH ANMELDUNG ═══ */}
      <section className="px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-4">Nach der Anmeldung</h2>
          <p className="reveal text-[#fff8e8]/60 text-center mb-16">Was du sofort bekommst.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "💬", title: "WhatsApp Gruppe", desc: "Direkte Community mit anderen Tradern. Support, Analysen und Updates in Echtzeit." },
              { icon: "📊", title: "MT4 Demo Konto", desc: "Starte risikofrei mit einem vorkonfigurierten Demo-Konto. Alles schon eingerichtet." },
              { icon: "🧠", title: "FORGE Mentor", desc: "Dein persönlicher Trading-Analyst. Analysiert deine Trades und optimiert deine Strategie." },
              { icon: "🔧", title: "Broker-Setup", desc: "Wir helfen dir bei der Kontoeröffnung und konfigurieren den Copier für dich." },
            ].map((item) => (
              <div key={item.title} className="reveal rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center hover:border-[#d4a537]/20 transition-colors">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-xs text-[#fff8e8]/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 9. BROKER ═══ */}
      <section className="px-4 py-24 bg-gradient-to-b from-transparent via-[#d4a537]/[0.02] to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-4">Empfohlene Broker</h2>
          <p className="reveal text-[#fff8e8]/60 text-center mb-16">Optimiert für den Smart Copier.</p>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="reveal rounded-2xl border border-[#d4a537]/20 bg-gradient-to-b from-[#d4a537]/5 to-transparent p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Tegas FX</h3>
                <span className="text-[10px] font-bold tracking-widest uppercase bg-[#d4a537]/20 text-[#d4a537] px-3 py-1 rounded-full">Empfohlen</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center"><div className="text-xl font-black text-[#d4a537]">24&times;</div><div className="text-[10px] text-[#fff8e8]/40">Hebel</div></div>
                <div className="text-center"><div className="text-xl font-black text-[#d4a537]">ab €100</div><div className="text-[10px] text-[#fff8e8]/40">Min. Einlage</div></div>
                <div className="text-center"><div className="text-xl font-black text-[#d4a537]">5%</div><div className="text-[10px] text-[#fff8e8]/40">Trail DD</div></div>
              </div>
              <ul className="space-y-2 text-sm text-[#fff8e8]/60">
                <li>&#10003; Prop-Firm Modell</li><li>&#10003; Schnelle Ausführung</li><li>&#10003; MetaTrader 4</li>
              </ul>
            </div>
            <div className="reveal rounded-2xl border border-white/10 bg-white/[0.02] p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">TAG Markets</h3>
                <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 text-[#fff8e8]/60 px-3 py-1 rounded-full">Amplify</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center"><div className="text-xl font-black text-[#fff8e8]/80">12&times;</div><div className="text-[10px] text-[#fff8e8]/40">Amplify</div></div>
                <div className="text-center"><div className="text-xl font-black text-[#fff8e8]/80">ab €500</div><div className="text-[10px] text-[#fff8e8]/40">Min. Einlage</div></div>
                <div className="text-center"><div className="text-xl font-black text-[#fff8e8]/80">10%</div><div className="text-[10px] text-[#fff8e8]/40">Fixed DD</div></div>
              </div>
              <ul className="space-y-2 text-sm text-[#fff8e8]/60">
                <li>&#10003; Amplify-Modell</li><li>&#10003; Höheres Kapital</li><li>&#10003; MetaTrader 4</li>
              </ul>
            </div>
          </div>
          <div className="reveal rounded-2xl border border-[#d4a537]/20 bg-[#d4a537]/5 p-8 text-center">
            <h3 className="font-bold text-lg mb-4">Rechenbeispiel: €500 Einlage</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div><div className="text-2xl font-black text-[#fff8e8]/60">€500</div><div className="text-xs text-[#fff8e8]/40">Deine Einlage</div></div>
              <div className="text-[#d4a537] text-2xl">&rarr;</div>
              <div><div className="text-2xl font-black text-[#d4a537]">24&times; Hebel</div><div className="text-xs text-[#fff8e8]/40">Tegas FX</div></div>
              <div className="text-[#d4a537] text-2xl">&rarr;</div>
              <div><div className="text-2xl font-black text-[#22c55e]">€12.000</div><div className="text-xs text-[#fff8e8]/40">Trading-Kapital</div></div>
            </div>
            <p className="text-xs text-[#fff8e8]/40 mt-4">Mit +1% pro Tag auf €12.000 = bis zu €120/Tag potentieller Gewinn.</p>
          </div>
        </div>
      </section>

      {/* ═══ 10. PRICING ═══ */}
      <section id="pricing" className="px-4 py-24 bg-gradient-to-b from-transparent via-[#d4a537]/[0.03] to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-4">Pricing</h2>
          <p className="reveal text-[#fff8e8]/60 text-center mb-16">80% Rabatt im ersten Monat. Keine Vertragsbindung.</p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="reveal rounded-2xl border border-white/10 bg-white/[0.02] p-8 flex flex-col">
              <h3 className="font-bold text-lg mb-1">{plans.starter.name}</h3>
              <p className="text-xs text-[#fff8e8]/40 mb-6">Einstieg in automatisiertes Trading</p>
              <div className="mb-6">
                <span className="text-3xl font-black text-[#d4a537]">€{plans.starter.firstMonth}</span>
                <span className="text-sm text-[#fff8e8]/40 ml-2 line-through">€{plans.starter.price}</span>
                <div className="text-[10px] text-[#22c55e] mt-1">80% Rabatt im 1. Monat</div>
              </div>
              <ul className="space-y-2 text-sm text-[#fff8e8]/60 mb-8 flex-1">
                <li>&#10003; Dashboard Zugang</li><li>&#10003; Market Intel Basis</li><li>&#10003; WhatsApp Gruppe</li><li>&#10003; 5 FORGE Mentor Nachrichten</li>
              </ul>
              <PlanButton plan="starter" label="Plan wählen" />
            </div>
            <div className="reveal rounded-2xl border-2 border-[#d4a537]/40 bg-gradient-to-b from-[#d4a537]/10 to-[#d4a537]/[0.02] p-8 flex flex-col relative" style={{ animation: "pulseGlow 4s ease-in-out infinite" }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest uppercase bg-[#d4a537] text-[#040302] px-4 py-1 rounded-full">Beliebtester Plan</div>
              <h3 className="font-bold text-lg mb-1">{plans.copier.name}</h3>
              <p className="text-xs text-[#fff8e8]/40 mb-6">Smart Copier + Risk Shield + Mentor</p>
              <div className="mb-6">
                <span className="text-3xl font-black text-[#d4a537]">€{plans.copier.firstMonth}</span>
                <span className="text-sm text-[#fff8e8]/40 ml-2 line-through">€{plans.copier.price}</span>
                <div className="text-[10px] text-[#22c55e] mt-1">80% Rabatt im 1. Monat</div>
              </div>
              <ul className="space-y-2 text-sm text-[#fff8e8]/60 mb-8 flex-1">
                <li>&#10003; Smart Copier vollständig</li><li>&#10003; 7-Faktor Risk Shield</li><li>&#10003; Trade Management</li><li>&#10003; 100 FORGE Mentor Nachrichten</li><li>&#10003; WhatsApp Gruppe</li>
              </ul>
              <PlanButton plan="copier" label="Plan wählen" />
            </div>
            <div className="reveal rounded-2xl border border-white/10 bg-white/[0.02] p-8 flex flex-col">
              <h3 className="font-bold text-lg mb-1">{plans.pro.name}</h3>
              <p className="text-xs text-[#fff8e8]/40 mb-6">Alles + Strategy Lab + Telegram Copier</p>
              <div className="mb-6">
                <span className="text-3xl font-black text-[#d4a537]">€{plans.pro.firstMonth}</span>
                <span className="text-sm text-[#fff8e8]/40 ml-2 line-through">€{plans.pro.price}</span>
                <div className="text-[10px] text-[#22c55e] mt-1">80% Rabatt im 1. Monat</div>
              </div>
              <ul className="space-y-2 text-sm text-[#fff8e8]/60 mb-8 flex-1">
                <li>&#10003; Alles aus Smart Copier</li><li>&#10003; Strategy Lab</li><li>&#10003; Telegram Signal Copier</li><li>&#10003; 300 FORGE Mentor Nachrichten</li><li>&#10003; Priority Support</li>
              </ul>
              <PlanButton plan="pro" label="Plan wählen" />
            </div>
          </div>
          <div className="reveal text-center"><CouponField /></div>
          <div className="reveal flex flex-wrap justify-center gap-6 mt-10">
            {["Keine Vertragsbindung", "Jederzeit kündbar", "SSL-verschlüsselt", "DSGVO-konform", "80% Rabatt im 1. Monat"].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-xs text-[#fff8e8]/40"><span className="text-[#22c55e]">&#10003;</span>{badge}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 11. FAQ ═══ */}
      <section className="px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="reveal text-3xl sm:text-4xl font-black text-center mb-16">Häufige Fragen</h2>
          <div className="space-y-4">
            {[
              { q: "Was ist der Smart Copier?", a: "Der Smart Copier kopiert Trades automatisch auf dein MetaTrader 4 Konto. Jeder Trade durchläuft unseren 7-Faktor Risk Shield, der Drawdown, News, Volatilität und mehr überprüft — bevor die Order platziert wird." },
              { q: "Brauche ich Trading-Erfahrung?", a: "Nein. Der Smart Copier ist vollautomatisch. Du benötigst lediglich ein MetaTrader 4 Konto bei einem unserer empfohlenen Broker. Wir helfen dir beim kompletten Setup." },
              { q: "Wie hoch ist das Risiko?", a: "Trading birgt immer Risiken. Unser 7-Faktor Risk Shield minimiert diese durch automatische DD-Kontrolle, News-Filter und Session-Management. Vergangene Performance ist kein verlässlicher Indikator für zukünftige Ergebnisse." },
              { q: "Kann ich jederzeit kündigen?", a: "Ja. Alle Pläne sind monatlich kündbar. Keine Vertragsbindung, keine versteckten Kosten." },
              { q: "Was passiert nach der Anmeldung?", a: "Du erhältst Zugang zur WhatsApp Gruppe, ein vorkonfiguriertes MT4 Demo-Konto, den FORGE Mentor und Hilfe beim Broker-Setup. Innerhalb von 24h bist du live." },
              { q: "Welchen Broker soll ich wählen?", a: "Tegas FX (24x Hebel, ab €100, 5% Trailing DD) ist unser empfohlener Broker. TAG Markets (12x Amplify) ist die Alternative für höheres Kapital." },
            ].map((faq, i) => (
              <details key={i} className="reveal group rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <summary className="px-6 py-5 cursor-pointer flex items-center justify-between text-sm font-semibold list-none hover:bg-white/[0.02] transition-colors">
                  {faq.q}
                  <span className="text-[#d4a537] transition-transform duration-200 group-open:rotate-45 flex-shrink-0 ml-4 text-lg">+</span>
                </summary>
                <div className="px-6 pb-5 text-sm text-[#fff8e8]/60 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 12. FOOTER + RISIKOHINWEIS ═══ */}
      <section className="px-4 py-8 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] text-[#fff8e8]/30 leading-relaxed">{risk}</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
