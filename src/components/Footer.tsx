import Link from "next/link";
import GoldFoundryLogo from "@/components/GoldFoundryLogo";

export default function Footer() {
  return (
    <footer className="relative z-10 px-6 pt-16 pb-8" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        {/* Column 1: Brand */}
        <div>
          <GoldFoundryLogo size={28} showText />
          <p className="text-sm mt-4 leading-relaxed" style={{ color: "var(--gf-text)" }}>
            KI-gesteuerte Trading-Technologie.
          </p>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--gf-text-dim)" }}>
            Ein Produkt der PhoenixOne AI UG (haftungsbeschraenkt)
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--gf-text-dim)" }}>
            Alle Trades werden durch Tegas FX (VFSC reguliert) ausgefuehrt.
          </p>
        </div>

        {/* Column 2: Produkt */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--gf-text-muted)" }}>
            Produkt
          </h4>
          <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--gf-text)" }}>
            <Link href="/#engine" className="hover:text-[#d4a537] transition-colors">Technologie</Link>
            <Link href="/#trader" className="hover:text-[#d4a537] transition-colors">Trader</Link>
            <Link href="/#rechner" className="hover:text-[#d4a537] transition-colors">Rechner</Link>
            <Link href="/#faq" className="hover:text-[#d4a537] transition-colors">FAQ</Link>
          </div>
        </div>

        {/* Column 3: Rechtliches */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--gf-text-muted)" }}>
            Rechtliches
          </h4>
          <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--gf-text)" }}>
            <Link href="/risikohinweis" className="hover:text-[#d4a537] transition-colors">Risikohinweis</Link>
            <Link href="/impressum" className="hover:text-[#d4a537] transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-[#d4a537] transition-colors">Datenschutz</Link>
            <Link href="/agb" className="hover:text-[#d4a537] transition-colors">AGB</Link>
          </div>
        </div>
      </div>

      {/* Risikohinweis */}
      <div className="max-w-5xl mx-auto pt-8 border-t" style={{ borderColor: "var(--gf-border)" }}>
        <p className="text-xs leading-relaxed mb-6" style={{ color: "var(--gf-text-dim)" }}>
          Trading birgt erhebliche Risiken. Vergangene Performance ist keine Garantie fuer zukuenftige Ergebnisse. Gold Foundry ist ein Technologie-Anbieter und kein Finanzdienstleister. Handeln Sie nur mit Kapital, dessen Verlust Sie sich leisten koennen.
        </p>
        <p className="text-xs text-center" style={{ color: "var(--gf-text-dim)" }}>
          &copy; 2026 PhoenixOne AI UG (haftungsbeschraenkt). Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  );
}
