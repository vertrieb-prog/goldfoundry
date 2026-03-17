// src/app/dashboard/trades/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // In production: fetch from /api with filters
    // For now: placeholder data structure
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>📊 Trade Ledger</h1><p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>Alle kopierten Trades mit Smart Analyse.</p></div>
        <div className="flex gap-2">
          {["all", "XAUUSD", "US500"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded ${filter === f ? "gf-btn" : "gf-btn-outline"}`}>{f === "all" ? "Alle" : f}</button>
          ))}
        </div>
      </div>

      <div className="gf-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
            {["Datum", "Symbol", "Typ", "Lots", "Open", "Close", "P&L", "Copier"].map(h => (
              <th key={h} className="text-left p-3 text-xs tracking-wider" style={{ color: "var(--gf-text-dim)" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {trades.length === 0 && (
              <tr><td colSpan={8} className="p-12 text-center" style={{ color: "var(--gf-text-dim)" }}>Trades werden geladen sobald der Copier aktiv ist. Verbinde ein MT-Konto um zu starten.</td></tr>
            )}
            {trades.map((t: any, i: number) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--gf-border)" }}>
                <td className="p-3 mono text-xs" style={{ color: "var(--gf-text-dim)" }}>{t.closeTime}</td>
                <td className="p-3 font-semibold" style={{ color: "var(--gf-text-bright)" }}>{t.symbol}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-xs" style={{ background: t.type === "BUY" ? "rgba(39,174,96,0.1)" : "rgba(192,57,43,0.1)", color: t.type === "BUY" ? "var(--gf-green)" : "var(--gf-red)" }}>{t.type}</span></td>
                <td className="p-3 mono">{t.volume}</td>
                <td className="p-3 mono" style={{ color: "var(--gf-text-dim)" }}>{t.openPrice}</td>
                <td className="p-3 mono" style={{ color: "var(--gf-text-dim)" }}>{t.closePrice}</td>
                <td className="p-3 font-bold" style={{ color: t.profit >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>{t.profit >= 0 ? "+" : ""}${t.profit}</td>
                <td className="p-3 text-xs" style={{ color: "var(--gf-text-dim)" }}>{t.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
