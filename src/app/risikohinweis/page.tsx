import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risikohinweis — Gold Foundry",
  description:
    "Wichtige Informationen zu den Risiken beim Trading mit Hebelprodukten, CFDs und Forex. Gold Foundry ist ein Technologie-Anbieter — alle Trades werden durch Tegas FX ausgefuehrt.",
};

export default function Risikohinweis() {
  return (
    <div className="min-h-screen py-20 px-6" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span>
        </Link>

        <h1 className="gf-heading text-4xl mt-10 mb-8 gf-gold-text">Risikohinweis</h1>

        {/* SHORT VERSION */}
        <div className="gf-panel p-6 mb-10" style={{ borderColor: "var(--gf-border-active)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--gf-gold)" }}>
            Zusammenfassung
          </p>
          <ul className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--gf-text)" }}>
            <li>Trading mit Hebelprodukten birgt ein hohes Risiko. Sie koennen Ihre gesamte Einlage verlieren.</li>
            <li>Gold Foundry ist ein Technologie-Anbieter und kein Finanzdienstleister.</li>
            <li>Alle Trades werden durch Tegas FX (MISA lizenziert, BFX2024226) ausgefuehrt.</li>
            <li>Vergangene Performance ist keine Garantie fuer zukuenftige Ergebnisse.</li>
          </ul>
        </div>

        {/* LONG VERSION */}
        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--gf-text)" }}>
          <Section nr="1" title="Allgemeine Risiken">
            Der Handel mit Finanzinstrumenten wie Devisen (Forex), Differenzkontrakten (CFDs),
            Edelmetallen und Indizes ist mit erheblichen Risiken verbunden. Sie koennen Ihr gesamtes
            eingesetztes Kapital verlieren. Dieser Handel ist nicht fuer alle Anleger geeignet.
          </Section>

          <Section nr="2" title="Hebelwirkung">
            Die Nutzung von Hebelprodukten (Leverage) kann sowohl Gewinne als auch Verluste erheblich
            verstaerken. Ein Hebel von 8x bedeutet, dass eine Marktbewegung von 1% zu einem Gewinn
            oder Verlust von 8% auf Ihrem Konto fuehren kann. Ein Hebel von 24x verstaerkt diesen
            Effekt entsprechend. Handeln Sie nur mit Hebel, wenn Sie die Risiken vollstaendig verstehen.
          </Section>

          <Section nr="3" title="Vergangene Performance">
            Vergangene Ergebnisse und historische Performance-Daten sind kein verlaesslicher Indikator
            fuer zukuenftige Ergebnisse. Die auf dieser Website dargestellten Performance-Daten
            (einschliesslich Trader-Statistiken, Equity Curves und Profit-Berechnungen) basieren auf
            historischen Daten und stellen keine Garantie fuer zukuenftige Gewinne dar.
          </Section>

          <Section nr="4" title="Keine Anlageberatung">
            Gold Foundry bietet keine Anlageberatung, Vermoegensverwaltung oder individuelle
            Finanzberatung an. Die auf dieser Website bereitgestellten Informationen dienen
            ausschliesslich zu Informationszwecken und stellen keine Empfehlung zum Kauf oder Verkauf
            von Finanzinstrumenten dar.
          </Section>

          <Section nr="5" title="Technologie-Anbieter">
            Gold Foundry ist ein Produkt der PhoenixOne AI UG (haftungsbeschraenkt), Leipzig,
            Deutschland. Wir sind ein Technologie-Anbieter, der Software fuer automatisiertes Trade
            Management bereitstellt. Wir sind KEIN Broker, KEIN Finanzdienstleister und KEIN
            Anlageberater.
          </Section>

          <Section nr="6" title="Broker-Partner">
            Alle Trades werden durch unseren Broker-Partner Tegas FX (tegasFX Limited, MISA
            lizenziert, License BFX2024226, Bonovo Road, Fomboni, Comoros) ausgefuehrt. Kundengelder werden auf segregierten Konten bei DBS
            Singapore verwahrt. Gold Foundry hat keinen direkten Zugriff auf Kundengelder.
          </Section>

          <Section nr="7" title="Automatisiertes Trading">
            Die KI-gesteuerte Trade-Management Engine von Gold Foundry operiert automatisch. Obwohl
            die Engine mit 13 Strategien und 9 Sicherheits-Features ausgestattet ist, kann kein
            automatisiertes System Verluste vollstaendig verhindern. Technische Ausfaelle,
            Netzwerkprobleme oder extreme Marktbedingungen koennen zu unerwarteten Verlusten fuehren.
          </Section>

          <Section nr="8" title="Copy Trading">
            Beim Copy Trading werden Trades von Signal-Providern automatisch auf Ihr Konto kopiert.
            Die Performance eines Signal-Providers kann sich jederzeit aendern. Vergangene Ergebnisse
            eines Traders sind keine Garantie fuer zukuenftige Ergebnisse.
          </Section>

          <Section nr="9" title="Eigene Verantwortung">
            Die Entscheidung, Finanzinstrumente zu handeln, liegt ausschliesslich bei Ihnen. Sie sind
            allein verantwortlich fuer Ihre Handelsentscheidungen und deren Ergebnisse.
          </Section>

          <div className="gf-panel p-6" style={{ borderColor: "var(--gf-border-active)" }}>
            <p className="font-bold text-base" style={{ color: "var(--gf-gold)" }}>
              Handeln Sie nur mit Kapital, dessen Verlust Sie sich leisten koennen.
            </p>
          </div>

          <Section nr="10" title="Regulatorische Hinweise">
            Gold Foundry (PhoenixOne AI UG) unterliegt NICHT der Aufsicht der BaFin oder einer
            anderen Finanzaufsichtsbehoerde, da wir ausschliesslich als Technologie-Anbieter agieren.
            Unser Broker-Partner Tegas FX ist durch die Mwali International Services Authority (MISA)
            lizenziert (License BFX2024226).
          </Section>

          <p className="pt-4" style={{ color: "var(--gf-text-dim)" }}>
            Stand: Maerz 2026 — PhoenixOne AI UG (haftungsbeschraenkt), Leipzig
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ nr, title, children }: { nr: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-2" style={{ color: "var(--gf-text-bright)" }}>
        {nr}. {title}
      </h2>
      <p>{children}</p>
    </div>
  );
}
