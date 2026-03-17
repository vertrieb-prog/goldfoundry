import Link from "next/link";
export default function Impressum() {
  return (
    <div className="min-h-screen py-20 px-4" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/"><span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span></Link>
        <h1 className="text-3xl font-bold mt-8 mb-8" style={{ color: "var(--gf-text-bright)" }}>Impressum</h1>
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--gf-text)" }}>
          <div><p className="font-semibold mb-1" style={{ color: "var(--gf-gold)" }}>Angaben gemäß § 5 TMG</p><p>Gold Foundry<br/>Musterstraße 1<br/>10115 Berlin<br/>Deutschland</p></div>
          <div><p className="font-semibold mb-1" style={{ color: "var(--gf-gold)" }}>Kontakt</p><p>E-Mail: legal@goldfoundry.de</p></div>
          <div><p className="font-semibold mb-1" style={{ color: "var(--gf-gold)" }}>Vertretungsberechtigte Person</p><p>[Name des Geschäftsführers]</p></div>
          <div><p className="font-semibold mb-1" style={{ color: "var(--gf-gold)" }}>Umsatzsteuer-Identifikationsnummer</p><p>gemäß § 27 a Umsatzsteuergesetz: [USt-IdNr.]</p></div>
          <div><p className="font-semibold mb-1" style={{ color: "var(--gf-gold)" }}>Haftungsausschluss</p><p>Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Gold Foundry bietet keine Finanzberatung. Trading birgt erhebliche Risiken. Vergangene Performance ist kein Indikator für zukünftige Ergebnisse.</p></div>
          <div className="pt-4" style={{ color: "var(--gf-text-dim)" }}><p>Hinweis: Dieses Impressum muss mit den echten Unternehmensdaten ausgefüllt werden bevor die Seite live geht.</p></div>
        </div>
      </div>
    </div>
  );
}
