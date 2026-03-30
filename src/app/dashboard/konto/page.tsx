// src/app/dashboard/konto/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const AMOUNTS = [250, 500, 1000, 5000];

interface AccountInfo {
  id: string; equity: number; initialBalance: number; ddLimit: number;
  ddBuffer: number; firmProfile: string; mtLogin: string; copierActive: boolean;
  todayCopied: number; todaySkipped: number; todayPnl: number;
}

interface CopyEvent {
  id: string; created_at: string; pair_name?: string; status: string;
  signal_account_id?: string; copy_account_id?: string; direction?: string;
}

export default function KontoPage() {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [events, setEvents] = useState<CopyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/copier/status");
      const d = await res.json();
      setAccounts(d.accounts ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/engine/events?limit=20");
      const d = await res.json();
      setEvents(d.events ?? []);
    } catch { /* ignore */ }
    setEventsLoading(false);
  }, []);

  useEffect(() => { fetchData(); fetchEvents(); }, [fetchData, fetchEvents]);

  const hasAccount = accounts.length > 0;
  const totalBalance = accounts.reduce((s, a) => s + (a.initialBalance ?? 0), 0);
  const totalEquity = accounts.reduce((s, a) => s + (a.equity ?? 0), 0);
  const freeMargin = totalEquity - (totalEquity * 0.1); // Approximate

  function fmtTime(iso: string) {
    try { return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="gf-heading text-2xl">Konto</h1>
        <button onClick={() => { fetchData(); fetchEvents(); }} className="text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-white/[0.03]" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)", color: "var(--gf-text-dim)" }}>
          Aktualisieren
        </button>
      </div>

      {/* Balance Card */}
      <div className="gf-panel p-6">
        {loading ? (
          <p className="text-sm text-zinc-500 text-center py-4">Laden...</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Balance</div>
                <div className="text-xl font-bold text-white">
                  {hasAccount ? `\u20AC${totalBalance.toLocaleString("de-DE", { maximumFractionDigits: 0 })}` : "\u2014"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Equity</div>
                <div className="text-xl font-bold text-white">
                  {hasAccount ? `\u20AC${totalEquity.toLocaleString("de-DE", { maximumFractionDigits: 0 })}` : "\u2014"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Freie Margin</div>
                <div className="text-xl font-bold text-white">
                  {hasAccount ? `\u20AC${freeMargin.toLocaleString("de-DE", { maximumFractionDigits: 0 })}` : "\u2014"}
                </div>
              </div>
            </div>
            {!hasAccount && (
              <div className="text-center mt-4">
                <p className="text-xs text-zinc-600 mb-3">Kein Konto verbunden.</p>
                <Link href="/onboarding" className="gf-btn gf-btn-sm text-xs">Konto verbinden &rarr;</Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Per-Account Details */}
      {hasAccount && accounts.map(acc => (
        <div key={acc.id} className="gf-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{acc.firmProfile?.toUpperCase() ?? "Konto"}</span>
              <span className="text-[10px] font-mono text-zinc-500">{acc.mtLogin}</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={acc.copierActive
              ? { background: "rgba(34,197,94,0.1)", color: "var(--gf-green)" }
              : { background: "rgba(239,68,68,0.1)", color: "var(--gf-red)" }
            }>{acc.copierActive ? "Aktiv" : "Pausiert"}</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div><div className="font-bold text-white">&euro;{acc.equity.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</div><div className="text-[9px] text-zinc-500">Equity</div></div>
            <div><div className="font-bold" style={{ color: acc.ddBuffer > 40 ? "var(--gf-green)" : "var(--gf-red)" }}>{acc.ddBuffer}%</div><div className="text-[9px] text-zinc-500">DD Buffer</div></div>
            <div><div className="font-bold text-white">{acc.todayCopied}</div><div className="text-[9px] text-zinc-500">Kopiert heute</div></div>
            <div><div className="font-bold" style={{ color: acc.todayPnl >= 0 ? "var(--gf-green)" : "var(--gf-red)" }}>{acc.todayPnl >= 0 ? "+" : ""}&euro;{acc.todayPnl.toFixed(0)}</div><div className="text-[9px] text-zinc-500">P&L heute</div></div>
          </div>
        </div>
      ))}

      {/* Deposit */}
      <div className="gf-panel p-6">
        <h3 className="font-semibold text-white mb-4">Einzahlung</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          {AMOUNTS.map(a => (
            <button key={a} className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-all hover:bg-white/[0.03]" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)", color: "var(--gf-text-bright)" }}>&euro;{a.toLocaleString("de-DE")}</button>
          ))}
        </div>
        <a href="https://tegasfx.com" target="_blank" rel="noopener noreferrer" className="gf-btn text-sm inline-block text-center">Bei Tegas FX einzahlen &rarr;</a>
      </div>

      {/* Withdrawal */}
      <div className="gf-panel p-6">
        <h3 className="font-semibold text-white mb-4">Auszahlung</h3>
        <a href="https://tegasfx.com" target="_blank" rel="noopener noreferrer" className="gf-btn-outline text-sm inline-block text-center">Bei Tegas FX auszahlen &rarr;</a>
      </div>

      {/* Copy Events History */}
      <div className="gf-panel p-6">
        <h3 className="font-semibold text-white mb-4">Copy Events</h3>
        {eventsLoading ? (
          <p className="text-sm text-zinc-500 text-center py-4">Laden...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-6">Keine Events vorhanden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
                  {["Zeit", "Symbol", "Status"].map(h => (
                    <th key={h} className="text-left p-2 text-[10px] font-medium uppercase tracking-wide text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => (
                  <tr key={ev.id ?? i} style={{ borderBottom: "1px solid var(--gf-border)" }}>
                    <td className="p-2 text-xs font-mono text-zinc-500">{fmtTime(ev.created_at)}</td>
                    <td className="p-2 text-xs font-semibold text-white">{ev.pair_name ?? "\u2014"}</td>
                    <td className="p-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{
                        background: ev.status === "COPIED" ? "rgba(34,197,94,0.08)" : ev.status === "BLOCKED" ? "rgba(239,68,68,0.08)" : "rgba(250,239,112,0.08)",
                        color: ev.status === "COPIED" ? "var(--gf-green)" : ev.status === "BLOCKED" ? "var(--gf-red)" : "var(--gf-gold)",
                      }}>{ev.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="gf-panel p-4">
        <p className="text-xs text-zinc-500">Einzahlungen und Auszahlungen werden sicher ueber Tegas FX (VFSC reguliert) abgewickelt.</p>
      </div>
    </div>
  );
}
