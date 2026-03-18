// src/app/dashboard/strategy/page.tsx
"use client";
import { useState } from "react";

const DEMO_ANALYSIS = {
  overallScore: 7.8,
  strategyType: "XAUUSD Asian Scalper",
  summary: "Profitabler Scalper mit gutem Risk/Reward. Schwaeche bei News-Events.",
  metrics: {
    sharpe: 1.84,
    profitFactor: 2.1,
    maxDD: 4.2,
    winRate: 68,
    avgTrade: 12.4,
  },
  optimizations: [
    { parameter: "SL", current: "30 pips", recommended: "42 pips", reason: "Historisch 23% besser" },
    { parameter: "News Filter", current: "Aus", recommended: "An", reason: "NFP/FOMC Auto-Pause" },
    { parameter: "Session", current: "24h", recommended: "Asian Only", reason: "Nacht-Boost +30%" },
    { parameter: "Lot Size", current: "Fixed", recommended: "Dynamic", reason: "DD-basiert" },
  ],
  monteCarlo: "95% Wahrscheinlichkeit: Max DD unter 6.8%",
};

export default function StrategyPage() {
  const [tab, setTab] = useState<"code" | "backtest">("code");
  const [code, setCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    setLoading(true);
    try {
      const formData = new FormData();
      if (tab === "code") { formData.append("code", code); formData.append("type", "mql4"); }
      else if (file) { formData.append("file", file); formData.append("type", "backtest_csv"); }
      const res = await fetch("/api/strategy/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.uploadId) {
        const poll = setInterval(async () => {
          try {
            const r = await fetch(`/api/strategy/upload?id=${data.uploadId}`);
            const d = await r.json();
            if (d.status === "complete" || d.status === "failed") { setAnalysis(d); setLoading(false); clearInterval(poll); }
          } catch { setLoading(false); clearInterval(poll); }
        }, 2000);
      } else { setLoading(false); }
    } catch { setLoading(false); }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>Strategy Lab</h1>
        <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider" style={{ background: "rgba(212,165,55,0.15)", color: "var(--gf-gold)" }}>DEMO DATA</span>
      </div>
      <p className="text-sm mb-8" style={{ color: "var(--gf-text-dim)" }}>Lade deinen MQL4-Code oder Backtest hoch — FORGE analysiert und optimiert.</p>

      {/* Upload Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("code")} className={tab === "code" ? "gf-btn text-xs" : "gf-btn-outline text-xs"}>MQL4/MQL5 Code</button>
        <button onClick={() => setTab("backtest")} className={tab === "backtest" ? "gf-btn text-xs" : "gf-btn-outline text-xs"}>Backtest Upload</button>
      </div>

      {/* Upload Form */}
      <div className="gf-panel p-6 mb-6">
        {tab === "code" ? (
          <textarea className="gf-input mono text-sm h-64 resize-y" placeholder="// Paste deinen MQL4/MQL5 Code hier ein..." value={code} onChange={e => setCode(e.target.value)} />
        ) : (
          <div className="border-2 border-dashed rounded p-12 text-center cursor-pointer" style={{ borderColor: "var(--gf-border)" }}
            onClick={() => document.getElementById("fileInput")?.click()}>
            <input id="fileInput" type="file" className="hidden" accept=".csv,.html,.htm,.xlsx" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <p style={{ color: "var(--gf-text-dim)" }}>{file ? file.name : "Datei hier reinziehen oder klicken"}</p>
            <p className="text-xs mt-2" style={{ color: "var(--gf-text-dim)" }}>MT4 Report (.html), CSV, Myfxbook Export</p>
          </div>
        )}
        <button onClick={handleUpload} className="gf-btn mt-4" disabled={loading || (tab === "code" ? !code : !file)}>
          {loading ? "Analysiere..." : "FORGE analysieren lassen"}
        </button>
      </div>

      {/* Live analysis result (if any) */}
      {analysis?.ai_analysis && (
        <div className="gf-panel p-6 mb-6 animate-in">
          <h3 className="font-semibold mb-4 gf-gold-text">Live Analyse-Ergebnis</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs tracking-widest mb-2" style={{ color: "var(--gf-text-dim)" }}>SCORE</div>
              <div className="text-5xl font-bold gf-gold-text">{analysis.ai_analysis.overallScore ?? "\u2014"}<span className="text-lg">/10</span></div>
            </div>
            <div>
              <div className="text-xs tracking-widest mb-2" style={{ color: "var(--gf-text-dim)" }}>TYP</div>
              <div className="text-lg font-semibold" style={{ color: "var(--gf-text-bright)" }}>{analysis.ai_analysis.strategyType ?? "\u2014"}</div>
              <div className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>{analysis.ai_analysis.summary}</div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Analysis Result */}
      <div className="gf-panel p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="font-semibold gf-gold-text">Demo Analyse-Ergebnis</h3>
          <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: "rgba(212,165,55,0.1)", color: "var(--gf-gold)" }}>Beispiel</span>
        </div>

        {/* Score + Type */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-xs tracking-widest mb-2" style={{ color: "var(--gf-text-dim)" }}>SCORE</div>
            <div className="text-5xl font-bold gf-gold-text">{DEMO_ANALYSIS.overallScore}<span className="text-lg">/10</span></div>
          </div>
          <div>
            <div className="text-xs tracking-widest mb-2" style={{ color: "var(--gf-text-dim)" }}>TYP</div>
            <div className="text-lg font-semibold" style={{ color: "var(--gf-text-bright)" }}>{DEMO_ANALYSIS.strategyType}</div>
            <div className="text-sm mt-1" style={{ color: "var(--gf-text)" }}>{DEMO_ANALYSIS.summary}</div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "SHARPE", value: DEMO_ANALYSIS.metrics.sharpe.toString(), color: "var(--gf-text-bright)" },
            { label: "PROFIT FACTOR", value: DEMO_ANALYSIS.metrics.profitFactor.toString(), color: "var(--gf-green)" },
            { label: "MAX DD", value: DEMO_ANALYSIS.metrics.maxDD + "%", color: "var(--gf-green)" },
            { label: "WIN RATE", value: DEMO_ANALYSIS.metrics.winRate + "%", color: "var(--gf-text-bright)" },
            { label: "AVG TRADE", value: DEMO_ANALYSIS.metrics.avgTrade + " pips", color: "var(--gf-text-bright)" },
          ].map((m, i) => (
            <div key={i} className="text-center p-3 rounded" style={{ background: "var(--gf-obsidian)" }}>
              <div className="text-xl font-bold mono" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] tracking-wider mt-1" style={{ color: "var(--gf-text-dim)" }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Optimizations */}
        <div className="mb-6 pt-4" style={{ borderTop: "1px solid var(--gf-border)" }}>
          <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>OPTIMIERUNGSVORSCHL&Auml;GE</div>
          {DEMO_ANALYSIS.optimizations.map((o, i) => (
            <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid var(--gf-border)" }}>
              <span className="text-sm font-bold mt-0.5" style={{ color: "var(--gf-gold)" }}>{i + 1}.</span>
              <div>
                <span className="font-semibold text-sm" style={{ color: "var(--gf-text-bright)" }}>{o.parameter}</span>
                <span className="text-sm" style={{ color: "var(--gf-text)" }}>: {o.current}</span>
                <span className="text-sm" style={{ color: "var(--gf-text-dim)" }}> {"\u2192"} </span>
                <span className="text-sm font-semibold" style={{ color: "var(--gf-green)" }}>{o.recommended}</span>
                <br />
                <span className="text-xs" style={{ color: "var(--gf-text-dim)" }}>{o.reason}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Monte Carlo */}
        <div className="p-4 rounded" style={{ background: "var(--gf-obsidian)" }}>
          <div className="text-xs tracking-widest mb-2" style={{ color: "var(--gf-text-dim)" }}>MONTE CARLO SIMULATION</div>
          <div className="text-sm font-semibold" style={{ color: "var(--gf-green)" }}>{DEMO_ANALYSIS.monteCarlo}</div>
        </div>
      </div>
    </div>
  );
}
