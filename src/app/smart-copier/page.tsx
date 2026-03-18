import Link from "next/link";

const FACTORS = [
  { num: "01", code: "TIME", title: "Nacht-Boost", desc: "Hoehere Lots in ruhiger Asian Session. Weniger Slippage, bessere Fills, mehr Profit pro Trade.", color: "#d4a537" },
  { num: "02", code: "NEWS", title: "Auto-Pause", desc: "Automatische Pause 15 Minuten vor High-Impact Events. Kein NFP-Blowup mehr.", color: "#3b82f6" },
  { num: "03", code: "DD", title: "Drawdown Buffer", desc: "Lots sinken automatisch wenn dein Challenge-Buffer schrumpft. Schutzt dein Konto vor dem Breach.", color: "#27ae60" },
  { num: "04", code: "PERF", title: "Momentum Scaling", desc: "Nach einer Gewinnserie steigen die Lots graduell. Nach Verlusten wird sofort reduziert.", color: "#d4a537" },
  { num: "05", code: "VOL", title: "ATR-Anpassung", desc: "Lot-Groesse wird live anhand der aktuellen Marktvolatilitaet (ATR) berechnet.", color: "#a855f7" },
  { num: "06", code: "DAY", title: "Wochentag-Filter", desc: "Freitag-Reduzierung vor Weekend-Gaps. Montag-Vorsicht bei illiquiden Opens.", color: "#3b82f6" },
  { num: "07", code: "INTEL", title: "Geopolitik + Regime", desc: "Erkennt Marktregime (Trend/Range/Crash) und passt Strategie autonom an.", color: "#27ae60" },
];

const COPIER_TRADES = [
  { time: "09:14:02", pair: "XAUUSD", side: "BUY", lots: "0.42", latency: "31ms", factors: "7/7", status: "COPIED" },
  { time: "09:14:02", pair: "XAUUSD", side: "BUY", lots: "0.38", latency: "28ms", factors: "7/7", status: "SCALED" },
  { time: "09:13:58", pair: "US500", side: "SELL", lots: "0.00", latency: "—", factors: "5/7", status: "BLOCKED" },
  { time: "09:12:41", pair: "EURUSD", side: "BUY", lots: "0.55", latency: "44ms", factors: "7/7", status: "COPIED" },
];

const STATS = [
  { value: "<50ms", label: "Copy-Latenz" },
  { value: "84%", label: "Challenge Pass-Rate" },
  { value: "2.400+", label: "Aktive Accounts" },
  { value: "\u20ac12M+", label: "Managed Volume" },
];

const STEPS = [
  { num: "01", title: "MT-Konto verbinden", desc: "Gib deine MT4/MT5 Zugangsdaten ein. Verschluesselte Verbindung in unter 30 Sekunden." },
  { num: "02", title: "Firm-Profil waehlen", desc: "FTMO, MyForexFunds, The Funded Trader — wir kennen alle Regeln und konfigurieren automatisch." },
  { num: "03", title: "Copier aktiviert sich", desc: "Ab jetzt arbeitet die 7-Faktor Risk Engine autonom. Du bekommst Notifications bei jedem Trade." },
];

export default function SmartCopierPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-glow gf-glow-gold fixed z-0" style={{ width: 900, height: 900, top: -300, left: -200, opacity: 0.5 }} />
      <div className="gf-glow fixed z-0" style={{ width: 600, height: 600, bottom: -200, right: -100, background: "rgba(212,165,55,0.04)" }} />

      {/* Nav */}
      <nav className="gf-nav">
        <Link href="/" className="flex items-center gap-2 px-3">
          <span className="text-sm font-bold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-[13px]">
          <Link href="/pricing" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Pricing</Link>
          <Link href="/forge-mentor" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">FORGE Mentor</Link>
          <Link href="/risk-shield" className="px-3 py-1.5 rounded-full text-[#a3a3a3] hover:text-white transition-colors">Risk Shield</Link>
        </div>
        <Link href="/auth/register" className="text-[13px] px-4 py-1.5 rounded-full bg-gradient-to-r from-[#d4a537] to-[#b8891f] text-[#0b0b0b] font-semibold hover:brightness-110 transition-all">
          Jetzt starten &nbsp;&#9654;
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16">
        <div className="text-center animate-in">
          <span className="gf-badge mb-6 inline-flex">CORE PRODUCT</span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
            <span className="italic text-white/50">Dein Trading auf</span><br />
            <span className="italic font-bold text-white">Autopilot.</span>{" "}
            <span className="italic font-bold gf-gold-text">7-Faktor Risk Engine.</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-[#888]">
            Kopiert Trades in &lt;50ms. Pausiert bei News. Schuetzt vor Drawdown. 84% Challenge Pass-Rate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">Jetzt starten &nbsp;&rarr;</Link>
            <Link href="/pricing" className="gf-btn-outline text-base !px-10 !py-4">Pricing ansehen</Link>
          </div>
        </div>
      </section>

      {/* 7 Schutzfaktoren */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16 animate-in">
          <span className="gf-badge mb-6 inline-flex">Risk Engine</span>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">Die 7</span>{" "}
            <span className="italic font-bold text-white">Schutzfaktoren.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FACTORS.map((f, i) => (
            <div key={i} className={`gf-panel p-7 group relative overflow-hidden animate-in ${i === 6 ? "md:col-span-2 lg:col-span-1" : ""}`} style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${f.color}08, transparent 70%)` }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] tracking-[3px] font-mono text-[#555]">{f.num}</span>
                  <span className="text-[9px] tracking-[2px] font-mono font-medium px-2 py-1 rounded-full border" style={{ color: f.color, borderColor: `${f.color}30`, background: `${f.color}08` }}>{f.code}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white group-hover:gf-gold-text transition-colors">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#666] group-hover:text-[#888] transition-colors">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Terminal Mockup */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-in">
          <span className="gf-badge mb-6 inline-flex">Live Preview</span>
          <h2 className="font-serif text-3xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">Der Copier</span>{" "}
            <span className="italic font-bold text-white">in Aktion.</span>
          </h2>
        </div>
        <div className="relative animate-in delay-1">
          <div className="absolute -inset-8 bg-gradient-to-br from-[#d4a537]/10 via-transparent to-[#d4a537]/5 rounded-3xl blur-2xl" />
          <div className="gf-terminal relative">
            <div className="gf-terminal-bar">
              <div className="gf-terminal-dot bg-[#ff5f57]" /><div className="gf-terminal-dot bg-[#febc2e]" /><div className="gf-terminal-dot bg-[#28c840]" />
              <span className="ml-3 text-[10px] tracking-[2px] text-[#555] uppercase font-mono">Smart Copier v2.1 — Live Feed</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#28c840] animate-glow" />
                <span className="text-[10px] text-[#28c840] font-mono">LIVE</span>
              </div>
            </div>
            <div className="px-4 pt-4 pb-2">
              <div className="grid grid-cols-7 text-[9px] tracking-wider uppercase text-[#555] pb-2 border-b border-white/5 font-mono">
                <span>Zeit</span><span>Pair</span><span>Side</span><span>Lots</span><span>Latenz</span><span>Faktoren</span><span>Status</span>
              </div>
              {COPIER_TRADES.map((t, i) => (
                <div key={i} className="grid grid-cols-7 text-[12px] font-mono py-2 border-b border-white/[0.02] items-center">
                  <span className="text-[#555]">{t.time}</span>
                  <span className="text-white font-medium">{t.pair}</span>
                  <span className={t.side === "BUY" ? "text-[#28c840]" : "text-[#ff6b6b]"}>{t.side}</span>
                  <span className="text-[#888]">{t.lots}</span>
                  <span className="text-[#888]">{t.latency}</span>
                  <span className={t.factors === "7/7" ? "text-[#28c840]" : "text-[#d4a537]"}>{t.factors}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full w-fit ${t.status === "COPIED" ? "bg-[#28c840]/10 text-[#28c840]" : t.status === "SCALED" ? "bg-[#d4a537]/10 text-[#d4a537]" : "bg-[#ff6b6b]/10 text-[#ff6b6b]"}`}>{t.status}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-[2px] text-[#555] uppercase">Risk Engine</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6,7].map(n => (
                    <div key={n} className="w-3 h-3 rounded-sm bg-[#28c840]/20 border border-[#28c840]/30 flex items-center justify-center">
                      <span className="text-[6px] text-[#28c840]">{"\u2713"}</span>
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#28c840]">7/7 ACTIVE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-8 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
          {STATS.map((s, i) => (
            <div key={i} className="text-center animate-in" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div className="text-3xl font-bold gf-gold-text mb-1">{s.value}</div>
              <div className="text-xs tracking-wider uppercase text-[#555]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* So funktioniert's */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-28">
        <div className="text-center mb-16 animate-in">
          <span className="gf-badge mb-6 inline-flex">Setup</span>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">So</span>{" "}
            <span className="italic font-bold text-white">funktioniert&apos;s.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={i} className="gf-panel p-8 animate-in" style={{ animationDelay: `${i * 0.15}s`, opacity: 0 }}>
              <div className="text-3xl font-bold gf-gold-text mb-4 font-mono">{s.num}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-[#666] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="gf-panel p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#d4a537]/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/30 to-transparent" />
          <div className="relative">
            <div className="text-[10px] tracking-[4px] uppercase text-[#d4a537] mb-6 font-medium">Ready?</div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold italic text-white mb-4">Jetzt starten.</h2>
            <p className="text-base text-[#666] mb-10 max-w-lg mx-auto">Konto verbinden, Profil waehlen, Copier laeuft. In unter 5 Minuten.</p>
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">Jetzt starten &nbsp;&rarr;</Link>
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
          <p className="mb-4">Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals fuehren. Vergangene Ergebnisse sind keine Garantie fuer zukuenftige Performance.</p>
          <p className="text-center">&copy; 2025 Gold Foundry. Trading birgt Risiken.</p>
        </div>
      </footer>
    </div>
  );
}
