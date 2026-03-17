import Link from "next/link";
export default function Datenschutz() {
  return (
    <div className="min-h-screen py-20 px-4" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/"><span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span></Link>
        <h1 className="text-3xl font-bold mt-8 mb-8" style={{ color: "var(--gf-text-bright)" }}>Datenschutzerklärung</h1>
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--gf-text)" }}>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>1. Verantwortlicher</p><p>Gold Foundry, Musterstraße 1, 10115 Berlin. E-Mail: datenschutz@goldfoundry.de</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>2. Erhobene Daten</p><p>Wir verarbeiten: E-Mail-Adresse, Name, IP-Adresse, MetaTrader-Zugangsdaten (verschlüsselt), Trading-Daten (Trades, Equity, Performance), Zahlungsinformationen (via Cryptomus — wir speichern keine Kryptowährungs-Wallet-Daten), Nutzungsdaten (Seitenaufrufe, Feature-Nutzung), Referral-Daten (wer hat wen eingeladen).</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>3. Rechtsgrundlage</p><p>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO): Bereitstellung der Plattform-Services. Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO): Sicherheit, Betrugsprävention, Produktverbesserung. Einwilligung (Art. 6 Abs. 1 lit. a DSGVO): Marketing-E-Mails, Cookies.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>4. Drittanbieter</p><p>Supabase (Datenbank, EU-Server), Vercel (Hosting, EU Edge), MetaApi (Trading-Anbindung), Anthropic (intelligente Analyse — anonymisierte Daten), Cryptomus (Zahlungsabwicklung), Resend (E-Mail-Versand).</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>5. Ihre Rechte</p><p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch. Kontakt: datenschutz@goldfoundry.de. Beschwerderecht bei der zuständigen Aufsichtsbehörde.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>6. Datenlöschung</p><p>Kontodaten werden 30 Tage nach Account-Löschung vollständig entfernt. Trading-Daten können auf Wunsch sofort gelöscht werden.</p></div>
          <div><p className="font-semibold mb-2" style={{ color: "var(--gf-gold)" }}>7. Cookies</p><p>Wir verwenden essenzielle Cookies (Session, Auth) und ein Referral-Cookie (30 Tage, für Affiliate-Tracking). Keine Tracking-Cookies von Drittanbietern.</p></div>
        </div>
      </div>
    </div>
  );
}
