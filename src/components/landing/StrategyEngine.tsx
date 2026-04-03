"use client";

import { motion } from "framer-motion";

const strategies = [
  {
    num: "01",
    name: "Gold Scalper",
    result: "+32%",
    resultLabel: "Top Gain",
    what: "Findet profitable Gold-Trades in Sekunden",
    how: "Analysiert 4 Zeitrahmen gleichzeitig und schlägt zu, wenn alle übereinstimmen.",
  },
  {
    num: "02",
    name: "Trend Rider",
    result: "+366%",
    resultLabel: "Bester Account",
    what: "Reitet den Gold-Trend bis zum Ende",
    how: "Erkennt den Haupttrend und baut die Position schrittweise aus — maximaler Profit.",
  },
  {
    num: "03",
    name: "Reversal Engine",
    result: "73%",
    resultLabel: "Winrate",
    what: "Kauft wenn alle verkaufen",
    how: "Erkennt Übertreibungen im Markt und handelt die Gegenbewegung — antizyklisch.",
  },
  {
    num: "04",
    name: "Breakout System",
    result: "3:1",
    resultLabel: "Risk:Reward",
    what: "Wartet auf den perfekten Moment",
    how: "Geduldig bis der Kurs ausbricht, dann volle Kraft voraus mit engem Stop.",
  },
  {
    num: "05",
    name: "News Shield",
    result: "24/7",
    resultLabel: "Aktiv",
    what: "Schützt dein Kapital vor News-Crashs",
    how: "Schließt alle Positionen automatisch vor NFP, FOMC und anderen Risiko-Events.",
  },
  {
    num: "06",
    name: "DD Guardian",
    result: "<18%",
    resultLabel: "Max Drawdown",
    what: "Dein automatischer Sicherheitsgurt",
    how: "Trailing Stop-Loss nach jedem Gewinn. Begrenzt Verluste, sichert Profits.",
  },
];

const card = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.1, duration: 0.5 } }),
} as any;

export default function StrategyEngine() {
  return (
    <section id="strategies" style={{ padding: "80px 20px", maxWidth: 960, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#d4a537", marginBottom: 12, fontWeight: 600 }}>
          Die PHANTOM Engine
        </div>
        <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16, color: "#fafafa" }}>
          6 Strategien handeln{" "}
          <span style={{ background: "linear-gradient(135deg, #d4a537, #f0d060)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>gleichzeitig</span>
          {" "}für dich
        </h2>
        <p style={{ color: "#a1a1aa", fontSize: "clamp(14px, 2vw, 17px)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          Während andere auf eine Strategie setzen, kombiniert PHANTOM sechs spezialisierte Systeme.
          Jeder Trade wird live auf MyFXBook protokolliert — du siehst alles in Echtzeit.
        </p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {strategies.map((s, i) => (
          <motion.div key={s.num} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={card}
            style={{ background: "rgba(10,8,6,0.7)", border: "1px solid rgba(212,165,55,0.08)", borderRadius: 16, padding: "24px 22px", position: "relative", overflow: "hidden", cursor: "default" }}
          >
            {/* Strategy number + LIVE */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#52525b", letterSpacing: "0.1em" }}>{s.num}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#22c55e", fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "sp-pulse 2s ease-in-out infinite" }} /> LIVE
              </span>
            </div>

            {/* Result badge */}
            <div style={{ display: "inline-flex", alignItems: "baseline", gap: 8, marginBottom: 12, padding: "6px 12px", background: "rgba(212,165,55,0.06)", borderRadius: 8, border: "1px solid rgba(212,165,55,0.12)" }}>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#d4a537" }}>{s.result}</span>
              <span style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.resultLabel}</span>
            </div>

            {/* Name + description */}
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: "#fafafa" }}>{s.name}</h3>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#d4a537", marginBottom: 6 }}>{s.what}</p>
            <p style={{ fontSize: 13, color: "#8b8b8b", lineHeight: 1.6 }}>{s.how}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
        style={{ textAlign: "center", marginTop: 48 }}>
        <p style={{ color: "#6d6045", fontSize: 13, marginBottom: 20 }}>
          Alle 6 Strategien laufen parallel auf 6 separaten Accounts — volle Diversifikation, minimales Risiko.
        </p>
        <a href="#performance" style={{ display: "inline-block", padding: "14px 36px", fontSize: 15, fontWeight: 700, color: "#0a0806", background: "linear-gradient(135deg, #d4a537, #f0d060)", borderRadius: 10, textDecoration: "none", letterSpacing: "0.02em" }}>
          Live-Ergebnisse ansehen
        </a>
      </motion.div>

      <style>{`@keyframes sp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </section>
  );
}
