"use client";

import { motion } from "framer-motion";

interface Account {
  name: string;
  equity: number;
  balance: number;
  profit: number;
  gain: number;
  drawdown: number;
  winrate: number;
  trades: number;
  pnl24h?: number;
  pnl72h?: number;
  pnl7d?: number;
  pnl30d?: number;
}

interface Props {
  account: Account | null;
  growthCurve: { date: string; value: number }[];
  recentTrades: { direction: string; symbol: string; lots: number; pnl: number; time: string }[];
  sinceDate?: string;
}

const MONO = "'JetBrains Mono', monospace";
const numColor = (v: number) => (v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#a1a1aa");
const fmtMoney = (v: number) =>
  `${Math.abs(v).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;

function EquityChart({ data }: { data: { date: string; value: number }[] }) {
  if (data.length < 2) {
    return (
      <div
        style={{
          height: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "#6d6045",
          background: "rgba(255,255,255,0.015)",
          borderRadius: 10,
          border: "1px dashed rgba(212,165,55,0.1)",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.6 }}>📈</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa" }}>Equity-Curve baut sich auf</div>
        <div style={{ fontSize: 11, color: "#6d6045" }}>
          {data.length === 0 ? "Noch keine Daten" : `Erst ${data.length} Tag — mehr Datenpunkte folgen täglich`}
        </div>
      </div>
    );
  }

  const w = 640;
  const h = 200;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const values = data.map((d) => d.value);
  const vMin = Math.min(0, ...values);
  const vMax = Math.max(0.01, ...values);
  const range = Math.max(vMax - vMin, 0.01);
  const n = data.length;
  const denom = Math.max(n - 1, 1);
  const toX = (i: number) => padL + (i / denom) * chartW;
  const toY = (v: number) => padT + ((vMax - v) / range) * chartH;

  const linePath = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${toX(n - 1).toFixed(1)},${toY(vMin).toFixed(1)} L${toX(0).toFixed(1)},${toY(vMin).toFixed(1)} Z`;

  const dateIdxs = [0, Math.floor(n / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i);
  const last = values[values.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", display: "block" }}>
      <defs>
        <linearGradient id="ppGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={last >= 0 ? "#22c55e" : "#ef4444"} stopOpacity="0.22" />
          <stop offset="100%" stopColor={last >= 0 ? "#22c55e" : "#ef4444"} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1={padL}
          y1={padT + p * chartH}
          x2={w - padR}
          y2={padT + p * chartH}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.5"
        />
      ))}
      <path d={areaPath} fill="url(#ppGrad)" />
      <path
        d={linePath}
        fill="none"
        stroke={last >= 0 ? "#22c55e" : "#ef4444"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {dateIdxs.map((i) => (
        <text
          key={i}
          x={toX(i)}
          y={h - 8}
          fill="#52525b"
          fontSize="9"
          fontFamily={MONO}
          textAnchor="middle"
        >
          {data[i].date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

export default function PerformancePanel({ account, growthCurve, recentTrades, sinceDate }: Props) {
  if (!account) {
    return (
      <section id="performance" style={{ padding: "60px 20px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", color: "#6d6045", fontSize: 13 }}>
          Lade Live-Performance…
        </div>
      </section>
    );
  }

  const start = sinceDate ? new Date(sinceDate) : new Date("2026-05-04");
  const daysActive = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);

  return (
    <section id="performance" style={{ padding: "60px 20px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#d4a537",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Live-Performance
        </div>
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 800,
            color: "#fafafa",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Echte Zahlen. <span style={{ color: "#d4a537" }}>Direkt aus MetaApi.</span>
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          background: "rgba(10,8,6,0.7)",
          border: "1px solid rgba(212,165,55,0.15)",
          borderRadius: 20,
          padding: "32px 36px",
        }}
      >
        {/* Big Number + Live Pulse */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 28,
            paddingBottom: 24,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#6d6045",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
              }}
            >
              Gesamt-Gain
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                fontFamily: MONO,
                color: numColor(account.gain),
                lineHeight: 1,
              }}
            >
              {account.gain >= 0 ? "+" : ""}
              {account.gain.toFixed(2)}%
            </div>
            <div
              style={{
                fontSize: 15,
                fontFamily: MONO,
                color: numColor(account.profit),
                marginTop: 8,
                fontWeight: 600,
              }}
            >
              {account.profit >= 0 ? "+" : "-"}
              {fmtMoney(account.profit)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                animation: "pp-pulse 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: "#22c55e",
                fontFamily: MONO,
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* 4 Mini Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: "16px 20px",
            marginBottom: 28,
          }}
        >
          {[
            {
              label: "Winrate",
              value: account.trades > 0 ? `${Math.round(account.winrate)}%` : "—",
              color: account.winrate >= 50 && account.trades > 0 ? "#22c55e" : "#a1a1aa",
            },
            {
              label: "Drawdown",
              value: account.drawdown > 0 ? `${account.drawdown.toFixed(2)}%` : "—",
              color: account.drawdown > 10 ? "#ef4444" : "#a1a1aa",
            },
            {
              label: "Trades",
              value: account.trades > 0 ? String(account.trades) : "—",
              color: "#fafafa",
            },
            {
              label: "Tage live",
              value: String(daysActive),
              color: "#fafafa",
            },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: 10,
                  color: "#6d6045",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Equity Chart */}
        <div style={{ paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div
            style={{
              fontSize: 11,
              color: "#6d6045",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            Equity-Verlauf
          </div>
          <EquityChart data={growthCurve} />
        </div>

        {/* Recent Trades */}
        {recentTrades.length > 0 ? (
          <div
            style={{
              paddingTop: 24,
              marginTop: 24,
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#6d6045",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Letzte Trades
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentTrades.slice(0, 8).map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: MONO,
                  }}
                >
                  <span
                    style={{
                      color: t.direction === "BUY" ? "#22c55e" : "#ef4444",
                      fontWeight: 700,
                      width: 36,
                    }}
                  >
                    {t.direction}
                  </span>
                  <span style={{ color: "#e0d4b8", flex: 1 }}>{t.symbol}</span>
                  <span style={{ color: "#6d6045" }}>{t.lots}L</span>
                  <span
                    style={{
                      color: t.pnl >= 0 ? "#22c55e" : "#ef4444",
                      fontWeight: 600,
                    }}
                  >
                    {t.pnl >= 0 ? "+" : ""}
                    {t.pnl.toFixed(2)}€
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              paddingTop: 24,
              marginTop: 24,
              borderTop: "1px solid rgba(255,255,255,0.05)",
              textAlign: "center",
              color: "#6d6045",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Noch keine geschlossenen Trades sichtbar — die ersten erscheinen hier sobald PHANTOM live aktiv wird.
          </div>
        )}
      </motion.div>

      <p style={{ textAlign: "center", color: "#52525b", fontSize: 11, marginTop: 16 }}>
        Daten direkt aus MetaApi · Tegas FX · Auto-Sync alle 30s
      </p>

      <style>{`@keyframes pp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </section>
  );
}
