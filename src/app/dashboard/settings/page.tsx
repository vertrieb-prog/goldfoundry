// src/app/dashboard/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";

const TIER_LABELS: Record<string, string> = {
  free: "Free", analyzer: "Analyzer", copier: "Smart Copier", pro: "Pro", provider: "Provider",
};

export default function SettingsPage() {
  const { user, tier, refetch } = useUser();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.full_name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience: null, goal: null, plan: null, completed: true }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      setSaved(true);
      await refetch();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || "Fehler beim Speichern. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="gf-heading text-2xl mb-8">Einstellungen</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profil */}
        <div className="gf-panel p-6">
          <h3 className="font-semibold mb-4 text-white">Profil</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Name</label>
              <input className="gf-input" value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">E-Mail</label>
              <input className="gf-input opacity-60" value={user?.email || ""} disabled />
              <p className="text-[10px] text-zinc-600 mt-1">E-Mail kann nicht ge&auml;ndert werden. Kontaktiere den Support.</p>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Telefon</label>
              <input className="gf-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 ..." />
            </div>
            <button onClick={handleSave} disabled={saving} className="gf-btn text-sm w-full">
              {saving ? "Wird gespeichert..." : saved ? "\u2713 Gespeichert!" : "Speichern"}
            </button>
            {saveError && <p className="text-xs text-red-400 mt-1">{saveError}</p>}
            {saved && <p className="text-xs text-emerald-400 mt-1">&Auml;nderungen wurden gespeichert.</p>}
          </div>
        </div>

        {/* Subscription */}
        <div className="gf-panel p-6">
          <h3 className="font-semibold mb-4 text-white">Subscription</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-zinc-500">Aktueller Plan:</span>
            <span className="gf-gold-text font-bold">{TIER_LABELS[tier] || "Free"}</span>
          </div>
          {tier === "free" ? (
            <div>
              <p className="text-sm text-zinc-500 mb-4">Upgrade f&uuml;r Smart Copier, Risk Shield und mehr.</p>
              <Link href="/dashboard/upgrade" className="gf-btn text-sm w-full text-center">Upgrade &rarr;</Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-zinc-500 mb-2">Dein Plan ist aktiv. Alle Features stehen dir zur Verf&uuml;gung.</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400">Aktiv</span>
              </div>
            </div>
          )}
        </div>

        {/* Auszahlung */}
        <div className="gf-panel p-6">
          <h3 className="font-semibold mb-4 text-white">Auszahlung</h3>
          <p className="text-xs text-zinc-500 mb-3">Konfiguriere deine Auszahlungsmethode f&uuml;r Provisionen.</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Methode</label>
              <select className="gf-input">
                <option>USDT (TRC20)</option>
                <option>BTC</option>
                <option>Bank Wire</option>
                <option>PayPal</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Wallet-Adresse / IBAN</label>
              <input className="gf-input" placeholder="0x... oder DE..." />
            </div>
            <button className="gf-btn-outline text-sm w-full">Speichern</button>
          </div>
        </div>

        {/* Benachrichtigungen */}
        <div className="gf-panel p-6">
          <h3 className="font-semibold mb-4 text-white">Benachrichtigungen</h3>
          <p className="text-xs text-zinc-500 mb-3">W&auml;hle welche Benachrichtigungen du per E-Mail erhalten willst.</p>
          <div className="space-y-3">
            {[
              { label: "Trade kopiert", desc: "Wenn ein Trade auf dein Konto kopiert wird" },
              { label: "DD-Warnung", desc: "Wenn der Drawdown-Buffer kritisch wird" },
              { label: "Neuer Referral", desc: "Wenn sich jemand \u00fcber deinen Link anmeldet" },
              { label: "Provision erhalten", desc: "Wenn du eine neue Provision bekommst" },
              { label: "Wochen-Report", desc: "W\u00f6chentliche Performance-\u00dcbersicht" },
            ].map(n => (
              <label key={n.label} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/[0.02] transition-colors" style={{ border: "1px solid var(--gf-border)" }}>
                <div>
                  <div className="text-sm text-white">{n.label}</div>
                  <div className="text-[10px] text-zinc-600">{n.desc}</div>
                </div>
                <input type="checkbox" defaultChecked className="accent-[var(--gf-gold)] w-4 h-4" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
