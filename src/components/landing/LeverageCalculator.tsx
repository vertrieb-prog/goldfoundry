"use client";

import { useState } from "react";

const fmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
type Mode = "8x" | "24x";

function Slider({ label, display, min, max, step, value, onChange, minLabel, maxLabel }: {
  label: string; display: string; min: number; max: number;
  step: number; value: number; onChange: (v: number) => void;
  minLabel: string; maxLabel: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-semibold tracking-wider uppercase"
          style={{ color: "var(--gf-text-muted)" }}>{label}</label>
        <span className="font-mono font-bold text-sm"
          style={{ color: "var(--gf-gold)" }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "var(--gf-gold)", background: "var(--gf-surface)" }} />
      <div className="flex justify-between text-xs mt-1"
        style={{ color: "var(--gf-text-dim)" }}>
        <span>{minLabel}</span><span>{maxLabel}</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight, red }: {
  label: string; value: string; highlight?: boolean; red?: boolean;
}) {
  const gold = highlight && !red;
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm" style={{ color: "var(--gf-text-muted)" }}>{label}</span>
      <span className={`font-mono font-bold ${highlight ? "text-xl" : "text-base"}`}
        style={{
          color: red ? "var(--gf-red)" : gold ? undefined : "var(--gf-text-bright)",
          ...(gold ? {
            background: "linear-gradient(135deg, var(--gf-gold-light), var(--gf-gold))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          } : {}),
        }}>
        {value}
      </span>
    </div>
  );
}

export default function LeverageCalculator() {
  const [mode, setMode] = useState<Mode>("8x");
  const [capital, setCapital] = useState(5000);
  const [months, setMonths] = useState(6);

  const leverage = mode === "8x" ? 8 : 24;
  const maxDD = mode === "8x" ? 20 : 5;
  const effectiveCapital = capital * leverage;
  const dailyProfit = effectiveCapital * 0.01;
  const monthlyProfit = dailyProfit * 20;
  const totalProfit = monthlyProfit * months;
  const maxLoss = capital * (maxDD / 100);

  return (
    <section id="rechner" className="relative overflow-hidden">
      <div className="gf-section">
        <div className="text-center mb-12 animate-in">
          <span className="gf-eyebrow mb-4 block">RECHNER</span>
          <h2 className="gf-heading text-3xl md:text-5xl mb-4">Hebel-Rechner</h2>
          <p style={{ color: "var(--gf-text-muted)" }} className="text-lg max-w-xl mx-auto">
            Berechne dein effektives Kapital und potenzielle Gewinne.
          </p>
        </div>

        <div className="gf-panel p-6 md:p-10 max-w-4xl mx-auto"
          style={{ boxShadow: "0 0 60px rgba(212,165,55,0.06)", borderColor: "rgba(212,165,55,0.15)" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Controls */}
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-semibold tracking-wider uppercase mb-3"
                  style={{ color: "var(--gf-text-muted)" }}>Hebel-Modus</label>
                <div className="flex gap-2">
                  {(["8x", "24x"] as Mode[]).map((m) => (
                    <button key={m} onClick={() => setMode(m)}
                      className="flex-1 py-3 px-4 rounded-xl font-mono font-bold text-sm transition-all duration-200"
                      style={mode === m
                        ? { background: "var(--gf-gold)", color: "var(--gf-obsidian)" }
                        : { background: "transparent", border: "1px solid var(--gf-gold-dim)", color: "var(--gf-gold)" }
                      }>
                      {m === "8x" ? "8× Hebel" : "24× Hebel"}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--gf-text-dim)" }}>
                  {mode === "8x" ? "Konservativ · 20% Max Drawdown" : "Aggressiv · 5% Max Drawdown"}
                </p>
              </div>

              <Slider label="Kapital" display={fmt.format(capital)}
                min={500} max={100000} step={500} value={capital} onChange={setCapital}
                minLabel="500 €" maxLabel="100.000 €" />

              <Slider label="Zeithorizont"
                display={`${months} ${months === 1 ? "Monat" : "Monate"}`}
                min={1} max={12} step={1} value={months} onChange={setMonths}
                minLabel="1 Monat" maxLabel="12 Monate" />
            </div>

            {/* Results */}
            <div className="space-y-6 flex flex-col justify-center">
              <ResultRow label="Effektives Kapital" value={fmt.format(effectiveCapital)} highlight />
              <ResultRow label="Ø Tagesgewinn (1%)" value={fmt.format(dailyProfit)} />
              <ResultRow label="Monatsgewinn (20 Tage)" value={fmt.format(monthlyProfit)} />
              <ResultRow label={`Gesamtgewinn (${months} ${months === 1 ? "Monat" : "Monate"})`}
                value={fmt.format(totalProfit)} highlight />
              <ResultRow label="Max Verlust" value={fmt.format(maxLoss)} red />
            </div>
          </div>

          <p className="text-xs text-center mt-8 leading-relaxed"
            style={{ color: "var(--gf-text-dim)" }}>
            Keine Garantie fuer zukuenftige Ergebnisse. Trading birgt erhebliche Risiken.
            Vergangene Performance ist kein Indikator fuer zukuenftige Ergebnisse.
          </p>
        </div>
      </div>
    </section>
  );
}
