"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface Trade {
  direction: "BUY" | "SELL";
  symbol: string;
  pnl: number;
  trader: string;
  traderColor: string;
  time: string;
  lots: number;
}

interface RecentTradesProps {
  trades: Trade[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  const [limit, setLimit] = useState(10);
  const visible = trades.slice(0, limit);

  return (
    <div className="gf-panel p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Letzte Trades
        </span>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-zinc-400"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      {/* Trade List */}
      <div className="flex-1 overflow-auto space-y-1">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-zinc-600">
            Noch keine Trades heute
          </div>
        ) : (
          visible.map((trade, i) => (
            <motion.div
              key={`${trade.time}-${i}`}
              className="flex items-center gap-3 py-1.5 border-b border-white/[0.03] last:border-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Direction Badge */}
              <span
                className="text-[9px] font-bold font-mono w-8 text-center py-0.5 rounded"
                style={{
                  background: trade.direction === "BUY" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  color: trade.direction === "BUY" ? "#22c55e" : "#ef4444",
                }}
              >
                {trade.direction}
              </span>

              {/* Symbol */}
              <span className="text-xs font-mono font-medium text-zinc-200 w-16">
                {trade.symbol}
              </span>

              {/* P&L */}
              <span
                className="text-xs font-mono font-bold flex-1 text-right"
                style={{ color: trade.pnl >= 0 ? "#22c55e" : "#ef4444" }}
              >
                {trade.pnl >= 0 ? "+" : ""}€{trade.pnl.toFixed(2)}
              </span>

              {/* Trader + Time */}
              <div className="text-right w-24">
                <div className="flex items-center justify-end gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: trade.traderColor }} />
                  <span className="text-[9px] font-mono" style={{ color: trade.traderColor }}>
                    {trade.trader}
                  </span>
                </div>
                <span className="text-[9px] text-zinc-600 font-mono">
                  {new Date(trade.time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} · {trade.lots}L
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
