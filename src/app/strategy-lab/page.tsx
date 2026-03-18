import Link from "next/link";
import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Strategy Lab | Gold Foundry",
  description: "Strategien entwickeln, testen und optimieren. KI-gestützte Analyse für bessere Trading-Ergebnisse.",
};

const FEATURES = [
  { icon: "📤", title: "MQL4/MQL5 Upload", desc: "Lade deinen EA hoch und erhalte in 30 Sekunden eine vollständige KI-Analyse. Code-Qualitaet, Risiko-Score, Optimierungspotenzial.", tag: "UPLOAD", color: "#3b82f6" },
  { icon: "🎲", title: "Monte Carlo Backtest", desc: "10.000 Simulationen mit randomisierten Parametern. Finde heraus ob dein EA robust ist — oder nur curve-fitted.", tag: "SIMULATION", color: "#a855f7" },
  { icon: "📈", title: "Walk-Forward Optimierung", desc: "Automatische Out-of-Sample Tests. Dein EA wird auf ungesehenen Daten validiert — nicht nur auf der Vergangenheit.", tag: "OPTIMIZE", color: "#27ae60" },
  { icon: "🏆", title: "Prop-Firm Challenge Simulation", desc: "Teste deinen EA gegen echte FTMO/MFF Regeln. Drawdown-Limits, Profit-Targets, Zeitlimits — alles simuliert.", tag: "CHALLENGE", color: "#d4a537" },
];

const ANALYSIS_RESULTS = [
  { label: "Code-Qualitaet", score: "8.2", max: "10", color: "#28c840" },
  { label: "Risk Management", score: "7.5", max: "10", color: "#d4a537" },
  { label: "Robustheit", score: "8.8", max: "10", color: "#28c840" },
  { label: "Prop-Firm Kompatibilitaet", score: "9.1", max: "10", color: "#28c840" },
];

const SUGGESTIONS = [
  "SL/TP Ratio von 1:1.2 auf 1:2.0 erhöhen → +23% Profit Factor",
  "Trailing Stop nach 50% TP-Distanz aktivieren → +18% Avg. Win",
  "Freitag 14:00 UTC Close-All hinzufügen → Weekend Gap Schutz",
  "Lot-Berechnung von Fixed auf ATR-basiert umstellen → -31% Drawdown",
];

const STATS = [
  { value: "500+", label: "EAs analysiert" },
  { value: "Ø 23%", label: "Performance-Steigerung" },
  { value: "10.000", label: "Monte Carlo Runs" },
];

export default function StrategyLabPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-glow gf-glow-gold fixed z-0" style={{ width: 800, height: 800, top: -250, right: -200, opacity: 0.4 }} />
      <div className="gf-glow fixed z-0" style={{ width: 600, height: 600, bottom: -200, left: -100, background: "rgba(168,85,247,0.05)" }} />

      {/* Nav */}
      <nav className="gf-nav">
        <Link href="/" className="flex items-center gap-2 px-3">
          <span className="text-sm font-bold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-[13px]">
          <Link href="/smart-copier" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Smart Copier</Link>
          <Link href="/pricing" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Pricing</Link>
          <Link href="/forge-mentor" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">FORGE Mentor</Link>
        </div>
        <Link href="/auth/register" className="text-[13px] px-4 py-1.5 rounded-full bg-gradient-to-r from-[#d4a537] to-[#b8891f] text-[#0b0b0b] font-semibold hover:brightness-110 transition-all">
          Jetzt starten &nbsp;&#9654;
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16">
        <div className="text-center animate-in">
          <span className="gf-badge mb-6 inline-flex">RESEARCH</span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
            <span className="italic text-white/50">Dein EA. Unsere KI.</span><br />
            <span className="italic font-bold text-white">Maximale</span>{" "}
            <span className="italic font-bold gf-gold-text">Performance.</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-[#888]">
            Lade deinen Expert Advisor hoch. Unsere KI analysiert, optimiert und simuliert — in Sekunden statt Wochen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">EA hochladen &nbsp;&rarr;</Link>
            <Link href="/pricing" className="gf-btn-outline text-base !px-10 !py-4">Pricing ansehen</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16 animate-in">
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">Vier Werkzeuge.</span>{" "}
            <span className="italic font-bold text-white">Ein Labor.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <div key={i} className="gf-panel p-8 group relative overflow-hidden animate-in" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}08, transparent 70%)` }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="gf-icon-ring">{f.icon}</div>
                  <span className="text-[9px] tracking-[2px] font-mono font-medium px-2 py-1 rounded-full border" style={{ color: f.color, borderColor: `${f.color}30`, background: `${f.color}08` }}>{f.tag}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:gf-gold-text transition-colors">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#666] group-hover:text-[#888] transition-colors">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Result Mockup */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-in">
          <span className="gf-badge mb-6 inline-flex">Analysis Result</span>
          <h2 className="font-serif text-3xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">So sieht ein</span>{" "}
            <span className="italic font-bold text-white">Ergebnis aus.</span>
          </h2>
        </div>
        <div className="relative animate-in delay-1">
          <div className="absolute -inset-8 bg-gradient-to-br from-[#a855f7]/8 via-transparent to-[#d4a537]/5 rounded-3xl blur-2xl" />
          <div className="gf-terminal relative">
            <div className="gf-terminal-bar">
              <div className="gf-terminal-dot bg-[#ff5f57]" /><div className="gf-terminal-dot bg-[#febc2e]" /><div className="gf-terminal-dot bg-[#28c840]" />
              <span className="ml-3 text-[10px] tracking-[2px] text-[#555] uppercase font-mono">Strategy Lab — Analysis Report</span>
            </div>
            <div className="p-5">
              {/* Overall Score */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/5">
                <div>
                  <div className="text-[10px] tracking-[2px] text-[#555] uppercase mb-1">Overall Score</div>
                  <div className="text-[11px] font-mono text-[#888]">GoldScalper_v3.2.mq4</div>
                </div>
                <div className="text-4xl font-bold gf-gold-text font-mono">8.2<span className="text-lg text-[#555]">/10</span></div>
              </div>
              {/* Score breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {ANALYSIS_RESULTS.map((r, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="text-[9px] tracking-wider uppercase text-[#555] mb-1">{r.label}</div>
                    <div className="text-xl font-bold font-mono" style={{ color: r.color }}>{r.score}<span className="text-sm text-[#555]">/{r.max}</span></div>
                  </div>
                ))}
              </div>
              {/* Optimization Suggestions */}
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                <div className="text-[10px] tracking-[2px] text-[#d4a537] uppercase mb-3 font-medium">Optimierungs-Vorschlaege</div>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] font-mono">
                      <span className="text-[#d4a537] mt-0.5">&#9654;</span>
                      <span className="text-[#888]">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-8 border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 px-6">
          {STATS.map((s, i) => (
            <div key={i} className="text-center animate-in" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div className="text-3xl font-bold gf-gold-text mb-1">{s.value}</div>
              <div className="text-xs tracking-wider uppercase text-[#555]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-28">
        <div className="gf-panel p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#a855f7]/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/30 to-transparent" />
          <div className="relative">
            <div className="text-[10px] tracking-[4px] uppercase text-[#d4a537] mb-6 font-medium">Research Lab</div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold italic text-white mb-4">EA analysieren lassen.</h2>
            <p className="text-base text-[#666] mb-10 max-w-lg mx-auto">Strategy Lab ist im Pro Trader Plan enthalten. Upload, Analyse, Optimierung — alles automatisiert.</p>
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">Jetzt starten &nbsp;&rarr;</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
