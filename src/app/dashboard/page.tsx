"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { KpiHeroBar } from "@/components/dashboard/KpiHeroBar";
import { TraderGrid } from "@/components/dashboard/TraderGrid";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { EquityCurve } from "@/components/dashboard/EquityCurve";

interface DashboardData {
  kpis: {
    totalEquity: number;
    totalBalance: number;
    equityChange: number;
    todayPnl: number;
    todayTrades: number;
    ddBuffer: number;
    ddLimit: number;
    equityHigh: number;
  };
  traders: {
    codename: string;
    asset: string;
    assetLabel: string;
    color: string;
    active: boolean;
    todayProfit: number;
    equity: number;
    balance: number;
    ddUsed: number;
    ddBuffer: number;
  }[];
  recentTrades: {
    direction: "BUY" | "SELL";
    symbol: string;
    pnl: number;
    trader: string;
    traderColor: string;
    time: string;
    lots: number;
  }[];
  equityCurve: {
    datapoints: { date: string; equity: number }[];
    periodChange: number;
    periodPnl: number;
  };
  lastUpdated: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard/overview");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4a537]/30 border-t-[#d4a537] rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-mono">Lade Command Center...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="gf-panel p-8 text-center max-w-sm">
          <div className="text-2xl mb-2">⚠</div>
          <div className="text-sm text-zinc-400 mb-1">Daten konnten nicht geladen werden</div>
          <div className="text-[10px] text-zinc-600 font-mono mb-4">{error}</div>
          <button
            onClick={() => { setLoading(true); fetchDashboard(); }}
            className="text-xs px-4 py-2 rounded-lg bg-[#d4a537]/10 text-[#d4a537] hover:bg-[#d4a537]/20 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#fafafa]">Command Center</h1>
          <p className="text-[10px] text-zinc-600 font-mono">
            Zuletzt aktualisiert: {new Date(data.lastUpdated).toLocaleTimeString("de-DE")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#22c55e] animate-ping opacity-40" />
          </div>
          <span className="text-[10px] font-mono text-[#22c55e]">LIVE</span>
        </div>
      </div>

      {/* Sektion 1: KPI Hero Bar */}
      <KpiHeroBar
        kpis={data.kpis}
        traders={data.traders.map((t) => ({
          codename: t.codename,
          color: t.color,
          ddUsed: t.ddUsed,
          ddBuffer: t.ddBuffer,
        }))}
      />

      {/* Sektion 2: Trader Grid */}
      <TraderGrid traders={data.traders} ddLimit={data.kpis.ddLimit} />

      {/* Sektion 3: Trades + Equity Curve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RecentTrades trades={data.recentTrades} />
        <EquityCurve
          datapoints={data.equityCurve.datapoints}
          periodChange={data.equityCurve.periodChange}
          periodPnl={data.equityCurve.periodPnl}
          currentEquity={data.kpis.totalEquity}
        />
      </div>
    </div>
  );
}
