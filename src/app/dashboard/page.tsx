// src/app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";

/* ── KPI Card ─────────────────────────────────────────── */
function KPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="gf-panel p-5 flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--gf-text-dim)" }}>{label}</span>
      <span className="text-2xl md:text-3xl font-bold mt-1.5" style={{ color: color ?? "var(--gf-text-bright)" }}>{value}</span>
      {sub && <span className="text-xs mt-1" style={{ color: sub.startsWith("+") ? "var(--gf-green)" : sub.startsWith("-") ? "var(--gf-red)" : "var(--gf-text-dim)" }}>{sub}</span>}
    </div>
  );
}

/* ── Mini Chart ───────────────────────────────────────── */
function MiniChart({ data }: { data: number[] }) {
  if (!data.length) return null;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const w = 200; const h = 60;
  const points = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
      <defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--gf-gold)" stopOpacity="0.3" /><stop offset="100%" stopColor="var(--gf-gold)" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#gc)" />
      <polyline points={points} fill="none" stroke="var(--gf-gold)" strokeWidth="1.5" />
    </svg>
  );
}

/* ── Quick Action Card ────────────────────────────────── */
function QuickAction({ icon, title, desc, href, accent }: { icon: string; title: string; desc: string; href: string; accent?: string }) {
  return (
    <Link href={href} className="gf-panel p-5 flex items-start gap-4 group">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{
        background: `${accent ?? "var(--gf-gold)"}10`,
        border: `1px solid ${accent ?? "var(--gf-gold)"}25`,
      }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white group-hover:text-[var(--gf-gold)] transition-colors">{title}</div>
        <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>
      </div>
      <span className="ml-auto text-zinc-700 group-hover:text-[var(--gf-gold)] transition-colors self-center">&rarr;</span>
    </Link>
  );
}

/* ── Demo Data ────────────────────────────────────────── */
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

/* ── Main Page ────────────────────────────────────────── */
export default function DashboardPage() {
  const { user, tier, isPaying, onboardingDone } = useUser();
  const [copier, setCopier] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [dismissedWelcome, setDismissedWelcome] = useState(false);

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
  const isNewUser = !isPaying && isDemo;

  return (
    <div>
      {/* ── Welcome Banner (new users) ────────────────── */}
      {isNewUser && !dismissedWelcome && (
        <div className="mb-6 p-6 rounded-2xl relative overflow-hidden" style={{
          background: "linear-gradient(135deg, rgba(250,239,112,0.06), rgba(250,239,112,0.02), var(--gf-panel))",
          border: "1px solid rgba(250,239,112,0.12)",
        }}>
          <button
            onClick={() => setDismissedWelcome(true)}
            className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 transition-colors text-sm"
          >&times;</button>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="gf-eyebrow mb-2">{"\u25c6"} Willkommen</div>
              <h2 className="text-xl font-bold text-white mb-2">Hey {firstName}, sch&ouml;n dass du da bist!</h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                {isPaying
                  ? "Verbinde jetzt dein MetaTrader-Konto und der Smart Copier startet automatisch."
                  : "Starte mit dem kostenlosen Dashboard oder aktiviere den Smart Copier f\u00fcr automatisches Trading."
                }
              </p>
              <div className="flex flex-wrap gap-2">
                {!isPaying && (
                  <Link href="/dashboard/upgrade" className="gf-btn gf-btn-sm">
                    Plan w&auml;hlen &rarr;
                  </Link>
                )}
                <Link href="/dashboard/accounts/add" className="gf-btn-outline gf-btn-sm">
                  Konto verbinden
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions (contextual) ────────────────── */}
      {isNewUser && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <QuickAction
            icon={"\ud83d\udcca"}
            title="Konto verbinden"
            desc="MT4/MT5 Login eingeben"
            href="/dashboard/accounts/add"
          />
          <QuickAction
            icon={"\ud83e\udde0"}
            title="FORGE Mentor"
            desc="Frag deinen KI-Berater"
            href="/dashboard/chat"
            accent="#a855f7"
          />
          <QuickAction
            icon={"\ud83d\udcb0"}
            title="Partner werden"
            desc="Bis zu 50% Provision"
            href="/dashboard/partner"
            accent="#22c55e"
          />
        </div>
      )}

      {/* ── KPIs ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
        <KPI label="Drawdown" value={isDemo ? "2,8%" : "\u2014"} color="var(--gf-green)" sub={isDemo ? "von max. 5%" : undefined} />
        <KPI label="Win Rate" value={isDemo ? "71,4%" : "\u2014"} color="var(--gf-gold)" sub={isDemo ? "30 Tage" : undefined} />
      </div>

      {/* ── Equity Curve ──────────────────────────────── */}
      <div className="gf-panel p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--gf-text-dim)" }}>Equity Curve</span>
            {isDemo && <span className="text-[9px] px-2 py-0.5 rounded-full font-mono" style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.15)" }}>DEMO</span>}
          </div>
          <span className="text-lg font-bold gf-gold-text">
            {isDemo ? "\u20ac25.847" : `\u20ac${totalEquity.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`}
          </span>
        </div>
        <MiniChart data={isDemo ? DEMO_EQUITY : Array.from({ length: 30 }, (_, i) => totalEquity * (0.95 + Math.random() * 0.1) + i * 50)} />
      </div>

      {/* ── Two Column: Trades + Next Steps ───────────── */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Recent Trades */}
        <div className="gf-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--gf-text-dim)" }}>Letzte Trades</span>
            {isDemo && <span className="text-[9px] px-2 py-0.5 rounded-full font-mono" style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)" }}>DEMO</span>}
          </div>
          <div className="space-y-2.5">
            {(isDemo ? DEMO_TRADES : []).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 4 ? "1px solid var(--gf-border)" : "none" }}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono" style={{
                    background: t.dir === "BUY" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: t.dir === "BUY" ? "var(--gf-green)" : "var(--gf-red)",
                  }}>{t.dir}</span>
                  <span className="text-sm font-semibold font-mono text-white">{t.symbol}</span>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: t.pnl >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
                  {t.pnl >= 0 ? "+" : ""}&euro;{Math.abs(t.pnl).toFixed(2)}
                </span>
              </div>
            ))}
            {!isDemo && accounts.length === 0 && (
              <p className="text-sm text-zinc-600 text-center py-4">Noch keine Trades. Verbinde ein Konto um loszulegen.</p>
            )}
          </div>
        </div>

        {/* CTA / Account Cards */}
        {isDemo ? (
          <div className="gf-panel p-8 flex flex-col items-center justify-center text-center" style={{
            background: "linear-gradient(135deg, var(--gf-panel), rgba(250,239,112,0.02))",
            border: "1px solid rgba(250,239,112,0.12)",
          }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl" style={{
              background: "rgba(250,239,112,0.06)", border: "1px solid rgba(250,239,112,0.15)",
            }}>+</div>
            <h3 className="text-base font-bold text-white mb-2">Erstes Konto verbinden</h3>
            <p className="text-sm text-zinc-500 mb-5 max-w-xs">Echte Daten statt Demo. Verbinde dein MetaTrader-Konto und tracke live.</p>
            <Link href="/dashboard/accounts/add" className="gf-btn gf-btn-sm">Konto verbinden &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc: any) => (
              <div key={acc.id} className="gf-panel p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-white">{acc.firmProfile?.toUpperCase()}</span>
                  <span className="text-xs font-mono" style={{ color: "var(--gf-text-dim)" }}>{acc.mtLogin}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">&euro;{acc.equity?.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</div>
                    <div className="text-[10px] text-zinc-500">EQUITY</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: acc.ddBuffer > 40 ? "var(--gf-green)" : acc.ddBuffer > 15 ? "var(--gf-gold)" : "var(--gf-red)" }}>{acc.ddBuffer}%</div>
                    <div className="text-[10px] text-zinc-500">DD BUFFER</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold" style={{ color: "var(--gf-gold)" }}>{acc.lastMultiplier ?? "\u2014"}x</div>
                    <div className="text-[10px] text-zinc-500">MULTI</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
