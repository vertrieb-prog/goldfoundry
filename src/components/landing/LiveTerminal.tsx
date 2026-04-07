// src/components/landing/LiveTerminal.tsx — Live terminal widget for landing page
"use client";

import { useEffect, useState } from "react";

type Tab = "trade" | "history";
type Range = "24h" | "72h" | "7d" | "all";

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

function elapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function LiveTerminal() {
  const [tab, setTab] = useState<Tab>("trade");
  const [range, setRange] = useState<Range>("24h");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const r = tab === "history" ? range : "7d";
    fetch(`/api/trades/live?range=${r}`).then(res => res.json()).then(setData).catch(() => {});
    const iv = setInterval(() => {
      fetch(`/api/trades/live?range=${r}`).then(res => res.json()).then(setData).catch(() => {});
    }, 15000);
    return () => clearInterval(iv);
  }, [tab, range]);

  if (!data?.summary) return null;

  const s = data.summary;
  const positions = data.positions ?? [];
  const history = data.history ?? [];
  const pnlColor = s.floatingPnl > 0 ? "#4caf50" : s.floatingPnl < 0 ? "#f44336" : "#9e9e9e";
  const historyPnl = history.reduce((sum: number, d: any) => sum + d.profit + (d.swap ?? 0) + (d.commission ?? 0), 0);
  const historyWins = history.filter((d: any) => d.profit > 0).length;
  const historyWr = history.length > 0 ? Math.round((historyWins / history.length) * 100) : 0;

  return (
    <section style={{ padding: "80px 20px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div className="text-[11px] uppercase tracking-[0.15em]" style={{ color: "#6d6045", marginBottom: 8 }}>
          Live Trading Terminal
        </div>
        <h3 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
          Echte Trades. <span style={{ color: "#d4a537" }}>In Echtzeit.</span>
        </h3>
        <p style={{ color: "#52525b", fontSize: 13, maxWidth: 500, margin: "0 auto" }}>
          Keine Screenshots, keine Demos. Das sind unsere echten Positionen von {s.accounts} Master-Accounts — live vom Broker.
        </p>
      </div>

      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #252a3a", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        {/* Account bar */}
        <div style={{ background: "#1c2030", padding: "12px 16px", borderBottom: "1px solid #252a3a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4caf50", boxShadow: "0 0 8px #4caf50" }} />
              <span className="text-[10px] font-semibold text-[#4caf50]">LIVE</span>
              <span className="text-[10px] text-[#5d6588]">{s.accounts} Accounts</span>
            </div>
            <span className="text-[9px] text-[#5d6588] font-mono">Auto-Refresh 15s</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Metric label="Balance" value={`$${fmt(s.balance)}`} />
            <Metric label="Equity" value={`$${fmt(s.equity)}`} />
            <Metric label="Floating P/L" value={`${s.floatingPnl >= 0 ? "+" : ""}$${fmt(s.floatingPnl)}`} color={pnlColor} />
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background: "#1c2030", display: "flex", borderBottom: "1px solid #252a3a" }}>
          <TabBtn active={tab === "trade"} onClick={() => setTab("trade")} label={`Trade (${positions.length})`} />
          <TabBtn active={tab === "history"} onClick={() => setTab("history")} label={`History (${history.length})`} />
        </div>

        {/* Content */}
        <div style={{ background: "#151929", maxHeight: 500, overflowY: "auto" }}>
          {tab === "trade" && (
            positions.length === 0 ? (
              <Empty text="Markt geschlossen — keine offenen Positionen" />
            ) : (
              positions.map((pos: any, i: number) => (
                <PositionRow key={pos.id ?? i} pos={pos} />
              ))
            )
          )}

          {tab === "history" && (
            <>
              {/* Time filter bar */}
              <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid #252a3a", background: "#1a1e2e" }}>
                {(["24h", "72h", "7d", "all"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="text-[10px] font-semibold px-3 py-1.5 rounded-md transition-all"
                    style={{
                      background: range === r ? "#2196f3" : "transparent",
                      color: range === r ? "#fff" : "#5d6588",
                      border: range === r ? "none" : "1px solid #252a3a",
                    }}
                  >
                    {r === "all" ? "Alle" : r.toUpperCase()}
                  </button>
                ))}
                {/* Summary stats */}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="text-[9px] text-[#5d6588]">WR: <span style={{ color: "#d4a537" }}>{historyWr}%</span></span>
                  <span className="text-[9px] font-mono font-bold" style={{ color: historyPnl >= 0 ? "#4caf50" : "#f44336" }}>
                    {historyPnl >= 0 ? "+" : ""}${fmt(historyPnl)}
                  </span>
                </div>
              </div>

              {history.length === 0 ? (
                <Empty text="Keine geschlossenen Trades in diesem Zeitraum" />
              ) : (
                history.map((deal: any, i: number) => (
                  <DealRow key={deal.id ?? i} deal={deal} />
                ))
              )}
            </>
          )}
        </div>

        {/* Bottom P&L bar */}
        <div style={{ background: "#1c2030", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #252a3a" }}>
          <span className="text-[9px] text-[#5d6588] uppercase">
            {tab === "trade" ? "Floating P/L" : `${history.length} Trades (${range === "all" ? "Alle" : range})`}
          </span>
          <span className="text-[16px] font-bold font-mono" style={{
            color: tab === "trade" ? pnlColor : (historyPnl >= 0 ? "#4caf50" : "#f44336"),
          }}>
            {tab === "trade"
              ? `${s.floatingPnl >= 0 ? "+" : ""}$${fmt(s.floatingPnl)}`
              : `${historyPnl >= 0 ? "+" : ""}$${fmt(historyPnl)}`}
          </span>
        </div>
      </div>

      <p className="text-center text-[9px] text-[#3a3f52] mt-3">
        Risikohinweis: Vergangene Ergebnisse sind keine Garantie fuer zukuenftige Performance.
      </p>
    </section>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[9px] text-[#5d6588]">{label}</div>
      <div className="text-[13px] font-bold font-mono mt-0.5" style={{ color: color ?? "#c8cdd8" }}>{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wide relative transition-colors"
      style={{ color: active ? "#2196f3" : "#5d6588" }}>
      {label}
      {active && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "#2196f3" }} />}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-16 text-center text-[12px] text-[#5d6588]">{text}</div>;
}

function PositionRow({ pos }: { pos: any }) {
  const net = pos.profit + (pos.swap ?? 0) + (pos.commission ?? 0);
  const netColor = net > 0 ? "#4caf50" : net < 0 ? "#f44336" : "#9e9e9e";
  const dirColor = pos.type === "BUY" ? "#2196f3" : "#f44336";
  return (
    <div className="flex" style={{ borderBottom: "1px solid #252a3a" }}>
      <div className="w-[3px] shrink-0" style={{ background: dirColor }} />
      <div className="flex-1 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white">{pos.symbol}</span>
            <span className="text-[10px] font-bold" style={{ color: dirColor }}>{pos.type}</span>
            <span className="text-[10px] text-[#5d6588]">{pos.volume} lot</span>
          </div>
          <span className="text-[14px] font-bold font-mono" style={{ color: netColor }}>
            {net >= 0 ? "+" : ""}{fmt(net)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] font-mono text-[#5d6588]">
            {pos.openPrice} {"\u2794"} <span className="text-[#c8cdd8]">{pos.currentPrice}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#5d6588] font-mono">{elapsed(pos.openTime)}</span>
            <TraderBadge name={pos.trader} color={pos.traderColor} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DealRow({ deal }: { deal: any }) {
  const net = deal.profit + (deal.swap ?? 0) + (deal.commission ?? 0);
  const netColor = net > 0 ? "#4caf50" : net < 0 ? "#f44336" : "#9e9e9e";
  const dirColor = deal.type === "BUY" ? "#2196f3" : "#f44336";
  return (
    <div className="flex" style={{ borderBottom: "1px solid #252a3a" }}>
      <div className="w-[3px] shrink-0" style={{ background: dirColor, opacity: 0.5 }} />
      <div className="flex-1 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-[#c8cdd8]">{deal.symbol}</span>
            <span className="text-[10px] font-bold" style={{ color: dirColor, opacity: 0.7 }}>{deal.type}</span>
            <span className="text-[10px] text-[#5d6588]">{deal.volume} lot</span>
          </div>
          <span className="text-[13px] font-bold font-mono" style={{ color: netColor }}>
            {net >= 0 ? "+" : ""}{fmt(net)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] font-mono text-[#5d6588]">{fmtDate(deal.closeTime)}</span>
          <TraderBadge name={deal.trader} color={deal.traderColor} />
        </div>
      </div>
    </div>
  );
}

function TraderBadge({ name, color }: { name: string; color: string }) {
  return (
    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: `${color}18`, color, letterSpacing: "0.05em" }}>
      {name}
    </span>
  );
}
