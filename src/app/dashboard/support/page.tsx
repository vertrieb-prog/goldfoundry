// src/app/dashboard/support/page.tsx
"use client";
import Link from "next/link";

const FAQ = [
  {
    q: "Wie verbinde ich mein MetaTrader-Konto?",
    a: "Gehe zu Konto und folge den Anweisungen. Du brauchst deine MT5-Login-Daten von Tegas FX.",
  },
  {
    q: "Was kostet Gold Foundry?",
    a: "Die Nutzung ist kostenlos. Du tradest ueber deinen eigenen Tegas FX Account.",
  },
  {
    q: "Wie funktioniert der Hebel?",
    a: "Tegas FX bietet bis zu 24x Hebel. Im Rechner kannst du verschiedene Szenarien durchspielen.",
  },
  {
    q: "Ist mein Kapital sicher?",
    a: "Dein Geld liegt auf deinem eigenen Tegas FX Konto (MISA lizenziert). Gold Foundry hat keinen Zugriff auf dein Kapital.",
  },
  {
    q: "Kann ich jederzeit aufhoeren?",
    a: "Ja. Du kannst jeden Trader jederzeit stoppen und dein Geld bei Tegas FX auszahlen.",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <h1 className="gf-heading text-2xl">Support</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FORGE Mentor */}
        <Link href="/dashboard/chat" className="gf-panel p-6 hover:bg-white/[0.01] transition-colors block">
          <div className="text-2xl mb-3">&#x1F9E0;</div>
          <h3 className="font-semibold text-white mb-1">FORGE Mentor</h3>
          <p className="text-xs text-zinc-500">Frag unsere KI zu Trading, Strategien und der Plattform.</p>
        </Link>

        {/* WhatsApp */}
        <a href="https://wa.me/message" target="_blank" rel="noopener noreferrer" className="gf-panel p-6 hover:bg-white/[0.01] transition-colors block">
          <div className="text-2xl mb-3">&#x1F4AC;</div>
          <h3 className="font-semibold text-white mb-1">WhatsApp Community</h3>
          <p className="text-xs text-zinc-500">Trete unserer Trading-Community bei.</p>
        </a>

        {/* E-Mail */}
        <a href="mailto:support@goldfoundry.de" className="gf-panel p-6 hover:bg-white/[0.01] transition-colors block">
          <div className="text-2xl mb-3">&#x2709;&#xFE0F;</div>
          <h3 className="font-semibold text-white mb-1">E-Mail Support</h3>
          <p className="text-xs text-zinc-500">Schreib uns direkt.</p>
        </a>
      </div>

      {/* FAQ */}
      <div className="gf-panel p-6">
        <h3 className="font-semibold text-white mb-4">Haeufige Fragen</h3>
        <div className="space-y-4">
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? "1px solid var(--gf-border)" : "none" }} className="pb-3">
              <div className="text-sm font-semibold text-white mb-1">{item.q}</div>
              <div className="text-xs text-zinc-500">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
