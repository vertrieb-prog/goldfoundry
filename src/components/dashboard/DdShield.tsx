"use client";

import { motion } from "framer-motion";

interface TraderDd {
  codename: string;
  color: string;
  ddUsed: number;
  ddBuffer: number;
}

interface DdShieldProps {
  ddBuffer: number;
  ddLimit: number;
  equityHigh: number;
  traders: TraderDd[];
}

function getDdColor(buffer: number): string {
  if (buffer > 2) return "#22c55e";
  if (buffer > 1) return "#eab308";
  return "#ef4444";
}

function DdBar({
  label,
  buffer,
  limit,
  color,
  barColor,
}: {
  label: string;
  buffer: number;
  limit: number;
  color: string;
  barColor: string;
}) {
  const bufferPercent = Math.max(0, Math.min(100, (buffer / limit) * 100));

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[10px] font-mono font-bold w-20 shrink-0"
        style={{ color }}
      >
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${bufferPercent}%` }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      <span
        className="text-xs font-mono font-medium w-12 text-right"
        style={{ color: barColor }}
      >
        {buffer.toFixed(1)}%
      </span>
    </div>
  );
}

export function DdShield({ ddBuffer, ddLimit, equityHigh, traders }: DdShieldProps) {
  const overallColor = getDdColor(ddBuffer);

  return (
    <div className="gf-panel p-5 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${overallColor}40, transparent 60%)`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{
                background: `${overallColor}15`,
                color: overallColor,
              }}
            >
              &#9769;
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              DD Shield
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-600 font-mono">
              Max DD: {ddLimit}% · Peak: €{equityHigh.toLocaleString("de-DE")}
            </span>
          </div>
        </div>

        {/* Main Buffer Bar */}
        <DdBar
          label="GESAMT"
          buffer={ddBuffer}
          limit={ddLimit}
          color="#fafafa"
          barColor={overallColor}
        />

        {/* Separator */}
        <div className="h-px bg-white/5 my-3" />

        {/* Per-Trader Breakdown */}
        <div className="flex flex-col gap-2">
          {traders.map((t) => (
            <DdBar
              key={t.codename}
              label={t.codename}
              buffer={t.ddBuffer}
              limit={ddLimit}
              color={t.color}
              barColor={getDdColor(t.ddBuffer)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
