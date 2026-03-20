// src/app/dashboard/trades/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const DEMO_TRADES = [
  { closeTime: "18.03.2026 14:32", symbol: "XAUUSD", type: "BUY", volume: 0.50, openPrice: 2341.50, closePrice: 2358.20, profit: 412.50, session: "London", duration: "2h 14m", action: "KOPIERT" },
  { closeTime: "18.03.2026 11:18", symbol: "XAUUSD", type: "SELL", volume: 0.30, openPrice: 2365.80, closePrice: 2351.40, profit: 280.80, session: "London", duration: "1h 42m", action: "KOPIERT" },
  { closeTime: "18.03.2026 09:45", symbol: "US500", type: "BUY", volume: 1.00, openPrice: 5842.50, closePrice: 5861.30, profit: 188.00, session: "Pre-Market", duration: "45m", action: "KOPIERT" },
  { closeTime: "17.03.2026 22:10", symbol: "EURUSD", type: "BUY", volume: 0.80, openPrice: 1.08420, closePrice: 1.08680, profit: 208.00, session: "NY", duration: "3h 20m", action: "KOPIERT" },
  { closeTime: "17.03.2026 19:55", symbol: "XAUUSD", type: "BUY", volume: 0.25, openPrice: 2338.90, closePrice: 2332.10, profit: -170.00, session: "NY", duration: "58m", action: "KOPIERT" },
  { closeTime: "17.03.2026 16:30", symbol: "GBPJPY", type: "SELL", volume: 0.40, openPrice: 192.450, closePrice: 192.120, profit: 132.00, session: "London", duration: "2h 05m", action: "KOPIERT" },
  { closeTime: "17.03.2026 14:12", symbol: "XAUUSD", type: "SELL", volume: 0.50, openPrice: 2355.40, closePrice: 2360.20, profit: -240.00, session: "London", duration: "32m", action: "KOPIERT" },
  { closeTime: "17.03.2026 10:05", symbol: "US500", type: "SELL", volume: 0.50, openPrice: 5855.00, closePrice: 5848.70, profit: 63.00, session: "Pre-Market", duration: "1h 10m", action: "KOPIERT" },
  { closeTime: "16.03.2026 21:40", symbol: "EURUSD", type: "SELL", volume: 1.00, openPrice: 1.08950, closePrice: 1.08720, profit: 230.00, session: "NY", duration: "4h 15m", action: "KOPIERT" },
  { closeTime: "16.03.2026 18:22", symbol: "XAUUSD", type: "BUY", volume: 0.40, openPrice: 2328.60, closePrice: 2341.90, profit: 332.00, session: "NY", duration: "1h 50m", action: "KOPIERT" },
];

type FilterKey = "all" | "XAUUSD" | "US500" | "EURUSD" | "winners" | "losers";

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="gf-panel p-4 text-center">
      <div className="text-xl font-bold" style={{ color: color || "var(--gf-text-bright)" }}>{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide mt-1 text-zinc-600">{label}</div>
    </div>
  );
}

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>(DEMO_TRADES);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    fetch("/api/trades").then(r => r.json()).then(d => { if (d.trades?.length) { setTrades(d.trades); setIsDemo(false); } }).catch(() => {});
  }, []);

  const filtered = trades.filter(t => {
    if (filter === "all") return true;
    if (filter === "winners") return t.profit >= 0;
    if (filter === "losers") return t.profit < 0;
    return t.symbol === filter;
  });

  const totalPnl = trades.reduce((s, t) => s + t.profit, 0);
  const winners = trades.filter(t => t.profit >= 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="gf-heading text-2xl">Trade Ledger</h1>
          <p className="text-sm text-zinc-500 mt-1">Alle kopierten Trades mit Performance-Analyse</p>
        </div>
        {isDemo && <span className="text-[9px] px-2.5 py-1 rounded-full font-mono tracking-wider" style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.12)" }}>DEMO</span>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Trades" value={`${trades.length}`} />
        <StatCard label="Win Rate" value={`${trades.length ? Math.round(winners / trades.length * 100) : 0}%`} color="var(--gf-green)" />
        <StatCard label="Gesamt P&L" value={`${totalPnl >= 0 ? "+" : ""}\u20ac${totalPnl.toFixed(0)}`} color={totalPnl >= 0 ? "var(--gf-green)" : "var(--gf-red)"} />
        <StatCard label="Bester Trade" value={`+\u20ac${Math.max(...trades.map(t => t.profit)).toFixed(0)}`} color="var(--gf-gold)" />
        <StatCard label="Profit Factor" value="2.3" color="var(--gf-gold)" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "all", label: "Alle" }, { key: "XAUUSD", label: "XAUUSD" }, { key: "US500", label: "US500" },
          { key: "EURUSD", label: "EURUSD" }, { key: "winners", label: "Gewinner" }, { key: "losers", label: "Verlierer" },
        ] as { key: FilterKey; label: string }[]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={filter === f.key
              ? { background: "var(--gf-gold)", color: "var(--gf-obsidian)", fontWeight: 700 }
              : { background: "var(--gf-panel)", color: "var(--gf-text-dim)", border: "1px solid var(--gf-border)" }
            }
          >{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="gf-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
              {["Datum", "Symbol", "Typ", "Lots", "Entry", "Exit", "P&L", "Session", "Dauer", "Status"].map(h => (
                <th key={h} className="text-left p-3 text-[10px] font-medium uppercase tracking-wide text-zinc-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="p-10 text-center">
                <div className="text-2xl mb-2">{"\ud83d\udcca"}</div>
                <p className="text-sm text-zinc-500">{filter !== "all" ? "Keine Trades mit diesem Filter." : "Noch keine Trades."}</p>
                {filter !== "all" && <button onClick={() => setFilter("all")} className="text-xs text-[var(--gf-gold)] hover:underline mt-2">Alle anzeigen</button>}
              </td></tr>
            )}
            {filtered.map((t: any, i: number) => (
              <tr key={i} className="hover:bg-white/[0.01] transition-colors" style={{ borderBottom: "1px solid var(--gf-border)" }}>
                <td className="p-3 text-xs font-mono text-zinc-600">{t.closeTime}</td>
                <td className="p-3 font-semibold text-white">{t.symbol}</td>
                <td className="p-3">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded" style={{
                    background: t.type === "BUY" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    color: t.type === "BUY" ? "var(--gf-green)" : "var(--gf-red)",
                    border: `1px solid ${t.type === "BUY" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                  }}>{t.type}</span>
                </td>
                <td className="p-3 font-mono text-zinc-400">{t.volume.toFixed(2)}</td>
                <td className="p-3 font-mono text-zinc-500">{t.openPrice}</td>
                <td className="p-3 font-mono text-zinc-500">{t.closePrice}</td>
                <td className="p-3 font-bold font-mono" style={{ color: t.profit >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
                  {t.profit >= 0 ? "+" : ""}{"\u20ac"}{t.profit.toFixed(2)}
                </td>
                <td className="p-3 text-xs text-zinc-500">{t.session}</td>
                <td className="p-3 text-xs font-mono text-zinc-600">{t.duration}</td>
                <td className="p-3">
                  <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded" style={{
                    background: t.action === "KOPIERT" ? "rgba(34,197,94,0.06)" : "rgba(250,239,112,0.06)",
                    color: t.action === "KOPIERT" ? "var(--gf-green)" : "var(--gf-gold)",
                    border: `1px solid ${t.action === "KOPIERT" ? "rgba(34,197,94,0.12)" : "rgba(250,239,112,0.12)"}`,
                  }}>{t.action}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
