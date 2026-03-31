"use client";

import { motion } from "framer-motion";
import { MiniChart } from "@/components/ui/mini-chart";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface TraderCardProps {
  codename: string;
  asset: string;
  assetLabel: string;
  color: string;
  perf: string;
  wr: string;
  maxDd: string;
  since: string;
  active: boolean;
  todayProfit: number;
  ddBuffer: number;
  ddLimit: number;
  equityCurve: number[];
}

function getDdColor(buffer: number): string {
  if (buffer > 2) return "#22c55e";
  if (buffer > 1) return "#eab308";
  return "#ef4444";
}

export function TraderCard({
  codename, asset, assetLabel, color, perf, wr, maxDd, since,
  active, todayProfit, ddBuffer, ddLimit, equityCurve,
}: TraderCardProps) {
  const profitPositive = todayProfit >= 0;
  const ddCritical = ddBuffer < 1;
  const borderColor = ddCritical ? "#ef4444" : color;
  const ddColor = getDdColor(ddBuffer);
  const bufferPercent = Math.max(0, (ddBuffer / ddLimit) * 100);

  return (
    <motion.div
      className="gf-panel p-5 relative overflow-hidden"
      style={{ borderColor: `${borderColor}30` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ translateY: -2 }}
      transition={{ duration: 0.3 }}
    >
      {/* Radial glow in trader color */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, ${color}, transparent 60%)`,
        }}
      />
      {/* Left accent border */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: borderColor }}
      />

      <div className="relative z-10 pl-2">
        {/* Header: Codename + Status */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <span className="text-base font-bold font-mono tracking-wide" style={{ color }}>
              {codename}
            </span>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {asset} · {assetLabel}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: active ? "#22c55e" : "#52525b",
                boxShadow: active ? "0 0 6px #22c55e60" : "none",
              }}
            />
            <span className="text-[9px] font-medium uppercase" style={{ color: active ? "#22c55e" : "#52525b" }}>
              {active ? "Active" : "Paused"}
            </span>
          </div>
        </div>

        {/* Today Profit + Avg Performance */}
        <div className="flex items-baseline justify-between mt-3 mb-2">
          <div className="text-lg font-bold font-mono" style={{ color: profitPositive ? "#22c55e" : "#ef4444" }}>
            <AnimatedNumber value={todayProfit} prefix={profitPositive ? "+€" : "€"} decimals={2} />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">{perf}</span>
        </div>

        {/* Mini Equity Curve */}
        <div className="my-3">
          <MiniChart data={equityCurve} color={color} height={40} />
        </div>

        {/* DD Mini Bar */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] text-zinc-600 w-6">DD</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: ddColor }}
              initial={{ width: 0 }}
              animate={{ width: `${bufferPercent}%` }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
          <span className="text-[9px] font-mono w-10 text-right" style={{ color: ddColor }}>
            {ddBuffer.toFixed(1)}%
          </span>
        </div>

        {/* Stats Footer */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-500 border-t border-white/5 pt-2">
          <span>WR <strong className="text-zinc-300">{wr}</strong></span>
          <span className="text-zinc-700">·</span>
          <span>Max DD <strong className="text-zinc-300">{maxDd}</strong></span>
          <span className="text-zinc-700">·</span>
          <span>Seit <strong className="text-zinc-300">{since}</strong></span>
        </div>
      </div>
    </motion.div>
  );
}
