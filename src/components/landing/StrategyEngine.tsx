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

export default function StrategyEngine({ accounts }: Props) {
  const acc = accounts?.[0];
  const isNew = !acc || (acc.gain === 0 && acc.profit === 0);

  return (
    <section id="strategies" style={{ padding: "80px 20px", maxWidth: 900, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#d4a537", marginBottom: 12, fontWeight: 600 }}>
          Die PHANTOM Engine
        </div>
        <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16, color: "#fafafa" }}>
          <span style={{ background: "linear-gradient(135deg, #d4a537, #f0d060)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Eine Strategie.
          </span>{" "}
          Ein Asset. Volle Transparenz.
        </h2>
        <p style={{ color: "#a1a1aa", fontSize: "clamp(14px, 2vw, 16px)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          PHANTOM tradet ausschließlich Gold (XAUUSD). Live-Account bei Tegas FX, jede Position direkt aus MetaApi gestreamt.
        </p>
      </motion.div>

      {acc && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ background: "rgba(10,8,6,0.7)", border: "1px solid rgba(212,165,55,0.15)", borderRadius: 20, padding: "32px 36px", position: "relative", maxWidth: 640, margin: "0 auto" }}>

          <div style={{ position: "absolute", top: 18, right: 18, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: isNew ? "#6d6045" : "#22c55e", animation: isNew ? "none" : "sp-pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: isNew ? "#6d6045" : "#22c55e", letterSpacing: "0.08em" }}>
              {isNew ? "NEU" : "LIVE"}
            </span>
          </div>

          <h3 style={{ fontSize: 22, fontWeight: 800, color: "#fafafa", marginBottom: 4 }}>{acc.name}</h3>
          <div style={{ fontSize: 12, color: "#6d6045", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
            XAUUSD · Gold
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "20px 24px", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Gain</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: isNew ? "#6d6045" : numColor(acc.gain) }}>
                {isNew ? "—" : `${acc.gain >= 0 ? "+" : ""}${acc.gain.toFixed(1)}%`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Profit</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: isNew ? "#6d6045" : numColor(acc.profit) }}>
                {isNew ? "—" : <>{acc.profit >= 0 ? "+" : "-"}{fmtMoney(acc.profit)}</>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Drawdown</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: (acc.drawdown ?? 0) > 10 ? "#ef4444" : "#a1a1aa" }}>
                {(acc.drawdown ?? 0) === 0 ? "—" : `${(acc.drawdown ?? 0).toFixed(1)}%`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6d6045", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Balance</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#d4a537" }}>
                {fmtMoney(acc.balance)}
              </div>
            </div>
          </div>

          {(acc.pnl24h ?? acc.daily ?? 0) !== 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(34,197,94,0.06)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.1)" }}>
              <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: numColor(acc.pnl24h ?? acc.daily ?? 0), fontWeight: 600 }}>
                {(acc.pnl24h ?? acc.daily ?? 0) >= 0 ? "+" : ""}{Math.abs(acc.pnl24h ?? 0).toFixed(2)}€ heute
              </span>
            </div>
          )}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 40 }}>
        {[
          { icon: "🎯", title: "Klarer Edge", desc: "Ein Setup, immer wieder. Kein Asset-Hopping, keine Dilettanten-Strategie." },
          { icon: "📊", title: "Ein Asset", desc: "Nur Gold (XAUUSD). Maximale Spezialisierung statt Streuung über 10 Märkte." },
          { icon: "🔍", title: "100% verifiziert", desc: "Live-Account bei Tegas FX, jede Position direkt aus MetaApi. Nichts wird schöngerechnet." },
        ].map((b) => (
          <div key={b.title} style={{ background: "rgba(10,8,6,0.4)", border: "1px solid rgba(212,165,55,0.06)", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{b.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa", marginBottom: 6 }}>{b.title}</div>
            <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.6 }}>{b.desc}</div>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
        style={{ textAlign: "center", marginTop: 40 }}>
        <a href="#performance" style={{ display: "inline-block", padding: "14px 36px", fontSize: 15, fontWeight: 700, color: "#0a0806", background: "linear-gradient(135deg, #d4a537, #f0d060)", borderRadius: 10, textDecoration: "none" }}>
          Live-Performance ansehen
        </a>
      </motion.div>

      <style>{`@keyframes sp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </section>
  );
}
