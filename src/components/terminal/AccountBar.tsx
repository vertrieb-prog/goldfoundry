// src/components/terminal/AccountBar.tsx — MT-style account summary strip
"use client";

interface Props {
  balance: number;
  equity: number;
  floatingPnl: number;
  margin: number;
  freeMargin: number;
  accounts: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AccountBar({ balance, equity, floatingPnl, margin, freeMargin, accounts }: Props) {
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;
  const pnlColor = floatingPnl > 0 ? "#4caf50" : floatingPnl < 0 ? "#f44336" : "#9e9e9e";

  return (
    <div style={{ background: "#1c2030" }}>
      {/* Top status line */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#151929", borderBottom: "1px solid #252a3a" }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4caf50]" />
          <span className="text-[10px] font-medium text-[#4caf50]">Connected</span>
          <span className="text-[10px] text-[#5d6588]">{accounts} accounts</span>
        </div>
        <span className="text-[10px] text-[#5d6588] font-mono">Gold Foundry Terminal</span>
      </div>

      {/* Main metrics grid — 2 rows like MT app */}
      <div className="grid grid-cols-3 px-3 py-2.5 gap-y-2" style={{ borderBottom: "1px solid #252a3a" }}>
        <Metric label="Balance" value={fmt(balance)} />
        <Metric label="Equity" value={fmt(equity)} />
        <Metric label="Margin" value={fmt(margin)} />
        <Metric label="Free Margin" value={fmt(freeMargin)} />
        <Metric label="Margin Level" value={marginLevel > 0 ? `${marginLevel.toFixed(0)}%` : "\u2014"} />
        <div>
          <div className="text-[9px] text-[#5d6588] leading-none">Profit</div>
          <div className="text-xs font-bold font-mono mt-0.5" style={{ color: pnlColor }}>
            {floatingPnl >= 0 ? "+" : ""}{fmt(floatingPnl)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] text-[#5d6588] leading-none">{label}</div>
      <div className="text-xs font-medium font-mono text-[#c8cdd8] mt-0.5">{value}</div>
    </div>
  );
}
