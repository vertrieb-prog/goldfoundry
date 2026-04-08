"use client";

interface StatsBarProps {
  pnl72h: number;
  pct72h: number;
  winrate: number;
  dd72h: number;
  maxDd: number;
  activePositions: number;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 70, flexShrink: 0 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6d6045", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: color ?? "#d4a537" }}>
        {value}
      </div>
    </div>
  );
}

export default function LiveStatsBar({ pnl72h, pct72h, winrate, dd72h, maxDd, activePositions }: StatsBarProps) {
  const pnlColor = pnl72h >= 0 ? "#22c55e" : "#ef4444";
  const pnlSign = pnl72h >= 0 ? "+" : "";

  return (
    <div
      style={{
        position: "relative",
        zIndex: 40,
        background: "rgba(4,3,2,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(212,165,55,0.08)",
        padding: "14px 20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px 20px", maxWidth: 1000, margin: "0 auto", overflowX: "auto", flexWrap: "wrap" as const }}>
        <div
          style={{
            width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
            boxShadow: "0 0 8px #22c55e", animation: "glow-pulse 2s infinite", flexShrink: 0,
          }}
        />
        <Stat label="72h P&L" value={`${pnlSign}${Math.abs(pnl72h).toLocaleString("de-DE", { maximumFractionDigits: 0 })}€`} color={pnlColor} />
        <Stat label="72h %" value={`${pnlSign}${pct72h.toFixed(2)}%`} color={pnlColor} />
        <Stat label="Winrate" value={`${winrate}%`} color={winrate >= 50 ? "#22c55e" : "#ef4444"} />
        <Stat label="72h DD" value={`${dd72h.toFixed(2)}%`} color="#ef4444" />
        <Stat label="Max DD" value={`${maxDd.toFixed(2)}%`} color="#ef4444" />
        <Stat label="Aktiv" value={String(activePositions)} />
      </div>
    </div>
  );
}
