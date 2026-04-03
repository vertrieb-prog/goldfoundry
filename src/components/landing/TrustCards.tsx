"use client";

import { motion } from "framer-motion";

const BULLET = "\u2022";

const cards = [
  {
    icon: "\u26E8",
    title: "Risk Shield",
    items: [
      "Max 17.68% Drawdown \u2014 automatisch gesteuert",
      "Trailing Stop-Loss nach TP1 auf Breakeven",
      "Notfall-Close bei extremer Volatilität",
    ],
  },
  {
    icon: "\u2197",
    title: "Verifizierte Performance",
    items: [
      "Alle Trades live auf MyFXBook einsehbar",
      "$47.633 verwaltetes Portfolio-Volumen",
      "+10.86% Gesamt-Gain in unter 2 Wochen",
    ],
  },
  {
    icon: "\u2713",
    title: "100% Kostenlos",
    items: [
      "Keine Gebühren, kein Abo, keine Provision",
      "Tegas FX (MISA-lizenziert) vergütet uns",
      "Auszahlung jederzeit \u2014 dein Geld, dein Konto",
    ],
  },
];

export default function TrustCards() {
  return (
    <section style={{ padding: "80px 20px", maxWidth: 1000, margin: "0 auto" }}>
      <h2
        style={{
          textAlign: "center",
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 700,
          color: "#fafafa",
          marginBottom: 48,
        }}
      >
        Warum <span style={{ color: "#22c55e" }}>73%</span> aller Trades{" "}
        <span style={{ color: "#d4a537" }}>im Plus</span> landen
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
        }}
      >
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            style={{
              background: "rgba(10,8,6,0.7)",
              border: "1px solid rgba(212,165,55,0.1)",
              borderRadius: 16,
              padding: 28,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fafafa", marginBottom: 16 }}>
              {card.title}
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {card.items.map((item, j) => (
                <li
                  key={j}
                  style={{
                    color: "#a1a1aa",
                    fontSize: 14,
                    lineHeight: 1.8,
                    paddingLeft: 16,
                    position: "relative",
                  }}
                >
                  <span style={{ position: "absolute", left: 0, color: "#d4a537" }}>{BULLET}</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <motion.a
          href="#performance"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{
            display: "inline-block",
            background: "#d4a537",
            color: "#0a0806",
            fontWeight: 700,
            fontSize: 16,
            padding: "14px 40px",
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          Performance live ansehen
        </motion.a>
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#52525b",
          fontSize: 11,
          marginTop: 32,
          lineHeight: 1.6,
          maxWidth: 700,
          margin: "32px auto 0",
        }}
      >
        Trading birgt erhebliche Risiken. Vergangene Performance ist keine Garantie für
        zukünftige Ergebnisse. Gold Foundry ist ein Technologie-Vermittler und kein
        Finanzdienstleister. Handeln Sie nur mit Kapital, dessen Verlust Sie sich leisten können.
      </p>
    </section>
  );
}
