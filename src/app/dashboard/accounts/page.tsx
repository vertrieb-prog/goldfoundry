// src/app/dashboard/accounts/page.tsx — Account Tracking Overview (MyFXBook-style)
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Account {
  id: string;
  account_name: string;
  broker_server: string;
  mt_login: string;
  mt_password: string | null;
  platform: string;
  initial_balance: number;
  current_equity: number;
  equity_high: number;
  currency: string;
  leverage: number;
  total_trades: number;
  total_profit: number;
  win_rate: number;
  copier_active: boolean;
  account_type: string;
  linked_channel: string | null;
  last_signal: { time: string; action: string; symbol: string; status: string } | null;
  last_sync: string | null;
  created_at: string;
}

/* ── Demo accounts ── */
const DEMO_ACCOUNTS: Account[] = [
  {
    id: "demo-1",
    account_name: "Gold Scalper Pro",
    broker_server: "ICMarkets-Live04",
    mt_login: "50284731",
    mt_password: "Demo1234!",
    platform: "mt5",
    initial_balance: 10000,
    current_equity: 12847.32,
    equity_high: 13200,
    currency: "USD",
    leverage: 500,
    total_trades: 423,
    total_profit: 2847.32,
    win_rate: 73.2,
    copier_active: true,
    account_type: "copier",
    linked_channel: null,
    last_signal: null,
    last_sync: "2026-03-16T14:32:00Z",
    created_at: "2025-11-01T10:00:00Z",
  },
  {
    id: "demo-2",
    account_name: "Index Swing",
    broker_server: "Pepperstone-Edge03",
    mt_login: "71035829",
    mt_password: "Demo1234!",
    platform: "mt5",
    initial_balance: 25000,
    current_equity: 28450.00,
    equity_high: 29100,
    currency: "USD",
    leverage: 100,
    total_trades: 187,
    total_profit: 3450.00,
    win_rate: 68.4,
    copier_active: true,
    account_type: "copier",
    linked_channel: null,
    last_signal: null,
    last_sync: "2026-03-16T14:28:00Z",
    created_at: "2025-09-15T08:00:00Z",
  },
  {
    id: "demo-3",
    account_name: "FX Majors",
    broker_server: "FPMarkets-Live01",
    mt_login: "38291054",
    mt_password: "Demo1234!",
    platform: "mt4",
    initial_balance: 5000,
    current_equity: 5620.80,
    equity_high: 5800,
    currency: "USD",
    leverage: 200,
    total_trades: 237,
    total_profit: 620.80,
    win_rate: 71.1,
    copier_active: false,
    account_type: "tracking",
    linked_channel: null,
    last_signal: null,
    last_sync: "2026-03-16T13:55:00Z",
    created_at: "2026-01-10T12:00:00Z",
  },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch("/api/accounts/list")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setAccounts(d.accounts ?? []); setLoading(false); })
      .catch(() => { setFetchError(true); setLoading(false); });
  }, []);

  const isDemo = !loading && accounts.length === 0;
  const displayAccounts = isDemo ? DEMO_ACCOUNTS : accounts;

  const gain = (a: Account) => {
    if (a.initial_balance <= 0) return 0;
    return ((a.current_equity - a.initial_balance) / a.initial_balance * 100);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>
            Account Tracking
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>
            Deine MT4/MT5 Konten — Live-Tracking wie MyFXBook
          </p>
        </div>
        <Link href="/dashboard/accounts/add" className="gf-btn text-sm !py-2.5 !px-6">
          + Konto hinzufügen
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <>
          {/* Demo banner */}
          {isDemo && (
            <div className="gf-panel p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{
              background: "linear-gradient(135deg, var(--gf-panel), rgba(212,165,55,0.04))",
              border: "1px solid rgba(212,165,55,0.15)",
            }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: "rgba(212,165,55,0.1)",
                  border: "1px solid rgba(212,165,55,0.15)",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a537" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--gf-text-bright)" }}>
                    Das sind Beispiel-Konten
                  </p>
                  <p className="text-xs" style={{ color: "var(--gf-text-dim)" }}>
                    Verbinde dein eigenes MT4/MT5 Konto, um echte Performance zu tracken.
                  </p>
                </div>
              </div>
              <Link href="/dashboard/accounts/add" className="gf-btn text-sm !py-2.5 !px-6 whitespace-nowrap">
                Konto verbinden →
              </Link>
            </div>
          )}

          {/* Account Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayAccounts.map(a => {
              const g = gain(a);
              const isPositive = g >= 0;
              return (
                <div key={a.id} className="gf-panel p-5 block relative" style={isDemo ? { cursor: "default" } : undefined}>
                  {/* Demo badge per card */}
                  {isDemo && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full" style={{
                      background: "rgba(212,165,55,0.08)",
                      color: "var(--gf-gold)",
                      border: "1px solid rgba(212,165,55,0.15)",
                    }}>
                      DEMO
                    </span>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="gf-icon-ring text-sm">
                      {a.platform === "mt5" ? "5" : "4"}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ color: "var(--gf-text-bright)" }}>
                        {a.account_name || `#${a.mt_login}`}
                      </div>
                      <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>
                        {a.broker_server}
                      </div>
                      {a.linked_channel && (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.15)" }}>
                            📢 {a.linked_channel}
                          </span>
                          {a.last_signal && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                              background: a.last_signal.status === "executed" ? "rgba(34,197,94,0.08)" : "rgba(250,239,112,0.08)",
                              color: a.last_signal.status === "executed" ? "#22c55e" : "var(--gf-gold)",
                              border: `1px solid ${a.last_signal.status === "executed" ? "rgba(34,197,94,0.15)" : "rgba(250,239,112,0.15)"}`,
                            }}>
                              {a.last_signal.action} {a.last_signal.symbol} · {new Date(a.last_signal.time).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Equity</div>
                      <div className="text-sm font-semibold mono" style={{ color: "var(--gf-text-bright)" }}>
                        ${Number(a.current_equity).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Gain</div>
                      <div className="text-sm font-semibold mono" style={{ color: isPositive ? "var(--gf-green)" : "var(--gf-red)" }}>
                        {isPositive ? "+" : ""}{g.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Win Rate</div>
                      <div className="text-sm font-semibold mono" style={{ color: "var(--gf-text-bright)" }}>
                        {Number(a.win_rate).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Additional stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Balance</div>
                      <div className="text-sm font-semibold mono" style={{ color: "var(--gf-text-bright)" }}>
                        ${Number(a.initial_balance).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Profit</div>
                      <div className="text-sm font-semibold mono" style={{ color: a.total_profit >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>
                        {a.total_profit >= 0 ? "+" : ""}${Number(a.total_profit).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--gf-text-dim)" }}>Broker</div>
                      <div className="text-xs font-semibold" style={{ color: "var(--gf-text-bright)" }}>
                        {a.broker_server.split("-")[0]}
                      </div>
                    </div>
                  </div>

                  {/* Login Details */}
                  <div className="mb-4 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--gf-border)" }}>
                    <div className="grid grid-cols-3 gap-3 mb-2">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Login</div>
                        <div className="text-xs font-mono font-semibold" style={{ color: "var(--gf-gold)" }}>{a.mt_login}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Passwort</div>
                        <div className="text-xs font-mono font-semibold flex items-center gap-1" style={{ color: "var(--gf-text-bright)" }}>
                          {a.mt_password ? (
                            <>
                              <span>{a.mt_password}</span>
                              <button
                                onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(a.mt_password!); }}
                                className="text-[9px] px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity"
                                style={{ background: "rgba(212,165,55,0.1)", color: "var(--gf-gold)", border: "1px solid rgba(212,165,55,0.15)" }}
                                title="Kopieren"
                              >
                                Copy
                              </button>
                            </>
                          ) : (
                            <span style={{ color: "var(--gf-text-dim)" }}>—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Plattform</div>
                        <div className="text-xs font-mono font-semibold" style={{ color: "var(--gf-text-bright)" }}>
                          {a.platform?.toUpperCase() || "MT4"}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Server</div>
                        <div className="text-xs font-mono" style={{ color: "var(--gf-text-bright)" }}>{a.broker_server}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>Leverage</div>
                        <div className="text-xs font-mono" style={{ color: "var(--gf-text-bright)" }}>1:{a.leverage}</div>
                      </div>
                    </div>
                  </div>

                  {/* Profit Bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${Math.min(Math.max(50 + g, 5), 100)}%`,
                      background: isPositive
                        ? "linear-gradient(90deg, var(--gf-green), #2ecc71)"
                        : "linear-gradient(90deg, var(--gf-red), #e74c3c)",
                    }} />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 text-[10px]" style={{ color: "var(--gf-text-dim)" }}>
                    <span>{a.total_trades} Trades</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: a.account_type === "copier" ? "rgba(212,165,55,0.1)" : "rgba(255,255,255,0.05)",
                        color: a.account_type === "copier" ? "var(--gf-gold)" : "var(--gf-text-dim)",
                      }}>
                        {a.account_type === "copier" ? "Copier" : "Tracking"}
                      </span>
                      <span>{a.leverage ? `1:${a.leverage}` : ""} · {a.currency}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add account CTA card (always visible in demo, optional in live) */}
            {isDemo && (
              <Link href="/dashboard/accounts/add" className="gf-panel p-5 flex flex-col items-center justify-center text-center group" style={{
                border: "1px dashed rgba(212,165,55,0.2)",
                background: "rgba(212,165,55,0.02)",
                minHeight: "240px",
              }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110" style={{
                  background: "rgba(212,165,55,0.08)",
                  border: "1px solid rgba(212,165,55,0.15)",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4a537" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <span className="text-sm font-semibold mb-1" style={{ color: "var(--gf-text-bright)" }}>
                  Konto verbinden
                </span>
                <span className="text-xs" style={{ color: "var(--gf-text-dim)" }}>
                  MT4 oder MT5
                </span>
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
