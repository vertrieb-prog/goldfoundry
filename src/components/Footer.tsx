import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] px-6 py-16" style={{ background: "#040302" }}>
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-2">
          <div className="text-lg font-bold mb-2" style={{ color: "#d4a537" }}>GOLD FOUNDRY</div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: "#666" }}>
            Automatisiertes Trading Portal. Smart Copier, Telegram Copier, FORGE Mentor.
          </p>
        </div>
        {/* Produkte */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#888" }}>Produkte</h4>
          <div className="flex flex-col gap-2 text-sm" style={{ color: "#666" }}>
            <Link href="/#produkte" className="hover:text-[#d4a537] transition-colors">Smart Copier</Link>
            <Link href="/#produkte" className="hover:text-[#d4a537] transition-colors">Telegram Copier</Link>
            <Link href="/#pricing" className="hover:text-[#d4a537] transition-colors">Pricing</Link>
          </div>
        </div>
        {/* Rechtliches */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#888" }}>Rechtliches</h4>
          <div className="flex flex-col gap-2 text-sm" style={{ color: "#666" }}>
            <Link href="/impressum" className="hover:text-[#d4a537] transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-[#d4a537] transition-colors">Datenschutz</Link>
            <Link href="/agb" className="hover:text-[#d4a537] transition-colors">AGB</Link>
            <Link href="/risk-disclaimer" className="hover:text-[#d4a537] transition-colors">Risikohinweis</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-8 border-t border-white/[0.04]">
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "#555" }}>
          Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals fuehren. Vergangene Ergebnisse sind keine Garantie fuer zukuenftige Performance. Gold Foundry ist kein Broker und bietet keine Anlageberatung.
        </p>
        <p className="text-xs text-center" style={{ color: "#555" }}>&copy; 2026 Gold Foundry. Trading birgt Risiken.</p>
      </div>
    </footer>
  );
}
