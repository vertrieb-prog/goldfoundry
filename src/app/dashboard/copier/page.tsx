// src/app/dashboard/copier/page.tsx
"use client";
import { useEffect, useState } from "react";

const DEMO_INTEL = {
  risk_level: "GREEN",
  risk_score: 18,
  regime: "TRENDING",
  geopolitical_risk: "LOW",
  forecast_text: "Stabile Marktlage. Gold im Aufwaertstrend, moderate Volatilitaet. Keine relevanten News-Events in den naechsten 4h. Optimale Bedingungen fuer Trend-Following-Strategien.",
};

const DEMO_ACCOUNTS = [
  {
    id: "acc-1",
    firmProfile: "TEGAS FX 24x",
    platform: "MT5",
    mtLogin: "88401234",
    brokerServer: "TegasFX-Live",
    equity: 48250,
    ddBuffer: 67.2,
    lastMultiplier: 0.92,
    todayPnl: 312.40,
    copierActive: true,
    todayCopied: 8,
    todaySkipped: 2,
    lastFactors: { Time: 1.0, News: 1.0, DD: 0.92, Perf: 0.95, Vol: 0.88, Day: 1.0, Intel: 1.0 },
    pausedReason: null,
  },
  {
    id: "acc-2",
    firmProfile: "TAG Markets 12x",
    platform: "MT5",
    mtLogin: "77203456",
    brokerServer: "TagMarkets-Live",
    equity: 24100,
    ddBuffer: 43.1,
    lastMultiplier: 0.65,
    todayPnl: 87.20,
    copierActive: true,
    todayCopied: 5,
    todaySkipped: 1,
    lastFactors: { Time: 1.0, News: 0.7, DD: 0.65, Perf: 0.85, Vol: 0.92, Day: 1.0, Intel: 0.9 },
    pausedReason: null,
  },
];

const DEMO_TELEGRAM = {
  active: true,
  groups: [
    { name: "XAUUSD VIP Signals", count: 247 },
    { name: "Forex Elite", count: 189 },
    { name: "Gold Scalper Pro", count: 312 },
  ],
  lastSignal: {
    text: "BUY XAUUSD @ 2341.50, TP 2358.00, SL 2334.00",
    status: "KOPIERT",
  },
  smartOrders: ["4-Split TP aktiv", "Auto-BE aktiv", "Trailing Runner aktiv"],
};

export default function CopierPage() {
  const [accounts, setAccounts] = useState<any[]>(DEMO_ACCOUNTS);
  const [intel, setIntel] = useState<any>(DEMO_INTEL);
  const [showConnect, setShowConnect] = useState(false);
  const [form, setForm] = useState({ firmProfile: "tegas_24x", brokerServer: "", mtLogin: "", mtPassword: "", platform: "mt5" });
  const [connecting, setConnecting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/copier/status")
      .then(r => r.json())
      .then(d => {
        if (d.accounts?.length) setAccounts(d.accounts);
        if (d.intel) setIntel(d.intel);
      })
      .catch(() => {});
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault(); setConnecting(true); setMsg("");
    try {
      const res = await fetch("/api/copier/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      setConnecting(false);
      if (data.success) { setMsg("Verbunden!"); setShowConnect(false); }
      else setMsg(data.error ?? "Fehler");
    } catch { setConnecting(false); setMsg("Verbindung fehlgeschlagen"); }
  }

  async function togglePause(accountId: string, active: boolean) {
    fetch("/api/copier/pause", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId, action: active ? "pause" : "resume" }) }).catch(() => {});
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, copierActive: !active } : a));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>FORGE COPY</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>Smart Autopilot · 7-Faktor Risk Engine · Manipulation Shield</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(212,165,55,0.15)", color: "var(--gf-gold)" }}>DEMO DATA</span>
          <button onClick={() => setShowConnect(!showConnect)} className="gf-btn text-sm">+ MT-Konto verbinden</button>
        </div>
      </div>

      {/* INTEL Bar */}
      {intel && (
        <div className="gf-panel p-4 mb-6 flex flex-wrap items-center gap-4">
          <span className="text-xs tracking-widest font-bold" style={{ color: "var(--gf-text-dim)" }}>INTEL</span>
          <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: "rgba(39,174,96,0.12)", color: "var(--gf-green)" }}>
            Risk Level: {intel.risk_level}
          </span>
          <span className="px-2 py-1 rounded text-xs font-bold mono" style={{ background: "rgba(212,165,55,0.1)", color: "var(--gf-gold)" }}>
            Score: {intel.risk_score}/100
          </span>
          <span className="text-xs" style={{ color: "var(--gf-text)" }}>
            Regime: <span style={{ color: "var(--gf-text-bright)" }}>{intel.regime}</span>
          </span>
          <span className="text-xs" style={{ color: "var(--gf-text)" }}>
            Geo: <span style={{ color: "var(--gf-text-bright)" }}>{intel.geopolitical_risk}</span>
          </span>
          {intel.forecast_text && (
            <p className="w-full text-xs mt-2 leading-relaxed" style={{ color: "var(--gf-text)" }}>{intel.forecast_text}</p>
          )}
        </div>
      )}

      {/* Connect Form (toggleable) */}
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
            <button type="submit" className="gf-btn" disabled={connecting}>{connecting ? "Verbinde..." : "Verbinden"}</button>
          </form>
          {msg && <p className="mt-3 text-sm" style={{ color: msg === "Verbunden!" ? "var(--gf-green)" : "var(--gf-red)" }}>{msg}</p>}
        </div>
      )}

      {/* Accounts */}
      <div className="space-y-4 mb-8">
        {accounts.map((acc: any) => (
          <div key={acc.id} className="gf-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: acc.copierActive ? "var(--gf-green)" : "var(--gf-red)" }} />
                <span className="font-semibold" style={{ color: "var(--gf-text-bright)" }}>{acc.firmProfile}</span>
                <span className="mono text-sm" style={{ color: "var(--gf-text-dim)" }}>{acc.platform} Login {acc.mtLogin}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{
                  background: acc.copierActive ? "rgba(39,174,96,0.12)" : "rgba(192,57,43,0.12)",
                  color: acc.copierActive ? "var(--gf-green)" : "var(--gf-red)"
                }}>
                  {acc.copierActive ? "ACTIVE" : "PAUSED"}
                </span>
              </div>
              <button onClick={() => togglePause(acc.id, acc.copierActive)} className={acc.copierActive ? "gf-btn-outline text-xs !px-4 !py-1.5" : "gf-btn text-xs !px-4 !py-1.5"}>
                {acc.copierActive ? "Pausieren" : "Fortsetzen"}
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{"\u20AC"}{acc.equity?.toLocaleString()}</div>
                <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Equity</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: acc.ddBuffer > 40 ? "var(--gf-green)" : "var(--gf-red)" }}>{acc.ddBuffer}%</div>
                <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>DD Buffer</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold gf-gold-text">{acc.lastMultiplier}x</div>
                <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Risk Multiplier</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: acc.todayPnl >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
                  {acc.todayPnl >= 0 ? "+" : ""}{"\u20AC"}{acc.todayPnl?.toFixed(2)}
                </div>
                <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Heute P&L</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: "var(--gf-text-bright)" }}>
                  {acc.todayCopied} <span className="text-xs font-normal" style={{ color: "var(--gf-green)" }}>kopiert</span>{" "}
                  / {acc.todaySkipped} <span className="text-xs font-normal" style={{ color: "var(--gf-text-dim)" }}>geskippt</span>
                </div>
                <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Heute</div>
              </div>
            </div>

            {/* Risk Factors */}
            {acc.lastFactors && (
              <div>
                <div className="text-[10px] tracking-widest mb-2" style={{ color: "var(--gf-text-dim)" }}>RISK FACTORS</div>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(acc.lastFactors).map(([k, v]: [string, any]) => (
                    <div key={k} className="text-center p-2 rounded" style={{ background: "var(--gf-obsidian)" }}>
                      <div className="text-xs font-bold mono" style={{ color: v >= 0.8 ? "var(--gf-green)" : v >= 0.3 ? "var(--gf-gold)" : "var(--gf-red)" }}>{v.toFixed(2)}</div>
                      {/* Color bar */}
                      <div className="w-full h-1 rounded-full mt-1 mb-1" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="h-full rounded-full" style={{
                          width: `${v * 100}%`,
                          background: v >= 0.8 ? "var(--gf-green)" : v >= 0.3 ? "var(--gf-gold)" : "var(--gf-red)"
                        }} />
                      </div>
                      <div className="text-[9px] uppercase" style={{ color: "var(--gf-text-dim)" }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {acc.pausedReason && (
              <div className="mt-3 text-xs px-3 py-2 rounded" style={{ background: "rgba(192,57,43,0.08)", color: "var(--gf-red)" }}>{acc.pausedReason}</div>
            )}
          </div>
        ))}
      </div>

      {/* Telegram Copier Section */}
      <div className="gf-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--gf-text-bright)" }}>Telegram Copier</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(39,174,96,0.12)", color: "var(--gf-green)" }}>
              AKTIV
            </span>
          </div>
          <span className="text-xs" style={{ color: "var(--gf-text-dim)" }}>
            Connected to <span style={{ color: "var(--gf-text-bright)" }}>{DEMO_TELEGRAM.groups.length} Signal Groups</span>
          </span>
        </div>

        {/* Signal Groups */}
        <div className="grid md:grid-cols-3 gap-3 mb-5">
          {DEMO_TELEGRAM.groups.map((g, i) => (
            <div key={i} className="p-3 rounded" style={{ background: "var(--gf-obsidian)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--gf-text-bright)" }}>{g.name}</div>
              <div className="text-xs mono mt-1" style={{ color: "var(--gf-text-dim)" }}>{g.count} Signale</div>
            </div>
          ))}
        </div>

        {/* Last Signal */}
        <div className="p-3 rounded mb-4" style={{ background: "var(--gf-obsidian)" }}>
          <div className="text-[10px] tracking-widest mb-1" style={{ color: "var(--gf-text-dim)" }}>LETZTES SIGNAL</div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="mono text-sm" style={{ color: "var(--gf-text-bright)" }}>{DEMO_TELEGRAM.lastSignal.text}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(39,174,96,0.12)", color: "var(--gf-green)" }}>
              {DEMO_TELEGRAM.lastSignal.status}
            </span>
          </div>
        </div>

        {/* Smart Orders */}
        <div>
          <div className="text-[10px] tracking-widest mb-2" style={{ color: "var(--gf-text-dim)" }}>SMART ORDERS</div>
          <div className="flex flex-wrap gap-2">
            {DEMO_TELEGRAM.smartOrders.map((s, i) => (
              <span key={i} className="px-3 py-1.5 rounded text-xs" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)" }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
