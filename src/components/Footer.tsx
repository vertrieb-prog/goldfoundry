import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] px-6 py-16 bg-black">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-2">
          <div className="text-lg font-bold gf-gold-text mb-2">GOLD FOUNDRY</div>
          <p className="text-xs text-zinc-500 leading-relaxed mb-4">
            Das All-in-One Trading Terminal fuer Prop-Firm Trader und Profis. Forex, Gold, Indices, Crypto.
          </p>
          <Link href="/auth/register" className="gf-btn gf-btn-sm text-xs">
            Jetzt starten &rarr;
          </Link>
        </div>
        {/* Produkte */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Produkte</h4>
          <div className="flex flex-col gap-2 text-sm text-zinc-500">
            <Link href="/smart-copier" className="hover:text-[var(--gf-gold)] transition-colors">Smart Copier</Link>
            <Link href="/telegram-copier" className="hover:text-[var(--gf-gold)] transition-colors">Telegram Copier</Link>
            <Link href="/forge-mentor" className="hover:text-[var(--gf-gold)] transition-colors">FORGE Mentor</Link>
            <Link href="/risk-shield" className="hover:text-[var(--gf-gold)] transition-colors">Risk Shield</Link>
            <Link href="/strategy-lab" className="hover:text-[var(--gf-gold)] transition-colors">Strategy Lab</Link>
            <Link href="/pricing" className="hover:text-[var(--gf-gold)] transition-colors">Pricing</Link>
          </div>
        </div>
        {/* Trading */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Trading</h4>
          <div className="flex flex-col gap-2 text-sm text-zinc-500">
            <Link href="/leaderboard" className="hover:text-[var(--gf-gold)] transition-colors">Leaderboard</Link>
            <Link href="/crypto" className="hover:text-[var(--gf-gold)] transition-colors">Crypto Trading</Link>
            <Link href="/wissen" className="hover:text-[var(--gf-gold)] transition-colors">Wissen &amp; Guides</Link>
            <Link href="/vergleich/prop-firms" className="hover:text-[var(--gf-gold)] transition-colors">Prop-Firm Vergleich</Link>
            <Link href="/vergleich/broker" className="hover:text-[var(--gf-gold)] transition-colors">Broker Vergleich</Link>
          </div>
        </div>
        {/* Partner */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Partner</h4>
          <div className="flex flex-col gap-2 text-sm text-zinc-500">
            <Link href="/partner" className="hover:text-[var(--gf-gold)] transition-colors">Partner werden</Link>
            <Link href="/partner" className="hover:text-[var(--gf-gold)] transition-colors">Bis zu 50% Provision</Link>
            <Link href="/dashboard/partner" className="hover:text-[var(--gf-gold)] transition-colors">Partner Dashboard</Link>
            <Link href="/dashboard/partner/earnings" className="hover:text-[var(--gf-gold)] transition-colors">Provisionen</Link>
          </div>
        </div>
        {/* Rechtliches */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">Rechtliches</h4>
          <div className="flex flex-col gap-2 text-sm text-zinc-500">
            <Link href="/impressum" className="hover:text-[var(--gf-gold)] transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-[var(--gf-gold)] transition-colors">Datenschutz</Link>
            <Link href="/agb" className="hover:text-[var(--gf-gold)] transition-colors">AGB</Link>
            <Link href="/risk-disclaimer" className="hover:text-[var(--gf-gold)] transition-colors">Risikohinweis</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/[0.04]">
        <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
          Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals fuehren. Vergangene Ergebnisse sind keine Garantie fuer zukuenftige Performance. Gold Foundry ist kein Broker und bietet keine Anlageberatung.
        </p>
        <p className="text-xs text-zinc-600 text-center">&copy; 2026 Gold Foundry. Trading birgt Risiken.</p>
      </div>
    </footer>
  );
}
