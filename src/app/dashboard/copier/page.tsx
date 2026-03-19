// src/app/dashboard/copier/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import FeatureGate from "@/components/FeatureGate";

const DEMO_INTEL = {
  risk_level: "GREEN", risk_score: 18, regime: "TRENDING",
  geopolitical_risk: "LOW",
  forecast_text: "Stabile Marktlage. Gold im Aufwärtstrend, moderate Volatilität. Optimale Bedingungen für Trend-Following.",
};

const DEMO_ACCOUNTS = [
  {
    id: "acc-1", firmProfile: "TEGAS FX 24x", platform: "MT5", mtLogin: "88401234",
    equity: 48250, ddBuffer: 67.2, lastMultiplier: 0.92, todayPnl: 312.40,
    copierActive: true, todayCopied: 8, todaySkipped: 2, pausedReason: null,
    lastFactors: { Time: 1.0, News: 1.0, DD: 0.92, Perf: 0.95, Vol: 0.88, Day: 1.0, Intel: 1.0 },
  },
  {
    id: "acc-2", firmProfile: "TAG Markets 12x", platform: "MT5", mtLogin: "77203456",
    equity: 24100, ddBuffer: 43.1, lastMultiplier: 0.65, todayPnl: 87.20,
    copierActive: true, todayCopied: 5, todaySkipped: 1, pausedReason: null,
    lastFactors: { Time: 1.0, News: 0.7, DD: 0.65, Perf: 0.85, Vol: 0.92, Day: 1.0, Intel: 0.9 },
  },
];

const RISK_COLORS: Record<string, string> = {
  GREEN: "var(--gf-green)", YELLOW: "var(--gf-gold)", ORANGE: "#f97316", RED: "var(--gf-red)", BLACK: "#666",
};

function StatCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="text-center p-3 rounded-xl" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
      <div className="text-xl font-bold font-['Outfit']" style={{ color: color || "var(--gf-text-bright)" }}>{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-[1.5px] mt-1" style={{ color: "var(--gf-text-dim)" }}>{label}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "var(--gf-text-dim)" }}>{sub}</div>}
    </div>
  );
}

export default function CopierPage() {
  const [accounts, setAccounts] = useState<any[]>(DEMO_ACCOUNTS);
  const [intel, setIntel] = useState<any>(DEMO_INTEL);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    fetch("/api/copier/status")
      .then(r => r.json())
      .then(d => { if (d.accounts?.length) { setAccounts(d.accounts); setIsDemo(false); } if (d.intel) setIntel(d.intel); })
      .catch(() => {});
  }, []);

  async function togglePause(accountId: string, active: boolean) {
    fetch("/api/copier/pause", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId, action: active ? "pause" : "resume" }) }).catch(() => {});
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, copierActive: !active } : a));
  }

  const riskColor = RISK_COLORS[intel?.risk_level] || "var(--gf-green)";

  return (
    <FeatureGate minTier="copier" featureName="Smart Copier" landingPage="/smart-copier">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="gf-heading text-2xl">Smart Copier</h1>
          <p className="text-sm text-zinc-500 mt-1">Autopilot Trading mit 7-Faktor Risk Shield</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && <span className="text-[9px] px-2.5 py-1 rounded-full font-mono tracking-wider" style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.12)" }}>DEMO</span>}
          <Link href="/dashboard/accounts/add" className="gf-btn gf-btn-sm">+ Konto verbinden</Link>
        </div>
      </div>

      {/* INTEL Bar */}
      {intel && (
        <div className="gf-panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[9px] font-mono tracking-[2px] text-zinc-500 uppercase">Forge Intel</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: riskColor, boxShadow: `0 0 8px ${riskColor}` }} />
              <span className="text-xs font-semibold" style={{ color: riskColor }}>{intel.risk_level}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
              <span className="text-[9px] text-zinc-500 font-mono">RISK</span>
              <span className="text-sm font-bold font-mono" style={{ color: riskColor }}>{intel.risk_score}/100</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
              <span className="text-[9px] text-zinc-500 font-mono">REGIME</span>
              <span className="text-sm font-semibold text-white">{intel.regime}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
              <span className="text-[9px] text-zinc-500 font-mono">GEO</span>
              <span className="text-sm font-semibold text-white">{intel.geopolitical_risk}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
              <span className="text-[9px] text-zinc-500 font-mono">STATUS</span>
              <span className="text-sm font-semibold" style={{ color: "var(--gf-green)" }}>OPTIMAL</span>
            </div>
          </div>
          {intel.forecast_text && <p className="text-xs text-zinc-500 leading-relaxed">{intel.forecast_text}</p>}
        </div>
      )}

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="gf-panel p-10 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl" style={{ background: "rgba(250,239,112,0.06)", border: "1px solid rgba(250,239,112,0.12)" }}>{"\u26a1"}</div>
          <h3 className="text-lg font-bold text-white mb-2">Kein Konto verbunden</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">Verbinde dein MetaTrader-Konto und der Smart Copier startet automatisch mit dem Risk Shield.</p>
          <Link href="/dashboard/accounts/add" className="gf-btn">Konto verbinden &rarr;</Link>
        </div>
      )}

      {/* Account Cards */}
      {accounts.map((acc: any) => (
        <div key={acc.id} className="gf-panel overflow-hidden">
          {/* Account Header */}
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--gf-border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: acc.copierActive ? "var(--gf-green)" : "var(--gf-red)", boxShadow: acc.copierActive ? "0 0 8px rgba(34,197,94,0.4)" : "none" }} />
              <div>
                <span className="font-semibold text-white">{acc.firmProfile}</span>
                <span className="text-xs text-zinc-600 font-mono ml-2">{acc.mtLogin}</span>
              </div>
              <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded" style={{
                background: acc.copierActive ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                color: acc.copierActive ? "var(--gf-green)" : "var(--gf-red)",
                border: `1px solid ${acc.copierActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
              }}>{acc.copierActive ? "ACTIVE" : "PAUSED"}</span>
            </div>
            <button onClick={() => togglePause(acc.id, acc.copierActive)} className={acc.copierActive ? "gf-btn-outline gf-btn-sm" : "gf-btn gf-btn-sm"}>
              {acc.copierActive ? "Pausieren" : "Fortsetzen"}
            </button>
          </div>

          {/* Stats */}
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
              <StatCard label="Equity" value={`\u20ac${acc.equity?.toLocaleString("de-DE")}`} />
              <StatCard label="DD Buffer" value={`${acc.ddBuffer}%`} color={acc.ddBuffer > 40 ? "var(--gf-green)" : acc.ddBuffer > 15 ? "var(--gf-gold)" : "var(--gf-red)"} />
              <StatCard label="Multiplier" value={`${acc.lastMultiplier}x`} color="var(--gf-gold)" />
              <StatCard label="Heute P&L" value={`${acc.todayPnl >= 0 ? "+" : ""}\u20ac${acc.todayPnl?.toFixed(0)}`} color={acc.todayPnl >= 0 ? "var(--gf-green)" : "var(--gf-red)"} />
              <StatCard label="Trades" value={`${acc.todayCopied}/${acc.todayCopied + acc.todaySkipped}`} sub={`${acc.todaySkipped} geskippt`} />
            </div>

            {/* Risk Factors */}
            {acc.lastFactors && (
              <div>
                <div className="text-[9px] font-mono tracking-[2px] text-zinc-600 mb-3">RISK FACTORS</div>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(acc.lastFactors).map(([k, v]: [string, any]) => {
                    const color = v >= 0.8 ? "var(--gf-green)" : v >= 0.5 ? "var(--gf-gold)" : "var(--gf-red)";
                    return (
                      <div key={k} className="text-center p-2 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                        <div className="text-xs font-bold font-mono" style={{ color }}>{(v * 100).toFixed(0)}%</div>
                        <div className="w-full h-1 rounded-full mt-1.5 mb-1" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${v * 100}%`, background: color }} />
                        </div>
                        <div className="text-[8px] uppercase font-mono text-zinc-600">{k}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {acc.pausedReason && (
              <div className="mt-4 p-3 rounded-lg flex items-start gap-2 text-xs" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", color: "var(--gf-red)" }}>
                <span>{"\u26a0\ufe0f"}</span> {acc.pausedReason}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Telegram Copier Link */}
      <div className="gf-panel p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(250,239,112,0.06)", border: "1px solid rgba(250,239,112,0.12)" }}>{"\ud83d\udce1"}</div>
          <div>
            <div className="text-sm font-semibold text-white">Telegram Copier</div>
            <div className="text-xs text-zinc-500">Signale aus Telegram-Channels automatisch kopieren</div>
          </div>
        </div>
        <Link href="/dashboard/telegram" className="gf-btn-outline gf-btn-sm">&Ouml;ffnen &rarr;</Link>
      </div>

      {/* How Risk Shield Works */}
      <div className="gf-panel p-5">
        <div className="text-[9px] font-mono tracking-[2px] text-zinc-600 mb-3">SO FUNKTIONIERT DER RISK SHIELD</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "\u23f0", title: "Session Filter", desc: "Tradet nur in optimalen Sessions" },
            { icon: "\ud83d\udcf0", title: "News Guard", desc: "Pausiert bei High-Impact News" },
            { icon: "\ud83d\udcc9", title: "DD Schutz", desc: "Reduziert Lots bei hohem Drawdown" },
            { icon: "\ud83c\udf0d", title: "Geo Intel", desc: "Analysiert geopolitische Risiken" },
          ].map(f => (
            <div key={f.title} className="p-3 rounded-lg text-center" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
              <div className="text-lg mb-1">{f.icon}</div>
              <div className="text-xs font-semibold text-white mb-0.5">{f.title}</div>
              <div className="text-[10px] text-zinc-600">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}
