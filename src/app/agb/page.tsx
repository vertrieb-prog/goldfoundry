import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGB — Gold Foundry",
  description: "Allgemeine Geschaeftsbedingungen der PhoenixOne AI UG fuer die Nutzung von Gold Foundry.",
};

export default function AGB() {
  return (
    <div className="min-h-screen py-20 px-6" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span>
        </Link>

        <h1 className="gf-heading text-4xl mt-10 mb-8 gf-gold-text">
          Allgemeine Geschaeftsbedingungen
        </h1>

        <p className="text-xs mb-10" style={{ color: "var(--gf-text-dim)" }}>
          Stand: Maerz 2026 — PhoenixOne AI UG (haftungsbeschraenkt), Leipzig
        </p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--gf-text)" }}>
          {/* §1 */}
          <section>
            <H2>&sect;1 Geltungsbereich</H2>
            <p>
              Diese AGB gelten fuer die Nutzung der Plattform Gold Foundry (goldfoundry.de) und aller
              damit verbundenen Dienste. Gold Foundry ist ein Technologie-Dienst der PhoenixOne AI UG
              (haftungsbeschraenkt). Gold Foundry ist KEIN Finanzdienstleister und KEIN Anlageberater.
            </p>
          </section>

          {/* §2 */}
          <section>
            <H2>&sect;2 Vertragspartner</H2>
            <p>
              Vertragspartner ist die PhoenixOne AI UG (haftungsbeschraenkt), Leipzig, Deutschland.
            </p>
          </section>

          {/* §3 */}
          <section>
            <H2>&sect;3 Leistungsbeschreibung</H2>
            <p className="mb-3">Gold Foundry bietet:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>KI-gesteuertes Trade Management (13 Strategien, 9 Safety Features)</li>
              <li>Copy Trading Technologie (4 Forge Trader)</li>
              <li>FORGE Mentor KI-Assistent</li>
              <li>Hebel-Rechner und Analyse-Tools</li>
              <li>100% kostenlos — keine Gebuehren fuer Gold Foundry</li>
            </ul>
            <p className="mb-3">Gold Foundry bietet NICHT:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Anlageberatung oder individuelle Empfehlungen</li>
              <li>Vermoegensverwaltung</li>
              <li>Broker-Dienstleistungen</li>
              <li>Garantierte Gewinne oder Renditen</li>
            </ul>
          </section>

          {/* §4 */}
          <section>
            <H2>&sect;4 Broker-Partner (Tegas FX)</H2>
            <p>
              Alle Trades werden durch unseren Broker-Partner Tegas FX (tegasFX Limited, MISA
              lizenziert, License BFX2024226, Bonovo Road, Fomboni, Comoros) ausgefuehrt. Die Nutzung von Gold Foundry setzt ein aktives Konto bei Tegas FX voraus.
              Es gelten zusaetzlich die AGB von Tegas FX. Gold Foundry hat keinen Zugriff auf
              Kundengelder.
            </p>
          </section>

          {/* §5 */}
          <section>
            <H2>&sect;5 Kosten</H2>
            <p>
              Die Nutzung von Gold Foundry ist kostenlos. Es fallen keine Abo-Gebuehren, Setup-Kosten
              oder versteckten Gebuehren an. Tegas FX erhebt eigene Gebuehren (Spreads, Kommissionen)
              gemaess deren Konditionen.
            </p>
          </section>

          {/* §6 */}
          <section>
            <H2>&sect;6 Haftung</H2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gold Foundry haftet nicht fuer Verluste aus Trading-Aktivitaeten.</li>
              <li>Gold Foundry haftet nicht fuer technische Ausfaelle, die zu Verlusten fuehren.</li>
              <li>Die Nutzung erfolgt auf eigenes Risiko des Nutzers.</li>
              <li>Gold Foundry hat keinen Zugriff auf Kundengelder.</li>
            </ul>
          </section>

          {/* §7 */}
          <section>
            <H2>&sect;7 Verfuegbarkeit</H2>
            <p>
              Gold Foundry bemueht sich um eine Verfuegbarkeit von 99,5%. Wartungsarbeiten werden nach
              Moeglichkeit ausserhalb der Handelszeiten durchgefuehrt. Ein Anspruch auf
              ununterbrochene Verfuegbarkeit besteht nicht.
            </p>
          </section>

          {/* §8 */}
          <section>
            <H2>&sect;8 Datenschutz</H2>
            <p>
              Es gilt unsere{" "}
              <Link href="/datenschutz" className="underline hover:text-[#d4a537]">
                Datenschutzerklaerung
              </Link>.
            </p>
          </section>

          {/* §9 */}
          <section>
            <H2>&sect;9 Kuendigung</H2>
            <p>
              Der Nutzer kann sein Konto jederzeit kuendigen. Es gibt keinen Vertrag und keine
              Kuendigungsfrist. Das Tegas FX Broker-Konto bleibt davon unberuehrt. Offene Positionen
              werden bei Kuendigung nicht automatisch geschlossen.
            </p>
          </section>

          {/* §10 */}
          <section>
            <H2>&sect;10 Aenderungen der AGB</H2>
            <p>
              Wir behalten uns vor, diese AGB jederzeit zu aendern. Aenderungen werden per E-Mail
              angekuendigt und treten 14 Tage nach Ankuendigung in Kraft.
            </p>
          </section>

          {/* §11 */}
          <section>
            <H2>&sect;11 Anwendbares Recht</H2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Leipzig.
            </p>
          </section>

          {/* §12 */}
          <section>
            <H2>&sect;12 Salvatorische Klausel</H2>
            <p>
              Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der uebrigen
              Bestimmungen unberuehrt.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold mb-3" style={{ color: "var(--gf-text-bright)" }}>
      {children}
    </h2>
  );
}
