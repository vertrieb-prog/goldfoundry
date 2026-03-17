// src/app/dashboard/profit/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function ProfitPage() {
  const [trader, setTrader] = useState<any>(null);
  const [follower, setFollower] = useState<any>(null);

  useEffect(() => {
    fetch("/api/profit-sharing/trader-dashboard").then(r => r.json()).then(setTrader);
    fetch("/api/profit-sharing/follower-view").then(r => r.json()).then(setFollower);
  }, []);

  const e = trader?.earnings ?? {};
  const rt = trader?.realtime;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--gf-text-bright)" }}>📈 Profit Sharing</h1>
      <p className="text-sm mb-8" style={{ color: "var(--gf-text-dim)" }}>40% Gold Foundry · 60% Trader · High Water Mark geschützt</p>

      {/* TRADER VIEW */}
      {rt && rt.followerCount > 0 && (
        <div className="mb-8">
          <div className="text-xs tracking-widest mb-4" style={{ color: "var(--gf-text-dim)" }}>ALS SIGNAL PROVIDER</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="gf-panel p-4 text-center"><div className="text-2xl font-bold gf-gold-text">${Number(e.lifetime_trader_payout ?? 0).toFixed(0)}</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Lifetime Verdient</div></div>
            <div className="gf-panel p-4 text-center"><div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>${Number(e.pending_balance ?? 0).toFixed(2)}</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Auszahlbar</div></div>
            <div className="gf-panel p-4 text-center"><div className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>{rt.followerCount}</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Follower</div></div>
            <div className="gf-panel p-4 text-center"><div className="text-2xl font-bold gf-gold-text">${rt.totalAUM?.toLocaleString()}</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>AUM</div></div>
          </div>

          <div className="gf-panel p-5">
            <div className="text-xs tracking-widest mb-3" style={{ color: "var(--gf-text-dim)" }}>ECHTZEIT-SCHÄTZUNG (nächstes Settlement)</div>
            <div className="text-3xl font-bold gf-gold-text mb-2">~${rt.totalEstimatedPayout?.toFixed(2)}</div>
            <div className="space-y-2">
              {rt.followers?.map((f: any, i: number) => (
                <div key={i} className="flex justify-between py-2 text-sm" style={{ borderBottom: "1px solid var(--gf-border)" }}>
                  <span className="mono" style={{ color: "var(--gf-text-dim)" }}>{f.login} ({f.firm})</span>
                  <span style={{ color: f.profitable ? "var(--gf-green)" : "var(--gf-text-dim)" }}>
                    {f.profitable ? `+$${f.unrealizedProfit} → $${f.estimatedTraderPayout} für dich` : `HWM nicht überschritten`}
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
                <div><div className="text-lg font-bold" style={{ color: "var(--gf-text-bright)" }}>${sub.equity?.toLocaleString()}</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Equity</div></div>
                <div><div className="text-lg font-bold" style={{ color: sub.currentProfit > 0 ? "var(--gf-green)" : "var(--gf-text-dim)" }}>+${sub.currentProfit}</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Profit seit HWM</div></div>
                <div><div className="text-lg font-bold" style={{ color: "var(--gf-gold)" }}>40/60</div><div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Platform/Trader</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!rt?.followerCount && !follower?.subscriptions?.length && (
        <div className="gf-panel p-12 text-center" style={{ color: "var(--gf-text-dim)" }}>
          Profit Sharing wird aktiv sobald du als Signal Provider Follower hast oder einem Trader folgst.
        </div>
      )}
    </div>
  );
}
