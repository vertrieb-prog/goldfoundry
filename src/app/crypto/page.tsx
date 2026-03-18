import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Krypto Trading | Gold Foundry",
  description: "Bitcoin, Ethereum und 50+ Kryptowährungen. DeFi Yield, Portfolio Management und mehr.",
};

const EXCHANGES = [
  { name: "Binance", pairs: "500+", fee: "0.10%", color: "#f0b90b" },
  { name: "Bybit", pairs: "400+", fee: "0.10%", color: "#f7a600" },
  { name: "Bitget", pairs: "350+", fee: "0.10%", color: "#00c8b3" },
  { name: "OKX", pairs: "300+", fee: "0.08%", color: "#ffffff" },
];

const FEATURES = [
  { icon: "⚡", title: "Copy Trading across Exchanges", desc: "Kopiere Top-Trader über alle 4 Exchanges hinweg. Ein Dashboard, alle Börsen. Automatische Lot-Anpassung.", tag: "CORE", color: "#d4a537" },
  { icon: "🛡️", title: "Liquidation Shield", desc: "Auto-Close bei <10% Margin. Schuetzt vor Liquidation bei Leverage-Trades. Reagiert in <200ms.", tag: "PROTECTION", color: "#ff6b6b" },
  { icon: "📊", title: "Funding Rate Alerts", desc: "Automatische Benachrichtigung bei extremen Funding Rates. Profitiere von Funding-Arbitrage.", tag: "INTEL", color: "#3b82f6" },
  { icon: "💼", title: "Portfolio Manager", desc: "Automatisches Rebalancing nach deiner Ziel-Allokation. Reduziert manuellen Aufwand auf null.", tag: "MANAGE", color: "#27ae60" },
];

const DEFI_COMPARISON = [
  { feature: "Copy Trading", gf: "Ja", defi: "Nein" },
  { feature: "Risk Management", gf: "7-Faktor Engine", defi: "Manuell" },
  { feature: "Liquidation Schutz", gf: "Automatisch", defi: "Keine" },
  { feature: "Exchanges", gf: "4 CEX + DeFi", defi: "1 Protokoll" },
  { feature: "Einstieg", gf: "Ab €9/Mo", defi: "Gas Fees + Slippage" },
  { feature: "Support", gf: "24/7 + FORGE Mentor", defi: "Discord" },
];

const STATS = [
  { value: "4", label: "Exchanges" },
  { value: "200+", label: "Crypto-Paare" },
  { value: "24/7", label: "Monitoring" },
];

export default function CryptoPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-glow gf-glow-gold fixed z-0" style={{ width: 800, height: 800, top: -200, left: -200, opacity: 0.4 }} />
      <div className="gf-glow fixed z-0" style={{ width: 700, height: 700, bottom: -300, right: -200, background: "rgba(59,130,246,0.05)" }} />

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
          <span className="gf-badge mb-6 inline-flex">CRYPTO</span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
            <span className="italic text-white/50">Crypto Trading.</span><br />
            <span className="italic font-bold text-white">Neu</span>{" "}
            <span className="italic font-bold gf-gold-text">definiert.</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-[#888]">
            4 Exchanges. Liquidation Shield. Funding Rate Alerts. Portfolio Rebalancing. Alles in einem Portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">Crypto starten &nbsp;&rarr;</Link>
            <Link href="/pricing" className="gf-btn-outline text-base !px-10 !py-4">Pricing ansehen</Link>
          </div>
        </div>
      </section>

      {/* Exchanges Grid */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-in">
          <span className="gf-badge mb-6 inline-flex">Exchanges</span>
          <h2 className="font-serif text-3xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">4 Börsen.</span>{" "}
            <span className="italic font-bold text-white">Ein Portal.</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in delay-1">
          {EXCHANGES.map((e, i) => (
            <div key={i} className="gf-panel p-6 text-center group hover:border-[#d4a537]/30 transition-colors">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center border" style={{ borderColor: `${e.color}30`, background: `${e.color}10` }}>
                <span className="text-lg font-bold font-mono" style={{ color: e.color }}>{e.name[0]}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{e.name}</h3>
              <p className="text-xs text-[#555]">{e.pairs} Paare</p>
              <p className="text-xs text-[#555]">ab {e.fee} Fee</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16 animate-in">
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">Crypto Features</span>{" "}
            <span className="italic font-bold text-white">im Detail.</span>
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

      {/* DeFi Comparison */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-in">
          <span className="gf-badge mb-6 inline-flex">Comparison</span>
          <h2 className="font-serif text-3xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">Gold Foundry vs.</span>{" "}
            <span className="italic font-bold text-white">DeFi Protokolle.</span>
          </h2>
          <p className="text-sm text-[#555] mt-4">Aave, Lido, Curve — im direkten Vergleich.</p>
        </div>
        <div className="gf-terminal animate-in delay-1">
          <div className="gf-terminal-bar">
            <div className="gf-terminal-dot bg-[#ff5f57]" /><div className="gf-terminal-dot bg-[#febc2e]" /><div className="gf-terminal-dot bg-[#28c840]" />
            <span className="ml-3 text-[10px] tracking-[2px] text-[#555] uppercase font-mono">Feature Comparison</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 text-[10px] tracking-wider uppercase text-[#555] pb-2 border-b border-white/5 font-mono">
              <span>Feature</span><span className="text-center">Gold Foundry</span><span className="text-center">DeFi (Aave/Lido/Curve)</span>
            </div>
            {DEFI_COMPARISON.map((row, i) => (
              <div key={i} className="grid grid-cols-3 text-[13px] font-mono py-2.5 border-b border-white/[0.03] items-center">
                <span className="text-[#888]">{row.feature}</span>
                <span className="text-center text-[#28c840]">{row.gf}</span>
                <span className="text-center text-[#555]">{row.defi}</span>
              </div>
            ))}
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#3b82f6]/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/30 to-transparent" />
          <div className="relative">
            <div className="text-[10px] tracking-[4px] uppercase text-[#d4a537] mb-6 font-medium">Crypto Trading</div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold italic text-white mb-4">Jetzt Crypto starten.</h2>
            <p className="text-base text-[#666] mb-10 max-w-lg mx-auto">Verbinde deine Exchange, aktiviere den Copier und lass die KI für dich arbeiten. 24/7.</p>
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
          <p className="mb-4">Risikohinweis: Der Handel mit Kryptowährungen birgt erhebliche Risiken und kann zum Verlust des eingesetzten Kapitals führen. Vergangene Ergebnisse sind keine Garantie für zukünftige Performance.</p>
          <p className="text-center">&copy; 2026 Gold Foundry. Trading birgt Risiken.</p>
        </div>
      </footer>
    </div>
  );
}
