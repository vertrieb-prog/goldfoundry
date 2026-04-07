// src/components/terminal/AccountBar.tsx — MT-style account bar with trader breakdown
"use client";

interface TraderSummary {
  name: string;
  color: string;
  positions: number;
  pnl: number;
}

interface Props {
  balance: number;
  equity: number;
  floatingPnl: number;
  margin: number;
  freeMargin: number;
  accounts: number;
  traders: TraderSummary[];
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AccountBar({ balance, equity, floatingPnl, margin, freeMargin, accounts, traders }: Props) {
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;
  const pnlColor = floatingPnl > 0 ? "#4caf50" : floatingPnl < 0 ? "#f44336" : "#9e9e9e";

  return (
    <div style={{ background: "#1c2030" }}>
      {/* Top status */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#151929", borderBottom: "1px solid #252a3a" }}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-[#4caf50]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#4caf50] animate-ping opacity-30" />
          </div>
          <span className="text-[10px] font-semibold text-[#4caf50]">LIVE</span>
          <span className="text-[10px] text-[#5d6588]">{accounts} Accounts verbunden</span>
        </div>
        <span className="text-[10px] text-[#5d6588] font-mono">Gold Foundry Terminal</span>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-3 px-3 py-2.5 gap-y-2" style={{ borderBottom: "1px solid #252a3a" }}>
        <Metric label="Balance" value={`$${fmt(balance)}`} />
        <Metric label="Equity" value={`$${fmt(equity)}`} />
        <Metric label="Margin" value={`$${fmt(margin)}`} />
        <Metric label="Free Margin" value={`$${fmt(freeMargin)}`} />
        <Metric label="Margin Level" value={marginLevel > 0 ? `${marginLevel.toFixed(0)}%` : "\u2014"} />
        <div>
          <div className="text-[9px] text-[#5d6588] leading-none">Profit</div>
          <div className="text-[13px] font-bold font-mono mt-0.5" style={{ color: pnlColor }}>
            {floatingPnl >= 0 ? "+" : ""}${fmt(floatingPnl)}
          </div>
        </div>
      </div>

      {/* Trader breakdown strip */}
      {traders.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: "1px solid #252a3a", background: "#181c2a" }}>
          <span className="text-[8px] text-[#5d6588] uppercase tracking-wider shrink-0 mr-1">Signals:</span>
          {traders.map((t) => {
            const pColor = t.pnl > 0 ? "#4caf50" : t.pnl < 0 ? "#f44336" : "#5d6588";
            return (
              <div key={t.name} className="flex items-center gap-1.5 px-2 py-1 rounded shrink-0" style={{
                background: `${t.color}10`,
                border: `1px solid ${t.color}25`,
              }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.color }} />
                <span className="text-[9px] font-bold" style={{ color: t.color }}>{t.name}</span>
                <span className="text-[9px] font-mono" style={{ color: "#5d6588" }}>{t.positions}</span>
                <span className="text-[9px] font-bold font-mono" style={{ color: pColor }}>
                  {t.pnl >= 0 ? "+" : ""}{fmt(t.pnl)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] text-[#5d6588] leading-none">{label}</div>
      <div className="text-[12px] font-semibold font-mono text-[#c8cdd8] mt-0.5">{value}</div>
    </div>
  );
}
