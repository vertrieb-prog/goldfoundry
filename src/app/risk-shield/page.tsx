import Link from "next/link";
import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Risk Shield | Gold Foundry",
  description: "Automatischer Schutz vor Stop Hunts, Flash Crashes und Spread-Spikes. Dein Kapital, geschützt.",
};

const LAYERS = [
  { num: "01", title: "Stop Hunt Detection", desc: "Erkennt künstliche Spikes an runden Zahlen ($2,100, $2,000). Schließt Positionen bevor der Spike dein SL triggert.", icon: "🎯", color: "#d4a537" },
  { num: "02", title: "Flash Crash Guard", desc: "Sofortiger Close bei abnormaler Volatilitaet. Reagiert in <100ms auf plötzliche Marktbewegungen.", icon: "⚡", color: "#ff6b6b" },
  { num: "03", title: "Spread Anomaly Filter", desc: "Blockiert Trades bei >3x normalem Spread. Kein Entry mehr zu Wucher-Spreads bei News oder Low-Liquidity.", icon: "📊", color: "#3b82f6" },
  { num: "04", title: "Slippage Protection", desc: "Maximale Slippage-Toleranz von 2 Pips. Trade wird abgelehnt wenn der Broker schlechter filled.", icon: "🛡️", color: "#27ae60" },
  { num: "05", title: "Gap Protection", desc: "Weekend Gap + News Gap Schutz. Positionen werden vor Marktschluss automatisch abgesichert.", icon: "🔒", color: "#a855f7" },
  { num: "06", title: "Correlation Shield", desc: "Verhindert Überexposure in korrelierenden Paaren. XAUUSD + XAGUSD + EURUSD = max. X% Risiko.", icon: "🔗", color: "#d4a537" },
];

const STATS = [
  { value: "6", label: "Schutzebenen" },
  { value: "847", label: "Threats erkannt / Monat" },
  { value: "0", label: "DD-Breaches" },
];

export default function RiskShieldPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-glow gf-glow-gold fixed z-0" style={{ width: 800, height: 800, top: -200, left: -200, opacity: 0.4 }} />
      <div className="gf-glow fixed z-0" style={{ width: 700, height: 700, bottom: -300, right: -200, background: "rgba(39,174,96,0.05)" }} />

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
          <span className="gf-badge mb-6 inline-flex">PROTECTION</span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
            <span className="italic text-white/50">6 Schutzebenen gegen</span><br />
            <span className="italic font-bold text-white">Marktmanipulation.</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-[#888]">
            Stop Hunts, Flash Crashes, Spread-Anomalien — erkannt und geblockt in Echtzeit. Dein unsichtbarer Bodyguard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">Schutz aktivieren &nbsp;&rarr;</Link>
            <Link href="/pricing" className="gf-btn-outline text-base !px-10 !py-4">Pricing ansehen</Link>
          </div>
        </div>
      </section>

      {/* 6 Protection Layers */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16 animate-in">
          <span className="gf-badge mb-6 inline-flex">Defense System</span>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">6 Ebenen.</span>{" "}
            <span className="italic font-bold text-white">Null Lücken.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LAYERS.map((l, i) => (
            <div key={i} className="gf-panel p-7 group relative overflow-hidden animate-in" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${l.color}08, transparent 70%)` }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="gf-icon-ring">{l.icon}</div>
                  <span className="text-[10px] tracking-[3px] font-mono text-[#555]">{l.num}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white group-hover:gf-gold-text transition-colors">{l.title}</h3>
                <p className="text-sm leading-relaxed text-[#666] group-hover:text-[#888] transition-colors">{l.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Before / After */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16 animate-in">
          <span className="gf-badge mb-6 inline-flex">Real-World Scenario</span>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">Vorher vs.</span>{" "}
            <span className="italic font-bold text-white">Nachher.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 animate-in delay-1">
          {/* Before */}
          <div className="gf-panel p-8 relative overflow-hidden border-[#c0392b]/10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c0392b]/30 to-transparent" />
            <div className="text-[10px] tracking-[3px] uppercase text-[#c0392b] mb-6 font-medium">Ohne Risk Shield</div>
            <div className="space-y-4">
              <div className="gf-terminal p-4">
                <div className="text-[11px] font-mono space-y-1">
                  <div className="text-[#555]">09:29:58 | XAUUSD @ $2,100.00</div>
                  <div className="text-[#888]">09:29:59 | Spike detected: -$14.20 in 800ms</div>
                  <div className="text-[#ff6b6b]">09:30:00 | SL HIT @ $2,086.80</div>
                  <div className="text-[#ff6b6b] font-bold">09:30:01 | Verlust: -€2.400,00</div>
                  <div className="text-[#555]">09:30:15 | Preis zurück bei $2,099.40</div>
                </div>
              </div>
              <p className="text-sm text-[#888]">Trader verliert <span className="text-[#ff6b6b] font-semibold">€2.400</span> durch Stop Hunt bei XAUUSD $2,100 — ein klassisches Pattern.</p>
            </div>
          </div>
          {/* After */}
          <div className="gf-panel p-8 relative overflow-hidden border-[#28c840]/10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#28c840]/30 to-transparent" />
            <div className="text-[10px] tracking-[3px] uppercase text-[#28c840] mb-6 font-medium">Mit Risk Shield</div>
            <div className="space-y-4">
              <div className="gf-terminal p-4">
                <div className="text-[11px] font-mono space-y-1">
                  <div className="text-[#555]">09:29:55 | Stop Hunt Pattern erkannt @ $2,100</div>
                  <div className="text-[#d4a537]">09:29:56 | Risk Shield: Position geschuetzt</div>
                  <div className="text-[#28c840]">09:29:57 | SL temporär erweitert auf $2,082.00</div>
                  <div className="text-[#28c840] font-bold">09:30:15 | Position sicher. Verlust: €0,00</div>
                  <div className="text-[#28c840]">09:31:00 | TP HIT @ $2,108.50 | +€850,00</div>
                </div>
              </div>
              <p className="text-sm text-[#888]">Risk Shield erkennt das Pattern und schuetzt <span className="text-[#28c840] font-semibold">15 Sekunden VOR</span> dem Spike. Trade wird zum Gewinner.</p>
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#27ae60]/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/30 to-transparent" />
          <div className="relative">
            <div className="text-[10px] tracking-[4px] uppercase text-[#d4a537] mb-6 font-medium">Protection First</div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold italic text-white mb-4">Schutz aktivieren.</h2>
            <p className="text-base text-[#666] mb-10 max-w-lg mx-auto">Risk Shield ist in jedem Copier-Plan enthalten. Registriere dich und aktiviere alle 6 Schutzebenen.</p>
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">Jetzt starten &nbsp;&rarr;</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
