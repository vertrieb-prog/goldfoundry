"use client";

import { useEffect, useRef } from "react";

const otherSystem = [
  { text: "Expert Advisor installieren", strike: true },
  { text: "VPS Server mieten (30\u20AC/Mo)", strike: true },
  { text: "MT4 24/7 offen lassen", strike: false },
  { text: "Manuell Lots berechnen", strike: true },
  { text: "News Events ueberwachen", strike: false },
  { text: "Stop Loss nachziehen", strike: false },
];

const goldFoundry = [
  "Dashboard oeffnen",
  "Trader waehlen",
  "Fertig.",
];

export default function ComparisonSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.classList.add("visible");
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="gf-section gf-reveal">
      <div className="text-center mb-16">
        <span className="gf-eyebrow mb-4 block">Der Unterschied</span>
        <h2 className="gf-heading text-3xl md:text-5xl mb-4">
          Kein EA. Kein VPS. <span className="gf-gold-text">Kein Stress.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* LEFT — Other Systems */}
        <div
          className="rounded-2xl p-6 md:p-8"
          style={{
            background: "var(--gf-panel)",
            border: "1px solid rgba(239, 68, 68, 0.12)",
          }}
        >
          <h3
            className="font-bold text-base mb-6"
            style={{ color: "var(--gf-text-muted)" }}
          >
            Andere Copy-Systeme
          </h3>
          <ul className="space-y-4">
            {otherSystem.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span
                  className="text-sm mt-0.5 flex-shrink-0"
                  style={{ color: "var(--gf-red)" }}
                >
                  &#10007;
                </span>
                <span
                  className={`text-sm ${item.strike ? "gf-killed" : ""}`}
                  style={{ color: "var(--gf-text-dim)" }}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT — Gold Foundry */}
        <div
          className="gf-panel rounded-2xl p-6 md:p-8"
          style={{
            borderColor: "rgba(212, 165, 55, 0.2)",
            boxShadow: "0 0 60px rgba(212, 165, 55, 0.04), 0 0 120px rgba(212, 165, 55, 0.02)",
          }}
        >
          <h3 className="font-bold text-base mb-6 gf-gold-text">
            Gold Foundry
          </h3>
          <ul className="space-y-4">
            {goldFoundry.map((text) => (
              <li key={text} className="flex items-start gap-3">
                <span
                  className="text-sm mt-0.5 flex-shrink-0"
                  style={{ color: "var(--gf-green)" }}
                >
                  &#10003;
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--gf-text-bright)" }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
