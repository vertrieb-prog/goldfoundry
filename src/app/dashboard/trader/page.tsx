// src/app/dashboard/trader/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const TRADERS = [
  { name: "PHANTOM", asset: "XAUUSD", perf: "+1.0%/Tag", wr: "72%", dd: "4.5%", since: "2022", color: "#d4a537" },
  { name: "NEXUS", asset: "US500", perf: "+0.7%/Tag", wr: "68%", dd: "3.8%", since: "2023", color: "#3b82f6" },
  { name: "SENTINEL", asset: "DAX40", perf: "+0.8%/Tag", wr: "65%", dd: "5.2%", since: "2023", color: "#a855f7" },
  { name: "SPECTRE", asset: "EURUSD", perf: "+0.5%/Tag", wr: "74%", dd: "3.2%", since: "2022", color: "#22c55e" },
];

const LEVERAGE_OPTIONS = ["1x", "2x", "4x", "8x", "12x", "24x"];

interface TraderState { leverage: string; risk: number; active: boolean; }
interface AccountData { id: string; equity: number; copierActive: boolean; firmProfile: string; mtLogin: string; }

export default function TraderPage() {
  const [states, setStates] = useState<Record<string, TraderState>>(
    Object.fromEntries(TRADERS.map(t => [t.name, { leverage: "8x", risk: 1, active: false }]))
  );
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/copier/status")
      .then(r => r.json())
      .then(d => setAccounts(d.accounts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalEquity = accounts.reduce((s, a) => s + (a.equity ?? 0), 0);
  const hasAccounts = accounts.length > 0;

  function update(name: string, patch: Partial<TraderState>) {
    setStates(prev => ({ ...prev, [name]: { ...prev[name], ...patch } }));
  }

  function calcEffective(leverage: string) {
    const mult = parseInt(leverage.replace("x", ""));
    const base = hasAccounts ? totalEquity : 5000;
    return (base * mult).toLocaleString("de-DE", { maximumFractionDigits: 0 });
  }

  async function toggleCopier(accountId: string, currentActive: boolean) {
    setToggling(accountId);
    try {
      const res = await fetch("/api/copier/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, action: currentActive ? "pause" : "resume" }),
      });
      const d = await res.json();
      if (d.success) {
        setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, copierActive: !currentActive } : a));
      }
    } catch { /* ignore */ }
    setToggling(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="gf-heading text-2xl">Forge Trader</h1>
          <p className="text-sm text-zinc-500 mt-1">Waehle einen Trader und konfiguriere Hebel und Risiko.</p>
        </div>
        {loading ? (
          <span className="text-xs text-zinc-500">Laden...</span>
        ) : hasAccounts ? (
          <span className="text-[10px] font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "var(--gf-green)", border: "1px solid rgba(34,197,94,0.2)" }}>Verbunden</span>
        ) : (
          <span className="text-[10px] font-semibold px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.03)", color: "var(--gf-text-dim)", border: "1px solid var(--gf-border)" }}>Kein Konto</span>
        )}
      </div>

      {/* Copier Toggle per Account */}
      {hasAccounts && (
        <div className="gf-panel p-4 flex flex-wrap gap-3">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
              <span className="text-xs font-mono text-zinc-400">{acc.mtLogin}</span>
              <button
                disabled={toggling === acc.id}
                onClick={() => toggleCopier(acc.id, acc.copierActive)}
                className="text-[10px] font-semibold px-3 py-1 rounded-lg transition-all"
                style={acc.copierActive
                  ? { background: "rgba(34,197,94,0.1)", color: "var(--gf-green)", border: "1px solid rgba(34,197,94,0.2)" }
                  : { background: "rgba(239,68,68,0.1)", color: "var(--gf-red)", border: "1px solid rgba(239,68,68,0.2)" }
                }
              >
                {toggling === acc.id ? "..." : acc.copierActive ? "Aktiv" : "Pausiert"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No Account CTA */}
      {!loading && !hasAccounts && (
        <div className="gf-panel p-5 flex flex-col items-center text-center" style={{ background: "linear-gradient(135deg, var(--gf-panel), rgba(250,239,112,0.02))", border: "1px solid rgba(250,239,112,0.12)" }}>
          <h3 className="text-sm font-bold text-white mb-1">Kein Konto verbunden</h3>
          <p className="text-xs text-zinc-500 mb-3">Verbinde dein MetaTrader-Konto, um Trades automatisch zu kopieren.</p>
          <Link href="/dashboard/konto" className="gf-btn gf-btn-sm text-xs">Konto verbinden &rarr;</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TRADERS.map(t => {
          const s = states[t.name];
          return (
            <div key={t.name} className="gf-panel p-5" style={{ borderColor: `${t.color}30` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: `${t.color}15`, color: t.color }}>{t.name[0]}</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: `${t.color}15`, color: t.color }}>{t.asset}</span>
                  </div>
                </div>
                <button onClick={() => update(t.name, { active: !s.active })}
                  className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                  style={s.active
                    ? { background: "rgba(34,197,94,0.1)", color: "var(--gf-green)", border: "1px solid rgba(34,197,94,0.2)" }
                    : { background: "rgba(255,255,255,0.03)", color: "var(--gf-text-dim)", border: "1px solid var(--gf-border)" }
                  }
                >{s.active ? "Aktiv" : "Inaktiv"}</button>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[{ label: "Ø/Tag", value: t.perf }, { label: "Win Rate", value: t.wr }, { label: "Max DD", value: t.dd }, { label: "Seit", value: t.since }].map(st => (
                  <div key={st.label} className="text-center p-2 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                    <div className="text-xs font-bold text-white">{st.value}</div>
                    <div className="text-[9px] text-zinc-600 mt-0.5">{st.label}</div>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <label className="text-[10px] text-zinc-500 mb-1 block">Hebel</label>
                <select className="gf-input text-sm" value={s.leverage} onChange={e => update(t.name, { leverage: e.target.value })}>
                  {LEVERAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-zinc-500">Risiko pro Trade</label>
                  <span className="text-xs font-bold" style={{ color: "var(--gf-gold)" }}>{s.risk.toFixed(1)}%</span>
                </div>
                <input type="range" min="0.5" max="3" step="0.1" value={s.risk} onChange={e => update(t.name, { risk: parseFloat(e.target.value) })} className="w-full accent-[var(--gf-gold)]" />
                <div className="flex justify-between text-[9px] text-zinc-600"><span>0.5%</span><span>3.0%</span></div>
              </div>
              <div className="p-3 rounded-lg text-xs" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                <span className="text-zinc-500">Bei </span>
                <span className="text-white font-semibold">&euro;{hasAccounts ? totalEquity.toLocaleString("de-DE", { maximumFractionDigits: 0 }) : "5.000"}</span>
                <span className="text-zinc-500"> Kapital &times; </span>
                <span className="font-semibold" style={{ color: t.color }}>{s.leverage} Hebel</span>
                <span className="text-zinc-500"> = </span>
                <span className="text-white font-bold">&euro;{calcEffective(s.leverage)}</span>
                <span className="text-zinc-500"> effektiv</span>
              </div>
              <p className="text-[9px] text-zinc-700 mt-3">Vergangene Performance ist keine Garantie fuer zukuenftige Ergebnisse.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
