// src/app/admin/settlements/page.tsx — Admin: Profit Settlements
"use client";
import { useEffect, useState } from "react";

export default function AdminSettlementsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/accounts")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const sharing = data?.sharing ?? [];
  const accounts = data?.accounts ?? [];
  const masters = data?.masters ?? [];
  const profiles = data?.profiles ?? [];

  const getUser = (id: string) => profiles.find((p: any) => p.id === id);
  const getAccount = (id: string) => accounts.find((a: any) => a.id === id);
  const getMaster = (id: string) => masters.find((m: any) => m.id === id);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--gf-text-bright)" }}>Abrechnungen</h1>
      <p className="text-sm mb-6" style={{ color: "var(--gf-text-dim)" }}>Profit Sharing Agreements & Kopplungen</p>

      {/* Active Agreements */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--gf-text-bright)" }}>
        Aktive Kopplungen ({sharing.filter((s: any) => s.active).length})
      </h2>

      {sharing.length === 0 ? (
        <div className="gf-panel p-8 text-center" style={{ color: "var(--gf-text-dim)" }}>
          Keine Profit-Sharing Agreements vorhanden.
        </div>
      ) : (
        <div className="space-y-3">
          {sharing.map((s: any) => {
            const followerAcc = getAccount(s.follower_account_id);
            const master = getMaster(s.master_account_id);
            const follower = getUser(s.follower_user_id);
            const trader = getUser(s.trader_user_id);
            return (
              <div key={s.id} className="gf-panel p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${s.active ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-xs font-medium" style={{ color: s.active ? "var(--gf-green)" : "var(--gf-red)" }}>
                      {s.active ? "AKTIV" : "INAKTIV"}
                    </span>
                  </div>
                  <span className="text-[10px] mono" style={{ color: "var(--gf-text-dim)" }}>{s.billing_cycle}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Signal</div>
                    <div style={{ color: "var(--gf-gold)" }}>📡 {master?.name ?? "?"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Follower</div>
                    <div style={{ color: "var(--gf-text-bright)" }}>{follower?.email ?? "?"}</div>
                    <div className="text-[10px] mono" style={{ color: "var(--gf-text-dim)" }}>#{followerAcc?.mt_login ?? "?"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Equity</div>
                    <div className="mono font-medium" style={{ color: "var(--gf-text-bright)" }}>
                      ${Number(followerAcc?.current_equity ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>HWM</div>
                    <div className="mono" style={{ color: "var(--gf-text)" }}>${Number(s.hwm_equity ?? 0).toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 flex items-center gap-4 text-[10px]" style={{ borderTop: "1px solid var(--gf-border)" }}>
                  <span style={{ color: "var(--gf-text-dim)" }}>Split: Platform {s.platform_cut_pct}% · Trader {s.trader_cut_pct}%</span>
                  <span style={{ color: "var(--gf-text-dim)" }}>Trader: {trader?.email ?? "?"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
