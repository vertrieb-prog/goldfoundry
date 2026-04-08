"use client";

import { motion } from "framer-motion";

interface Account {
  name: string;
  color?: string;
  gain: number;
  daily?: number;
  monthly?: number;
  drawdown?: number;
  balance: number;
  equity: number;
  profit: number;
  pnl24h?: number;
  pnl72h?: number;
  pnl7d?: number;
  pnl30d?: number;
  winrate?: number;
  trades?: number;
  active?: boolean;
}

interface Props {
  accounts: Account[];
}

function numColor(v: number) { return v >= 0 ? "#22c55e" : "#ef4444"; }
function fmtMoney(v: number) { return `${Math.abs(Math.round(v)).toLocaleString("de-DE")}€`; }

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
} as any;

export default function StrategyEngine({ accounts }: Props) {
  if (!accounts?.length) return null;

  return (
    <section id="strategies" style={{ padding: "80px 20px", maxWidth: 1000, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#d4a537", marginBottom: 12, fontWeight: 600 }}>
          Die PHANTOM Engine
        </div>
        <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16, color: "#fafafa" }}>
          <span style={{ background: "linear-gradient(135deg, #d4a537, #f0d060)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {accounts.length} Strategien
          </span>{" "}
          handeln gerade für dich
        </h2>
        <p style={{ color: "#a1a1aa", fontSize: "clamp(14px, 2vw, 16px)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
          Jede Strategie laeuft auf einem eigenen Account — alle live verifiziert.
          {accounts.length > 6 && " Neue Strategien werden laufend ergaenzt."}
        </p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: 16 }}>
        {accounts.map((acc, i) => {
          const isNew = acc.gain === 0 && acc.profit === 0;
          return (
            <motion.div key={acc.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={cardVariants}
              style={{ background: "rgba(10,8,6,0.7)", border: "1px solid rgba(212,165,55,0.08)", borderRadius: 16, padding: "20px 22px", position: "relative" }}>

              {/* LIVE indicator */}
              <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: isNew ? "#6d6045" : "#22c55e", animation: isNew ? "none" : "sp-pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: isNew ? "#6d6045" : "#22c55e", letterSpacing: "0.08em" }}>
                  {isNew ? "NEU" : "LIVE"}
                </span>
              </div>

              {/* Strategy name */}
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fafafa", marginBottom: 14, paddingRight: 50 }}>{acc.name}</h3>

              {/* Key metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Gain</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: isNew ? "#6d6045" : numColor(acc.gain) }}>
                    {isNew ? "—" : `${acc.gain >= 0 ? "+" : ""}${acc.gain.toFixed(1)}%`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Profit</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: isNew ? "#6d6045" : numColor(acc.profit) }}>
                    {isNew ? "—" : <>{acc.profit >= 0 ? "+" : "-"}{fmtMoney(acc.profit)}</>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Drawdown</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: (acc.drawdown ?? 0) > 10 ? "#ef4444" : "#a1a1aa" }}>
                    {(acc.drawdown ?? 0) === 0 ? "—" : `${(acc.drawdown ?? 0).toFixed(1)}%`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Balance</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "#d4a537" }}>
                    {fmtMoney(acc.balance)}
                  </div>
                </div>
              </div>

              {/* Daily badge */}
              {(acc.daily ?? acc.pnl24h ?? 0) !== 0 && (
                <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(34,197,94,0.06)", borderRadius: 6, border: "1px solid rgba(34,197,94,0.1)" }}>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: numColor(acc.pnl24h ?? acc.daily ?? 0), fontWeight: 600 }}>
                    {(acc.pnl24h ?? acc.daily ?? 0) >= 0 ? "+" : ""}{Math.abs(acc.pnl24h ?? 0).toFixed(2)}€ heute
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
        style={{ textAlign: "center", marginTop: 40 }}>
        <a href="#performance" style={{ display: "inline-block", padding: "14px 36px", fontSize: 15, fontWeight: 700, color: "#0a0806", background: "linear-gradient(135deg, #d4a537, #f0d060)", borderRadius: 10, textDecoration: "none" }}>
          Alle Live-Ergebnisse ansehen
        </a>
      </motion.div>

      <style>{`@keyframes sp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </section>
  );
}
