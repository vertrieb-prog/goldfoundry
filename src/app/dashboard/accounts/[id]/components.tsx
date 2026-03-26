"use client";
// src/app/dashboard/accounts/[id]/components.tsx — Sub-components for account detail

/* ── Stat Card ── */
export function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="gf-panel p-4">
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>{label}</div>
      <div className="text-lg font-bold mono" style={{ color: color || "var(--gf-text-bright)" }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "var(--gf-text-dim)" }}>{sub}</div>}
    </div>
  );
}

/* ── Positions Table ── */
export function PositionsTable({ positions }: { positions: any[] }) {
  if (!positions.length) return (
    <div className="gf-panel p-6 text-center text-sm" style={{ color: "var(--gf-text-dim)" }}>Keine offenen Positionen</div>
  );
  return (
    <div className="gf-panel overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
            {["Symbol", "Typ", "Volume", "Open Price", "Current", "SL", "TP", "Profit", "Zeit"].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--gf-text-dim)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {positions.map((p, i) => {
            const profit = Number(p.profit || p.unrealizedProfit || 0);
            return (
              <tr key={p.id || i} style={{ borderBottom: "1px solid var(--gf-border)" }}>
                <td className="px-3 py-2 font-semibold" style={{ color: "var(--gf-text-bright)" }}>{p.symbol}</td>
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{
                    background: p.type === "POSITION_TYPE_BUY" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: p.type === "POSITION_TYPE_BUY" ? "#22c55e" : "#ef4444",
                  }}>{p.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL"}</span>
                </td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-bright)" }}>{p.volume}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-bright)" }}>{p.openPrice}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-bright)" }}>{p.currentPrice}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-dim)" }}>{p.stopLoss || "—"}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-dim)" }}>{p.takeProfit || "—"}</td>
                <td className="px-3 py-2 mono font-semibold" style={{ color: profit >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
                  {profit >= 0 ? "+" : ""}{profit.toFixed(2)}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--gf-text-dim)" }}>
                  {p.time ? new Date(p.time).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Equity Curve (CSS bar chart) ── */
export function EquityCurve({ trades }: { trades: any[] }) {
  // Group trades by day, sum profit
  const byDay: Record<string, number> = {};
  for (const t of trades) {
    const d = (t.closed_at || t.created_at || "").slice(0, 10);
    if (!d) continue;
    byDay[d] = (byDay[d] || 0) + Number(t.profit || 0);
  }
  const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-30);
  if (!days.length) return (
    <div className="gf-panel p-6 text-center text-sm" style={{ color: "var(--gf-text-dim)" }}>Nicht genug Daten fuer die Equity-Kurve</div>
  );

  const maxAbs = Math.max(...days.map(d => Math.abs(d[1])), 1);

  return (
    <div className="gf-panel p-4">
      <div className="flex items-end gap-0.5" style={{ height: 120 }}>
        {days.map(([day, val]) => {
          const pct = Math.abs(val) / maxAbs * 100;
          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end h-full relative group">
              <div className="absolute -top-6 text-[9px] hidden group-hover:block px-1 py-0.5 rounded whitespace-nowrap"
                style={{ background: "var(--gf-panel)", color: "var(--gf-text-bright)", border: "1px solid var(--gf-border)" }}>
                {day.slice(5)}: {val >= 0 ? "+" : ""}{val.toFixed(0)}
              </div>
              <div className="w-full rounded-t-sm transition-all" style={{
                height: `${Math.max(pct, 3)}%`,
                background: val >= 0 ? "var(--gf-green)" : "var(--gf-red)",
                opacity: 0.7,
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Signal History ── */
export function SignalHistory({ signals }: { signals: any[] }) {
  if (!signals.length) return (
    <div className="gf-panel p-6 text-center text-sm" style={{ color: "var(--gf-text-dim)" }}>Keine Signale vorhanden</div>
  );
  return (
    <div className="gf-panel overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
            {["Datum", "Aktion", "Symbol", "Entry", "SL", "TP", "Konfidenz", "Status"].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--gf-text-dim)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {signals.map((s, i) => {
            const p = s.parsed || {};
            return (
              <tr key={s.id || i} style={{ borderBottom: "1px solid var(--gf-border)" }}>
                <td className="px-3 py-2" style={{ color: "var(--gf-text-dim)" }}>
                  {s.created_at ? new Date(s.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                </td>
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{
                    background: (p.action || "").toLowerCase().includes("buy") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: (p.action || "").toLowerCase().includes("buy") ? "#22c55e" : "#ef4444",
                  }}>{p.action || "?"}</span>
                </td>
                <td className="px-3 py-2 font-semibold" style={{ color: "var(--gf-text-bright)" }}>{p.symbol || "?"}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-bright)" }}>{p.entry || "—"}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-dim)" }}>{p.sl || "—"}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-dim)" }}>{p.tp || p.tp1 || "—"}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-gold)" }}>{p.confidence ? `${p.confidence}%` : "—"}</td>
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{
                    background: s.status === "executed" ? "rgba(34,197,94,0.1)" : "rgba(250,239,112,0.08)",
                    color: s.status === "executed" ? "#22c55e" : "var(--gf-gold)",
                  }}>{s.status || "pending"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Trade History Table ── */
export function TradeHistory({ trades }: { trades: any[] }) {
  if (!trades.length) return (
    <div className="gf-panel p-6 text-center text-sm" style={{ color: "var(--gf-text-dim)" }}>Keine Trade-Historie vorhanden</div>
  );
  return (
    <div className="gf-panel overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
            {["Symbol", "Typ", "Volume", "Open", "Close", "Profit", "Dauer", "Kommentar"].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--gf-text-dim)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => {
            const profit = Number(t.profit || 0);
            const dur = t.opened_at && t.closed_at
              ? formatDuration(new Date(t.closed_at).getTime() - new Date(t.opened_at).getTime())
              : "—";
            return (
              <tr key={t.id || i} style={{ borderBottom: "1px solid var(--gf-border)" }}>
                <td className="px-3 py-2 font-semibold" style={{ color: "var(--gf-text-bright)" }}>{t.symbol}</td>
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{
                    background: (t.trade_type || "").toLowerCase().includes("buy") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: (t.trade_type || "").toLowerCase().includes("buy") ? "#22c55e" : "#ef4444",
                  }}>{t.trade_type || "?"}</span>
                </td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-bright)" }}>{t.volume}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-bright)" }}>{t.open_price}</td>
                <td className="px-3 py-2 mono" style={{ color: "var(--gf-text-bright)" }}>{t.close_price || "—"}</td>
                <td className="px-3 py-2 mono font-semibold" style={{ color: profit >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
                  {profit >= 0 ? "+" : ""}{profit.toFixed(2)}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--gf-text-dim)" }}>{dur}</td>
                <td className="px-3 py-2 max-w-[120px] truncate" style={{ color: "var(--gf-text-dim)" }}>{t.comment || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}
