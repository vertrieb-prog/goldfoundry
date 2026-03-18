import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FORGE Mentor | Gold Foundry",
  description: "Dein persönlicher KI-Trading-Mentor. Analyse, Coaching und Optimierung für jeden Trade.",
};

const FEATURES = [
  { icon: "📊", title: "Trade-Analyse", desc: "Analysiert 847 Trades in 3 Sekunden. Erkennt Muster, Schwächen und versteckte Edge in deiner Historie.", tag: "ANALYTICS", color: "#3b82f6" },
  { icon: "🛡️", title: "Risiko-Coaching", desc: "Warnt bevor du Fehler machst. Erkennt Overtrading, Revenge-Trading und emotionale Muster in Echtzeit.", tag: "PROTECTION", color: "#27ae60" },
  { icon: "🌍", title: "Markt-Intel", desc: "Regime Detection + Geopolitik Scanner. Weiss ob der Markt trending, ranging oder im Crash-Modus ist.", tag: "INTEL", color: "#a855f7" },
  { icon: "⚙️", title: "Strategie-Optimierung", desc: "MQL4 Code-Analyse + Monte Carlo Simulation. Findet die optimalen Parameter für deinen EA.", tag: "OPTIMIZE", color: "#d4a537" },
];

const CHAT_MESSAGES = [
  { role: "user", text: "> Analyse meinen XAUUSD Trade von heute" },
  { role: "mentor", text: "Entry war optimal (+0.8σ vom VWAP). SL zu eng — empfehle 1.5x ATR statt fixed 70 pips. TP bei 2.358 aligned mit Weekly R1." },
  { role: "mentor", text: "Dein Risk/Reward lag bei 1:1.2. Für dein Profil empfehle ich min. 1:2. Die letzten 12 XAUUSD Trades hatten Ø 1:1.4 — hier liegt Optimierungspotenzial." },
];

const STATS = [
  { value: "300+", label: "Nachrichten / Monat" },
  { value: "<2s", label: "Antwortzeit" },
  { value: "12 Jahre", label: "Trading-Wissen" },
];

export default function ForgeMentorPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-glow gf-glow-gold fixed z-0" style={{ width: 800, height: 800, top: -200, right: -200, opacity: 0.5 }} />
      <div className="gf-glow fixed z-0" style={{ width: 600, height: 600, bottom: -200, left: -100, background: "rgba(168,85,247,0.04)" }} />

      {/* Nav */}
      <nav className="gf-nav">
        <Link href="/" className="flex items-center gap-2 px-3">
          <span className="text-sm font-bold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-[13px]">
          <Link href="/smart-copier" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Smart Copier</Link>
          <Link href="/pricing" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Pricing</Link>
          <Link href="/risk-shield" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Risk Shield</Link>
        </div>
        <Link href="/auth/register" className="text-[13px] px-4 py-1.5 rounded-full bg-gradient-to-r from-[#d4a537] to-[#b8891f] text-[#0b0b0b] font-semibold hover:brightness-110 transition-all">
          Jetzt starten &nbsp;&#9654;
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16">
        <div className="text-center animate-in">
          <span className="gf-badge mb-6 inline-flex">FORGE MENTOR</span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
            <span className="italic text-white/50">Dein persönlicher</span><br />
            <span className="italic font-bold text-white">Quant-Analyst.</span>{" "}
            <span className="italic font-bold gf-gold-text">24/7.</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-[#888]">
            Analysiert jeden Trade. Optimiert deine Strategie. Kennt den Markt. Dein FORGE Mentor der niemals schläft.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">FORGE Mentor testen &nbsp;&rarr;</Link>
            <Link href="/pricing" className="gf-btn-outline text-base !px-10 !py-4">Pricing ansehen</Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16 animate-in">
          <span className="gf-badge mb-6 inline-flex">Capabilities</span>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">Was FORGE Mentor</span>{" "}
            <span className="italic font-bold text-white">kann.</span>
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

      {/* Chat Mockup */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-in">
          <span className="gf-badge mb-6 inline-flex">Live Demo</span>
          <h2 className="font-serif text-3xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">So spricht</span>{" "}
            <span className="italic font-bold text-white">FORGE Mentor.</span>
          </h2>
        </div>
        <div className="relative animate-in delay-1">
          <div className="absolute -inset-8 bg-gradient-to-br from-[#a855f7]/8 via-transparent to-[#d4a537]/5 rounded-3xl blur-2xl" />
          <div className="gf-terminal relative">
            <div className="gf-terminal-bar">
              <div className="gf-terminal-dot bg-[#ff5f57]" /><div className="gf-terminal-dot bg-[#febc2e]" /><div className="gf-terminal-dot bg-[#28c840]" />
              <span className="ml-3 text-[10px] tracking-[2px] text-[#555] uppercase font-mono">FORGE Mentor v3.0</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-glow" />
                <span className="text-[10px] text-[#a855f7] font-mono">AKTIV</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {CHAT_MESSAGES.map((m, i) => (
                <div key={i} className={`rounded-lg p-3 text-[13px] font-mono ${m.role === "user" ? "bg-white/[0.03] text-[#888]" : "bg-[#d4a537]/5 border border-[#d4a537]/10 text-[#ccc]"}`}>
                  {m.role === "mentor" && <div className="text-[10px] tracking-[2px] text-[#d4a537] uppercase mb-2 font-medium">FORGE Mentor</div>}
                  {m.text}
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-[#555] font-mono text-sm">&gt;</span>
                <span className="text-[#555] font-mono text-sm animate-pulse">Stelle deine Frage...</span>
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

      {/* Use Cases */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-28">
        <div className="text-center mb-16 animate-in">
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">Frag alles.</span>{" "}
            <span className="italic font-bold text-white">Bekomme Antworten.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 animate-in delay-1">
          {[
            { q: "Warum verliere ich immer montags?", a: "Dein Win-Rate am Montag: 34%. Grund: Illiquide Opens + zu enge SLs. Empfehlung: Erste 2h nicht traden." },
            { q: "Optimiere meinen XAUUSD EA", a: "Dein SL/TP Ratio ist suboptimal. Monte Carlo zeigt: 1.8x ATR SL + 2.4x ATR TP erhöhen den Profit Factor um 31%." },
            { q: "Wie ist das aktuelle Marktregime?", a: "XAUUSD: Bullish Trend (ADX 42). Risk-On Umfeld. US500 korreliert negativ. Empfehle Long-Bias mit reduziertem Size." },
          ].map((item, i) => (
            <div key={i} className="gf-panel p-6">
              <div className="text-sm text-[#888] mb-3 font-mono">&gt; {item.q}</div>
              <div className="text-sm text-[#ccc] leading-relaxed bg-[#d4a537]/5 border border-[#d4a537]/10 rounded-lg p-3">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="gf-panel p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#a855f7]/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/30 to-transparent" />
          <div className="relative">
            <div className="text-[10px] tracking-[4px] uppercase text-[#d4a537] mb-6 font-medium">KI-gestuetzt</div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold italic text-white mb-4">FORGE Mentor testen.</h2>
            <p className="text-base text-[#666] mb-10 max-w-lg mx-auto">Registriere dich und stelle deine erste Frage. Kostenlos im Analyzer-Plan (5 Nachrichten/Tag).</p>
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">FORGE Mentor testen &nbsp;&rarr;</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t px-6 py-12" style={{ borderColor: "var(--gf-border)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="text-lg font-bold gf-gold-text mb-2">GOLD FOUNDRY</div>
            <p className="text-xs text-[#555]">Das All-in-One Trading Terminal.</p>
          </div>
          <div className="flex gap-12 text-sm text-[#555]">
            <div className="flex flex-col gap-2">
              <Link href="/pricing" className="hover:text-[#d4a537] transition-colors">Pricing</Link>
              <Link href="/leaderboard" className="hover:text-[#d4a537] transition-colors">Leaderboard</Link>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/impressum" className="hover:text-[#d4a537] transition-colors">Impressum</Link>
              <Link href="/datenschutz" className="hover:text-[#d4a537] transition-colors">Datenschutz</Link>
              <Link href="/agb" className="hover:text-[#d4a537] transition-colors">AGB</Link>
              <Link href="/risk-disclaimer" className="hover:text-[#d4a537] transition-colors">Risikohinweis</Link>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 text-xs" style={{ borderTop: "1px solid var(--gf-border)", color: "#555" }}>
          <p className="mb-4">Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals führen. Vergangene Ergebnisse sind keine Garantie für zukünftige Performance.</p>
          <p className="text-center">&copy; 2026 Gold Foundry. Trading birgt Risiken.</p>
        </div>
      </footer>
    </div>
  );
}
