// src/app/admin/accounts/page.tsx — Admin: All Accounts with Signal Mappings
"use client";
import { useEffect, useState } from "react";

interface Account {
  id: string;
  user_id: string;
  metaapi_account_id: string;
  account_type: string;
  account_name: string | null;
  firm_profile: string;
  broker_server: string;
  mt_login: string;
  platform: string;
  initial_balance: number;
  current_equity: number;
  copier_active: boolean;
  copier_paused_reason: string | null;
  master_account_id: string | null;
  created_at: string;
  last_sync: string | null;
  total_profit: number;
  win_rate: number;
  currency: string;
}

interface Master {
  id: string;
  metaapi_account_id: string;
  name: string;
  strategy_type: string;
  instruments: string[];
  active: boolean;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  subscription_tier: string;
  subscription_active: boolean;
}

interface Sharing {
  id: string;
  follower_account_id: string;
  master_account_id: string;
  trader_user_id: string;
  follower_user_id: string;
  active: boolean;
}

type TabType = "all" | "signal" | "copier" | "tracking";

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sharing, setSharing] = useState<Sharing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/accounts")
      .then(r => r.json())
      .then(d => {
        setAccounts(d.accounts ?? []);
        setMasters(d.masters ?? []);
        setProfiles(d.profiles ?? []);
        setSharing(d.sharing ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getUser = (userId: string) => profiles.find(p => p.id === userId);
  const getMaster = (masterId: string | null) => masters.find(m => m.id === masterId);
  const getSharing = (accountId: string) => sharing.find(s => s.follower_account_id === accountId);
  const getFollowerCount = (masterId: string) => sharing.filter(s => s.master_account_id === masterId && s.active).length;

  // Filter accounts
  const filtered = accounts.filter(a => {
    if (tab === "copier" && a.account_type !== "copier") return false;
    if (tab === "tracking" && a.account_type !== "tracking") return false;
    if (search) {
      const s = search.toLowerCase();
      const user = getUser(a.user_id);
      return (
        a.mt_login.includes(s) ||
        a.broker_server.toLowerCase().includes(s) ||
        (a.account_name ?? "").toLowerCase().includes(s) ||
        (user?.email ?? "").toLowerCase().includes(s) ||
        (user?.full_name ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: "Alle", count: accounts.length },
    { key: "signal", label: "Signal", count: masters.length },
    { key: "copier", label: "Copier", count: accounts.filter(a => a.account_type === "copier").length },
    { key: "tracking", label: "Tracking", count: accounts.filter(a => a.account_type === "tracking").length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--gf-text-bright)" }}>Account Verwaltung</h1>
      <p className="text-sm mb-6" style={{ color: "var(--gf-text-dim)" }}>Alle Konten — Signal, Copy und Tracking</p>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-md text-xs font-medium transition-all" style={{
                background: tab === t.key ? "rgba(212,165,55,0.1)" : "transparent",
                color: tab === t.key ? "var(--gf-gold)" : "var(--gf-text-dim)",
              }}>
              {t.label} <span className="mono ml-1">({t.count})</span>
            </button>
          ))}
        </div>
        <input type="text" placeholder="Suchen... (Login, Email, Broker)" value={search} onChange={e => setSearch(e.target.value)}
          className="gf-input !w-64 text-sm" />
      </div>

      {/* Signal Accounts Tab */}
      {tab === "signal" ? (
        <div className="space-y-4">
          {masters.length === 0 ? (
            <div className="gf-panel p-8 text-center" style={{ color: "var(--gf-text-dim)" }}>
              Keine Signal-Konten vorhanden. Erstelle eines unter "Signal-Konten".
            </div>
          ) : masters.map(m => (
            <div key={m.id} className="gf-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: "rgba(212,165,55,0.1)", border: "1px solid rgba(212,165,55,0.2)" }}>
                    📡
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: "var(--gf-text-bright)" }}>{m.name}</div>
                    <div className="text-xs mono" style={{ color: "var(--gf-text-dim)" }}>{m.metaapi_account_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full" style={{
                    background: m.active ? "rgba(39,174,96,0.1)" : "rgba(192,57,43,0.1)",
                    color: m.active ? "var(--gf-green)" : "var(--gf-red)",
                  }}>
                    {m.active ? "AKTIV" : "INAKTIV"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Strategie</div>
                  <div style={{ color: "var(--gf-text-bright)" }}>{m.strategy_type}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Instrumente</div>
                  <div style={{ color: "var(--gf-text-bright)" }}>{m.instruments.join(", ")}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Follower</div>
                  <div className="mono font-semibold" style={{ color: "var(--gf-gold)" }}>{getFollowerCount(m.id)}</div>
                </div>
              </div>

              {/* Connected Copier Accounts */}
              {sharing.filter(s => s.master_account_id === m.id).length > 0 && (
                <div className="border-t pt-3 mt-3" style={{ borderColor: "var(--gf-border)" }}>
                  <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--gf-text-dim)" }}>Gekoppelte Konten</div>
                  <div className="space-y-1">
                    {sharing.filter(s => s.master_account_id === m.id).map(s => {
                      const acc = accounts.find(a => a.id === s.follower_account_id);
                      const user = getUser(s.follower_user_id);
                      return (
                        <div key={s.id} className="flex items-center justify-between py-1.5 px-3 rounded text-xs" style={{ background: "rgba(255,255,255,0.02)" }}>
                          <div className="flex items-center gap-3">
                            <span className={`w-1.5 h-1.5 rounded-full ${s.active ? "bg-green-500" : "bg-red-500"}`} />
                            <span style={{ color: "var(--gf-text-bright)" }}>{user?.email ?? "?"}</span>
                            <span className="mono" style={{ color: "var(--gf-text-dim)" }}>#{acc?.mt_login ?? "?"}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="mono" style={{ color: "var(--gf-text)" }}>${Number(acc?.current_equity ?? 0).toLocaleString()}</span>
                            <span style={{ color: s.active ? "var(--gf-green)" : "var(--gf-red)" }}>{s.active ? "AKTIV" : "INAKTIV"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Accounts Table */
        <div className="gf-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
                  {["User", "Login", "Typ", "Broker", "Balance", "Equity", "Profit", "Signal", "Status", "Erstellt"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--gf-text-dim)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-sm" style={{ color: "var(--gf-text-dim)" }}>Keine Accounts gefunden</td></tr>
                ) : filtered.map(a => {
                  const user = getUser(a.user_id);
                  const master = getMaster(a.master_account_id);
                  const share = getSharing(a.id);
                  const profit = Number(a.total_profit ?? 0);
                  return (
                    <tr key={a.id} className="transition-colors hover:bg-white/[0.01]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      {/* User */}
                      <td className="px-4 py-3">
                        <div style={{ color: "var(--gf-text-bright)" }}>{user?.full_name ?? user?.email?.split("@")[0] ?? "?"}</div>
                        <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>{user?.email}</div>
                      </td>
                      {/* Login */}
                      <td className="px-4 py-3 mono" style={{ color: "var(--gf-text-bright)" }}>#{a.mt_login}</td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                          background: a.account_type === "copier" ? "rgba(212,165,55,0.1)" : "rgba(255,255,255,0.05)",
                          color: a.account_type === "copier" ? "var(--gf-gold)" : "var(--gf-text-dim)",
                        }}>
                          {a.account_type === "copier" ? "COPIER" : "TRACKING"}
                        </span>
                      </td>
                      {/* Broker */}
                      <td className="px-4 py-3">
                        <div className="text-xs" style={{ color: "var(--gf-text)" }}>{a.broker_server}</div>
                        <div className="text-[10px] mono" style={{ color: "var(--gf-text-dim)" }}>{a.platform.toUpperCase()}</div>
                      </td>
                      {/* Balance */}
                      <td className="px-4 py-3 mono" style={{ color: "var(--gf-text)" }}>
                        ${Number(a.initial_balance).toLocaleString()}
                      </td>
                      {/* Equity */}
                      <td className="px-4 py-3 mono font-medium" style={{ color: "var(--gf-text-bright)" }}>
                        ${Number(a.current_equity).toLocaleString()}
                      </td>
                      {/* Profit */}
                      <td className="px-4 py-3 mono font-medium" style={{ color: profit >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
                        {profit >= 0 ? "+" : ""}${profit.toLocaleString()}
                      </td>
                      {/* Signal */}
                      <td className="px-4 py-3">
                        {master ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)" }}>
                            📡 {master.name}
                          </span>
                        ) : (
                          <span className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>—</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        {a.account_type === "copier" ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${a.copier_active ? "bg-green-500" : "bg-red-500"}`} />
                            <span className="text-[10px]" style={{ color: a.copier_active ? "var(--gf-green)" : "var(--gf-red)" }}>
                              {a.copier_active ? "AKTIV" : a.copier_paused_reason ?? "PAUSIERT"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>Tracking</span>
                        )}
                      </td>
                      {/* Created */}
                      <td className="px-4 py-3 text-[10px] mono" style={{ color: "var(--gf-text-dim)" }}>
                        {new Date(a.created_at).toLocaleDateString("de-DE")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
