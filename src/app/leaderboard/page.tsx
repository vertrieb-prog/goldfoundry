// src/app/leaderboard/page.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetch(`/api/leaderboard?period=${period}`).then(r => r.json()).then(d => setData(d.leaderboard ?? []));
  }, [period]);

  const maxSharpe = Math.max(...data.map(d => d.sharpe), 1);

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center justify-between mb-12">
          <Link href="/"><span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span></Link>
          <Link href="/auth/register" className="gf-btn text-xs">Starten →</Link>
        </nav>

        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--gf-text-bright)" }}>Strategy Leaderboard</h1>
        <p className="text-sm mb-8" style={{ color: "var(--gf-text-dim)" }}>Gerankt nach Sharpe Ratio (risk-adjusted). Nur verifizierte Live-Performance.</p>

        <div className="flex gap-2 mb-8">
          {[["week", "7 Tage"], ["month", "30 Tage"], ["alltime", "All-Time"]].map(([k, l]) => (
            <button key={k} onClick={() => setPeriod(k)} className={period === k ? "gf-btn text-xs" : "gf-btn-outline text-xs"}>{l}</button>
          ))}
        </div>

        <div className="space-y-3">
          {data.map((entry, i) => (
            <div key={entry.id} className="gf-panel p-5 flex items-center gap-4">
              <div className="text-2xl font-bold w-10 text-center" style={{ color: i === 0 ? "var(--gf-gold)" : i < 3 ? "var(--gf-text-bright)" : "var(--gf-text-dim)" }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold" style={{ color: "var(--gf-text-bright)" }}>{entry.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)" }}>{entry.strategyType}</span>
                </div>
                {/* Sharpe bar */}
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(entry.sharpe / maxSharpe) * 100}%`, background: "linear-gradient(90deg, var(--gf-gold-dim), var(--gf-gold))" }} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold gf-gold-text">{entry.sharpe}</div>
                <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Sharpe</div>
              </div>
              <div className="text-right hidden md:block">
                <div className="font-semibold" style={{ color: "var(--gf-text-bright)" }}>{entry.winRate}%</div>
                <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Win Rate</div>
              </div>
              <div className="text-right hidden md:block">
                <div className="font-semibold" style={{ color: entry.totalPnl >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>${entry.totalPnl}</div>
                <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>P&L</div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="gf-panel p-12 text-center" style={{ color: "var(--gf-text-dim)" }}>
              Leaderboard wird befüllt sobald Strategien live laufen. Werde der Erste!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
