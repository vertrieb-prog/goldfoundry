import Link from "next/link";

export default function RiskDisclaimer({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11px] text-center py-3 px-4" style={{ color: "var(--gf-text-dim, #5a4f3a)" }}>
        Risikohinweis: Trading birgt erhebliche Verlustrisiken.{" "}
        <Link href="/risk-disclaimer" className="underline hover:text-[#d4a537]">Mehr erfahren</Link>
      </p>
    );
  }

  return (
    <div className="border-t mt-12 pt-6 pb-4 px-4 text-center" style={{ borderColor: "var(--gf-border, #2a2218)" }}>
      <p className="text-xs leading-relaxed max-w-3xl mx-auto" style={{ color: "var(--gf-text-dim, #5a4f3a)" }}>
        Risikohinweis: Vergangene Performance ist kein verlässlicher Indikator für zukünftige Ergebnisse.
        Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des
        eingesetzten Kapitals führen. Gold Foundry ist kein Broker und bietet keine Anlageberatung.{" "}
        <Link href="/risk-disclaimer" className="underline hover:text-[#d4a537]">Vollständiger Risikohinweis</Link>
      </p>
    </div>
  );
}
