// src/components/landing/LiveTerminal.tsx — Full-width live terminal for LP
"use client";

import { useEffect, useState } from "react";

type Range = "24h" | "72h" | "7d" | "all";

function fmt(n: number) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}
function elapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function LiveTerminal() {
  const [range, setRange] = useState<Range>("24h");
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const load = () => {
      fetch(`/api/trades/live?range=${range}`).then(r => r.json()).then(setData).catch(() => {});
      fetch("/api/lp/stats").then(r => r.json()).then(setStats).catch(() => {});
    };
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [range]);

  if (!data?.summary) return null;

  const s = data.summary;
  const positions = data.positions ?? [];
  const history = data.history ?? [];
  const accs = stats?.accounts ?? [];
  const floatPnl = positions.reduce((sum: number, p: any) => sum + p.profit + (p.swap ?? 0) + (p.commission ?? 0), 0);
  const histPnl = history.reduce((sum: number, d: any) => sum + d.profit + (d.swap ?? 0) + (d.commission ?? 0), 0);
  const histWins = history.filter((d: any) => d.profit > 0).length;
  const histWr = stats?.winrate ?? (history.length > 0 ? Math.round((histWins / history.length) * 100) : 0);

  return (
    <section style={{ padding: "80px 20px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "#6d6045", marginBottom: 8 }}>
          Live Trading Terminal
        </div>
        <h3 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
          Echte Trades. <span style={{ color: "#d4a537" }}>Jetzt gerade.</span>
        </h3>
        <p style={{ color: "#52525b", fontSize: 13, maxWidth: 500, margin: "0 auto" }}>
          {s.accounts} Master-Trader. {positions.length} offene Positionen. Alles live vom Broker.
        </p>
      </div>

      {/* Main terminal grid: Positions | Stats | History */}
      <div className="terminal-grid" style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #252a3a", boxShadow: "0 12px 60px rgba(0,0,0,0.5)" }}>
        <style>{`.terminal-grid{display:grid;grid-template-columns:1fr}@media(min-width:768px){.terminal-grid{grid-template-columns:1fr 220px 1fr}}`}</style>

        {/* LEFT: Live Positions */}
        <div style={{ background: "#151929", minHeight: 400 }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#1c2030", borderBottom: "1px solid #252a3a" }}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-[#4caf50]" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#4caf50] animate-ping opacity-30" />
              </div>
              <span className="text-[10px] font-bold text-[#4caf50]">LIVE TRADES</span>
            </div>
            <span className="text-[10px] text-[#5d6588]">{positions.length} offen</span>
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {positions.length === 0 ? (
              <div className="py-16 text-center text-[11px] text-[#5d6588]">Keine offenen Positionen</div>
            ) : positions.map((pos: any, i: number) => (
              <PosRow key={pos.id ?? i} pos={pos} />
            ))}
          </div>
          {/* Float P&L */}
          <div className="flex justify-between items-center px-4 py-2" style={{ background: "#1c2030", borderTop: "1px solid #252a3a" }}>
            <span className="text-[9px] text-[#5d6588] uppercase">Float P/L</span>
            <span className="text-[14px] font-bold font-mono" style={{ color: floatPnl >= 0 ? "#4caf50" : "#f44336" }}>
              {floatPnl >= 0 ? "+" : ""}{fmt(floatPnl)}€
            </span>
          </div>
        </div>

        {/* CENTER: Account Stats */}
        <div style={{ background: "#1c2030", borderLeft: "1px solid #252a3a", borderRight: "1px solid #252a3a", minWidth: 220 }}
          className="hidden md:block">
          <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #252a3a" }}>
            <span className="text-[10px] font-bold text-[#d4a537] uppercase tracking-wider">Portfolio</span>
          </div>
          <div className="px-4 py-3 space-y-3">
            <StatRow label="Balance" value={`${fmt(s.balance)}€`} />
            <StatRow label="Equity" value={`${fmt(s.equity)}€`} />
            <StatRow label="Floating" value={`${floatPnl >= 0 ? "+" : ""}${fmt(floatPnl)}€`} color={floatPnl >= 0 ? "#4caf50" : "#f44336"} />
            <StatRow label="Positionen" value={`${positions.length}`} />
            <StatRow label="Accounts" value={`${s.accounts}`} />
            <div style={{ borderTop: "1px solid #252a3a", paddingTop: 12, marginTop: 8 }}>
              <span className="text-[9px] text-[#5d6588] uppercase tracking-wider">Trader Signals</span>
            </div>
            {accs.filter((a: any) => a.active).map((a: any) => (
              <div key={a.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                  <span className="text-[10px] font-bold" style={{ color: a.color }}>{a.name}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: a.pnl24h >= 0 ? "#4caf50" : a.pnl24h < 0 ? "#f44336" : "#5d6588" }}>
                  {a.pnl24h >= 0 ? "+" : ""}{fmt(a.pnl24h)}€
                </span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #252a3a", paddingTop: 12, marginTop: 8 }}>
              <span className="text-[9px] text-[#5d6588] uppercase tracking-wider">Winrate ({range})</span>
              <div className="text-[20px] font-bold font-mono mt-1" style={{ color: histWr >= 50 ? "#4caf50" : "#f44336" }}>
                {histWr}%
              </div>
              <div className="w-full h-1.5 rounded-full mt-2" style={{ background: "#252a3a" }}>
                <div className="h-full rounded-full" style={{ width: `${histWr}%`, background: histWr >= 50 ? "#4caf50" : "#f44336" }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: History */}
        <div style={{ background: "#151929", minHeight: 400 }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#1c2030", borderBottom: "1px solid #252a3a" }}>
            <span className="text-[10px] font-bold text-[#8a90a5] uppercase">History</span>
            <div className="flex gap-1">
              {(["24h", "72h", "7d", "all"] as Range[]).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className="text-[9px] font-bold px-2 py-1 rounded transition-all"
                  style={{ background: range === r ? "#2196f3" : "transparent", color: range === r ? "#fff" : "#5d6588" }}>
                  {r === "all" ? "ALL" : r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {history.length === 0 ? (
              <div className="py-16 text-center text-[11px] text-[#5d6588]">Keine Trades ({range})</div>
            ) : history.map((deal: any, i: number) => (
              <DealRow key={deal.id ?? i} deal={deal} />
            ))}
          </div>
          {/* History P&L */}
          <div className="flex justify-between items-center px-4 py-2" style={{ background: "#1c2030", borderTop: "1px solid #252a3a" }}>
            <span className="text-[9px] text-[#5d6588]">{history.length} Trades</span>
            <span className="text-[14px] font-bold font-mono" style={{ color: histPnl >= 0 ? "#4caf50" : "#f44336" }}>
              {histPnl >= 0 ? "+" : ""}{fmt(histPnl)}€
            </span>
          </div>
        </div>
      </div>

      <p className="text-center text-[9px] text-[#3a3f52] mt-3">
        Risikohinweis: Vergangene Ergebnisse sind keine Garantie fuer zukuenftige Performance.
      </p>
    </section>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[#5d6588]">{label}</span>
      <span className="text-[12px] font-bold font-mono" style={{ color: color ?? "#c8cdd8" }}>{value}</span>
    </div>
  );
}

function PosRow({ pos }: { pos: any }) {
  const net = pos.profit + (pos.swap ?? 0) + (pos.commission ?? 0);
  const nc = net > 0 ? "#4caf50" : net < 0 ? "#f44336" : "#9e9e9e";
  const dc = pos.type === "BUY" ? "#2196f3" : "#f44336";
  return (
    <div className="flex" style={{ borderBottom: "1px solid #1e2235" }}>
      <div className="w-[3px] shrink-0" style={{ background: pos.traderColor }} />
      <div className="flex-1 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${pos.traderColor}15`, color: pos.traderColor, border: `1px solid ${pos.traderColor}30` }}>
              {pos.trader}
            </span>
            <span className="text-[12px] font-bold text-white">{pos.symbol}</span>
            <span className="text-[9px] font-bold" style={{ color: dc }}>{pos.type}</span>
          </div>
          <span className="text-[12px] font-bold font-mono" style={{ color: nc }}>
            {net >= 0 ? "+" : ""}{fmt(net)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] font-mono text-[#5d6588]">
            {pos.openPrice} → <span className="text-[#8a90a5]">{pos.currentPrice}</span>
          </span>
          <span className="text-[8px] text-[#5d6588] font-mono">{pos.volume}lot · {elapsed(pos.openTime)}</span>
        </div>
      </div>
    </div>
  );
}

function DealRow({ deal }: { deal: any }) {
  const net = deal.profit + (deal.swap ?? 0) + (deal.commission ?? 0);
  const nc = net > 0 ? "#4caf50" : net < 0 ? "#f44336" : "#9e9e9e";
  const isDaily = deal.isDaily;
  return (
    <div className="flex" style={{ borderBottom: "1px solid #1e2235" }}>
      <div className="w-[3px] shrink-0" style={{ background: deal.traderColor, opacity: 0.6 }} />
      <div className="flex-1 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${deal.traderColor}15`, color: deal.traderColor }}>
              {deal.trader}
            </span>
            <span className="text-[11px] font-bold text-[#c8cdd8]">{deal.symbol}</span>
            {isDaily && deal.trades > 0 && (
              <span className="text-[8px] text-[#5d6588] px-1 py-0.5 rounded" style={{ background: "#252a3a" }}>
                {deal.trades} trades
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold font-mono" style={{ color: nc }}>
            {net >= 0 ? "+" : ""}{fmt(net)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[9px] font-mono text-[#5d6588]">{fmtDate(deal.closeTime)}</span>
          <div className="flex items-center gap-2">
            {deal.volume > 0 && <span className="text-[8px] text-[#5d6588]">{deal.volume}lot</span>}
            {isDaily && deal.pips > 0 && <span className="text-[8px] text-[#4caf50]">+{deal.pips}pips</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
