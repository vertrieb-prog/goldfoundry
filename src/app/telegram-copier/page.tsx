"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RISK_DISCLAIMER } from "@/lib/config";
import Footer from "@/components/Footer";

const FEATURES = [
  { icon: "AI", title: "AI Signal-Parsing", desc: "Unsere proprietaere AI erkennt automatisch BUY/SELL, Entry, SL, TP aus jeder Telegram-Nachricht. Egal welches Format." },
  { icon: "4x", title: "Smart TP-Splits", desc: "Jedes Signal wird in 4 Take-Profits aufgeteilt (40/25/20/15%). Maximale Gewinnmitnahme bei jedem Trade." },
  { icon: "BE", title: "Auto-Breakeven", desc: "Nach TP1 wird der Stop Loss automatisch auf Entry + Spread verschoben. Kein Risiko mehr im Trade." },
  { icon: "TS", title: "Trailing Stop", desc: "Der letzte Split (Runner) wird mit einem 15-Pip Trailing Stop nachgezogen. Fange die ganze Bewegung." },
  { icon: "7F", title: "7-Faktor Risk Engine", desc: "Jedes Signal durchlaeuft die komplette Risk Engine: Time, News, DD, Performance, Volatility, Weekday, Intel." },
  { icon: "SH", title: "Manipulation Shield", desc: "Stop Hunt, Flash Crash, Spread-Anomalien, Liquidity Vacuum — alles wird erkannt und blockiert." },
];

const FLOW_STEPS = [
  { step: "01", title: "Signal kommt rein", desc: "Telegram-Channel sendet ein Trading-Signal", icon: ">" },
  { step: "02", title: "AI parsed sofort", desc: "Action, Symbol, Entry, SL, TPs in unter 200ms", icon: "{}" },
  { step: "03", title: "Risk Engine prueft", desc: "7 Faktoren berechnen den optimalen Multiplier", icon: "x7" },
  { step: "04", title: "Smart Orders live", desc: "4 Orders mit gestaffelten TPs auf deinem MT4/MT5", icon: "4x" },
];

const MANAGEMENT_STEPS = [
  { time: "09:14:02", event: "Signal erkannt", detail: "BUY XAUUSD @ 2341.50 | Confidence 96%", status: "parsed", profit: null },
  { time: "09:14:03", event: "Risk Engine: COPY", detail: "Multiplier 0.92 | News in 45min | DD Buffer 72%", status: "checked", profit: null },
  { time: "09:14:03", event: "4 Orders platziert", detail: "0.42L + 0.26L + 0.21L + 0.16L = 1.05L total", status: "executed", profit: null },
  { time: "09:28:17", event: "TP1 getroffen", detail: "0.42L @ 2348 geschlossen", status: "tp", profit: "+€273" },
  { time: "09:28:18", event: "Auto-Breakeven aktiviert", detail: "SL aller verbleibenden Orders auf 2341.70", status: "managed", profit: null },
  { time: "09:41:05", event: "TP2 getroffen", detail: "0.26L @ 2355 geschlossen", status: "tp", profit: "+€351" },
  { time: "09:41:06", event: "AI: TIGHTEN_SL", detail: "Momentum sinkt. SL nachgezogen auf 2349.50", status: "managed", profit: null },
  { time: "09:55:33", event: "TP3 getroffen", detail: "0.21L @ 2362 geschlossen", status: "tp", profit: "+€430" },
  { time: "09:55:34", event: "Trailing Stop aktiv", detail: "Runner 0.16L trailing bei 15 Pips Abstand", status: "managed", profit: null },
  { time: "10:12:41", event: "Runner geschlossen", detail: "Trailing SL bei 2368.20 getriggert", status: "closed", profit: "+€431" },
  { time: "10:12:42", event: "Trade komplett", detail: "4/4 TPs | 0% Risiko nach TP1", status: "done", profit: "+€1.485" },
];

const AI_DECISIONS = [
  { scenario: "Momentum stirbt", action: "TIGHTEN_SL", desc: "5m/15m Candles zeigen nachlassenden Move — SL wird automatisch nachgezogen.", icon: "~" },
  { scenario: "News in 10 Minuten", action: "PARTIAL_CLOSE", desc: "50% der Position wird vor High-Impact Events geschlossen. Rest mit engem SL.", icon: "!" },
  { scenario: "Channel sagt CLOSE", action: "CLOSE_ALL", desc: "Alle Positionen von diesem Channel werden sofort geschlossen.", icon: "X" },
  { scenario: "Channel sagt MOVE SL", action: "MODIFY", desc: "SL/TP-Updates werden sofort auf alle deine Orders uebertragen.", icon: ">" },
  { scenario: "DD Buffer < 20%", action: "REDUCE", desc: "Lots halbiert. Unter 5%: Pause. Unter 2%: Emergency Kill.", icon: "!" },
  { scenario: "Freitag 16:00", action: "WEEKEND_CLOSE", desc: "Alle offenen Positionen werden vor dem Weekend geschlossen.", icon: "F" },
];

function statusColor(status: string) {
  switch (status) {
    case "parsed": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "checked": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "executed": return "text-green-400 bg-green-500/10 border-green-500/20";
    case "tp": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "managed": return "text-[#d4a537] bg-[#d4a537]/10 border-[#d4a537]/20";
    case "closed": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    case "done": return "text-white bg-white/10 border-white/20";
    default: return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
  }
}

function dotColor(status: string) {
  switch (status) {
    case "parsed": return "bg-blue-400 shadow-blue-400/50";
    case "checked": return "bg-yellow-400 shadow-yellow-400/50";
    case "executed": return "bg-green-400 shadow-green-400/50";
    case "tp": return "bg-emerald-400 shadow-emerald-400/50";
    case "managed": return "bg-[#d4a537] shadow-[#d4a537]/50";
    case "closed": return "bg-purple-400 shadow-purple-400/50";
    case "done": return "bg-white shadow-white/50";
    default: return "bg-zinc-400";
  }
}

// Scroll-Reveal Hook
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// Animated counter
function Counter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const { ref, visible } = useReveal();
  const [val, setVal] = useState("0");
  useEffect(() => {
    if (!visible) return;
    const num = parseInt(target.replace(/[^0-9]/g, ""));
    if (isNaN(num)) { setVal(target); return; }
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(num * eased).toString());
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target]);
  return <span ref={ref}>{target.includes("%") ? val + "%" : target.includes("$") ? "$" + val : target.includes("+") ? val + "+" : val}{suffix}</span>;
}

// Pulsing live dot
function PulseDot({ color = "bg-green-400" }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

export default function TelegramCopierPage() {
  const [activeTimeline, setActiveTimeline] = useState(-1);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineVisible, setTimelineVisible] = useState(false);

  // Auto-play timeline animation
  useEffect(() => {
    if (!timelineVisible) return;
    let i = 0;
    const timer = setInterval(() => {
      setActiveTimeline(i);
      i++;
      if (i > MANAGEMENT_STEPS.length) clearInterval(timer);
    }, 400);
    return () => clearInterval(timer);
  }, [timelineVisible]);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimelineVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Typing effect for signal
  const [typedLines, setTypedLines] = useState(0);
  const signalRef = useRef<HTMLDivElement>(null);
  const [signalVisible, setSignalVisible] = useState(false);

  useEffect(() => {
    const el = signalRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSignalVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!signalVisible) return;
    let i = 0;
    const timer = setInterval(() => { i++; setTypedLines(i); if (i >= 7) clearInterval(timer); }, 300);
    return () => clearInterval(timer);
  }, [signalVisible]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Global Animations */}
      <style jsx global>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes glow-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        @keyframes slide-in-right { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes gradient-x { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes count-up { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-glow { animation: glow-pulse 3s ease-in-out infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }
        .glass-card { backdrop-filter: blur(12px); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
        .glass-card:hover { border-color: rgba(212,165,55,0.2); background: rgba(255,255,255,0.05); }
        .gold-glow { box-shadow: 0 0 60px rgba(212,165,55,0.08), 0 0 120px rgba(212,165,55,0.04); }
      `}</style>

      {/* ═══ HERO ═══ */}
      <section className="relative py-28 px-6 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-[#d4a537]/[0.03] blur-[120px] animate-float pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/[0.02] blur-[100px] animate-float pointer-events-none" style={{ animationDelay: "3s" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#d4a537]/10 text-[#d4a537] border border-[#d4a537]/20 mb-6">
              <PulseDot color="bg-[#d4a537]" />
              Telegram Signal Copier
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              Telegram-Signale.<br />
              <span className="bg-gradient-to-r from-[#d4a537] via-[#f0d070] to-[#d4a537] bg-clip-text text-transparent animate-gradient">
                Intelligent verwaltet.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Nicht nur kopieren — intelligent managen. Unsere AI erkennt jedes Signal, platziert Smart Orders und verwaltet jeden Trade aktiv bis zum Schluss.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4 gold-glow">
                Jetzt starten — ab 6 EUR/Monat
              </Link>
              <Link href="/smart-copier" className="gf-btn-outline text-base !px-10 !py-4">
                Smart Copier ansehen
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FLOW: 4 STEPS ═══ */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Von Signal zu Trade in unter 2 Sekunden</h2></Reveal>
          <Reveal delay={100}><p className="text-zinc-500 text-center mb-16 max-w-xl mx-auto">Vollautomatisch. Kein manuelles Eingreifen.</p></Reveal>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/20 to-transparent -translate-y-1/2" />
            <div className="grid md:grid-cols-4 gap-6">
              {FLOW_STEPS.map((s, i) => (
                <Reveal key={s.step} delay={i * 150}>
                  <div className="relative glass-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-[#d4a537]/5 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-[#d4a537]/10 border border-[#d4a537]/20 flex items-center justify-center text-[#d4a537] font-mono font-bold text-sm mb-4">
                        {s.icon}
                      </div>
                      <div className="text-[#d4a537]/50 text-xs font-mono mb-2">STEP {s.step}</div>
                      <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
                    </div>
                    {/* Arrow */}
                    {i < 3 && <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#d4a537]/30 text-lg z-20">&rarr;</div>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SIGNAL EXAMPLE: TYPING ANIMATION ═══ */}
      <section className="py-24 px-6 border-t border-white/[0.04]" ref={signalRef}>
        <div className="max-w-5xl mx-auto">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Signal rein — Profit raus</h2></Reveal>
          <Reveal delay={100}><p className="text-zinc-500 text-center mb-16">Vom Telegram-Text zur vollautomatischen Execution.</p></Reveal>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Telegram Signal with typing effect */}
            <div className="glass-card rounded-2xl p-6 gold-glow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">TG</div>
                <div>
                  <div className="text-xs text-white font-medium">Gold Signals VIP</div>
                  <div className="text-[10px] text-zinc-600">@gold_signals_pro</div>
                </div>
                <PulseDot color="bg-blue-400" />
              </div>
              <div className="bg-black/50 rounded-xl p-5 font-mono text-sm leading-loose border border-white/[0.04]">
                {typedLines >= 1 && <div className="text-green-400 font-bold animate-[slide-in-right_0.3s_ease-out]">BUY XAUUSD</div>}
                {typedLines >= 2 && <div className="text-zinc-400 animate-[slide-in-right_0.3s_ease-out]">Entry: 2341.50 (Market)</div>}
                {typedLines >= 3 && <div className="text-red-400 animate-[slide-in-right_0.3s_ease-out]">SL: 2334.00</div>}
                {typedLines >= 4 && <div className="text-green-400 animate-[slide-in-right_0.3s_ease-out]">TP1: 2348.00</div>}
                {typedLines >= 5 && <div className="text-green-400 animate-[slide-in-right_0.3s_ease-out]">TP2: 2355.00</div>}
                {typedLines >= 6 && <div className="text-green-400 animate-[slide-in-right_0.3s_ease-out]">TP3: 2362.00</div>}
                {typedLines < 7 && <span className="inline-block w-2 h-4 bg-[#d4a537] animate-pulse ml-0.5" />}
              </div>
              {typedLines >= 7 && (
                <div className="mt-4 space-y-1.5 text-xs animate-[slide-in-right_0.4s_ease-out]">
                  <div className="flex justify-between text-zinc-600"><span>Parsing</span><span className="text-green-400 font-mono">142ms</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Confidence</span><span className="text-green-400 font-mono">96%</span></div>
                  <div className="flex justify-between text-zinc-600"><span>Risk Check</span><span className="text-green-400 font-mono">COPY (0.92x)</span></div>
                </div>
              )}
            </div>

            {/* Execution Result */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#d4a537]/20 flex items-center justify-center text-[#d4a537] text-xs font-bold">GF</div>
                <div className="text-xs text-white font-medium">Smart Execution</div>
                {typedLines >= 7 && <PulseDot color="bg-green-400" />}
              </div>
              <div className="space-y-2 font-mono text-xs">
                {typedLines >= 7 && (
                  <>
                    {[
                      { label: "TP1: 0.42L @ 2348", pct: "40%", color: "bg-green-500/10 text-green-400 border-green-500/20" },
                      { label: "TP2: 0.26L @ 2355", pct: "25%", color: "bg-green-500/10 text-green-400 border-green-500/20" },
                      { label: "TP3: 0.21L @ 2362", pct: "20%", color: "bg-green-500/10 text-green-400 border-green-500/20" },
                      { label: "Runner: 0.16L trailing", pct: "15%", color: "bg-[#d4a537]/10 text-[#d4a537] border-[#d4a537]/20" },
                    ].map((o, i) => (
                      <div key={o.label} className={`flex justify-between p-2.5 rounded-lg border ${o.color} animate-[slide-in-right_0.3s_ease-out]`} style={{ animationDelay: `${i * 100}ms` }}>
                        <span>{o.label}</span><span className="font-bold">{o.pct}</span>
                      </div>
                    ))}
                    <div className="pt-3 space-y-1.5">
                      <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 flex justify-between animate-[slide-in-right_0.3s_ease-out]" style={{ animationDelay: "500ms" }}>
                        <span>Nach TP1: Auto-Breakeven</span><span>SL &rarr; 2341.70</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400 flex justify-between animate-[slide-in-right_0.3s_ease-out]" style={{ animationDelay: "600ms" }}>
                        <span>Nach TP2: AI tightened SL</span><span>SL &rarr; 2349.50</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-[#d4a537]/20 bg-[#d4a537]/10 text-[#d4a537] flex justify-between animate-[slide-in-right_0.3s_ease-out]" style={{ animationDelay: "700ms" }}>
                        <span>Runner: Trailing Stop</span><span>15 Pips</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AI TRADE MANAGEMENT TIMELINE ═══ */}
      <section className="py-24 px-6 border-t border-white/[0.04] relative" ref={timelineRef}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#d4a537]/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#d4a537]/10 text-[#d4a537] border border-[#d4a537]/20 mb-4">
                <PulseDot color="bg-[#d4a537]" />
                AI TRADE MANAGEMENT
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Intelligentes Management in Echtzeit</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Andere Copier kopieren und vergessen. Unser System analysiert jeden Trade alle 30 Sekunden und entscheidet autonom.
              </p>
            </div>
          </Reveal>

          {/* Animated Timeline */}
          <div className="relative">
            {/* Animated line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-zinc-800 overflow-hidden">
              <div className="w-full bg-gradient-to-b from-[#d4a537] to-[#d4a537]/0 transition-all duration-1000" style={{ height: `${Math.min((activeTimeline / MANAGEMENT_STEPS.length) * 100, 100)}%` }} />
            </div>

            <div className="space-y-0">
              {MANAGEMENT_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`relative flex items-start gap-4 pl-12 py-3 transition-all duration-500 ${i <= activeTimeline ? "opacity-100" : "opacity-0 translate-x-4"}`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  {/* Dot */}
                  <div className={`absolute left-[12px] top-[18px] w-[15px] h-[15px] rounded-full transition-all duration-300 ${i <= activeTimeline ? `${dotColor(step.status)} shadow-lg` : "bg-zinc-800"}`} />

                  <div className="flex-1 flex items-start gap-4">
                    <div className="text-xs font-mono text-zinc-600 w-16 shrink-0 pt-0.5 tabular-nums">{step.time}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusColor(step.status)}`}>
                          {step.event}
                        </span>
                        {step.profit && (
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {step.profit}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{step.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {activeTimeline >= MANAGEMENT_STEPS.length - 1 && (
            <div className="mt-10 p-6 rounded-2xl border border-[#d4a537]/20 bg-gradient-to-r from-[#d4a537]/5 to-transparent gold-glow animate-[slide-in-right_0.5s_ease-out]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <div className="text-sm text-[#d4a537] font-bold mb-1">Ein Trade. 11 automatische Entscheidungen.</div>
                  <div className="text-xs text-zinc-500">0% Risiko nach Minute 14. Kein manuelles Eingreifen.</div>
                </div>
                <div className="text-3xl font-bold text-emerald-400 font-mono">+€1.485</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ AI DECISIONS ═══ */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Die AI denkt mit — in jeder Situation</h2></Reveal>
          <Reveal delay={100}><p className="text-zinc-500 text-center mb-16 max-w-2xl mx-auto">Alle 30 Sekunden analysiert unser AI Trade Manager jede offene Position mit echten Candle-Daten.</p></Reveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AI_DECISIONS.map((d, i) => (
              <Reveal key={d.scenario} delay={i * 100}>
                <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#d4a537]/10 border border-[#d4a537]/20 flex items-center justify-center text-[#d4a537] font-mono font-bold text-sm group-hover:bg-[#d4a537]/20 transition-colors">
                      {d.icon}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d4a537]/10 text-[#d4a537] border border-[#d4a537]/20">{d.action}</span>
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-2">{d.scenario}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{d.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Technologie unter der Haube</h2></Reveal>
          <Reveal delay={100}><p className="text-zinc-500 text-center mb-16 max-w-xl mx-auto">Gebaut fuer Prop-Firm Challenges.</p></Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] group h-full">
                  <div className="w-12 h-12 rounded-xl bg-[#d4a537]/10 border border-[#d4a537]/20 flex items-center justify-center text-[#d4a537] font-mono font-bold text-sm mb-4 group-hover:bg-[#d4a537]/20 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CHANNEL QUALITY ═══ */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Channel-Qualitaet im Blick</h2></Reveal>
          <Reveal delay={100}><p className="text-zinc-500 text-center mb-16 max-w-xl mx-auto">Jeder verbundene Channel wird kontinuierlich ausgewertet.</p></Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Win Rate", value: "68%", sub: "Letzte 100 Signale" },
              { label: "Confidence", value: "91%", sub: "AI Parsing-Qualitaet" },
              { label: "Signale/Woche", value: "23", sub: "Aktive Frequenz" },
              { label: "Fake Signals", value: "0", sub: "Editierte/Geloeschte" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 100}>
                <div className="glass-card rounded-2xl p-6 text-center group hover:scale-[1.02] transition-all duration-300">
                  <div className="text-3xl font-bold bg-gradient-to-r from-[#d4a537] to-[#f0d070] bg-clip-text text-transparent mb-1">
                    <Counter target={s.value} />
                  </div>
                  <div className="text-xs text-white font-medium mb-1">{s.label}</div>
                  <div className="text-[10px] text-zinc-600">{s.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ACCOUNT SAFETY ═══ */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <Reveal><h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Dein Konto ist sicher</h2></Reveal>
          <Reveal delay={100}><p className="text-zinc-500 text-center mb-16 max-w-xl mx-auto">Mehrere Sicherheitsebenen schuetzen dein Kapital.</p></Reveal>

          {/* Visual DD bar */}
          <Reveal delay={200}>
            <div className="glass-card rounded-2xl p-8 mb-8">
              <div className="text-xs font-mono text-zinc-500 mb-4">DD BUFFER VISUALISIERUNG</div>
              <div className="relative h-10 rounded-full overflow-hidden bg-zinc-900 mb-6">
                <div className="absolute inset-y-0 left-0 w-[5%] bg-red-500/40 border-r border-red-500/60" />
                <div className="absolute inset-y-0 left-[5%] w-[35%] bg-orange-500/20 border-r border-orange-500/40" />
                <div className="absolute inset-y-0 left-[40%] w-[40%] bg-yellow-500/15 border-r border-yellow-500/30" />
                <div className="absolute inset-y-0 left-[80%] w-[20%] bg-green-500/20" />
                {/* Animated marker */}
                <div className="absolute inset-y-1 left-[72%] w-1 rounded-full bg-white animate-pulse" />
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
                <div className="text-red-400 text-center">0-5%<br/><span className="text-zinc-600">KILL SWITCH</span></div>
                <div className="text-orange-400 text-center">5-40%<br/><span className="text-zinc-600">VORSICHT</span></div>
                <div className="text-yellow-400 text-center">40-80%<br/><span className="text-zinc-600">REDUZIERT</span></div>
                <div className="text-green-400 text-center">80%+<br/><span className="text-zinc-600">VOLLE POWER</span></div>
              </div>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { pct: "80%+", label: "Volle Power", desc: "Alle Signale mit normalem Multiplier.", color: "border-green-500/20", dot: "bg-green-400" },
              { pct: "40-80%", label: "Reduziert", desc: "Lots automatisch um 30-50% reduziert.", color: "border-yellow-500/20", dot: "bg-yellow-400" },
              { pct: "5-40%", label: "Vorsichtsmodus", desc: "Minimale Lots, nur High-Confidence.", color: "border-orange-500/20", dot: "bg-orange-400" },
              { pct: "<5%", label: "Emergency Kill", desc: "ALLE Positionen sofort geschlossen. Konto gerettet.", color: "border-red-500/20", dot: "bg-red-400" },
            ].map((level, i) => (
              <Reveal key={level.pct} delay={i * 100}>
                <div className={`glass-card rounded-2xl p-5 border ${level.color} hover:scale-[1.01] transition-all duration-300`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${level.dot}`} />
                    <span className="text-sm font-bold text-white">{level.pct} — {level.label}</span>
                  </div>
                  <p className="text-xs text-zinc-500 pl-4.5">{level.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-6 border-t border-white/[0.04] relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#d4a537]/[0.03] to-transparent pointer-events-none" />
        <Reveal>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bereit?</h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Verbinde deinen ersten Telegram-Channel in unter 5 Minuten. Intelligentes Trade Management inklusive.</p>
            <Link href="/auth/register" className="gf-btn text-base !px-12 !py-4 gold-glow">
              Jetzt starten
            </Link>
            <p className="text-xs text-zinc-600 mt-4">Ab 6 EUR im ersten Monat. Jederzeit kuendbar.</p>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
