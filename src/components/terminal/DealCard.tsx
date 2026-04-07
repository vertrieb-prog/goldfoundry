// src/components/terminal/DealCard.tsx — MT-style closed deal row
"use client";

interface Props {
  symbol: string;
  type: "BUY" | "SELL";
  volume: number;
  profit: number;
  swap: number;
  commission: number;
  closeTime: string;
  trader: string;
  traderColor: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export function DealCard(deal: Props) {
  const isBuy = deal.type === "BUY";
  const net = deal.profit + deal.swap + deal.commission;
  const pnlColor = net > 0 ? "#4caf50" : net < 0 ? "#f44336" : "#9e9e9e";
  const dirColor = isBuy ? "#2196f3" : "#f44336";

  return (
    <div className="flex" style={{ background: "#1c2030", borderBottom: "1px solid #252a3a" }}>
      <div className="w-1 shrink-0" style={{ background: dirColor, opacity: 0.5 }} />
      <div className="flex-1 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-[#c8cdd8]">{deal.symbol}</span>
            <span className="text-[10px] font-bold" style={{ color: dirColor, opacity: 0.7 }}>
              {deal.type}
            </span>
            <span className="text-[10px] text-[#5d6588]">{deal.volume} lot</span>
          </div>
          <span className="text-[13px] font-bold font-mono" style={{ color: pnlColor }}>
            {net >= 0 ? "+" : ""}{fmt(net)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] font-mono text-[#5d6588]">{fmtDate(deal.closeTime)}</span>
          <div className="flex items-center gap-2">
            {(deal.swap !== 0 || deal.commission !== 0) && (
              <span className="text-[9px] font-mono text-[#5d6588]">
                net: {fmt(net)} (p:{fmt(deal.profit)} s:{fmt(deal.swap)} c:{fmt(deal.commission)})
              </span>
            )}
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${deal.traderColor}18`, color: deal.traderColor }}
            >
              {deal.trader}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
