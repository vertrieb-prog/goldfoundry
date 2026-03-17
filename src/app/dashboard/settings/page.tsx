// src/app/dashboard/settings/page.tsx
"use client";
export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--gf-text-bright)" }}>⚙ Settings</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="gf-panel p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--gf-text-bright)" }}>Profil</h3>
          <div className="space-y-3">
            <input className="gf-input" placeholder="Name" />
            <input className="gf-input" placeholder="E-Mail" disabled />
            <input className="gf-input" placeholder="Telefon" />
            <button className="gf-btn text-sm">Speichern</button>
          </div>
        </div>
        <div className="gf-panel p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--gf-text-bright)" }}>Subscription</h3>
          <p className="text-sm mb-4" style={{ color: "var(--gf-text-dim)" }}>Aktueller Plan: <span className="gf-gold-text font-bold">Free</span></p>
          <a href="/pricing" className="gf-btn text-sm">Upgrade →</a>
        </div>
        <div className="gf-panel p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--gf-text-bright)" }}>Auszahlung</h3>
          <div className="space-y-3">
            <select className="gf-input"><option>USDT (TRC20)</option><option>BTC</option><option>Bank Wire</option><option>PayPal</option></select>
            <input className="gf-input" placeholder="Wallet-Adresse / IBAN" />
            <button className="gf-btn text-sm">Speichern</button>
          </div>
        </div>
        <div className="gf-panel p-6">
          <h3 className="font-semibold mb-4" style={{ color: "var(--gf-text-bright)" }}>Benachrichtigungen</h3>
          <div className="space-y-3">
            {["Trade kopiert", "DD-Warnung", "Neuer Referral", "Provision erhalten", "Wochen-Report"].map(n => (
              <label key={n} className="flex items-center justify-between text-sm" style={{ color: "var(--gf-text)" }}>
                {n}
                <input type="checkbox" defaultChecked className="accent-[#d4a537]" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
