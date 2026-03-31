"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { DdShield } from "@/components/dashboard/DdShield";

interface KpiData {
  totalEquity: number;
  equityChange: number;
  todayPnl: number;
  todayTrades: number;
  ddBuffer: number;
  ddLimit: number;
  equityHigh: number;
}

interface TraderDd {
  codename: string;
  color: string;
  ddUsed: number;
  ddBuffer: number;
}

interface KpiHeroBarProps {
  kpis: KpiData;
  traders: TraderDd[];
  isDemo?: boolean;
}

export function KpiHeroBar({ kpis, traders, isDemo = true }: KpiHeroBarProps) {
  const pnlPositive = kpis.todayPnl >= 0;
  const equityPositive = kpis.equityChange >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-3">
      {/* Card 1: Total Equity */}
      <motion.div
        className="gf-panel p-5 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {equityPositive && (
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, #d4a537 0%, transparent 60%)",
            }}
          />
        )}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Equity
            </span>
            {isDemo && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                DEMO
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono text-[#fafafa]">
            <AnimatedNumber value={kpis.totalEquity} prefix="€" decimals={0} />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span
              className="text-xs font-mono"
              style={{ color: equityPositive ? "#22c55e" : "#ef4444" }}
            >
              {equityPositive ? "▲" : "▼"} {equityPositive ? "+" : ""}
              {kpis.equityChange.toFixed(1)}%
            </span>
            <span className="text-[10px] text-zinc-600">heute</span>
          </div>
        </div>
      </motion.div>

      {/* Card 2: Today P&L */}
      <motion.div
        className="gf-panel p-5 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${pnlPositive ? "#22c55e" : "#ef4444"}40, transparent 60%)`,
          }}
        />
        <div className="relative z-10">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Heute P&amp;L
          </span>
          <div
            className="text-2xl font-bold font-mono mt-1"
            style={{ color: pnlPositive ? "#22c55e" : "#ef4444" }}
          >
            <AnimatedNumber
              value={kpis.todayPnl}
              prefix={pnlPositive ? "+€" : "€"}
              decimals={0}
            />
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-zinc-500">
              {kpis.todayTrades} Trades
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 3: DD Shield (doppelt breit) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <DdShield
          ddBuffer={kpis.ddBuffer}
          ddLimit={kpis.ddLimit}
          equityHigh={kpis.equityHigh}
          traders={traders}
        />
      </motion.div>
    </div>
  );
}
