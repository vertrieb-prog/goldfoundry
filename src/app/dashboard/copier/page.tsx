// src/app/dashboard/copier/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function CopierPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [intel, setIntel] = useState<any>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [form, setForm] = useState({ firmProfile: "tegas_24x", brokerServer: "", mtLogin: "", mtPassword: "", platform: "mt5" });
  const [connecting, setConnecting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadData(); }, []);
  function loadData() { fetch("/api/copier/status").then(r => r.json()).then(d => { setAccounts(d.accounts ?? []); setIntel(d.intel); }); }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault(); setConnecting(true); setMsg("");
    const res = await fetch("/api/copier/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setConnecting(false);
    if (data.success) { setMsg("Verbunden!"); setShowConnect(false); loadData(); }
    else setMsg(data.error ?? "Fehler");
  }

  async function togglePause(accountId: string, active: boolean) {
    await fetch("/api/copier/pause", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId, action: active ? "pause" : "resume" }) });
    loadData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>⚡ FORGE COPY</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>Smart Autopilot · 7-Faktor Risk Engine · Manipulation Shield</p>
        </div>
        <button onClick={() => setShowConnect(!showConnect)} className="gf-btn text-sm">+ MT-Konto verbinden</button>
      </div>

      {intel && (
        <div className="gf-panel p-4 mb-6 flex flex-wrap items-center gap-4">
          <span className="text-xs tracking-widest" style={{ color: "var(--gf-text-dim)" }}>INTEL</span>
          <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: "rgba(212,165,55,0.1)", color: "var(--gf-gold)" }}>{intel.risk_level} ({intel.risk_score}/100)</span>
          <span className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Regime: {intel.regime}</span>
          <span className="text-xs" style={{ color: "var(--gf-text-dim)" }}>Geo: {intel.geopolitical_risk}</span>
          {intel.forecast_text && <p className="w-full text-xs mt-2 leading-relaxed" style={{ color: "var(--gf-text)" }}>{intel.forecast_text.slice(0, 200)}...</p>}
        </div>
      )}

      {showConnect && (
        <div className="gf-panel p-6 mb-6 animate-in">
          <h3 className="font-semibold mb-4" style={{ color: "var(--gf-text-bright)" }}>MetaTrader verbinden</h3>
          <form onSubmit={handleConnect} className="grid md:grid-cols-2 gap-4">
            <select className="gf-input" value={form.firmProfile} onChange={e => setForm({ ...form, firmProfile: e.target.value })}>
              <option value="tegas_24x">Tegas FX 24x (5% Trailing DD)</option>
              <option value="tag_12x">Tag Markets 12x (10% Fixed DD)</option>
            </select>
            <select className="gf-input" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
              <option value="mt5">MetaTrader 5</option>
              <option value="mt4">MetaTrader 4</option>
            </select>
            <input className="gf-input" placeholder="Broker Server (z.B. TegasFX-Live)" value={form.brokerServer} onChange={e => setForm({ ...form, brokerServer: e.target.value })} required />
            <input className="gf-input" placeholder="MT Login" value={form.mtLogin} onChange={e => setForm({ ...form, mtLogin: e.target.value })} required />
            <input className="gf-input" type="password" placeholder="MT Trading Password" value={form.mtPassword} onChange={e => setForm({ ...form, mtPassword: e.target.value })} required />
            <button type="submit" className="gf-btn" disabled={connecting}>{connecting ? "Verbinde..." : "Verbinden →"}</button>
          </form>
          {msg && <p className="mt-3 text-sm" style={{ color: msg === "Verbunden!" ? "var(--gf-green)" : "var(--gf-red)" }}>{msg}</p>}
        </div>
      )}

      <div className="space-y-4">
        {accounts.map((acc: any) => (
          <div key={acc.id} className="gf-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: acc.copierActive ? "var(--gf-green)" : "var(--gf-red)" }} />
                <span className="font-semibold" style={{ color: "var(--gf-text-bright)" }}>{acc.firmProfile?.toUpperCase()}</span>
                <span className="mono text-sm" style={{ color: "var(--gf-text-dim)" }}>{acc.mtLogin}@{acc.brokerServer}</span>
              </div>
              <button onClick={() => togglePause(acc.id, acc.copierActive)} className={acc.copierActive ? "gf-btn-outline text-xs !px-4 !py-1.5" : "gf-btn text-xs !px-4 !py-1.5"}>
                {acc.copierActive ? "Pausieren" : "Fortsetzen"}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center"><div className="text-xl font-bold" style={{ color: "var(--gf-text-bright)" }}>${acc.equity?.toLocaleString()}</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Equity</div></div>
              <div className="text-center"><div className="text-xl font-bold" style={{ color: acc.ddBuffer > 40 ? "var(--gf-green)" : "var(--gf-red)" }}>{acc.ddBuffer}%</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>DD Buffer</div></div>
              <div className="text-center"><div className="text-xl font-bold gf-gold-text">{acc.lastMultiplier ?? "—"}×</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Risk Multiplier</div></div>
              <div className="text-center"><div className="text-xl font-bold" style={{ color: acc.todayPnl >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>{acc.todayPnl >= 0 ? "+" : ""}${acc.todayPnl?.toFixed(2)}</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Heute P&L</div></div>
            </div>

            {acc.lastFactors && (
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(acc.lastFactors).map(([k, v]: [string, any]) => (
                  <div key={k} className="text-center p-2 rounded" style={{ background: "var(--gf-obsidian)" }}>
                    <div className="text-xs font-bold mono" style={{ color: v >= 0.8 ? "var(--gf-green)" : v >= 0.3 ? "var(--gf-gold)" : "var(--gf-red)" }}>{v}</div>
                    <div className="text-[9px] uppercase" style={{ color: "var(--gf-text-dim)" }}>{k}</div>
                  </div>
                ))}
              </div>
            )}

            {acc.pausedReason && <div className="mt-3 text-xs px-3 py-2 rounded" style={{ background: "rgba(192,57,43,0.08)", color: "var(--gf-red)" }}>{acc.pausedReason}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
