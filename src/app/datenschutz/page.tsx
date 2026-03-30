import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklaerung — Gold Foundry",
  description: "Datenschutzerklaerung der PhoenixOne AI UG — wie wir Ihre Daten schuetzen und verarbeiten.",
};

export default function Datenschutz() {
  return (
    <div className="min-h-screen py-20 px-6" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span>
        </Link>

        <h1 className="gf-heading text-4xl mt-10 mb-8 gf-gold-text">Datenschutzerklaerung</h1>

        <p className="text-xs mb-10" style={{ color: "var(--gf-text-dim)" }}>Stand: Maerz 2026</p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--gf-text)" }}>
          {/* 1 */}
          <section>
            <H2>1. Verantwortlicher</H2>
            <p>
              PhoenixOne AI UG (haftungsbeschraenkt)<br />
              [ADRESSE PLACEHOLDER], Leipzig<br />
              E-Mail: datenschutz@goldfoundry.de
            </p>
          </section>

          {/* 2 */}
          <section>
            <H2>2. Art der erhobenen Daten</H2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Registrierungsdaten:</strong> Name, E-Mail, Telefon (optional)</li>
              <li><strong>Nutzungsdaten:</strong> IP-Adresse, Browser, Geraet, Seitenaufrufe</li>
              <li><strong>Trading-Daten:</strong> MetaApi Account ID (verschluesselt), Trade-Historie</li>
              <li><strong>Kommunikation:</strong> Support-Anfragen, Chat-Verlaeufe</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <H2>3. Zweck der Verarbeitung</H2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bereitstellung des Gold Foundry Dashboards</li>
              <li>Verbindung mit Tegas FX Broker-Konto (ueber MetaApi)</li>
              <li>KI-Engine Trade Management</li>
              <li>Support und Kommunikation</li>
              <li>Verbesserung unserer Dienste</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <H2>4. Rechtsgrundlage</H2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> (Vertragserfuellung): Bereitstellung der
                Plattform-Services
              </li>
              <li>
                <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse): Sicherheit,
                Betrugspraevention, Produktverbesserung
              </li>
              <li>
                <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> (Einwilligung): Marketing-E-Mails,
                Analyse-Cookies
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <H2>5. Empfaenger und Dritte</H2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Tegas FX</strong> — Broker-Partner fuer Kontoeroeffnung und Trade-Execution</li>
              <li><strong>MetaApi</strong> — Cloud API fuer Broker-Verbindung</li>
              <li><strong>Anthropic / Claude</strong> — FORGE Mentor KI-Assistent (anonymisierte Trade-Daten)</li>
              <li><strong>Vercel</strong> — Hosting-Provider</li>
              <li><strong>Supabase</strong> — Datenbank</li>
              <li><strong>Resend</strong> — E-Mail-Versand</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <H2>6. Speicherdauer</H2>
            <p>
              Daten werden geloescht, sobald der Zweck der Speicherung entfaellt. Gesetzliche
              Aufbewahrungsfristen (z.B. Steuerrecht: 10 Jahre) bleiben unberuehrt. Kontodaten werden
              30 Tage nach Account-Loeschung vollstaendig entfernt. Trading-Daten koennen auf Wunsch
              sofort geloescht werden.
            </p>
          </section>

          {/* 7 */}
          <section>
            <H2>7. Ihre Rechte (DSGVO)</H2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
              <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
              <li>Recht auf Loeschung (Art. 17 DSGVO)</li>
              <li>Recht auf Einschraenkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Recht auf Datenportabilitaet (Art. 20 DSGVO)</li>
              <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
              <li>Recht auf Beschwerde bei der zustaendigen Aufsichtsbehoerde</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <H2>8. Cookies</H2>
            <p>
              Wir verwenden technisch notwendige Cookies fuer die Funktionalitaet der Website
              (Session, Auth). Analyse-Cookies werden nur mit Ihrer ausdruecklichen Einwilligung
              gesetzt. Es werden keine Tracking-Cookies von Drittanbietern verwendet.
            </p>
          </section>

          {/* 9 */}
          <section>
            <H2>9. SSL-Verschluesselung</H2>
            <p>
              Diese Website nutzt eine SSL-Verschluesselung fuer die Sicherheit Ihrer Daten bei der
              Uebertragung.
            </p>
          </section>

          <div className="gf-panel p-6" style={{ borderColor: "var(--gf-border-active)" }}>
            <p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>
              Kontakt fuer Datenschutzfragen
            </p>
            <p>datenschutz@goldfoundry.de</p>
          </div>
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
