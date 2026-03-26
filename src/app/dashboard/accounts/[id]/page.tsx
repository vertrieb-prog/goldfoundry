"use client";
// src/app/dashboard/accounts/[id]/page.tsx — MyFXBook-style Account Detail
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatCard, PositionsTable, EquityCurve, SignalHistory, TradeHistory } from "./components";

interface AccountData {
  account: any;
  positions: any[];
  trades: any[];
  signals: any[];
  stats: {
    totalTrades: number; winRate: number; totalProfit: number;
    avgWin: number; avgLoss: number; profitFactor: number;
    bestTrade: number; worstTrade: number; maxDrawdown: number;
  };
  metaInfo: any;
}

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/accounts/${id}`)
      .then(r => { if (!r.ok) throw new Error("Konto nicht gefunden"); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
    </div>
  );

  if (error || !data) return (
    <div className="text-center py-20">
      <p className="text-sm mb-4" style={{ color: "var(--gf-red)" }}>{error || "Fehler beim Laden"}</p>
      <Link href="/dashboard/accounts" className="gf-btn text-sm !py-2 !px-5">Zurueck</Link>
    </div>
  );

  const { account: a, positions, trades, signals, stats, metaInfo } = data;
  const equity = metaInfo?.equity ?? a.current_equity ?? 0;
  const balance = metaInfo?.balance ?? a.initial_balance ?? 0;
  const gain = a.initial_balance > 0 ? ((equity - a.initial_balance) / a.initial_balance * 100) : 0;

  return (
    <div>
      {/* Back + Header */}
      <Link href="/dashboard/accounts" className="inline-flex items-center gap-1.5 text-xs mb-5 hover:opacity-80 transition-opacity" style={{ color: "var(--gf-gold)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        Alle Konten
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>
            {a.account_name || `#${a.mt_login}`}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: "var(--gf-text-dim)" }}>{a.broker_server}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "var(--gf-text-dim)" }}>
              {a.platform?.toUpperCase() || "MT4"} #{a.mt_login}
            </span>
            {a.linked_channel && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.15)" }}>
                {a.linked_channel}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold mono" style={{ color: gain >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
            {gain >= 0 ? "+" : ""}{gain.toFixed(2)}%
          </div>
          <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Gesamt-Performance</div>
        </div>
      </div>

      {/* Row 1 — Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Equity" value={`$${Number(equity).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`} />
        <StatCard label="Balance" value={`$${Number(balance).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`} />
        <StatCard label="Profit" value={`${stats.totalProfit >= 0 ? "+" : ""}$${Number(stats.totalProfit).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`}
          color={stats.totalProfit >= 0 ? "var(--gf-green)" : "var(--gf-red)"} />
        <StatCard label="Win Rate" value={`${Number(stats.winRate).toFixed(1)}%`}
          color={stats.winRate >= 50 ? "var(--gf-green)" : "var(--gf-red)"} />
        <StatCard label="Trades" value={String(stats.totalTrades)} />
        <StatCard label="Max Drawdown" value={`${stats.maxDrawdown.toFixed(2)}%`}
          color={stats.maxDrawdown > 20 ? "var(--gf-red)" : "var(--gf-text-bright)"} />
      </div>

      {/* Row 1b — Advanced Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Avg Win" value={`$${stats.avgWin.toFixed(2)}`} color="var(--gf-green)" />
        <StatCard label="Avg Loss" value={`$${stats.avgLoss.toFixed(2)}`} color="var(--gf-red)" />
        <StatCard label="Profit Factor" value={String(stats.profitFactor)} color={stats.profitFactor >= 1.5 ? "var(--gf-green)" : "var(--gf-text-bright)"} />
        <StatCard label="Best / Worst" value={`$${stats.bestTrade.toFixed(0)} / $${stats.worstTrade.toFixed(0)}`} />
      </div>

      {/* Row 2 — Open Positions */}
      <SectionTitle title="Offene Positionen" count={positions.length} />
      <div className="mb-6"><PositionsTable positions={positions} /></div>

      {/* Row 3 — Equity Curve */}
      <SectionTitle title="Equity-Kurve (letzte 30 Tage)" />
      <div className="mb-6"><EquityCurve trades={trades} /></div>

      {/* Row 4 — Signal History */}
      {signals.length > 0 && (
        <>
          <SectionTitle title="Signal-Historie" count={signals.length} />
          <div className="mb-6"><SignalHistory signals={signals} /></div>
        </>
      )}

      {/* Row 5 — Trade History */}
      <SectionTitle title="Trade-Historie" count={trades.length} />
      <div className="mb-6"><TradeHistory trades={trades} /></div>
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-sm font-semibold" style={{ color: "var(--gf-text-bright)" }}>{title}</h2>
      {count !== undefined && (
        <span className="text-[10px] px-2 py-0.5 rounded-full mono" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)" }}>{count}</span>
      )}
    </div>
  );
}
