// src/components/terminal/PositionCard.tsx — MT-style position card with prominent trader signal
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
  const pnlBg = net > 0 ? "rgba(76,175,80,0.08)" : net < 0 ? "rgba(244,67,54,0.08)" : "transparent";

  return (
    <div className="flex" style={{ background: "#1c2030", borderBottom: "1px solid #252a3a" }}>
      {/* Left trader color bar */}
      <div className="w-1.5 shrink-0" style={{ background: pos.traderColor }} />

      <div className="flex-1 px-3 py-3">
        {/* Row 1: Trader Signal Badge + Symbol + P&L */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Trader origin badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{
              background: `${pos.traderColor}15`,
              border: `1px solid ${pos.traderColor}30`,
            }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: pos.traderColor, boxShadow: `0 0 6px ${pos.traderColor}60` }} />
              <span className="text-[9px] font-bold tracking-wider" style={{ color: pos.traderColor }}>
                {pos.trader}
              </span>
            </div>
            <span className="text-[14px] font-bold text-white">{pos.symbol}</span>
          </div>
          {/* P&L with background */}
          <div className="px-2.5 py-1 rounded-md" style={{ background: pnlBg }}>
            <span className="text-[15px] font-bold font-mono" style={{ color: pnlColor }}>
              {net >= 0 ? "+" : ""}{fmt(net)}
            </span>
          </div>
        </div>

        {/* Row 2: Direction + Volume + Prices */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{
              background: isBuy ? "rgba(33,150,243,0.12)" : "rgba(244,67,54,0.12)",
              color: dirColor,
            }}>
              {pos.type}
            </span>
            <span className="text-[10px] text-[#8a90a5] font-mono">{pos.volume} lot</span>
            <span className="text-[10px] text-[#3a3f52]">|</span>
            <span className="text-[10px] font-mono text-[#5d6588]">{pos.openPrice}</span>
            <span className="text-[10px] text-[#3a3f52]">{"\u2192"}</span>
            <span className="text-[10px] font-mono text-white font-semibold">{pos.currentPrice}</span>
          </div>
          <span className="text-[9px] text-[#5d6588] font-mono">{elapsed(pos.openTime)}</span>
        </div>

        {/* Row 3: SL/TP + Swap/Comm */}
        <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-[#5d6588]">
          {pos.sl !== null && pos.sl !== 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[#f44336]/50" />
              SL {pos.sl}
            </span>
          )}
          {pos.tp !== null && pos.tp !== 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[#4caf50]/50" />
              TP {pos.tp}
            </span>
          )}
          {pos.swap !== 0 && <span>Swap {fmt(pos.swap)}</span>}
          {pos.commission !== 0 && <span>Comm {fmt(pos.commission)}</span>}
        </div>
      </div>
    </div>
  );
}
