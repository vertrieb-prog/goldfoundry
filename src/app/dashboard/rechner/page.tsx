// src/app/dashboard/rechner/page.tsx
"use client";
import { useState } from "react";

export default function RechnerPage() {
  const [capital, setCapital] = useState(5000);
  const [is24x, setIs24x] = useState(false);
  const leverage = is24x ? 24 : 8;

  const effective = capital * leverage;
  const monthlyReturn8x = capital * 0.08;
  const monthlyReturn24x = capital * 0.24;
  const monthlyReturn = is24x ? monthlyReturn24x : monthlyReturn8x;
  const maxLoss = capital * (is24x ? 0.042 : 0.042);

  const projections = [
    { months: 1, value: capital + monthlyReturn },
    { months: 3, value: capital + monthlyReturn * 3 },
    { months: 6, value: capital + monthlyReturn * 6 },
    { months: 12, value: capital + monthlyReturn * 12 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="gf-heading text-2xl">Hebel-Rechner</h1>
        <p className="text-sm text-zinc-500 mt-1">Berechne dein effektives Kapital und monatliche Projektion.</p>
      </div>

      {/* Capital Slider */}
      <div className="gf-panel p-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-zinc-400">Dein Kapital</label>
          <span className="text-lg font-bold text-white">&euro;{capital.toLocaleString("de-DE")}</span>
        </div>
        <input
          type="range"
          min="500"
          max="50000"
          step="500"
          value={capital}
          onChange={e => setCapital(parseInt(e.target.value))}
          className="w-full accent-[var(--gf-gold)]"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
          <span>&euro;500</span>
          <span>&euro;50.000</span>
        </div>
      </div>

      {/* Leverage Toggle */}
      <div className="gf-panel p-6">
        <label className="text-sm text-zinc-400 mb-3 block">Hebel waehlen</label>
        <div className="flex gap-3">
          <button
            onClick={() => setIs24x(false)}
            className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
            style={!is24x
              ? { background: "rgba(250,239,112,0.1)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.3)" }
              : { background: "var(--gf-obsidian)", color: "var(--gf-text-dim)", border: "1px solid var(--gf-border)" }
            }
          >
            8x Hebel
          </button>
          <button
            onClick={() => setIs24x(true)}
            className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
            style={is24x
              ? { background: "rgba(250,239,112,0.1)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.3)" }
              : { background: "var(--gf-obsidian)", color: "var(--gf-text-dim)", border: "1px solid var(--gf-border)" }
            }
          >
            24x Hebel
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="gf-panel p-5 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Effektives Kapital</div>
          <div className="text-2xl font-bold" style={{ color: "var(--gf-gold)" }}>
            &euro;{effective.toLocaleString("de-DE")}
          </div>
          <div className="text-xs text-zinc-600 mt-1">{leverage}x Hebel</div>
        </div>
        <div className="gf-panel p-5 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Monatliche Projektion</div>
          <div className="text-2xl font-bold" style={{ color: "var(--gf-green)" }}>
            +&euro;{Math.round(monthlyReturn).toLocaleString("de-DE")}
          </div>
          <div className="text-xs text-zinc-600 mt-1">Ø bei {is24x ? "1%" : "1%"}/Tag</div>
        </div>
        <div className="gf-panel p-5 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Max. Verlust (DD 4.2%)</div>
          <div className="text-2xl font-bold" style={{ color: "var(--gf-red)" }}>
            -&euro;{Math.round(maxLoss).toLocaleString("de-DE")}
          </div>
          <div className="text-xs text-zinc-600 mt-1">Risk Shield aktiv</div>
        </div>
      </div>

      {/* Monthly Projection Table */}
      <div className="gf-panel p-6">
        <h3 className="font-semibold text-white mb-4">Projektion</h3>
        <div className="space-y-3">
          {projections.map(p => (
            <div key={p.months} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid var(--gf-border)" }}>
              <span className="text-sm text-zinc-400">{p.months} {p.months === 1 ? "Monat" : "Monate"}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold" style={{ color: "var(--gf-green)" }}>
                  +&euro;{Math.round(monthlyReturn * p.months).toLocaleString("de-DE")}
                </span>
                <span className="text-sm font-semibold text-white">
                  &euro;{Math.round(p.value).toLocaleString("de-DE")}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-zinc-700 mt-4">
          Projektionen basieren auf historischer Performance. Vergangene Ergebnisse sind keine Garantie fuer die Zukunft.
        </p>
      </div>
    </div>
  );
}
