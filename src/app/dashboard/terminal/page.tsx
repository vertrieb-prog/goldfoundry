"use client";

import { useEffect, useState } from "react";

type Tab = "positions" | "history";

interface Position {
  id: string;
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

interface Deal {
  id: string;
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

interface Summary {
  equity: number;
  balance: number;
  floatingPnl: number;
  openCount: number;
  accounts: number;
}

function fmt(n: number) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function PnlText({ value }: { value: number }) {
  const color = value > 0 ? "#22c55e" : value < 0 ? "#ef4444" : "#71717a";
  return (
    <span className="font-bold font-mono" style={{ color }}>
      {value > 0 ? "+" : ""}{fmt(value)}
    </span>
  );
}

function PositionRow({ pos }: { pos: Position }) {
  const net = pos.profit + pos.swap + pos.commission;
  return (
    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Row 1: Symbol + P&L */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{
              background: pos.type === "BUY" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: pos.type === "BUY" ? "#22c55e" : "#ef4444",
            }}
          >
            {pos.type}
          </span>
          <span className="text-sm font-bold text-white">{pos.symbol}</span>
          <span className="text-[10px] text-zinc-600">{pos.volume}</span>
        </div>
        <PnlText value={net} />
      </div>
      {/* Row 2: Prices + Trader */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500">
          <span>{pos.openPrice}</span>
          <span className="text-zinc-700">{"\u2192"}</span>
          <span className="text-zinc-300">{pos.currentPrice}</span>
        </div>
        <div className="flex items-center gap-2">
          {pos.sl && <span className="text-[9px] text-red-500/60">SL {pos.sl}</span>}
          {pos.tp && <span className="text-[9px] text-green-500/60">TP {pos.tp}</span>}
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: `${pos.traderColor}15`, color: pos.traderColor }}
          >
            {pos.trader}
          </span>
        </div>
      </div>
      {/* Row 3: Swap + Commission if nonzero */}
      {(pos.swap !== 0 || pos.commission !== 0) && (
        <div className="flex gap-3 mt-1 text-[9px] text-zinc-600">
          {pos.swap !== 0 && <span>Swap: {fmt(pos.swap)}</span>}
          {pos.commission !== 0 && <span>Comm: {fmt(pos.commission)}</span>}
        </div>
      )}
    </div>
  );
}

function DealRow({ deal }: { deal: Deal }) {
  const net = deal.profit + deal.swap + deal.commission;
  return (
    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{
              background: deal.type === "BUY" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: deal.type === "BUY" ? "#22c55e" : "#ef4444",
            }}
          >
            {deal.type}
          </span>
          <span className="text-sm font-bold text-white">{deal.symbol}</span>
          <span className="text-[10px] text-zinc-600">{deal.volume}</span>
        </div>
        <PnlText value={net} />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] font-mono text-zinc-600">{fmtTime(deal.closeTime)}</span>
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: `${deal.traderColor}15`, color: deal.traderColor }}
        >
          {deal.trader}
        </span>
      </div>
    </div>
  );
}

export default function TerminalPage() {
  const [tab, setTab] = useState<Tab>("positions");
  const [data, setData] = useState<{
    summary: Summary;
    positions: Position[];
    history: Deal[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/trades/live");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4a537]/30 border-t-[#d4a537] rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-mono">Lade Terminal...</span>
        </div>
      </div>
    );
  }

  const s = data?.summary;
  const positions = data?.positions ?? [];
  const history = data?.history ?? [];
  const margin = s ? s.equity - s.balance : 0;

  return (
    <div className="flex flex-col gap-0 max-w-2xl mx-auto">
      {/* Account Bar */}
      <div className="p-4 rounded-t-xl" style={{ background: "linear-gradient(135deg, #1a1a1a, #111)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#22c55e] animate-ping opacity-40" />
            </div>
            <span className="text-[10px] font-mono text-[#22c55e]">LIVE</span>
            <span className="text-[10px] text-zinc-600">{s?.accounts ?? 0} Accounts</span>
          </div>
          <span className="text-[10px] text-zinc-600 font-mono">Auto-Refresh 15s</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Balance</div>
            <div className="text-lg font-bold text-white font-mono">${fmt(s?.balance ?? 0)}</div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Equity</div>
            <div className="text-lg font-bold text-white font-mono">${fmt(s?.equity ?? 0)}</div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Floating P&L</div>
            <div className="text-lg font-bold font-mono" style={{
              color: (s?.floatingPnl ?? 0) >= 0 ? "#22c55e" : "#ef4444",
            }}>
              {(s?.floatingPnl ?? 0) >= 0 ? "+" : ""}${fmt(s?.floatingPnl ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex" style={{ background: "#0f0f0f" }}>
        {([
          { key: "positions" as Tab, label: `Positionen (${positions.length})` },
          { key: "history" as Tab, label: `History (${history.length})` },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-3 text-xs font-semibold transition-colors"
            style={{
              color: tab === t.key ? "#d4a537" : "#52525b",
              borderBottom: tab === t.key ? "2px solid #d4a537" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-b-xl overflow-hidden" style={{ background: "#0a0a0a" }}>
        {tab === "positions" && (
          positions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-zinc-600">Keine offenen Positionen</div>
            </div>
          ) : (
            <>
              {positions.map((pos) => (
                <PositionRow key={pos.id} pos={pos} />
              ))}
              {/* Floating P&L Summary */}
              <div className="px-4 py-3 flex justify-between" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                  {positions.length} Position{positions.length !== 1 ? "en" : ""}
                </span>
                <PnlText value={positions.reduce((s, p) => s + p.profit + p.swap + p.commission, 0)} />
              </div>
            </>
          )
        )}

        {tab === "history" && (
          history.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm text-zinc-600">Keine Trades in den letzten 7 Tagen</div>
            </div>
          ) : (
            <>
              {history.map((deal) => (
                <DealRow key={deal.id} deal={deal} />
              ))}
              {/* History Summary */}
              <div className="px-4 py-3 flex justify-between" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                  {history.length} Trades (7 Tage)
                </span>
                <PnlText value={history.reduce((s, d) => s + d.profit + d.swap + d.commission, 0)} />
              </div>
            </>
          )
        )}
      </div>

      {/* Risikohinweis */}
      <div className="mt-4 text-[9px] text-zinc-700 text-center px-4">
        Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden
        und kann zum Verlust des eingesetzten Kapitals fuehren.
      </div>
    </div>
  );
}
