// src/components/terminal/PositionCard.tsx — MT-style position card
"use client";

interface Props {
  symbol: string;
  type: "BUY" | "SELL";
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
  sl: number | null;
  tp: number | null;
  trader: string;
  traderColor: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function elapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function PositionCard(pos: Props) {
  const isBuy = pos.type === "BUY";
  const net = pos.profit + pos.swap + pos.commission;
  const pnlColor = net > 0 ? "#4caf50" : net < 0 ? "#f44336" : "#9e9e9e";
  const dirColor = isBuy ? "#2196f3" : "#f44336";

  return (
    <div className="flex" style={{ background: "#1c2030", borderBottom: "1px solid #252a3a" }}>
      {/* Left color bar — MT signature */}
      <div className="w-1 shrink-0" style={{ background: dirColor }} />

      <div className="flex-1 px-3 py-2.5">
        {/* Row 1: Symbol + Direction + Volume | P&L */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white">{pos.symbol}</span>
            <span className="text-[10px] font-bold" style={{ color: dirColor }}>
              {pos.type}
            </span>
            <span className="text-[10px] text-[#5d6588]">{pos.volume} lot</span>
          </div>
          <span className="text-[14px] font-bold font-mono" style={{ color: pnlColor }}>
            {net >= 0 ? "+" : ""}{fmt(net)}
          </span>
        </div>

        {/* Row 2: Open/Current price grid */}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span className="text-[#5d6588]">open</span>
            <span className="text-[#8a90a5]">{pos.openPrice}</span>
            <span className="text-[#3a3f52] mx-1">{"\u2794"}</span>
            <span className="text-white font-semibold">{pos.currentPrice}</span>
          </div>
          <span className="text-[9px] text-[#5d6588] font-mono">{elapsed(pos.openTime)}</span>
        </div>

        {/* Row 3: SL/TP + Swap/Comm + Trader */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-[9px] font-mono text-[#5d6588]">
            {pos.sl !== null && pos.sl !== 0 && (
              <span>SL <span className="text-[#f44336]/70">{pos.sl}</span></span>
            )}
            {pos.tp !== null && pos.tp !== 0 && (
              <span>TP <span className="text-[#4caf50]/70">{pos.tp}</span></span>
            )}
            {pos.swap !== 0 && <span>sw {fmt(pos.swap)}</span>}
            {pos.commission !== 0 && <span>cm {fmt(pos.commission)}</span>}
          </div>
          <span
            className="text-[8px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${pos.traderColor}18`, color: pos.traderColor }}
          >
            {pos.trader}
          </span>
        </div>
      </div>
    </div>
  );
}
