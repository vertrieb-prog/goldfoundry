"use client";

import { useState, useMemo } from "react";
import { MiniChart } from "@/components/ui/mini-chart";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface DataPoint {
  date: string;
  equity: number;
}

interface EquityCurveProps {
  datapoints: DataPoint[];
  periodChange: number;
  periodPnl: number;
  currentEquity: number;
}

export function EquityCurve({ datapoints, periodChange, periodPnl, currentEquity }: EquityCurveProps) {
  const [period, setPeriod] = useState<"7" | "30" | "90" | "all">("30");

  const filtered = useMemo(() => {
    if (period === "all") return datapoints;
    const days = parseInt(period);
    return datapoints.slice(-days);
  }, [datapoints, period]);

  const values = filtered.map((d) => d.equity);
  const isPositive = periodPnl >= 0;

  return (
    <div className="gf-panel p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Portfolio Equity
        </span>
        <div className="flex gap-1">
          {(["7", "30", "90", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[9px] px-2 py-0.5 rounded font-mono transition-colors ${
                period === p
                  ? "bg-[#d4a537]/15 text-[#d4a537]"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {p === "all" ? "All" : `${p}T`}
            </button>
          ))}
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-3">
        <div className="text-xl font-bold font-mono text-[#fafafa]">
          <AnimatedNumber value={currentEquity} prefix="€" decimals={0} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-mono" style={{ color: isPositive ? "#22c55e" : "#ef4444" }}>
            {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}€{periodPnl.toFixed(0)} ({isPositive ? "+" : ""}{periodChange.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[120px]">
        <MiniChart data={values} color="#d4a537" height={120} showGradient />
      </div>

      {/* X-Axis Labels */}
      {filtered.length > 0 && (
        <div className="flex justify-between mt-1 text-[9px] font-mono text-zinc-600">
          <span>{new Date(filtered[0].date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}</span>
          {filtered.length > 2 && (
            <span>{new Date(filtered[Math.floor(filtered.length / 2)].date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}</span>
          )}
          <span>{new Date(filtered[filtered.length - 1].date).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}</span>
        </div>
      )}
    </div>
  );
}
