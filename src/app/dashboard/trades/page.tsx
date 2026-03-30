// src/app/dashboard/trades/page.tsx
"use client";
import { useEffect, useState } from "react";

type FilterKey = "all" | "XAUUSD" | "US500" | "EURUSD" | "winners" | "losers";
type ViewTab = "trades" | "events";

interface CopyEvent {
  id: string; created_at: string; pair_name?: string; status: string;
  signal_account_id?: string; copy_account_id?: string;
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="gf-panel p-4 text-center">
      <div className="text-xl font-bold" style={{ color: color || "var(--gf-text-bright)" }}>{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide mt-1 text-zinc-600">{label}</div>
    </div>
  );
}

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

export default function TradesPage() {
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<CopyEvent[]>([]);
  const [evtSummary, setEvtSummary] = useState<any>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [tab, setTab] = useState<ViewTab>("trades");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/copier/stats").then(r => r.json()).catch(() => null),
      fetch("/api/engine/events?limit=50").then(r => r.json()).catch(() => null),
    ]).then(([statsData, eventsData]) => {
      if (statsData && !statsData.error) setStats(statsData);
      if (eventsData) { setEvents(eventsData.events ?? []); setEvtSummary(eventsData.summary ?? null); }
    }).finally(() => setLoading(false));
  }, []);

  const overview = stats?.overview;
  const protection = stats?.capitalProtection;
  const recentSignals = stats?.recentSignals ?? [];

  const filteredSignals = recentSignals.filter((t: any) => {
    if (filter === "all") return true;
    if (filter === "winners" || filter === "losers") return true;
    return t.symbol === filter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="gf-heading text-2xl">Trade Ledger</h1>
        <p className="text-sm text-zinc-500 text-center py-10">Laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="gf-heading text-2xl">Trade Ledger</h1>
          <p className="text-sm text-zinc-500 mt-1">Alle kopierten Trades mit Performance-Analyse</p>
        </div>
      </div>

      {/* Stats from copier/stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Signals gesamt" value={`${overview?.totalSignals ?? 0}`} />
        <StatCard label="Ausgefuehrt" value={`${overview?.signalsExecuted ?? 0}`} color="var(--gf-green)" />
        <StatCard label="Blockiert" value={`${overview?.signalsBlocked ?? 0}`} color="var(--gf-red)" />
        <StatCard label="Win Rate" value={`${overview?.winRate ?? 0}%`} color="var(--gf-gold)" />
        <StatCard label="Kapital geschuetzt" value={`\u20AC${protection?.totalProtected ?? 0}`} color="var(--gf-green)" />
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        {([{ key: "trades" as ViewTab, label: "Trade History" }, { key: "events" as ViewTab, label: `Engine Events (${events.length})` }]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="text-xs px-4 py-2 rounded-lg transition-all"
            style={tab === t.key
              ? { background: "var(--gf-gold)", color: "var(--gf-obsidian)", fontWeight: 700 }
              : { background: "var(--gf-panel)", color: "var(--gf-text-dim)", border: "1px solid var(--gf-border)" }
            }
          >{t.label}</button>
        ))}
      </div>

      {/* Trades Tab */}
      {tab === "trades" && (
        <>
          <div className="flex flex-wrap gap-2">
            {([
              { key: "all", label: "Alle" }, { key: "XAUUSD", label: "XAUUSD" }, { key: "US500", label: "US500" }, { key: "EURUSD", label: "EURUSD" },
            ] as { key: FilterKey; label: string }[]).map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={filter === f.key
                  ? { background: "var(--gf-gold)", color: "var(--gf-obsidian)", fontWeight: 700 }
                  : { background: "var(--gf-panel)", color: "var(--gf-text-dim)", border: "1px solid var(--gf-border)" }
                }
              >{f.label}</button>
            ))}
          </div>

          <div className="gf-panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
                  {["Datum", "Symbol", "Richtung", "Confidence"].map(h => (
                    <th key={h} className="text-left p-3 text-[10px] font-medium uppercase tracking-wide text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSignals.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center text-sm text-zinc-500">Keine Trades vorhanden.</td></tr>
                ) : filteredSignals.map((t: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors" style={{ borderBottom: "1px solid var(--gf-border)" }}>
                    <td className="p-3 text-xs font-mono text-zinc-600">{fmtTime(t.date)}</td>
                    <td className="p-3 font-semibold text-white">{t.symbol ?? "\u2014"}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{
                        background: t.action === "BUY" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                        color: t.action === "BUY" ? "var(--gf-green)" : "var(--gf-red)",
                      }}>{t.action ?? "\u2014"}</span>
                    </td>
                    <td className="p-3 text-xs font-mono text-zinc-400">{t.confidence ?? "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Events Tab */}
      {tab === "events" && (
        <>
          {evtSummary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard label="Detected" value={`${evtSummary.detected}`} />
              <StatCard label="Copied" value={`${evtSummary.copied}`} color="var(--gf-green)" />
              <StatCard label="Blocked" value={`${evtSummary.blocked}`} color="var(--gf-red)" />
              <StatCard label="Missed" value={`${evtSummary.missed}`} color="var(--gf-gold)" />
              <StatCard label="Errors" value={`${evtSummary.errors}`} color="var(--gf-red)" />
            </div>
          )}
          <div className="gf-panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--gf-border)" }}>
                  {["Zeit", "Paar", "Status"].map(h => (
                    <th key={h} className="text-left p-3 text-[10px] font-medium uppercase tracking-wide text-zinc-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-sm text-zinc-500">Keine Engine Events.</td></tr>
                ) : events.map((ev, i) => (
                  <tr key={ev.id ?? i} className="hover:bg-white/[0.01]" style={{ borderBottom: "1px solid var(--gf-border)" }}>
                    <td className="p-3 text-xs font-mono text-zinc-500">{fmtTime(ev.created_at)}</td>
                    <td className="p-3 text-xs font-semibold text-white">{ev.pair_name ?? "\u2014"}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{
                        background: ev.status === "COPIED" ? "rgba(34,197,94,0.08)" : ev.status === "BLOCKED" ? "rgba(239,68,68,0.08)" : ev.status === "MISSED" ? "rgba(250,239,112,0.08)" : "rgba(255,255,255,0.05)",
                        color: ev.status === "COPIED" ? "var(--gf-green)" : ev.status === "BLOCKED" ? "var(--gf-red)" : ev.status === "MISSED" ? "var(--gf-gold)" : "var(--gf-text-dim)",
                      }}>{ev.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
