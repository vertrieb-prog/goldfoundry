import Link from "next/link";

const RANKS = [
  { name: "Starter", req: "0 Referrals", commission: "20%", color: "#888", bg: "#888" },
  { name: "Bronze", req: "3 Referrals", commission: "25%", color: "#cd7f32", bg: "#cd7f32" },
  { name: "Silver", req: "10 Referrals", commission: "30%", color: "#c0c0c0", bg: "#c0c0c0" },
  { name: "Gold", req: "25 Referrals", commission: "35%", color: "#d4a537", bg: "#d4a537" },
  { name: "Platinum", req: "50 Referrals", commission: "40%", color: "#e5e4e2", bg: "#e5e4e2" },
  { name: "Diamond", req: "100 Referrals", commission: "45%", color: "#b9f2ff", bg: "#b9f2ff" },
  { name: "Crown", req: "250 Referrals", commission: "50%", color: "#ffd700", bg: "#ffd700" },
];

const COMMISSIONS = [
  { level: "Level 1 (Direkt)", rate: "Bis zu 50%", desc: "Deine direkten Referrals" },
  { level: "Level 2", rate: "10%", desc: "Referrals deiner Referrals" },
  { level: "Level 3", rate: "5%", desc: "Dritte Ebene" },
];

const MATCHING = [
  { rank: "Gold", bonus: "10% Matching Bonus" },
  { rank: "Diamond", bonus: "20% / 10% / 5% Matching" },
  { rank: "Crown", bonus: "25% / 15% / 10% / 5% Matching" },
];

const PACKS = [
  { size: "5er Pack", price: "\u20ac99", perUnit: "\u20ac19,80/Stueck" },
  { size: "10er Pack", price: "\u20ac179", perUnit: "\u20ac17,90/Stueck" },
  { size: "25er Pack", price: "\u20ac399", perUnit: "\u20ac15,96/Stueck" },
  { size: "50er Pack", price: "\u20ac699", perUnit: "\u20ac13,98/Stueck" },
];

export default function PartnerPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-glow gf-glow-gold fixed z-0" style={{ width: 900, height: 900, top: -300, left: -200, opacity: 0.5 }} />
      <div className="gf-glow fixed z-0" style={{ width: 600, height: 600, bottom: -200, right: -100, background: "rgba(212,165,55,0.06)" }} />

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
          Partner werden &nbsp;&#9654;
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16">
        <div className="text-center animate-in">
          <span className="gf-badge mb-6 inline-flex">PARTNER PROGRAM</span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
            <span className="italic text-white/50">Verdiene bis zu</span><br />
            <span className="italic font-bold gf-gold-text">50% Provision.</span>{" "}
            <span className="italic font-bold text-white">Passiv.</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-[#888]">
            Empfiehl Gold Foundry und verdiene bis zu 50% Provision auf 3 Ebenen. Passives Einkommen durch dein Netzwerk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">Partner werden &nbsp;&rarr;</Link>
            <Link href="/pricing" className="gf-btn-outline text-base !px-10 !py-4">Pricing ansehen</Link>
          </div>
        </div>
      </section>

      {/* 7 Raenge */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-16 animate-in">
          <span className="gf-badge mb-6 inline-flex">Rank System</span>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">7 Raenge.</span>{" "}
            <span className="italic font-bold text-white">Dein Aufstieg.</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {RANKS.map((r, i) => (
            <div key={i} className="gf-panel p-5 text-center group relative overflow-hidden animate-in" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${r.color}40, transparent)` }} />
              <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center border" style={{ borderColor: `${r.color}40`, background: `${r.color}10` }}>
                <span className="text-lg font-bold font-mono" style={{ color: r.color }}>{r.commission.replace('%', '')}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{r.name}</h3>
              <p className="text-[10px] text-[#555] mb-2">{r.req}</p>
              <span className="text-xs font-mono font-bold" style={{ color: r.color }}>{r.commission}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FORGE Points */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-in">
            <span className="gf-badge mb-6 inline-flex">FORGE Points</span>
            <h2 className="font-serif text-3xl md:text-4xl leading-[1.1] mb-4">
              <span className="italic text-white/40">1 FP =</span>{" "}
              <span className="italic font-bold gf-gold-text">\u20ac0,10</span>
            </h2>
            <p className="text-sm text-[#666] leading-relaxed mb-6">
              FORGE Points verdienst du durch Provisionen, abgeschlossene Tasks und Achievements. Einloesbar fuer Abos, Builder Packs oder Cash-Out.
            </p>
            <div className="space-y-3">
              {["Provisionen generieren automatisch FP", "Tasks & Achievements fuer Bonus-FP", "Einloesbar fuer Premium-Features oder Auszahlung"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-[#d4a537]">&#10022;</span>
                  <span className="text-[#ccc]">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="animate-in delay-1">
            <div className="gf-terminal">
              <div className="gf-terminal-bar">
                <div className="gf-terminal-dot bg-[#ff5f57]" /><div className="gf-terminal-dot bg-[#febc2e]" /><div className="gf-terminal-dot bg-[#28c840]" />
                <span className="ml-3 text-[10px] tracking-[2px] text-[#555] uppercase font-mono">FORGE Points Balance</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-wider uppercase text-[#555]">Balance</span>
                  <span className="text-2xl font-bold font-mono gf-gold-text">12.450 FP</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#555]">Wert</span>
                  <span className="text-[#28c840] font-mono">\u20ac1.245,00</span>
                </div>
                <div className="border-t border-white/5 pt-3 space-y-2 text-[12px] font-mono">
                  <div className="flex justify-between"><span className="text-[#555]">Heute</span><span className="text-[#28c840]">+85 FP</span></div>
                  <div className="flex justify-between"><span className="text-[#555]">Diese Woche</span><span className="text-[#28c840]">+420 FP</span></div>
                  <div className="flex justify-between"><span className="text-[#555]">Dieser Monat</span><span className="text-[#28c840]">+1.870 FP</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-in">
          <span className="gf-badge mb-6 inline-flex">Commission</span>
          <h2 className="font-serif text-3xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">3 Ebenen.</span>{" "}
            <span className="italic font-bold text-white">Maximales Einkommen.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-8 animate-in delay-1">
          {COMMISSIONS.map((c, i) => (
            <div key={i} className="gf-panel p-6 text-center">
              <div className="text-3xl font-bold gf-gold-text mb-2 font-mono">{c.rate}</div>
              <h3 className="text-sm font-semibold text-white mb-1">{c.level}</h3>
              <p className="text-xs text-[#555]">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="gf-panel p-6 animate-in delay-2">
          <div className="text-[10px] tracking-[2px] text-[#d4a537] uppercase mb-4 font-medium">Matching Bonus</div>
          <div className="grid md:grid-cols-3 gap-4">
            {MATCHING.map((m, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-1">{m.rank}</h4>
                <p className="text-xs text-[#888]">{m.bonus}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Builder Packs */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12 animate-in">
          <span className="gf-badge mb-6 inline-flex">Builder Packs</span>
          <h2 className="font-serif text-3xl md:text-5xl leading-[1.1]">
            <span className="italic text-white/40">Beschleunige</span>{" "}
            <span className="italic font-bold text-white">deinen Aufstieg.</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in delay-1">
          {PACKS.map((p, i) => (
            <div key={i} className="gf-panel p-6 text-center group hover:border-[#d4a537]/30 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-2">{p.size}</h3>
              <div className="text-2xl font-bold gf-gold-text mb-1 font-mono">{p.price}</div>
              <p className="text-[11px] text-[#555]">{p.perUnit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Calculator */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="gf-panel p-8 md:p-12 relative overflow-hidden animate-in">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/30 to-transparent" />
          <div className="text-center mb-8">
            <span className="gf-badge mb-4 inline-flex">Rechenbeispiel</span>
            <h3 className="font-serif text-2xl md:text-3xl italic text-white">Was du verdienen kannst.</h3>
          </div>
          <div className="gf-terminal">
            <div className="gf-terminal-bar">
              <div className="gf-terminal-dot bg-[#ff5f57]" /><div className="gf-terminal-dot bg-[#febc2e]" /><div className="gf-terminal-dot bg-[#28c840]" />
              <span className="ml-3 text-[10px] tracking-[2px] text-[#555] uppercase font-mono">Provision Calculator</span>
            </div>
            <div className="p-4 space-y-2 text-[13px] font-mono">
              <div className="flex justify-between text-[#888]"><span>10 Referrals x Copier-Plan (\u20ac29/Mo)</span><span className="text-white">\u20ac290/Mo</span></div>
              <div className="flex justify-between text-[#888]"><span>Level 1 Provision (30% Silver)</span><span className="text-[#28c840]">\u20ac87/Mo</span></div>
              <div className="flex justify-between text-[#888]"><span>Level 2 (5 indirekte, 10%)</span><span className="text-[#28c840]">\u20ac14,50/Mo</span></div>
              <div className="border-t border-white/5 pt-2 flex justify-between font-bold"><span className="text-[#d4a537]">Gesamt passiv</span><span className="text-[#28c840]">\u20ac101,50/Mo</span></div>
              <div className="flex justify-between text-[#555] text-[11px]"><span>Jaehrlich</span><span className="text-[#28c840]">\u20ac1.218,00/Jahr</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="gf-panel p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#d4a537]/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4a537]/30 to-transparent" />
          <div className="relative">
            <div className="text-[10px] tracking-[4px] uppercase text-[#d4a537] mb-6 font-medium">Revenue Share</div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold italic text-white mb-4">Partner werden.</h2>
            <p className="text-base text-[#666] mb-10 max-w-lg mx-auto">Registriere dich, erhalte deinen Affiliate-Link und starte sofort mit 20% Provision.</p>
            <Link href="/auth/register" className="gf-btn text-base !px-10 !py-4">Partner werden &nbsp;&rarr;</Link>
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
