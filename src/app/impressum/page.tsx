import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — Gold Foundry",
  description: "Impressum der PhoenixOne AI UG (haftungsbeschraenkt), Betreiber von Gold Foundry.",
};

export default function Impressum() {
  return (
    <div className="min-h-screen py-20 px-6" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span>
        </Link>

        <h1 className="gf-heading text-4xl mt-10 mb-8 gf-gold-text">Impressum</h1>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--gf-text)" }}>
          <div>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>
              Angaben gemaess &sect; 5 TMG
            </p>
            <p>
              PhoenixOne AI UG (haftungsbeschraenkt)<br />
              [STRASSE + HAUSNUMMER]<br />
              [PLZ] Leipzig<br />
              Deutschland
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>Vertreten durch</p>
            <p>Geschaeftsfuehrer: [NAME PLACEHOLDER]</p>
          </div>

          <div>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>Kontakt</p>
            <p>
              E-Mail: info@goldfoundry.de<br />
              Telefon: [TELEFONNUMMER PLACEHOLDER]
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>Registereintrag</p>
            <p>
              Registergericht: Amtsgericht Leipzig<br />
              Registernummer: HRB [NUMMER PLACEHOLDER]
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>Umsatzsteuer-ID</p>
            <p>
              Umsatzsteuer-Identifikationsnummer gemaess &sect; 27a UStG: DE[NUMMER PLACEHOLDER]
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>
              Verantwortlich fuer den Inhalt nach &sect; 55 Abs. 2 RStV
            </p>
            <p>
              [NAME PLACEHOLDER]<br />
              [ADRESSE PLACEHOLDER]
            </p>
          </div>

          {/* WICHTIGER HINWEIS */}
          <div className="gf-panel p-6" style={{ borderColor: "var(--gf-border-active)" }}>
            <p className="font-semibold mb-3" style={{ color: "var(--gf-gold)" }}>
              Hinweis zur Taetigkeit
            </p>
            <p>
              Gold Foundry ist ein Produkt der PhoenixOne AI UG (haftungsbeschraenkt). Wir sind ein
              Technologie-Anbieter fuer automatisiertes Trade Management. Wir bieten KEINE
              Anlageberatung, Vermoegensverwaltung oder Finanzdienstleistungen an. Wir sind KEIN
              Broker und KEIN Finanzdienstleister im Sinne des KWG, WpHG oder der MiFID II. Alle
              Trades werden durch unseren Broker-Partner Tegas FX (Clover Markets Ltd., VFSC
              reguliert) ausgefuehrt. Gold Foundry hat keinen Zugriff auf Kundengelder.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>Streitschlichtung</p>
            <p>
              Die Europaeische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#d4a537]"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              . Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>
              Haftung fuer Inhalte
            </p>
            <p>
              Als Diensteanbieter sind wir gemaess &sect; 7 Abs. 1 TMG fuer eigene Inhalte auf diesen
              Seiten nach den allgemeinen Gesetzen verantwortlich. Nach &sect;&sect; 8 bis 10 TMG sind
              wir als Diensteanbieter jedoch nicht verpflichtet, uebermittelte oder gespeicherte
              fremde Informationen zu ueberwachen.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>
              Haftung fuer Links
            </p>
            <p>
              Unser Angebot enthaelt Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Fuer die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
              verantwortlich.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
