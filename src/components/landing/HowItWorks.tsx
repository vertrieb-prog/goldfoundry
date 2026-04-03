"use client";

import { motion } from "framer-motion";

const steps = [
  {
    icon: "\u26A1",
    title: "Konto eröffnen",
    desc: "Kostenloses Konto bei Tegas FX in 2 Minuten. Kein Mindestkapital, keine versteckten Gebühren.",
  },
  {
    icon: "\u2699",
    title: "PHANTOM aktivieren",
    desc: "Wähle dein Risikoprofil (8x, 12x oder 24x Hebel). PHANTOM startet sofort mit dem Trading.",
  },
  {
    icon: "\u2197",
    title: "Live verdienen",
    desc: "Sieh jeden Trade in Echtzeit. 73% Winrate, verifiziert über MyFXBook. Auszahlung jederzeit.",
  },
];

export default function HowItWorks() {
  return (
    <section style={{ padding: "80px 20px", maxWidth: 1000, margin: "0 auto" }}>
      <h2
        style={{
          textAlign: "center",
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 700,
          color: "#fafafa",
          marginBottom: 56,
        }}
      >
        So startest du in{" "}
        <span style={{ color: "#d4a537" }}>2 Minuten</span>
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 32,
        }}
      >
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            style={{
              background: "rgba(10,8,6,0.7)",
              border: "1px solid rgba(212,165,55,0.1)",
              borderRadius: 16,
              padding: 32,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>{step.icon}</div>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#d4a537",
                marginBottom: 8,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Schritt {i + 1}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
              {step.title}
            </h3>
            <p style={{ color: "#a1a1aa", lineHeight: 1.7, fontSize: 15 }}>{step.desc}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 48 }}>
        <motion.a
          href="#register"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
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
          Jetzt kostenlos starten
        </motion.a>
        <p style={{ color: "#71717a", fontSize: 12, marginTop: 14, letterSpacing: "0.04em" }}>
          Keine Gebühren {"\u00B7"} Kein Abo {"\u00B7"} Auszahlung jederzeit
        </p>
      </div>
    </section>
  );
}
