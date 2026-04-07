// src/app/dashboard/terminal/page.tsx — MetaTrader-style live terminal
"use client";

import { useEffect, useState, useCallback } from "react";
import { AccountBar } from "@/components/terminal/AccountBar";
import { PositionCard } from "@/components/terminal/PositionCard";
import { DealCard } from "@/components/terminal/DealCard";

type Tab = "trade" | "history";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TerminalPage() {
  const [tab, setTab] = useState<Tab>("trade");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/trades/live");
      if (!res.ok) throw new Error();
      setData(await res.json());
      setLastUpdate(new Date());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]" style={{ background: "#151929" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#2196f3]/30 border-t-[#2196f3] rounded-full animate-spin" />
          <span className="text-[11px] text-[#5d6588] font-mono">Connecting to servers...</span>
        </div>
      </div>
    );
  }

  const s = data?.summary ?? { balance: 0, equity: 0, floatingPnl: 0, openCount: 0, accounts: 0 };
  const positions = data?.positions ?? [];
  const history = data?.history ?? [];
  const margin = positions.length > 0 ? Math.abs(s.equity - s.balance - s.floatingPnl) : 0;
  const freeMargin = s.equity - margin;
  const totalFloating = positions.reduce(
    (sum: number, p: any) => sum + p.profit + p.swap + p.commission, 0
  );
  const pnlColor = totalFloating > 0 ? "#4caf50" : totalFloating < 0 ? "#f44336" : "#9e9e9e";

  return (
    <div className="flex flex-col max-w-2xl mx-auto rounded-xl overflow-hidden" style={{
      background: "#151929",
      boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      minHeight: "70vh",
    }}>
      {/* Account metrics bar */}
      <AccountBar
        balance={s.balance}
        equity={s.equity}
        floatingPnl={s.floatingPnl}
        margin={margin}
        freeMargin={freeMargin}
        accounts={s.accounts}
      />

      {/* MT-style tab bar */}
      <div className="flex" style={{ background: "#1c2030", borderBottom: "1px solid #252a3a" }}>
        {([
          { key: "trade" as Tab, label: "Trade", count: positions.length },
          { key: "history" as Tab, label: "History", count: history.length },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2.5 text-[11px] font-semibold tracking-wide uppercase transition-colors relative"
            style={{ color: tab === t.key ? "#2196f3" : "#5d6588" }}
          >
            {t.label} ({t.count})
            {tab === t.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "#2196f3" }} />
            )}
          </button>
        ))}
      </div>

      {/* Positions list */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(70vh - 180px)" }}>
        {tab === "trade" && (
          positions.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-[40px] opacity-20 mb-3">$</div>
              <div className="text-[12px] text-[#5d6588]">No open positions</div>
              <div className="text-[10px] text-[#3a3f52] mt-1">Market is closed or no active trades</div>
            </div>
          ) : (
            positions.map((pos: any) => <PositionCard key={pos.id} {...pos} />)
          )
        )}

        {tab === "history" && (
          history.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-[40px] opacity-20 mb-3">H</div>
              <div className="text-[12px] text-[#5d6588]">No recent deals</div>
              <div className="text-[10px] text-[#3a3f52] mt-1">Last 7 days trade history</div>
            </div>
          ) : (
            history.map((deal: any) => <DealCard key={deal.id} {...deal} />)
          )
        )}
      </div>

      {/* Bottom P&L bar — sticky like MT */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{
        background: "#1c2030",
        borderTop: "1px solid #252a3a",
      }}>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-[#5d6588] uppercase">Floating P/L</span>
          {lastUpdate && (
            <span className="text-[8px] text-[#3a3f52] font-mono">
              {lastUpdate.toLocaleTimeString("de-DE")}
            </span>
          )}
        </div>
        <span className="text-[16px] font-bold font-mono" style={{ color: pnlColor }}>
          {totalFloating >= 0 ? "+" : ""}${fmt(totalFloating)}
        </span>
      </div>

      {/* Risikohinweis */}
      <div className="px-3 py-2 text-[8px] text-[#3a3f52] text-center" style={{ background: "#151929" }}>
        Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden
        und kann zum Verlust des eingesetzten Kapitals fuehren.
      </div>
    </div>
  );
}
