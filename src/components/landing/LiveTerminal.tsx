// src/components/landing/LiveTerminal.tsx — Live terminal preview for landing page
"use client";

import { useEffect, useState } from "react";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function elapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function LiveTerminal() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/trades/live").then(r => r.json()).then(setData).catch(() => {});
    const iv = setInterval(() => {
      fetch("/api/trades/live").then(r => r.json()).then(setData).catch(() => {});
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  if (!data?.summary) return null;

  const s = data.summary;
  const positions = (data.positions ?? []).slice(0, 6);
  const pnlColor = s.floatingPnl > 0 ? "#4caf50" : s.floatingPnl < 0 ? "#f44336" : "#9e9e9e";

  return (
    <section style={{ padding: "80px 20px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#6d6045", marginBottom: 8 }}>
          Live Trading Terminal
        </div>
        <h3 style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
          Echte Trades. <span style={{ color: "#d4a537" }}>In Echtzeit.</span>
        </h3>
        <p style={{ color: "#52525b", fontSize: 13, maxWidth: 480, margin: "0 auto" }}>
          Keine Screenshots, keine Demos. Das sind unsere echten Positionen von 7 Master-Accounts — live vom Broker.
        </p>
      </div>

      {/* Terminal widget */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #252a3a", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        {/* Account bar */}
        <div style={{ background: "#1c2030", padding: "12px 16px", borderBottom: "1px solid #252a3a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4caf50", boxShadow: "0 0 8px #4caf50" }} />
              <span style={{ fontSize: 10, color: "#4caf50", fontWeight: 600 }}>LIVE</span>
              <span style={{ fontSize: 10, color: "#5d6588" }}>{s.accounts} Accounts</span>
            </div>
            <span style={{ fontSize: 9, color: "#5d6588", fontFamily: "monospace" }}>Auto-Refresh 15s</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <MetricBlock label="Balance" value={`$${fmt(s.balance)}`} />
            <MetricBlock label="Equity" value={`$${fmt(s.equity)}`} />
            <MetricBlock label="Floating P/L" value={`${s.floatingPnl >= 0 ? "+" : ""}$${fmt(s.floatingPnl)}`} color={pnlColor} />
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background: "#1c2030", display: "flex", borderBottom: "1px solid #252a3a" }}>
          <div style={{ flex: 1, padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#2196f3", borderBottom: "2px solid #2196f3", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Trade ({data.positions?.length ?? 0})
          </div>
          <div style={{ flex: 1, padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#5d6588", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            History ({data.history?.length ?? 0})
          </div>
        </div>

        {/* Position rows */}
        <div style={{ background: "#151929" }}>
          {positions.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#5d6588", fontSize: 12 }}>
              Markt geschlossen — keine offenen Positionen
            </div>
          ) : (
            positions.map((pos: any, i: number) => {
              const net = pos.profit + (pos.swap ?? 0) + (pos.commission ?? 0);
              const netColor = net > 0 ? "#4caf50" : net < 0 ? "#f44336" : "#9e9e9e";
              const dirColor = pos.type === "BUY" ? "#2196f3" : "#f44336";
              return (
                <div key={pos.id ?? i} style={{ display: "flex", borderBottom: "1px solid #252a3a" }}>
                  <div style={{ width: 3, background: dirColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{pos.symbol}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: dirColor }}>{pos.type}</span>
                        <span style={{ fontSize: 10, color: "#5d6588" }}>{pos.volume} lot</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: netColor }}>
                        {net >= 0 ? "+" : ""}{fmt(net)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#5d6588" }}>
                        {pos.openPrice} {"\u2794"} <span style={{ color: "#c8cdd8" }}>{pos.currentPrice}</span>
                      </span>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${pos.traderColor}18`, color: pos.traderColor }}>
                        {pos.trader}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Show more hint */}
          {(data.positions?.length ?? 0) > 6 && (
            <div style={{ padding: "8px 0", textAlign: "center", fontSize: 10, color: "#5d6588" }}>
              +{data.positions.length - 6} weitere Positionen
            </div>
          )}
        </div>

        {/* Bottom P&L bar */}
        <div style={{ background: "#1c2030", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #252a3a" }}>
          <span style={{ fontSize: 9, color: "#5d6588", textTransform: "uppercase" }}>Floating P/L</span>
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: pnlColor }}>
            {s.floatingPnl >= 0 ? "+" : ""}${fmt(s.floatingPnl)}
          </span>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "#3a3f52", fontSize: 9, marginTop: 12 }}>
        Risikohinweis: Vergangene Ergebnisse sind keine Garantie fuer zukuenftige Performance.
      </p>
    </section>
  );
}

function MetricBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "#5d6588" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: color ?? "#c8cdd8", marginTop: 2 }}>{value}</div>
    </div>
  );
}
