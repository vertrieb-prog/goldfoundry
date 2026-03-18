import Link from "next/link";
import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Gold Foundry — THE Trading Portal",
  description: "Forex, Crypto, Indices & Commodities. Smart Copier, FORGE Mentor, Risk Shield. Alles in einer Plattform.",
};

/* ── Module Data ── */
const MODULES = [
  { icon: "⚡", title: "Smart Copier", desc: "7-Faktor Risk Engine. Nacht-Boost, News-Pause, DD-Schutz. Kopiert Trades in <50ms.", tag: "CORE", href: "/smart-copier" },
  { icon: "🛡️", title: "Risk Shield", desc: "Stop Hunts, Flash Crashes, Spread-Anomalien — in Echtzeit erkannt und geblockt.", tag: "SCHUTZ", href: "/risk-shield" },
  { icon: "🧠", title: "FORGE Mentor", desc: "Persönlicher Quant-Analyst. Analysiert jeden Trade, optimiert deine Strategie autonom.", tag: "KI", href: "/forge-mentor" },
  { icon: "📊", title: "Market Intel", desc: "Regime-Detection, Geopolitik-Scanner, Economic Calendar. Fließt direkt in den Copier.", tag: "INTEL", href: "/auth/register" },
  { icon: "🔬", title: "Strategy Lab", desc: "MQL4 Upload → analysiert + optimiert. Monte Carlo Backtest. Walk-Forward.", tag: "RESEARCH", href: "/strategy-lab" },
  { icon: "💰", title: "Partner Program", desc: "Bis zu 50% Provision auf 3 Ebenen. Passives Einkommen durch dein Netzwerk.", tag: "REVENUE", href: "/partner" },
];

/* ── Pain Points ── */
const PAIN_POINTS = [
  { icon: "🔧", title: "Tool-Chaos", desc: "MyFXBook, FX Blue, Telegram, TradingView — du jonglierst 8+ Tools die nicht miteinander reden." },
  { icon: "🎯", title: "Kein Überblick", desc: "Deine Daten sind verstreut. P&L hier, Drawdown dort. Keine zentrale Wahrheit." },
  { icon: "⏱️", title: "Zeitverschwendung", desc: "Stunden mit manuellen Setups, Copy-Paste und Journal-Einträgen statt echtem Trading." },
  { icon: "🛑", title: "Kein Schutz", desc: "Stop Hunts, Spread-Spikes, Flash Crashes — dein Broker spielt gegen dich und du merkst es nicht." },
  { icon: "📉", title: "Challenge-Fails", desc: "Du verlierst Prop-Firm Challenges wegen fehlender Risk-Controls und emotionaler Trades." },
  { icon: "🤷", title: "Keine Strategie", desc: "Du tradest auf Gefühl. Keine Backtests, keine Daten, keine systematische Optimierung." },
];

/* ── Stats ── */
const STATS = [
  { value: "7", label: "Schutz-Faktoren" },
  { value: "24/7", label: "Automatisierung" },
  { value: "84%", label: "Challenge Pass-Rate" },
  { value: "<50ms", label: "Copy-Latenz" },
  { value: "2.400+", label: "Active Accounts" },
  { value: "€12M+", label: "Managed Volume" },
];

/* ── Target Groups ── */
const TARGETS = [
  { icon: "🏆", title: "Prop-Firm Trader", desc: "Bestehe Challenges mit automatischem Risk Management und DD-Schutz.", meta: "FTMO, MFF, TFT" },
  { icon: "📡", title: "Signal Provider", desc: "Monetarisiere deine Trades. Follower-Management, Profit-Share, Landing Page.", meta: "60/40 SPLIT" },
  { icon: "🔄", title: "Copy Trader", desc: "Folge den besten Tradern — mit intelligentem Risk-Management dazwischen.", meta: "SET & FORGET" },
  { icon: "📈", title: "Scalper & Daytrader", desc: "Schnelle Ausführung, Spread-Filter, Session-Controls. Perfekt für aktive Trader.", meta: "LOW LATENCY" },
  { icon: "🌍", title: "Portfolio-Manager", desc: "Multi-Account, Multi-Broker, Multi-Asset. Ein Dashboard für alles.", meta: "MULTI-ASSET" },
  { icon: "💼", title: "Trading-Einsteiger", desc: "Lerne mit dem FORGE Mentor. Kopiere Profis. Verstehe jeden Trade.", meta: "GUIDED" },
];

/* ── Fake live trades ── */
const TRADES = [
  { pair: "XAUUSD", type: "BUY", entry: "2,341.50", pips: "+165", pnl: "+412,50 €", status: "RUNNING" },
  { pair: "US500", type: "SELL", entry: "5,892.4", pips: "+32.4", pnl: "+162,00 €", status: "RUNNING" },
  { pair: "XAUUSD", type: "BUY", entry: "2,338.20", pips: "+138", pnl: "+345,00 €", status: "TP HIT" },
];

/* ── FAQ ── */
const FAQ = [
  { q: "Brauche ich Trading-Erfahrung?", a: "Nein. Gold Foundry ist für Einsteiger und Profis. Der FORGE Mentor erklärt dir alles, der Smart Copier handelt automatisch." },
  { q: "Welche Broker werden unterstützt?", a: "Alle MetaTrader 4/5 Broker. Plus Binance, Bybit, Bitget, OKX für Crypto. Über 500+ Broker kompatibel." },
  { q: "Wie funktioniert der Smart Copier?", a: "Du wählst einen Signal-Provider, der Copier kopiert dessen Trades in <50ms auf dein Konto — mit 7-Faktor Risk Engine dazwischen." },
  { q: "Kann ich jederzeit kündigen?", a: "Ja, monatliche Abrechnung. Kein Vertrag, keine Mindestlaufzeit. Kündigung mit einem Klick." },
  { q: "Ist mein Geld sicher?", a: "Wir haben keinen Zugriff auf dein Kapital. Gold Foundry verbindet sich read-only oder mit limitierten Trade-Rechten über MetaAPI." },
  { q: "Was kostet Gold Foundry?", a: "Ab €9/Monat für den Analyzer. Der volle Copier ab €29/Monat. Zahlung auch per Crypto möglich." },
];

/* ── Inline CTA component ── */
function SectionCTA({ text, secondary }: { text?: string; secondary?: boolean }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${secondary ? "" : "justify-center"} mt-12`}>
      <Link href="/auth/register" className="gf-btn gf-btn-shimmer">
        {text || "Jetzt kostenlos starten →"}
      </Link>
      <Link href="/pricing" className="gf-btn-outline">
        Alle Pläne ansehen
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>

      {/* ── Background Effects ── */}
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 800, height: 800, top: -200, left: -200 }} />
      <div className="gf-orb gf-orb-warm fixed z-0" style={{ width: 600, height: 600, top: 400, right: -200 }} />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 500, height: 500, bottom: -100, left: "40%" }} />

      {/* ══════════════════════════════════════════
          NAVIGATION
         ══════════════════════════════════════════ */}
      <nav className="gf-nav">
        <Link href="/" className="flex items-center gap-2 px-3">
          <span className="text-sm font-bold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-[13px]">
          <Link href="#problem" className="px-3 py-1.5 rounded-full text-zinc-400 hover:text-white transition-colors">Problem</Link>
          <Link href="#features" className="px-3 py-1.5 rounded-full text-zinc-400 hover:text-white transition-colors">Features</Link>
          <Link href="#terminal" className="px-3 py-1.5 rounded-full text-zinc-400 hover:text-white transition-colors">Terminal</Link>
          <Link href="/pricing" className="px-3 py-1.5 rounded-full text-zinc-400 hover:text-white transition-colors">Pricing</Link>
        </div>
        <Link href="/auth/register" className="gf-btn gf-btn-sm !rounded-full">
          Jetzt starten →
        </Link>
      </nav>

      {/* ══════════════════════════════════════════
          HERO
         ══════════════════════════════════════════ */}
      <section className="gf-section pt-32 md:pt-40 pb-16 text-center">
        <div className="animate-in max-w-4xl mx-auto">
          <span className="gf-badge mb-8 inline-flex">System Operational</span>

          <h1 className="gf-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            Das mächtigste
            <br />
            <span className="gf-gold-text">Trading-System</span>
            <br />
            der Welt beherrschen.
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-zinc-400 leading-relaxed">
            Copier, Risk Engine, Market Intel, Strategy Lab, FORGE Mentor — alles in einem Portal.
            Prop-Firm optimiert. Vollautomatisch.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/auth/register" className="gf-btn gf-btn-shimmer gf-btn-breathe text-base !px-10 !py-4">
              Jetzt starten — ab €9/Mo
            </Link>
            <Link href="/pricing" className="gf-btn-outline text-base !px-10 !py-4">
              Pricing ansehen
            </Link>
          </div>

          {/* Urgency */}
          <p className="text-xs text-zinc-500 mb-8 font-mono">
            Keine Kreditkarte nötig · In 2 Minuten startklar · Jederzeit kündbar
          </p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-zinc-800 bg-zinc-700" />
                ))}
              </div>
              <span>2.400+ Trader aktiv</span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★★★★★</span>
              <span>4.9 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS MARQUEE
         ══════════════════════════════════════════ */}
      <section className="relative z-10 py-8 border-y border-white/[0.04] overflow-hidden gf-mask-sides">
        <div className="flex animate-ticker gap-16 px-8">
          {[...Array(2)].flatMap((_, j) =>
            STATS.map((s, i) => (
              <div key={`${j}-${i}`} className="flex items-center gap-4 whitespace-nowrap">
                <span className="text-2xl font-extrabold gf-gold-text font-mono">{s.value}</span>
                <span className="text-xs tracking-widest uppercase text-zinc-500">{s.label}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PAIN POINTS — "Das Problem"
         ══════════════════════════════════════════ */}
      <section id="problem" className="gf-section">
        <div className="text-center mb-16 animate-in">
          <span className="gf-eyebrow mb-4 block">Das Problem</span>
          <h2 className="gf-heading text-3xl md:text-5xl lg:text-6xl mb-6">
            Du verlierst nicht wegen
            <br />
            <span className="text-zinc-500">deiner Strategie.</span>
          </h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto text-zinc-500">
            Sondern weil dein Setup aus 8 verschiedenen Tools besteht, die nicht miteinander reden. Das endet hier.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PAIN_POINTS.map((p, i) => (
            <div key={i} className="gf-panel p-6 animate-in" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
              <div className="text-2xl mb-4">{p.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA after pain points */}
        <div className="text-center animate-in">
          <SectionCTA text="Schluss damit — Jetzt wechseln →" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LIGHT SECTION — "Die Wahrheit"
         ══════════════════════════════════════════ */}
      <section className="gf-light-section py-24 md:py-32">
        <div className="max-w-[680px] mx-auto px-6 text-center animate-in">
          <span className="gf-eyebrow mb-6 block" style={{ color: "#b8a830" }}>Die Wahrheit</span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-zinc-900 mb-6">
            Das Problem liegt nicht bei dir.
          </h2>
          <p className="text-lg text-zinc-600 leading-relaxed mb-8">
            Du hast die Skills. Du hast die Disziplin. Was dir fehlt ist ein System, das alle Puzzleteile zusammenfügt —
            automatisch, intelligent und in Echtzeit. <strong className="text-zinc-900">Das ist Gold Foundry.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-zinc-800 transition-colors font-mono">
              Jetzt System starten →
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-zinc-600 font-semibold text-sm rounded-xl border border-zinc-300 hover:border-zinc-400 transition-colors">
              Pläne vergleichen
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES — "Sechs Tools. Ein Portal."
         ══════════════════════════════════════════ */}
      <section id="features" className="gf-section">
        <div className="text-center mb-16 animate-in">
          <span className="gf-eyebrow mb-4 block">All-In-One Trading OS</span>
          <h2 className="gf-heading text-3xl md:text-5xl lg:text-6xl mb-6">
            Sechs Tools.
            <br />
            <span className="gf-gold-text">Ein Portal.</span>
          </h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto text-zinc-500">
            Kein Zusammenkleben von 10 verschiedenen Services. Gold Foundry vereint alles —
            in einem System das autonom arbeitet.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((m, i) => (
            <Link key={i} href={m.href} className="gf-panel p-8 group animate-in block" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <div className="gf-icon-ring">{m.icon}</div>
                <span className="text-[10px] tracking-widest font-mono font-semibold px-3 py-1 rounded-full border border-[rgba(250,239,112,0.15)] text-[var(--gf-gold)] bg-[rgba(250,239,112,0.04)]">
                  {m.tag}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[var(--gf-gold)] transition-colors">{m.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-400 transition-colors">{m.desc}</p>
              <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-[var(--gf-gold)] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                Mehr erfahren →
              </span>
            </Link>
          ))}
        </div>

        {/* CTA after features */}
        <div className="text-center animate-in">
          <SectionCTA text="Alle Features nutzen — ab €9/Mo →" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LIVE TERMINAL
         ══════════════════════════════════════════ */}
      <section id="terminal" className="gf-section">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Terminal */}
          <div className="animate-in relative">
            <div className="absolute -inset-12 bg-gradient-to-br from-[rgba(250,239,112,0.06)] via-transparent to-transparent rounded-3xl blur-3xl" />
            <div className="gf-terminal relative">
              <div className="gf-terminal-bar">
                <div className="gf-terminal-dot bg-[#ff5f57]" />
                <div className="gf-terminal-dot bg-[#febc2e]" />
                <div className="gf-terminal-dot bg-[#28c840]" />
                <span className="ml-3 text-[10px] tracking-[2px] text-zinc-500 uppercase font-mono">Gold Foundry Terminal v3</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-glow" />
                  <span className="text-[10px] text-emerald-500 font-mono">LIVE</span>
                </div>
              </div>
              {/* Equity curve */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-[2px] text-zinc-500 uppercase font-mono">Equity Curve — 30d</span>
                  <span className="text-[13px] font-mono font-bold text-emerald-500">+4.832,50 €</span>
                </div>
                <svg viewBox="0 0 400 80" className="w-full h-16">
                  <defs>
                    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FAEF70" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#FAEF70" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,60 L20,55 L40,58 L60,50 L80,45 L100,48 L120,40 L140,35 L160,38 L180,30 L200,28 L220,32 L240,25 L260,20 L280,22 L300,15 L320,18 L340,12 L360,10 L380,8 L400,5 L400,80 L0,80Z" fill="url(#eq)" />
                  <path d="M0,60 L20,55 L40,58 L60,50 L80,45 L100,48 L120,40 L140,35 L160,38 L180,30 L200,28 L220,32 L240,25 L260,20 L280,22 L300,15 L320,18 L340,12 L360,10 L380,8 L400,5" fill="none" stroke="#FAEF70" strokeWidth="2" />
                </svg>
              </div>
              {/* Trades */}
              <div className="px-4 pb-4 space-y-2">
                <div className="grid grid-cols-5 text-[9px] tracking-wider uppercase text-zinc-500 pb-1 border-b border-white/5 font-mono">
                  <span>Pair</span><span>Side</span><span>Entry</span><span>P&L</span><span>Status</span>
                </div>
                {TRADES.map((t, i) => (
                  <div key={i} className="grid grid-cols-5 text-[12px] font-mono py-1.5 border-b border-white/[0.02] items-center">
                    <span className="text-white font-medium">{t.pair}</span>
                    <span className={t.type === "BUY" ? "text-emerald-500" : "text-red-400"}>{t.type}</span>
                    <span className="text-zinc-500">{t.entry}</span>
                    <span className="text-emerald-500 font-medium">{t.pnl}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit ${t.status === "RUNNING" ? "bg-emerald-500/10 text-emerald-500" : "bg-[var(--gf-gold-muted)] text-[var(--gf-gold)]"}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
              {/* Risk Engine */}
              <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[2px] text-zinc-500 uppercase font-mono">Risk Engine</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7].map(n => (
                      <div key={n} className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <span className="text-[6px] text-emerald-500">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-500">7/7 ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Right: Text + CTA */}
          <div className="animate-in delay-2">
            <span className="gf-eyebrow mb-4 block">Command Center</span>
            <h2 className="gf-heading text-3xl md:text-5xl mb-6">
              Dein komplettes
              <br />
              <span className="gf-gold-text">Trading-Cockpit.</span>
            </h2>
            <div className="space-y-6 mb-8">
              {[
                { title: "Real-time Dashboard", desc: "Equity, P&L, Drawdown, Win Rate — alles live. Keine Verzögerung." },
                { title: "FORGE Mentor Chat", desc: "Frag alles über deine Trades. Bekomme sofortige Analyse und Optimierung." },
                { title: "7-Faktor Risk Engine", desc: "DD-Schutz, News-Pause, Nacht-Modus, Spread-Filter, Korrelation, Exposure, Volatilität." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[var(--gf-gold-muted)] border border-[rgba(250,239,112,0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--gf-gold)]" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* CTA in terminal section */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/register" className="gf-btn">
                Terminal freischalten →
              </Link>
              <Link href="/leaderboard" className="gf-btn-outline">
                Live Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TARGET GROUPS
         ══════════════════════════════════════════ */}
      <section className="gf-section">
        <div className="text-center mb-16 animate-in">
          <span className="gf-eyebrow mb-4 block">Für wen ist Gold Foundry?</span>
          <h2 className="gf-heading text-3xl md:text-5xl lg:text-6xl mb-6">
            Egal ob Anfänger
            <br />
            <span className="gf-gold-text">oder Profi.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TARGETS.map((t, i) => (
            <Link key={i} href="/auth/register" className="gf-panel p-6 group block animate-in" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="gf-icon-ring">{t.icon}</div>
                <span className="text-[9px] tracking-widest font-mono text-zinc-500 px-2 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  {t.meta}
                </span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-[var(--gf-gold)] transition-colors">{t.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{t.desc}</p>
              <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-[var(--gf-gold)] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                Jetzt starten →
              </span>
            </Link>
          ))}
        </div>

        {/* CTA after target groups */}
        <div className="text-center animate-in">
          <SectionCTA text="Passt zu dir? Jetzt starten →" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COMPARISON: BEFORE / AFTER
         ══════════════════════════════════════════ */}
      <section className="gf-section max-w-5xl">
        <div className="text-center mb-16 animate-in">
          <span className="gf-eyebrow mb-4 block">Vorher vs. Nachher</span>
          <h2 className="gf-heading text-3xl md:text-5xl lg:text-6xl mb-6">
            8 Tools raus.
            <br />
            <span className="gf-gold-text">Ein System rein.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 animate-in">
          {/* Before */}
          <div className="gf-panel p-8 border-red-500/10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
            <div className="text-[10px] tracking-[3px] uppercase text-red-400 mb-6 font-mono font-semibold">Vorher</div>
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
                  <span className="text-red-400 text-xs">✕</span>
                  <span className="text-zinc-600 line-through">{item}</span>
                </div>
              ))}
              <div className="pt-3 mt-2 border-t border-white/5 flex justify-between text-sm">
                <span className="text-zinc-500">Monatliche Kosten</span>
                <span className="text-red-400 font-mono font-bold">~180+ €/Mo</span>
              </div>
            </div>
          </div>
          {/* After */}
          <div className="gf-panel p-8 border-[var(--gf-gold)]/10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(250,239,112,0.4)] to-transparent" />
            <div className="text-[10px] tracking-[3px] uppercase text-[var(--gf-gold)] mb-6 font-mono font-semibold">Gold Foundry</div>
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
                  <span className="text-[var(--gf-gold)]">✦</span>
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}
              <div className="pt-3 mt-2 border-t border-white/5 flex justify-between text-sm">
                <span className="text-zinc-500">Alles inklusive</span>
                <span className="gf-gold-text font-mono font-bold">ab 9 €/Mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA after comparison */}
        <div className="text-center animate-in">
          <SectionCTA text="Spar dir 170€/Mo — Jetzt wechseln →" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          VISION QUOTE + CTA
         ══════════════════════════════════════════ */}
      <section className="gf-section max-w-5xl">
        <div className="animate-in text-center">
          <span className="gf-eyebrow mb-8 block">The Future of Trading</span>
          <h2 className="gf-heading text-3xl md:text-5xl lg:text-6xl leading-[1.15] mb-10">
            <span className="text-zinc-500">Wir haben nicht noch ein Tool gebaut</span>
            {" — "}
            <span className="text-zinc-600">wir haben jedes andere überflüssig gemacht.</span>
            {" "}
            <span className="gf-gold-text">Ein System. Null Kompromisse.</span>
          </h2>
          <Link href="/auth/register" className="gf-btn gf-btn-shimmer gf-btn-breathe text-base !px-10 !py-4">
            Jetzt loslegen →
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
         ══════════════════════════════════════════ */}
      <section id="faq" className="gf-section max-w-3xl">
        <div className="text-center mb-16 animate-in">
          <span className="gf-eyebrow mb-4 block">FAQ</span>
          <h2 className="gf-heading text-3xl md:text-5xl mb-6">
            Häufige Fragen.
          </h2>
        </div>

        <div className="space-y-3 animate-in">
          {FAQ.map((f, i) => (
            <details key={i} className="gf-panel group">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <span className="text-white font-semibold pr-4">{f.q}</span>
                <span className="text-zinc-500 text-xl flex-shrink-0 group-open:rotate-45 transition-transform duration-200">+</span>
              </summary>
              <div className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed -mt-2">
                {f.a}
              </div>
            </details>
          ))}
        </div>

        {/* CTA after FAQ */}
        <div className="text-center mt-12 animate-in">
          <p className="text-zinc-500 text-sm mb-4">Noch Fragen? Der FORGE Mentor hilft dir direkt im Dashboard.</p>
          <SectionCTA text="Jetzt Account erstellen →" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA — Maximum urgency
         ══════════════════════════════════════════ */}
      <section className="gf-section max-w-4xl">
        <div className="gf-panel p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(250,239,112,0.04)] via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(250,239,112,0.3)] to-transparent" />
          <div className="relative">
            <span className="gf-eyebrow mb-6 block">Ready to trade?</span>
            <h2 className="gf-heading text-4xl md:text-6xl mb-4">
              Starte jetzt.
            </h2>
            <p className="text-base text-zinc-500 mb-4 max-w-lg mx-auto">
              Account erstellen. Keine Kreditkarte. Sofortiger Zugang zum kompletten Trading-Ökosystem.
            </p>
            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 mb-8 font-mono">
              <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Keine Kreditkarte</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Jederzeit kündbar</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> 500+ Broker</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> In 2 Min. startklar</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="gf-btn gf-btn-shimmer gf-btn-breathe text-base !px-10 !py-4">
                Jetzt starten — ab €9/Mo →
              </Link>
              <Link href="/pricing" className="gf-btn-outline text-base !px-10 !py-4">
                Alle Pläne ansehen
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
