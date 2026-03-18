// src/app/dashboard/trades/page.tsx
"use client";
import { useEffect, useState } from "react";

const DEMO_STATS = {
  totalTrades: 847,
  winRate: 71.4,
  avgPnl: 36.80,
  bestTrade: 412.50,
  profitFactor: 2.3,
};

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
  { closeTime: "16.03.2026 15:08", symbol: "GBPJPY", type: "BUY", volume: 0.30, openPrice: 191.800, closePrice: 191.450, profit: -105.00, session: "London", duration: "47m", action: "GESKIPPT" },
  { closeTime: "16.03.2026 12:44", symbol: "XAUUSD", type: "SELL", volume: 0.35, openPrice: 2347.20, closePrice: 2342.80, profit: 154.00, session: "London", duration: "1h 22m", action: "KOPIERT" },
  { closeTime: "15.03.2026 20:30", symbol: "US500", type: "BUY", volume: 0.75, openPrice: 5830.10, closePrice: 5826.40, profit: -55.50, session: "NY", duration: "28m", action: "KOPIERT" },
  { closeTime: "15.03.2026 17:15", symbol: "EURUSD", type: "BUY", volume: 0.60, openPrice: 1.08100, closePrice: 1.08340, profit: 144.00, session: "London", duration: "2h 38m", action: "KOPIERT" },
  { closeTime: "15.03.2026 13:50", symbol: "XAUUSD", type: "BUY", volume: 0.20, openPrice: 2319.70, closePrice: 2335.50, profit: 316.00, session: "Asian", duration: "5h 12m", action: "KOPIERT" },
];

type FilterKey = "all" | "XAUUSD" | "US500" | "EURUSD" | "GBPJPY" | "winners" | "losers";

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>(DEMO_TRADES);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    fetch("/api/trades")
      .then(r => r.json())
      .then(d => { if (d.trades?.length) setTrades(d.trades); })
      .catch(() => {});
  }, []);

  const filtered = trades.filter(t => {
    if (filter === "all") return true;
    if (filter === "winners") return t.profit >= 0;
    if (filter === "losers") return t.profit < 0;
    return t.symbol === filter;
  });

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Alle" },
    { key: "XAUUSD", label: "XAUUSD" },
    { key: "US500", label: "US500" },
    { key: "EURUSD", label: "EURUSD" },
    { key: "winners", label: "Nur Gewinner" },
    { key: "losers", label: "Nur Verlierer" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>Trade Ledger</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>Alle kopierten Trades mit Smart Analyse.</p>
        </div>
        <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(212,165,55,0.15)", color: "var(--gf-gold)" }}>DEMO DATA</span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="gf-panel p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{DEMO_STATS.totalTrades}</div>
          <div className="text-[10px] tracking-wider" style={{ color: "var(--gf-text-dim)" }}>TOTAL TRADES</div>
        </div>
        <div className="gf-panel p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--gf-green)" }}>{DEMO_STATS.winRate}%</div>
          <div className="text-[10px] tracking-wider" style={{ color: "var(--gf-text-dim)" }}>WIN RATE</div>
        </div>
        <div className="gf-panel p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--gf-green)" }}>+{"\u20AC"}{DEMO_STATS.avgPnl.toFixed(2)}</div>
          <div className="text-[10px] tracking-wider" style={{ color: "var(--gf-text-dim)" }}>AVG P&L</div>
        </div>
        <div className="gf-panel p-4 text-center">
          <div className="text-2xl font-bold gf-gold-text">+{"\u20AC"}{DEMO_STATS.bestTrade.toFixed(2)}</div>
          <div className="text-[10px] tracking-wider" style={{ color: "var(--gf-text-dim)" }}>BEST TRADE</div>
        </div>
        <div className="gf-panel p-4 text-center">
          <div className="text-2xl font-bold gf-gold-text">{DEMO_STATS.profitFactor}</div>
          <div className="text-[10px] tracking-wider" style={{ color: "var(--gf-text-dim)" }}>PROFIT FACTOR</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`text-xs px-3 py-1.5 rounded ${filter === f.key ? "gf-btn" : "gf-btn-outline"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Trade Table */}
      <div className="gf-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
              {["Datum", "Symbol", "Typ", "Lots", "Entry", "Exit", "P&L", "Session", "Dauer", "Copier Action"].map(h => (
                <th key={h} className="text-left p-3 text-xs tracking-wider" style={{ color: "var(--gf-text-dim)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t: any, i: number) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--gf-border)" }}>
                <td className="p-3 mono text-xs" style={{ color: "var(--gf-text-dim)" }}>{t.closeTime}</td>
                <td className="p-3 font-semibold" style={{ color: "var(--gf-text-bright)" }}>{t.symbol}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-xs" style={{
                    background: t.type === "BUY" ? "rgba(39,174,96,0.1)" : "rgba(192,57,43,0.1)",
                    color: t.type === "BUY" ? "var(--gf-green)" : "var(--gf-red)"
                  }}>{t.type}</span>
                </td>
                <td className="p-3 mono">{t.volume.toFixed(2)}</td>
                <td className="p-3 mono" style={{ color: "var(--gf-text-dim)" }}>{t.openPrice}</td>
                <td className="p-3 mono" style={{ color: "var(--gf-text-dim)" }}>{t.closePrice}</td>
                <td className="p-3 font-bold" style={{ color: t.profit >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
                  {t.profit >= 0 ? "+" : ""}{"\u20AC"}{t.profit.toFixed(2)}
                </td>
                <td className="p-3 text-xs" style={{ color: "var(--gf-text)" }}>{t.session}</td>
                <td className="p-3 text-xs mono" style={{ color: "var(--gf-text-dim)" }}>{t.duration}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{
                    background: t.action === "KOPIERT" ? "rgba(39,174,96,0.1)" : "rgba(212,165,55,0.1)",
                    color: t.action === "KOPIERT" ? "var(--gf-green)" : "var(--gf-gold)"
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
