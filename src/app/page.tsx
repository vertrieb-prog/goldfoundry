import Link from "next/link";

/* ── Replaced tools ── */
const KILLED = ["MyFXBook", "FX Blue", "MQL5 Signals", "Telegram Copier", "TradingView Alerts", "Manual Journaling"];

/* ── All-in-one modules ── */
const MODULES = [
  { icon: "⚡", title: "Smart Copier", desc: "7-Faktor Risk Engine. Nacht-Boost, News-Pause, DD-Schutz. Kopiert Trades in <50ms.", tag: "CORE", color: "#d4a537" },
  { icon: "🛡️", title: "Manipulation Shield", desc: "Stop Hunts, Flash Crashes, Spread-Anomalien — in Echtzeit erkannt und geblockt.", tag: "PROTECTION", color: "#27ae60" },
  { icon: "🧠", title: "FORGE Mentor", desc: "Persönlicher Quant-Analyst. Analysiert jeden Trade, optimiert deine Strategie autonom.", tag: "SMART ENGINE", color: "#d4a537" },
  { icon: "📊", title: "Market Intel", desc: "Regime-Detection, Geopolitik-Scanner, Economic Calendar. Fließt direkt in den Copier.", tag: "INTEL", color: "#3b82f6" },
  { icon: "🔬", title: "Strategy Lab", desc: "MQL4 Upload → analysiert + optimiert. Monte Carlo Backtest. Walk-Forward.", tag: "RESEARCH", color: "#a855f7" },
  { icon: "💰", title: "Partner Program", desc: "Bis zu 50% Provision auf 3 Ebenen. Passives Einkommen durch dein Netzwerk.", tag: "REVENUE", color: "#d4a537" },
];

/* ── Fake live trades for terminal ── */
const TRADES = [
  { pair: "XAUUSD", type: "BUY", entry: "2,341.50", tp: "2,358.00", sl: "2,334.00", pips: "+165", pnl: "+412,50 \u20ac", status: "RUNNING" },
  { pair: "US500", type: "SELL", entry: "5,892.4", tp: "5,860.0", sl: "5,910.0", pips: "+32.4", pnl: "+162,00 \u20ac", status: "RUNNING" },
  { pair: "XAUUSD", type: "BUY", entry: "2,338.20", tp: "2,352.00", sl: "2,331.00", pips: "+138", pnl: "+345,00 \u20ac", status: "TP HIT" },
];

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>

      {/* ── Background ── */}
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-glow gf-glow-gold fixed z-0" style={{ width: 1000, height: 1000, top: -300, left: -300, opacity: 0.6 }} />
      <div className="gf-glow gf-glow-warm fixed z-0" style={{ width: 800, height: 800, top: 200, right: -400 }} />
      <div className="gf-glow fixed z-0" style={{ width: 600, height: 600, bottom: -200, left: "30%", background: "rgba(212,165,55,0.04)" }} />

      {/* ── Floating Nav ── */}
      <nav className="gf-nav">
        <Link href="/" className="flex items-center gap-2 px-3">
          <span className="text-sm font-bold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-[13px]">
          <Link href="#features" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Features</Link>
          <Link href="#terminal" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Terminal</Link>
          <Link href="/pricing" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Pricing</Link>
        </div>
        <Link href="/auth/register" className="text-[13px] px-4 py-1.5 rounded-full bg-gradient-to-r from-[#d4a537] to-[#b8891f] text-[#0b0b0b] font-semibold hover:brightness-110 transition-all">
          Start Engine &nbsp;&#9654;
        </Link>
      </nav>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── HERO ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Text */}
          <div className="animate-in">
            <span className="gf-badge mb-8 inline-flex">System Operational</span>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
              <span className="italic text-white/50">Vergiss alles</span>
              <br />
              <span className="italic text-white/50">was du kennst.</span>
              <br />
              <span className="italic font-bold text-white">Das ist&nbsp;</span>
              <span className="italic font-bold gf-gold-text">Gold Foundry.</span>
            </h1>
            <p className="text-lg max-w-lg mb-8 leading-relaxed text-[#888]">
              Das All-in-One Trading Terminal. Copier, Risk Engine, Market Intel, Strategy Lab, FORGE Mentor — alles in einem Portal. Prop-Firm optimiert.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/auth/register" className="gf-btn text-base !px-8 !py-4">
                Kostenlos starten
              </Link>
              <Link href="#terminal" className="gf-btn-outline text-base !px-8 !py-4">
                Live Terminal &nbsp;&darr;
              </Link>
            </div>
            {/* Killed tools ticker */}
            <div className="flex items-center gap-3 text-xs text-[#555]">
              <span className="text-[#d4a537] font-medium">ERSETZT:</span>
              <div className="overflow-hidden flex-1 relative h-5">
                <div className="flex gap-6 animate-ticker whitespace-nowrap absolute">
                  {[...KILLED, ...KILLED].map((t, i) => (
                    <span key={i} className="gf-killed">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Terminal Preview */}
          <div className="animate-in delay-2 relative">
            {/* Glow behind terminal */}
            <div className="absolute -inset-8 bg-gradient-to-br from-[#d4a537]/10 via-transparent to-[#d4a537]/5 rounded-3xl blur-2xl" />
            <div className="gf-terminal relative">
              <div className="gf-terminal-bar">
                <div className="gf-terminal-dot bg-[#ff5f57]" />
                <div className="gf-terminal-dot bg-[#febc2e]" />
                <div className="gf-terminal-dot bg-[#28c840]" />
                <span className="ml-3 text-[10px] tracking-[2px] text-[#555] uppercase font-mono">Gold Foundry Terminal v2.1</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#28c840] animate-glow" />
                  <span className="text-[10px] text-[#28c840] font-mono">LIVE</span>
                </div>
              </div>
              {/* Mini equity curve SVG */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-[2px] text-[#555] uppercase">Equity Curve — 30d</span>
                  <span className="text-[13px] font-mono font-bold text-[#28c840]">+4.832,50 \u20ac</span>
                </div>
                <svg viewBox="0 0 400 80" className="w-full h-16">
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4a537" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#d4a537" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,60 L20,55 L40,58 L60,50 L80,45 L100,48 L120,40 L140,35 L160,38 L180,30 L200,28 L220,32 L240,25 L260,20 L280,22 L300,15 L320,18 L340,12 L360,10 L380,8 L400,5 L400,80 L0,80Z" fill="url(#eq)" />
                  <path d="M0,60 L20,55 L40,58 L60,50 L80,45 L100,48 L120,40 L140,35 L160,38 L180,30 L200,28 L220,32 L240,25 L260,20 L280,22 L300,15 L320,18 L340,12 L360,10 L380,8 L400,5" fill="none" stroke="#d4a537" strokeWidth="2" />
                </svg>
              </div>
              {/* Trade rows */}
              <div className="px-4 pb-4 space-y-2">
                <div className="grid grid-cols-6 text-[9px] tracking-wider uppercase text-[#555] pb-1 border-b border-white/5 font-mono">
                  <span>Pair</span><span>Side</span><span>Entry</span><span>Pips</span><span>P&L</span><span>Status</span>
                </div>
                {TRADES.map((t, i) => (
                  <div key={i} className="grid grid-cols-6 text-[12px] font-mono py-1.5 border-b border-white/[0.02] items-center">
                    <span className="text-white font-medium">{t.pair}</span>
                    <span className={t.type === "BUY" ? "text-[#28c840]" : "text-[#ff6b6b]"}>{t.type}</span>
                    <span className="text-[#888]">{t.entry}</span>
                    <span className="text-[#28c840]">{t.pips}</span>
                    <span className="text-[#28c840] font-medium">{t.pnl}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit ${t.status === "RUNNING" ? "bg-[#28c840]/10 text-[#28c840]" : "bg-[#d4a537]/10 text-[#d4a537]"}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
              {/* Risk Engine bar */}
              <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[2px] text-[#555] uppercase">Risk Engine</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7].map(n => (
                      <div key={n} className="w-3 h-3 rounded-sm bg-[#28c840]/20 border border-[#28c840]/30 flex items-center justify-center">
                        <span className="text-[6px] text-[#28c840]">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#28c840]">7/7 ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Marquee ── */}
      <section className="relative z-10 py-8 border-y border-white/[0.04] overflow-hidden">
        <div className="flex animate-ticker gap-16 px-8">
          {[...Array(2)].flatMap((_, j) => [
            { v: "7", l: "Schutz-Faktoren" }, { v: "24/7", l: "Automatische Überwachung" }, { v: "84%", l: "Challenge Pass-Rate" },
            { v: "<50ms", l: "Copy-Latenz" }, { v: "2,400+", l: "Active Accounts" }, { v: "\u20ac12M+", l: "Managed Volume" },
          ].map((s, i) => (
            <div key={`${j}-${i}`} className="flex items-center gap-4 whitespace-nowrap">
              <span className="text-2xl font-bold gf-gold-text">{s.v}</span>
              <span className="text-xs tracking-wider uppercase text-[#555]">{s.l}</span>
            </div>
          )))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── THE ALL-IN-ONE SECTION ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-20 animate-in">
          <span className="gf-badge mb-6 inline-flex">All-In-One Trading OS</span>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl mt-6 leading-[1.05]">
            <span className="italic text-white/40">Sechs Tools.</span>
            <br />
            <span className="italic font-bold text-white">Ein Portal.</span>
          </h2>
          <p className="text-base mt-6 max-w-2xl mx-auto text-[#666]">
            Kein Zusammenkleben von 10 verschiedenen Services mehr. Gold Foundry vereint alles was ein professioneller Trader braucht — in einem System das autonom arbeitet.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m, i) => (
            <div key={i} className="gf-panel p-8 group relative overflow-hidden animate-in" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${m.color}08, transparent 70%)` }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="gf-icon-ring">{m.icon}</div>
                  <span className="text-[9px] tracking-[2px] font-mono font-medium px-2 py-1 rounded-full border" style={{ color: m.color, borderColor: `${m.color}30`, background: `${m.color}08` }}>
                    {m.tag}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:gf-gold-text transition-colors">{m.title}</h3>
                <p className="text-sm leading-relaxed text-[#666] group-hover:text-[#888] transition-colors">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── LIVE TERMINAL SECTION ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section id="terminal" className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Dashboard mockup */}
          <div className="relative animate-in">
            <div className="absolute -inset-12 bg-gradient-to-br from-[#d4a537]/8 via-transparent to-transparent rounded-3xl blur-3xl" />
            <div className="gf-terminal relative">
              <div className="gf-terminal-bar">
                <div className="gf-terminal-dot bg-[#ff5f57]" />
                <div className="gf-terminal-dot bg-[#febc2e]" />
                <div className="gf-terminal-dot bg-[#28c840]" />
                <span className="ml-3 text-[10px] tracking-[2px] text-[#555] uppercase font-mono">FORGE Command Center</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3">
                {/* KPI Cards */}
                {[
                  { label: "Daily P&L", value: "+1.247 \u20ac", color: "#28c840" },
                  { label: "Win Rate", value: "87.3%", color: "#d4a537" },
                  { label: "Drawdown", value: "2.1%", color: "#28c840" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="text-[9px] tracking-wider uppercase text-[#555] mb-1">{kpi.label}</div>
                    <div className="text-lg font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              {/* FORGE Mentor mockup */}
              <div className="px-4 pb-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] tracking-[2px] text-[#d4a537] uppercase font-mono">FORGE Mentor</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#28c840] animate-glow" />
                  </div>
                  <div className="space-y-2 text-[12px] font-mono">
                    <div className="bg-white/[0.03] rounded-lg p-2 text-[#888]">
                      &gt; Analyse meinen XAUUSD Trade von heute
                    </div>
                    <div className="bg-[#d4a537]/5 border border-[#d4a537]/10 rounded-lg p-2 text-[#ccc]">
                      Entry war optimal (+0.8σ vom VWAP). SL zu eng — empfehle 1.5x ATR statt fixed 70 pips. TP bei 2.358 aligned mit Weekly R1.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text */}
          <div className="animate-in delay-2">
            <span className="gf-badge mb-6 inline-flex">Command Center</span>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] mb-6">
              <span className="italic text-white/50">Dein komplettes</span>
              <br />
              <span className="italic font-bold text-white">Trading-Cockpit.</span>
            </h2>
            <div className="space-y-6">
              {[
                { title: "Real-time Dashboard", desc: "Equity, P&L, Drawdown, Win Rate — alles live. Keine Verzögerung." },
                { title: "FORGE Mentor Chat", desc: "Frag alles über deine Trades. Bekomme sofortige Analyse und Optimierung." },
                { title: "7-Faktor Risk Engine", desc: "DD-Schutz, News-Pause, Nacht-Modus, Spread-Filter, Korrelation, Exposure, Volatilität." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#d4a537]/10 border border-[#d4a537]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#d4a537]" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-[#666] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── COMPARISON: BEFORE / AFTER ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-28">
        <div className="text-center mb-16 animate-in">
          <span className="gf-badge mb-6 inline-flex">Before vs. After</span>
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.05]">
            <span className="italic text-white/40">Vorher: 8 Tools.</span>
            <br />
            <span className="italic font-bold text-white">Jetzt: Gold Foundry.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 animate-in delay-1">
          {/* Before */}
          <div className="gf-panel p-8 relative overflow-hidden border-[#c0392b]/10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c0392b]/30 to-transparent" />
            <div className="text-[10px] tracking-[3px] uppercase text-[#c0392b] mb-6 font-medium">Vorher</div>
            <div className="space-y-3">
              {[
                "MyFXBook für Tracking",
                "FX Blue für Analyse",
                "Telegram für Copier-Signale",
                "TradingView für Alerts",
                "Excel für Journal",
                "Discord für Community",
                "MQL5 für Signale",
                "Eigene Scripts für Risk Management",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-[#c0392b]">✕</span>
                  <span className="text-[#555] line-through">{item}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-white/5 flex justify-between text-sm">
                <span className="text-[#666]">Monatliche Kosten</span>
                <span className="text-[#c0392b] font-mono font-bold">~180+ \u20ac/Mo</span>
              </div>
            </div>
          </div>
          {/* After */}
          <div className="gf-panel p-8 relative overflow-hidden border-[#d4a537]/10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/40 to-transparent" />
            <div className="text-[10px] tracking-[3px] uppercase text-[#d4a537] mb-6 font-medium">Gold Foundry</div>
            <div className="space-y-3">
              {[
                "Smart Copier + 7-Faktor Risk Engine",
                "FORGE Mentor + Analyse",
                "Manipulation Shield (Echtzeit)",
                "Market Intel + Regime Detection",
                "Strategy Lab + Monte Carlo",
                "Built-in Community + Chat",
                "Live Leaderboard + Stats",
                "Partner Program (bis zu 50% auf 3 Ebenen)",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-[#d4a537]">✦</span>
                  <span className="text-[#ccc]">{item}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-white/5 flex justify-between text-sm">
                <span className="text-[#666]">Alles inklusive</span>
                <span className="gf-gold-text font-mono font-bold">ab 9 \u20ac/Mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── VISION QUOTE ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-28">
        <div className="animate-in">
          <span className="gf-badge mb-8 inline-flex">The Future of Trading</span>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-[1.1]">
            <span className="italic text-white/40">Wir haben nicht noch ein Tool gebaut</span>
            {" — "}
            <span className="italic text-white/25">wir haben jedes andere überflüssig gemacht.</span>
            {" "}
            <span className="italic font-bold text-white">Ein System. Null Kompromisse.</span>
          </h2>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── FINAL CTA ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-28">
        <div className="gf-panel p-12 md:p-16 text-center relative overflow-hidden">
          {/* Background glow inside card */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#d4a537]/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/30 to-transparent" />
          <div className="relative">
            <div className="text-[10px] tracking-[4px] uppercase text-[#d4a537] mb-6 font-medium">Ready to trade?</div>
            <h2 className="font-serif text-4xl md:text-6xl font-bold italic text-white mb-4">
              Starte jetzt.
            </h2>
            <p className="text-base text-[#666] mb-10 max-w-lg mx-auto">
              Kostenloser Account. Keine Kreditkarte. Sofortiger Zugang zum kompletten Trading-Ökosystem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">
                Kostenlos starten &nbsp;&rarr;
              </Link>
              <Link href="/pricing" className="gf-btn-outline text-base !px-10 !py-4">
                Pricing ansehen
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
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
          <p className="mb-4">Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals fuehren. Vergangene Ergebnisse sind keine Garantie fuer zukuenftige Performance.</p>
          <p className="text-center">&copy; 2025 Gold Foundry. Trading birgt Risiken.</p>
        </div>
      </footer>
    </div>
  );
}
