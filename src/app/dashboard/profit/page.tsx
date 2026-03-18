// src/app/dashboard/profit/page.tsx
"use client";
import { useEffect, useState } from "react";

const DEMO_TRADER = {
  earnings: {
    lifetime_trader_payout: 4280,
    pending_balance: 892.40,
  },
  realtime: {
    followerCount: 34,
    totalAUM: 482000,
    totalEstimatedPayout: 892.40,
    followers: [
      { login: 70441, firm: "TEGAS FX", equity: 52400, unrealizedProfit: 1840, estimatedTraderPayout: 1104, profitable: true },
      { login: 70892, firm: "TAG Markets", equity: 28300, unrealizedProfit: 620, estimatedTraderPayout: 372, profitable: true },
      { login: 71205, firm: "TEGAS FX", equity: 104000, unrealizedProfit: 3200, estimatedTraderPayout: 1920, profitable: true },
      { login: 71488, firm: "TAG Markets", equity: 15800, unrealizedProfit: -240, estimatedTraderPayout: 0, profitable: false },
      { login: 71933, firm: "TEGAS FX", equity: 41200, unrealizedProfit: 890, estimatedTraderPayout: 534, profitable: true },
    ],
  },
};

const DEMO_FOLLOWER = {
  subscriptions: [
    {
      strategyName: "Alpha Gold Scalper",
      strategyType: "XAUUSD Scalping",
      active: true,
      equity: 12400,
      currentProfit: 1240,
    },
  ],
};

export default function ProfitPage() {
  const [trader, setTrader] = useState<any>(DEMO_TRADER);
  const [follower, setFollower] = useState<any>(DEMO_FOLLOWER);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    fetch("/api/profit-sharing/trader-dashboard")
      .then(r => r.json())
      .then(d => {
        if (d.realtime?.followerCount > 0 || d.earnings) {
          setTrader(d);
          setIsDemo(false);
        }
      })
      .catch(() => {});
    fetch("/api/profit-sharing/follower-view")
      .then(r => r.json())
      .then(d => {
        if (d.subscriptions?.length > 0) {
          setFollower(d);
          setIsDemo(false);
        }
      })
      .catch(() => {});
  }, []);

  const e = trader?.earnings ?? {};
  const rt = trader?.realtime;

  return (
    <div>
      {isDemo && (
        <div
          className="fixed top-20 right-6 z-50 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
          style={{
            background: "linear-gradient(135deg, rgba(212,165,55,0.15), rgba(212,165,55,0.05))",
            border: "1px solid rgba(212,165,55,0.25)",
            color: "var(--gf-gold)",
            boxShadow: "0 4px 20px rgba(212,165,55,0.1)",
          }}
        >
          DEMO DATA
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--gf-text-bright)" }}>Profit Sharing</h1>
      <p className="text-sm mb-8" style={{ color: "var(--gf-text-dim)" }}>40% Gold Foundry &middot; 60% Trader &middot; High Water Mark gesch\u00fctzt</p>

      {/* TRADER VIEW */}
      {rt && rt.followerCount > 0 && (
        <div className="mb-8">
          <div className="text-xs tracking-widest mb-4" style={{ color: "var(--gf-text-dim)" }}>ALS SIGNAL PROVIDER</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="gf-panel p-4 text-center">
              <div className="text-2xl font-bold gf-gold-text">\u20ac{Number(e.lifetime_trader_payout ?? 0).toLocaleString("de-DE")}</div>
              <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Lifetime Verdient</div>
            </div>
            <div className="gf-panel p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>\u20ac{Number(e.pending_balance ?? 0).toFixed(2)}</div>
              <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Auszahlbar</div>
            </div>
            <div className="gf-panel p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{rt.followerCount}</div>
              <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Follower</div>
            </div>
            <div className="gf-panel p-4 text-center">
              <div className="text-2xl font-bold gf-gold-text">\u20ac{rt.totalAUM?.toLocaleString("de-DE")}</div>
              <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>AUM</div>
            </div>
          </div>

          <div className="gf-panel p-5">
            <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>ECHTZEIT-SCH\u00c4TZUNG (n\u00e4chstes Settlement)</div>
            <div className="text-3xl font-bold gf-gold-text mb-4">~\u20ac{rt.totalEstimatedPayout?.toFixed(2)}</div>
            <div className="space-y-0">
              {/* Header */}
              <div className="grid grid-cols-5 gap-2 py-2 text-[10px] tracking-widest uppercase" style={{ color: "var(--gf-text-dim)", borderBottom: "1px solid var(--gf-border)" }}>
                <span>Login</span>
                <span>Firma</span>
                <span className="text-right">Equity</span>
                <span className="text-right">Unrealized</span>
                <span className="text-right">Dein Payout</span>
              </div>
              {rt.followers?.map((f: any, i: number) => (
                <div key={i} className="grid grid-cols-5 gap-2 py-3 text-sm" style={{ borderBottom: "1px solid var(--gf-border)" }}>
                  <span className="mono" style={{ color: "var(--gf-text-dim)" }}>{f.login}</span>
                  <span style={{ color: "var(--gf-text-bright)" }}>{f.firm}</span>
                  <span className="text-right mono" style={{ color: "var(--gf-text)" }}>\u20ac{f.equity?.toLocaleString("de-DE")}</span>
                  <span className="text-right mono" style={{ color: f.profitable ? "var(--gf-green)" : "var(--gf-red)" }}>
                    {f.profitable ? "+" : ""}\u20ac{f.unrealizedProfit?.toLocaleString("de-DE")}
                  </span>
                  <span className="text-right mono font-semibold" style={{ color: f.profitable ? "var(--gf-gold)" : "var(--gf-text-dim)" }}>
                    {f.profitable ? `\u20ac${f.estimatedTraderPayout?.toLocaleString("de-DE")}` : "HWM nicht erreicht"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOLLOWER VIEW */}
      {follower?.subscriptions?.length > 0 && (
        <div>
          <div className="text-xs tracking-widest mb-4" style={{ color: "var(--gf-text-dim)" }}>ALS FOLLOWER</div>
          {follower.subscriptions.map((sub: any, i: number) => (
            <div key={i} className="gf-panel p-5 mb-3">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-semibold" style={{ color: "var(--gf-text-bright)" }}>{sub.strategyName}</span>
                  <span className="text-xs ml-2" style={{ color: "var(--gf-text-dim)" }}>{sub.strategyType}</span>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: sub.active ? "rgba(39,174,96,0.1)" : "rgba(192,57,43,0.1)", color: sub.active ? "var(--gf-green)" : "var(--gf-red)" }}>
                  {sub.active ? "Aktiv" : "Inaktiv"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold" style={{ color: "var(--gf-text-bright)" }}>\u20ac{sub.equity?.toLocaleString("de-DE")}</div>
                  <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Equity</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: sub.currentProfit > 0 ? "var(--gf-green)" : "var(--gf-text-dim)" }}>+\u20ac{sub.currentProfit?.toLocaleString("de-DE")}</div>
                  <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Profit seit HWM</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: "var(--gf-gold)" }}>40/60</div>
                  <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Platform/Trader</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risikohinweis */}
      <div className="mt-8 pt-6 text-xs" style={{ borderTop: "1px solid var(--gf-border)", color: "var(--gf-text-dim)" }}>
        <p>Profit Sharing basiert auf dem High Water Mark Prinzip. Auszahlungen erfolgen nur bei neuem Gewinn \u00fcber dem bisherigen H\u00f6chststand.</p>
      </div>
    </div>
  );
}
