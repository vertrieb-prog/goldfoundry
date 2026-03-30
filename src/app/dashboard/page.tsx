// src/app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import ForgeChat from "@/components/ForgeChat";

/* -- KPI Card ------------------------------------------------ */
function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="gf-panel p-4 flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--gf-text-dim)" }}>{label}</span>
      <span className="text-xl font-bold mt-1" style={{ color: color ?? "var(--gf-text-bright)" }}>{value}</span>
      {sub && <span className="text-[10px] mt-0.5" style={{ color: sub.startsWith("+") ? "var(--gf-green)" : sub.startsWith("-") ? "var(--gf-red)" : "var(--gf-text-dim)" }}>{sub}</span>}
    </div>
  );
}

/* -- Mini Chart ---------------------------------------------- */
function MiniChart({ data }: { data: number[] }) {
  if (!data.length) return null;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const w = 200; const h = 50;
  const points = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--gf-gold)" stopOpacity="0.3" /><stop offset="100%" stopColor="var(--gf-gold)" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#gc)" />
      <polyline points={points} fill="none" stroke="var(--gf-gold)" strokeWidth="1.5" />
    </svg>
  );
}

/* -- Demo Data ----------------------------------------------- */
const DEMO_EQUITY = [
  23200, 23350, 23180, 23420, 23600, 23550, 23780, 23950, 24100, 24020,
  24280, 24150, 24400, 24650, 24580, 24800, 24720, 24950, 25100, 25020,
  25280, 25180, 25400, 25550, 25480, 25700, 25620, 25850, 26000, 25847,
];

const DEMO_TRADES = [
  { symbol: "XAUUSD", dir: "BUY", pnl: 85.20 },
  { symbol: "US500", dir: "SELL", pnl: 42.10 },
  { symbol: "EURUSD", dir: "BUY", pnl: -18.50 },
  { symbol: "GBPJPY", dir: "SELL", pnl: 67.30 },
  { symbol: "XAUUSD", dir: "BUY", pnl: 135.80 },
];

/* -- Main Page ----------------------------------------------- */
export default function DashboardPage() {
  const { user } = useUser();
  const [copier, setCopier] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    fetch("/api/copier/status")
      .then(r => r.json())
      .then(d => { if (d.accounts?.length) { setCopier(d); setIsDemo(false); } })
      .catch(() => {});
  }, []);

  const accounts = copier?.accounts ?? [];
  const totalEquity = isDemo ? 26102.55 : accounts.reduce((s: number, a: any) => s + (a.equity ?? 0), 0);
  const todayPnl = isDemo ? 312.40 : accounts.reduce((s: number, a: any) => s + (a.todayPnl ?? 0), 0);
  const firstName = user?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Trader";

  return (
    <div>
      {/* Greeting */}
      <div className="mb-4">
        <h1 className="text-lg font-bold text-white">Hey {firstName} <span className="text-zinc-500 font-normal text-sm">| Command Center</span></h1>
      </div>

      {/* Two-Column Layout: Chat (60%) + Sidebar (40%) */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ height: "calc(100vh - 10rem)" }}>

        {/* LEFT: FORGE Mentor Chat */}
        <div className="w-full lg:w-[60%] min-h-[500px] lg:min-h-0">
          <ForgeChat />
        </div>

        {/* RIGHT: KPIs + Chart + Trades + Accounts */}
        <div className="w-full lg:w-[40%] flex flex-col gap-3 overflow-auto">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <KPI
              label="Equity"
              value={isDemo ? "\u20ac26.102" : `\u20ac${totalEquity.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`}
              sub={isDemo ? "Demo" : undefined}
            />
            <KPI
              label="Heute P&L"
              value={isDemo ? "+\u20ac312" : `${todayPnl >= 0 ? "+" : ""}\u20ac${todayPnl.toFixed(0)}`}
              color={isDemo ? "var(--gf-green)" : (todayPnl >= 0 ? "var(--gf-green)" : "var(--gf-red)")}
              sub={isDemo ? "Demo" : undefined}
            />
            <KPI label="Drawdown" value={isDemo ? "2,8%" : "\u2014"} color="var(--gf-green)" sub={isDemo ? "max 5%" : undefined} />
          </div>

          {/* Equity Curve */}
          <div className="gf-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--gf-text-dim)" }}>Equity Curve</span>
                {isDemo && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.15)" }}>DEMO</span>}
              </div>
              <span className="text-sm font-bold gf-gold-text">
                {isDemo ? "\u20ac25.847" : `\u20ac${totalEquity.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`}
              </span>
            </div>
            <MiniChart data={isDemo ? DEMO_EQUITY : Array.from({ length: 30 }, (_, i) => totalEquity * (0.95 + Math.random() * 0.1) + i * 50)} />
          </div>

          {/* Recent Trades */}
          <div className="gf-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--gf-text-dim)" }}>Letzte Trades</span>
              {isDemo && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)" }}>DEMO</span>}
            </div>
            <div className="space-y-1.5">
              {(isDemo ? DEMO_TRADES : []).map((t, i) => (
                <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < 4 ? "1px solid var(--gf-border)" : "none" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono" style={{
                      background: t.dir === "BUY" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: t.dir === "BUY" ? "var(--gf-green)" : "var(--gf-red)",
                    }}>{t.dir}</span>
                    <span className="text-xs font-semibold font-mono text-white">{t.symbol}</span>
                  </div>
                  <span className="text-xs font-bold font-mono" style={{ color: t.pnl >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
                    {t.pnl >= 0 ? "+" : ""}&euro;{Math.abs(t.pnl).toFixed(2)}
                  </span>
                </div>
              ))}
              {!isDemo && accounts.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-3">Noch keine Trades.</p>
              )}
            </div>
          </div>

          {/* Account Cards / CTA */}
          {isDemo ? (
            <div className="gf-panel p-5 flex flex-col items-center text-center" style={{
              background: "linear-gradient(135deg, var(--gf-panel), rgba(250,239,112,0.02))",
              border: "1px solid rgba(250,239,112,0.12)",
            }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-lg" style={{
                background: "rgba(250,239,112,0.06)", border: "1px solid rgba(250,239,112,0.15)",
              }}>+</div>
              <h3 className="text-sm font-bold text-white mb-1">Konto verbinden</h3>
              <p className="text-xs text-zinc-500 mb-3">Echte Daten statt Demo. MetaTrader verbinden.</p>
              <Link href="/dashboard/konto" className="gf-btn gf-btn-sm text-xs">Verbinden &rarr;</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc: any) => (
                <div key={acc.id} className="gf-panel p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-white">{acc.firmProfile?.toUpperCase()}</span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--gf-text-dim)" }}>{acc.mtLogin}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-bold text-white">&euro;{acc.equity?.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</div>
                      <div className="text-[9px] text-zinc-500">EQUITY</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: acc.ddBuffer > 40 ? "var(--gf-green)" : acc.ddBuffer > 15 ? "var(--gf-gold)" : "var(--gf-red)" }}>{acc.ddBuffer}%</div>
                      <div className="text-[9px] text-zinc-500">DD BUFFER</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--gf-gold)" }}>{acc.lastMultiplier ?? "\u2014"}x</div>
                      <div className="text-[9px] text-zinc-500">MULTI</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
