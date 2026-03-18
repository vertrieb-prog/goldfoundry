// src/app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import FeatureGate from "@/components/FeatureGate";

function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="gf-panel p-5 flex flex-col">
      <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--gf-text-dim)" }}>{label}</span>
      <span className="text-2xl md:text-3xl font-bold mt-1" style={{ color: color ?? "var(--gf-text-bright)" }}>{value}</span>
      {sub && <span className="text-xs mt-1" style={{ color: sub.startsWith("+") ? "var(--gf-green)" : sub.startsWith("-") ? "var(--gf-red)" : "var(--gf-text-dim)" }}>{sub}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { NOMINAL: "#27ae60", CAUTION: "#d4a537", WARNING: "#e67e22", CRITICAL: "#c0392b", GREEN: "#27ae60", YELLOW: "#d4a537", RED: "#c0392b" };
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold"><span className="w-2 h-2 rounded-full" style={{ background: colors[status] ?? "#5a4f3a" }} />{status}</span>;
}

function MiniChart({ data }: { data: number[] }) {
  if (!data.length) return null;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const w = 200; const h = 60;
  const points = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
      <defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d4a537" stopOpacity="0.3" /><stop offset="100%" stopColor="#d4a537" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#gc)" />
      <polyline points={points} fill="none" stroke="#d4a537" strokeWidth="1.5" />
    </svg>
  );
}

/* Demo equity curve: realistic upward trend with bumps */
const DEMO_EQUITY_CURVE = [
  23200, 23350, 23180, 23420, 23600, 23550, 23780, 23950, 24100, 24020,
  24280, 24150, 24400, 24650, 24580, 24800, 24720, 24950, 25100, 25020,
  25280, 25180, 25400, 25550, 25480, 25700, 25620, 25850, 26000, 25847,
];

/* Demo recent trades */
const DEMO_TRADES = [
  { symbol: "XAUUSD", direction: "BUY", pnl: 85.20 },
  { symbol: "US500", direction: "SELL", pnl: 42.10 },
  { symbol: "EURUSD", direction: "BUY", pnl: -18.50 },
  { symbol: "GBPJPY", direction: "SELL", pnl: 67.30 },
  { symbol: "XAUUSD", direction: "BUY", pnl: 135.80 },
];

function DemoBadge() {
  return (
    <div
      className="fixed top-20 right-6 z-50 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
      style={{
        background: "linear-gradient(135deg, rgba(212,165,55,0.15), rgba(212,165,55,0.05))",
        border: "1px solid rgba(212,165,55,0.25)",
        color: "var(--gf-gold)",
        boxShadow: "0 4px 20px rgba(212,165,55,0.1)",
        animation: "glow-pulse 3s ease-in-out infinite",
      }}
    >
      DEMO DATA
    </div>
  );
}

export default function DashboardPage() {
  const [copier, setCopier] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    fetch("/api/copier/status")
      .then(r => r.json())
      .then(d => {
        if (d.accounts?.length) {
          setCopier(d);
          setIsDemo(false);
        }
      })
      .catch(() => {});
  }, []);

  const accounts = copier?.accounts ?? [];
  const intel = copier?.intel;

  const totalEquity = isDemo ? 26102.55 : accounts.reduce((s: number, a: any) => s + (a.equity ?? 0), 0);
  const todayPnl = isDemo ? 312.40 : accounts.reduce((s: number, a: any) => s + (a.todayPnl ?? 0), 0);
  const totalCopied = isDemo ? 12 : accounts.reduce((s: number, a: any) => s + (a.todayCopied ?? 0), 0);
  const totalSkipped = isDemo ? 2 : accounts.reduce((s: number, a: any) => s + (a.todaySkipped ?? 0), 0);

  const equityCurve = isDemo
    ? DEMO_EQUITY_CURVE
    : Array.from({ length: 30 }, (_, i) => totalEquity * (0.95 + Math.random() * 0.1) + i * 50);

  return (
    <FeatureGate minTier="analyzer" featureName="Dashboard" landingPage="/pricing">
    <div>
      {isDemo && <DemoBadge />}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>Command Center</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>Dein Trading auf einen Blick. Alle Systeme autonom aktiv.</p>
        </div>
        {(intel || isDemo) && (
          <div className="gf-panel px-4 py-2 flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--gf-text-dim)" }}>FORGE INTEL</span>
            <StatusBadge status={isDemo ? "GREEN" : (intel?.risk_level ?? "GREEN")} />
            <span className="text-xs mono" style={{ color: "var(--gf-text-dim)" }}>{isDemo ? "TRENDING" : (intel?.regime ?? "—")}</span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <KPI
          label="Balance"
          value={isDemo ? "€25.847,32" : `€${totalEquity.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`}
          sub={isDemo ? "+€1.247,32 gesamt" : undefined}
        />
        <KPI
          label="Equity"
          value={isDemo ? "€26.102,55" : `€${totalEquity.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`}
          sub={isDemo ? "+€255,23 offen" : undefined}
        />
        <KPI
          label="Heute P&L"
          value={isDemo ? "+€312,40" : `${todayPnl >= 0 ? "+" : "-"}€${Math.abs(todayPnl).toFixed(2)}`}
          sub={isDemo ? "+1.2% heute" : undefined}
          color={isDemo ? "var(--gf-green)" : (todayPnl >= 0 ? "var(--gf-green)" : "var(--gf-red)")}
        />
        <KPI
          label="Drawdown"
          value={isDemo ? "2,8%" : "—"}
          sub={isDemo ? "von max. 5%" : undefined}
          color={isDemo ? "var(--gf-green)" : undefined}
        />
        <KPI
          label="Win Rate"
          value={isDemo ? "71,4%" : "—"}
          sub={isDemo ? "letzte 30 Tage" : undefined}
          color={isDemo ? "var(--gf-gold)" : undefined}
        />
        <KPI
          label="Total Trades"
          value={isDemo ? "847" : `${totalCopied}`}
          sub={isDemo ? "seit Kontoeröffnung" : `${totalSkipped} übersprungen`}
        />
      </div>

      {/* EQUITY CURVE */}
      <div className="gf-panel p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--gf-text-dim)" }}>Equity Curve · 30 Tage</span>
          <span className="text-lg font-bold gf-gold-text">
            {isDemo ? "€25.847,32" : `€${totalEquity.toLocaleString("de-DE", { minimumFractionDigits: 0 })}`}
          </span>
        </div>
        <MiniChart data={equityCurve} />
      </div>

      {/* TWO-COLUMN: Recent Trades + CTA (demo) or Account Cards (live) */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {isDemo ? (
          <>
            {/* Recent Trades (demo) */}
            <div className="gf-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs tracking-widest uppercase" style={{ color: "var(--gf-text-dim)" }}>Letzte Trades</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                  background: "rgba(212,165,55,0.08)",
                  color: "var(--gf-gold)",
                  border: "1px solid rgba(212,165,55,0.15)",
                }}>DEMO</span>
              </div>
              <div className="space-y-3">
                {DEMO_TRADES.map((t, i) => {
                  const isPos = t.pnl >= 0;
                  return (
                    <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < DEMO_TRADES.length - 1 ? "1px solid var(--gf-border)" : "none" }}>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{
                          background: t.direction === "BUY" ? "rgba(39,174,96,0.1)" : "rgba(192,57,43,0.1)",
                          color: t.direction === "BUY" ? "var(--gf-green)" : "var(--gf-red)",
                        }}>
                          {t.direction}
                        </span>
                        <span className="text-sm font-semibold mono" style={{ color: "var(--gf-text-bright)" }}>{t.symbol}</span>
                      </div>
                      <span className="text-sm font-bold mono" style={{ color: isPos ? "var(--gf-green)" : "var(--gf-red)" }}>
                        {isPos ? "+" : ""}€{Math.abs(t.pnl).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Card */}
            <div className="gf-panel p-8 flex flex-col items-center justify-center text-center" style={{
              background: "linear-gradient(135deg, var(--gf-panel), rgba(212,165,55,0.03))",
              border: "1px solid rgba(212,165,55,0.12)",
            }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{
                background: "rgba(212,165,55,0.08)",
                border: "1px solid rgba(212,165,55,0.15)",
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4a537" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--gf-text-bright)" }}>
                Verbinde dein erstes MT4/MT5 Konto
              </h3>
              <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--gf-text-dim)" }}>
                Echte Daten statt Demo. Verbinde jetzt dein MetaTrader-Konto und tracke deine Performance live.
              </p>
              <Link href="/dashboard/accounts/add" className="gf-btn text-sm !py-3 !px-8">
                Konto verbinden →
              </Link>
            </div>
          </>
        ) : (
          <>
            {accounts.map((acc: any) => (
              <div key={acc.id} className="gf-panel p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-sm" style={{ color: "var(--gf-text-bright)" }}>{acc.firmProfile?.toUpperCase()}</span>
                    <span className="text-xs ml-2 mono" style={{ color: "var(--gf-text-dim)" }}>{acc.mtLogin}</span>
                  </div>
                  <StatusBadge status={acc.status} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold" style={{ color: "var(--gf-text-bright)" }}>€{acc.equity?.toLocaleString("de-DE", { minimumFractionDigits: 0 })}</div>
                    <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Equity</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: acc.ddBuffer > 40 ? "var(--gf-green)" : acc.ddBuffer > 15 ? "var(--gf-gold)" : "var(--gf-red)" }}>{acc.ddBuffer}%</div>
                    <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>DD Buffer</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: acc.lastMultiplier > 0.8 ? "var(--gf-green)" : acc.lastMultiplier > 0.3 ? "var(--gf-gold)" : "var(--gf-red)" }}>{acc.lastMultiplier ?? "—"}x</div>
                    <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Multiplier</div>
                  </div>
                </div>
                {acc.lastFactors && (
                  <div className="mt-3 pt-3 flex gap-2 text-[10px] mono flex-wrap" style={{ borderTop: "1px solid var(--gf-border)", color: "var(--gf-text-dim)" }}>
                    <span>T:{acc.lastFactors.time}</span><span>N:{acc.lastFactors.news}</span><span>D:{acc.lastFactors.dd}</span>
                    <span>P:{acc.lastFactors.perf}</span><span>V:{acc.lastFactors.vol}</span><span>W:{acc.lastFactors.day}</span><span>I:{acc.lastFactors.intel}</span>
                  </div>
                )}
                <div className="mt-3 flex justify-between text-xs" style={{ color: "var(--gf-text-dim)" }}>
                  <span>Heute: {acc.todayCopied} kopiert / {acc.todaySkipped} geskippt</span>
                  <span style={{ color: acc.todayPnl >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>{acc.todayPnl >= 0 ? "+" : "-"}€{Math.abs(acc.todayPnl ?? 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {loading && <div className="text-center py-12" style={{ color: "var(--gf-text-dim)" }}>Lade Daten...</div>}

      {/* Risikohinweis */}
      <div className="mt-8 pt-6 text-xs" style={{ borderTop: "1px solid var(--gf-border)", color: "var(--gf-text-dim)" }}>
        <p>Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals führen. Vergangene Ergebnisse sind keine Garantie für zukünftige Performance.</p>
      </div>
    </div>
    </FeatureGate>
  );
}
