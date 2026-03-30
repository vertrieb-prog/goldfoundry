"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Was ist Gold Foundry?",
    a: "Gold Foundry ist ein Technologie-Anbieter, der KI-gesteuertes Trade Management entwickelt. Wir sind kein Broker und kein Finanzdienstleister. Alle Trades werden ueber unseren Partner Tegas FX ausgefuehrt.",
  },
  {
    q: "Wer ist Tegas FX?",
    a: "Tegas FX ist ein regulierter ECN/STP Broker mit Sitz in Vanuatu (VFSC). Ueber 30 Liquidity Provider, Equinix LD4 Datacenter in London, segregierte Kundengelder bei DBS Singapore.",
  },
  {
    q: "Wie gut sind die Trader?",
    a: "Unsere 4 Forge-Trader haben einen verifizierten Track Record. GoldForge zum Beispiel: +1% Durchschnittsgewinn pro Tag, 72% Win Rate, maximal 4.5% Drawdown — seit 2022.",
  },
  {
    q: "Brauche ich einen EA oder VPS?",
    a: "Nein. Gold Foundry laeuft komplett in der Cloud ueber MetaApi. Kein Download, kein VPS, kein MT4 das 24/7 laufen muss. Du brauchst nur einen Browser.",
  },
  {
    q: "Was kostet Gold Foundry?",
    a: "Nichts. Gold Foundry ist 100% kostenlos. Du zahlst nur 40% deiner Gewinne als Performance Fee — und nur wenn du tatsaechlich im Plus bist. Keine monatlichen Gebuehren.",
  },
  {
    q: "Kann ich erst mit Demo testen?",
    a: "Ja. Du kannst ein Demo-Konto verbinden und die gesamte Plattform risikofrei testen, bevor du echtes Kapital einsetzt.",
  },
  {
    q: "Was passiert bei Verlusten?",
    a: "Unsere KI-Engine hat 13 Strategien und 9 Safety Features. Der Kill Switch schliesst automatisch alle Positionen beim Max Drawdown. Du verlierst nie mehr als das eingestellte Limit.",
  },
  {
    q: "Kann ich jederzeit aufhoeren?",
    a: "Ja. Kein Vertrag, keine Kuendigungsfrist. Du kannst jederzeit alle Trader stoppen und dein Geld von Tegas FX abziehen.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="relative z-10 py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="gf-heading text-3xl md:text-5xl text-center mb-12">
          Haeufig gestellte Fragen
        </h2>

        <div className="flex flex-col gap-3">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="gf-panel" style={{ transform: "none" }}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-medium" style={{ color: "var(--gf-text-bright)" }}>
                    {item.q}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0 ml-4 transition-transform duration-300"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", color: "var(--gf-gold)" }}
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: isOpen ? "300px" : "0px", opacity: isOpen ? 1 : 0 }}
                >
                  <p
                    className="px-6 pb-5 leading-relaxed"
                    style={{ color: "var(--gf-text)" }}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
