// src/app/dashboard/trader/page.tsx
"use client";
import { useState } from "react";

const TRADERS = [
  { name: "GoldForge", asset: "XAUUSD", perf: "+1.0%/Tag", wr: "72%", dd: "4.5%", since: "2022", color: "#d4a537" },
  { name: "TechForge", asset: "US500", perf: "+0.7%/Tag", wr: "68%", dd: "3.8%", since: "2023", color: "#3b82f6" },
  { name: "IndexForge", asset: "DAX40", perf: "+0.8%/Tag", wr: "65%", dd: "5.2%", since: "2023", color: "#a855f7" },
  { name: "ForexForge", asset: "EURUSD", perf: "+0.5%/Tag", wr: "74%", dd: "3.2%", since: "2022", color: "#22c55e" },
];

const LEVERAGE_OPTIONS = ["1x", "2x", "4x", "8x", "12x", "24x"];

interface TraderState {
  leverage: string;
  risk: number;
  active: boolean;
}

export default function TraderPage() {
  const [states, setStates] = useState<Record<string, TraderState>>(
    Object.fromEntries(TRADERS.map(t => [t.name, { leverage: "8x", risk: 1, active: false }]))
  );

  function update(name: string, patch: Partial<TraderState>) {
    setStates(prev => ({ ...prev, [name]: { ...prev[name], ...patch } }));
  }

  function calcEffective(leverage: string) {
    const mult = parseInt(leverage.replace("x", ""));
    return (5000 * mult).toLocaleString("de-DE");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="gf-heading text-2xl">Forge Trader</h1>
        <p className="text-sm text-zinc-500 mt-1">Waehle einen Trader und konfiguriere Hebel und Risiko.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TRADERS.map(t => {
          const s = states[t.name];
          return (
            <div key={t.name} className="gf-panel p-5" style={{ borderColor: `${t.color}30` }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: `${t.color}15`, color: t.color }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: `${t.color}15`, color: t.color }}>
                      {t.asset}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => update(t.name, { active: !s.active })}
                  className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                  style={s.active
                    ? { background: "rgba(34,197,94,0.1)", color: "var(--gf-green)", border: "1px solid rgba(34,197,94,0.2)" }
                    : { background: "rgba(255,255,255,0.03)", color: "var(--gf-text-dim)", border: "1px solid var(--gf-border)" }
                  }
                >
                  {s.active ? "Aktiv" : "Inaktiv"}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Ø/Tag", value: t.perf },
                  { label: "Win Rate", value: t.wr },
                  { label: "Max DD", value: t.dd },
                  { label: "Seit", value: t.since },
                ].map(st => (
                  <div key={st.label} className="text-center p-2 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                    <div className="text-xs font-bold text-white">{st.value}</div>
                    <div className="text-[9px] text-zinc-600 mt-0.5">{st.label}</div>
                  </div>
                ))}
              </div>

              {/* Leverage */}
              <div className="mb-3">
                <label className="text-[10px] text-zinc-500 mb-1 block">Hebel</label>
                <select
                  className="gf-input text-sm"
                  value={s.leverage}
                  onChange={e => update(t.name, { leverage: e.target.value })}
                >
                  {LEVERAGE_OPTIONS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Risk Slider */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-zinc-500">Risiko pro Trade</label>
                  <span className="text-xs font-bold" style={{ color: "var(--gf-gold)" }}>{s.risk.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={s.risk}
                  onChange={e => update(t.name, { risk: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--gf-gold)]"
                />
                <div className="flex justify-between text-[9px] text-zinc-600">
                  <span>0.5%</span>
                  <span>3.0%</span>
                </div>
              </div>

              {/* Mini Calculator */}
              <div className="p-3 rounded-lg text-xs" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                <span className="text-zinc-500">Bei </span>
                <span className="text-white font-semibold">&euro;5.000</span>
                <span className="text-zinc-500"> Kapital &times; </span>
                <span className="font-semibold" style={{ color: t.color }}>{s.leverage} Hebel</span>
                <span className="text-zinc-500"> = </span>
                <span className="text-white font-bold">&euro;{calcEffective(s.leverage)}</span>
                <span className="text-zinc-500"> effektiv</span>
              </div>

              {/* Disclaimer */}
              <p className="text-[9px] text-zinc-700 mt-3">Vergangene Performance ist keine Garantie fuer zukuenftige Ergebnisse.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
