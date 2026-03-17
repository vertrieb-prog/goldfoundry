// src/app/dashboard/strategy/page.tsx
"use client";
import { useState } from "react";

export default function StrategyPage() {
  const [tab, setTab] = useState<"code" | "backtest">("code");
  const [code, setCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    setLoading(true);
    const formData = new FormData();
    if (tab === "code") { formData.append("code", code); formData.append("type", "mql4"); }
    else if (file) { formData.append("file", file); formData.append("type", "backtest_csv"); }
    const res = await fetch("/api/strategy/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.uploadId) {
      // Poll for result
      const poll = setInterval(async () => {
        const r = await fetch(`/api/strategy/upload?id=${data.uploadId}`);
        const d = await r.json();
        if (d.status === "complete" || d.status === "failed") { setAnalysis(d); setLoading(false); clearInterval(poll); }
      }, 2000);
    } else { setLoading(false); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--gf-text-bright)" }}>🔬 Strategy Lab</h1>
      <p className="text-sm mb-8" style={{ color: "var(--gf-text-dim)" }}>Lade deinen MQL4-Code oder Backtest hoch — FORGE analysiert und optimiert.</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("code")} className={tab === "code" ? "gf-btn text-xs" : "gf-btn-outline text-xs"}>MQL4/MQL5 Code</button>
        <button onClick={() => setTab("backtest")} className={tab === "backtest" ? "gf-btn text-xs" : "gf-btn-outline text-xs"}>Backtest Upload</button>
      </div>

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
          {loading ? "Analysiere..." : "FORGE analysieren lassen →"}
        </button>
      </div>

      {analysis?.ai_analysis && (
        <div className="gf-panel p-6 animate-in">
          <h3 className="font-semibold mb-4 gf-gold-text">Analyse-Ergebnis</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs tracking-widest mb-2" style={{ color: "var(--gf-text-dim)" }}>SCORE</div>
              <div className="text-5xl font-bold gf-gold-text">{analysis.ai_analysis.overallScore ?? "—"}<span className="text-lg">/10</span></div>
            </div>
            <div>
              <div className="text-xs tracking-widest mb-2" style={{ color: "var(--gf-text-dim)" }}>TYP</div>
              <div className="text-lg font-semibold" style={{ color: "var(--gf-text-bright)" }}>{analysis.ai_analysis.strategyType ?? "—"}</div>
              <div className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>{analysis.ai_analysis.summary}</div>
            </div>
          </div>
          {analysis.ai_analysis.optimizations?.length > 0 && (
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--gf-border)" }}>
              <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>OPTIMIERUNGSVORSCHLÄGE</div>
              {analysis.ai_analysis.optimizations.map((o: any, i: number) => (
                <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid var(--gf-border)" }}>
                  <span style={{ color: "var(--gf-gold)" }}>→</span>
                  <div><span className="font-semibold text-sm" style={{ color: "var(--gf-text-bright)" }}>{o.parameter}</span>: {o.current} → <span style={{ color: "var(--gf-green)" }}>{o.recommended}</span><br /><span className="text-xs" style={{ color: "var(--gf-text-dim)" }}>{o.reason}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
