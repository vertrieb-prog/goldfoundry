import Link from "next/link";

export default function RiskDisclaimer({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11px] text-center py-3 px-4" style={{ color: "var(--gf-text-dim, #5a4f3a)" }}>
        Risikohinweis: Trading birgt erhebliche Risiken. Gold Foundry ist ein Technologie-Anbieter.
        Alle Trades werden durch Tegas FX ausgefuehrt.{" "}
        <Link href="/risikohinweis" className="underline hover:text-[#d4a537]">Mehr erfahren</Link>
      </p>
    );
  }

  return (
    <div className="border-t mt-12 pt-6 pb-4 px-4 text-center" style={{ borderColor: "var(--gf-border, #2a2218)" }}>
      <p className="text-xs leading-relaxed max-w-3xl mx-auto" style={{ color: "var(--gf-text-dim, #5a4f3a)" }}>
        Risikohinweis: Trading birgt erhebliche Risiken. Gold Foundry ist ein Technologie-Anbieter
        und kein Finanzdienstleister. Alle Trades werden durch Tegas FX (VFSC reguliert) ausgefuehrt.
        Vergangene Performance ist kein verlaesslicher Indikator fuer zukuenftige Ergebnisse.{" "}
        <Link href="/risikohinweis" className="underline hover:text-[#d4a537]">Vollstaendiger Risikohinweis</Link>
      </p>
    </div>
  );
}
