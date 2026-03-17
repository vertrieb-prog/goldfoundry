import Link from "next/link";
export default function AGB() {
  return (
    <div className="min-h-screen py-20 px-4" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/"><span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span></Link>
        <h1 className="text-3xl font-bold mt-8 mb-8" style={{ color: "var(--gf-text-bright)" }}>Allgemeine Geschäftsbedingungen</h1>
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--gf-text)" }}>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>1. Geltungsbereich</p><p>Diese AGB gelten für die Nutzung der Gold Foundry Plattform (goldfoundry.de) und aller damit verbundenen Services wie Smart Copier, FORGE Mentor, Strategy Lab und das Partner-Programm.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>2. Leistungsbeschreibung</p><p>Gold Foundry bietet algorithmische Trading-Tools, automatisiertes Copy-Trading, Strategie-Analyse und ein Affiliate-System. Gold Foundry ist KEIN Broker und führt keine Trades im eigenen Namen aus. Alle Trades werden über den MetaTrader-Account des Nutzers bei seinem gewählten Broker ausgeführt.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>3. Abo-Modell</p><p>Die Nutzung erfolgt auf Abo-Basis (monatlich). Zahlung via Cryptomus (Kryptowährung) oder Stripe (Kreditkarte). Das Abo verlängert sich automatisch. Kündigung jederzeit zum Monatsende möglich.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>4. Profit Sharing</p><p>Bei Nutzung des Smart Copiers gilt: 40% des Copier-Gewinns gehen an Gold Foundry, 60% an den Signal-Provider. High Water Mark Prinzip: Nur bei neuem Profit wird abgerechnet. Die Abrechnung erfolgt monatlich.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>5. Haftung</p><p>Gold Foundry übernimmt KEINE Haftung für Trading-Verluste. Der Smart Copier reduziert Risiken, kann Verluste aber nicht ausschließen. Der Nutzer tradet auf eigenes Risiko. Vergangene Performance ist kein Indikator für zukünftige Ergebnisse.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>6. Affiliate/Partner-Programm</p><p>Provisionen werden wöchentlich abgerechnet. Minimum-Auszahlung: 50 EUR. Manipulation des Affiliate-Systems (Fake-Accounts, Self-Referrals) führt zu sofortiger Sperrung. Gold Foundry behält sich vor, Provisionen bei Betrug einzubehalten.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>7. Account-Sperrung</p><p>Gold Foundry kann Accounts bei Verstößen gegen diese AGB, Betrug, oder Nicht-Zahlung sperren. Bei Sperrung wird der Smart Copier sofort deaktiviert.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>8. Anwendbares Recht</p><p>Es gilt deutsches Recht. Gerichtsstand ist Berlin.</p></div>
        </div>
      </div>
    </div>
  );
}
