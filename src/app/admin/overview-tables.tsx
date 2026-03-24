// src/app/admin/overview-tables.tsx — Telegram stats, accounts table, recent activity
"use client";

interface Props {
  stats: any;
}

function StatusDot({ active }: { active: boolean }) {
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: active ? "#2ecc71" : "#e74c3c" }} />;
}

function SignalBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    executed: "#2ecc71", parsed: "#3498db", blocked: "#e74c3c",
    risk_blocked: "#e74c3c", low_confidence: "#f39c12", unparsed: "#95a5a6",
    manual_review: "#f39c12", execution_failed: "#e74c3c",
  };
  return (
    <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${colors[status] || "#555"}22`, color: colors[status] || "#888" }}>
      {status}
    </span>
  );
}

export function TelegramStats({ stats }: Props) {
  const tg = stats.telegram;
  const statusOrder = ["executed", "parsed", "blocked", "risk_blocked", "low_confidence", "execution_failed", "unparsed", "manual_review"];
  const maxChannel = tg.topChannels.length > 0 ? tg.topChannels[0].count : 1;

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      {/* Signal counts */}
      <div className="gf-panel p-5">
        <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--gf-text-dim)" }}>Telegram Signals</h3>
        <div className="text-3xl font-bold mono mb-3" style={{ color: "var(--gf-gold)" }}>{tg.totalSignals}</div>
        <div className="space-y-1.5">
          {statusOrder.map(s => {
            const count = tg.byStatus[s];
            if (!count) return null;
            return (
              <div key={s} className="flex justify-between items-center">
                <SignalBadge status={s} />
                <span className="text-xs mono" style={{ color: "var(--gf-text-bright)" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top channels */}
      <div className="gf-panel p-5">
        <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--gf-text-dim)" }}>Top Channels</h3>
        {tg.topChannels.length === 0 && <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>No data</div>}
        {tg.topChannels.map((ch: any, i: number) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="truncate max-w-[140px]" style={{ color: "var(--gf-text-dim)" }}>{ch.name}</span>
              <span className="mono" style={{ color: "var(--gf-text-bright)" }}>{ch.count}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="h-full rounded-full" style={{ width: `${(ch.count / maxChannel) * 100}%`, background: "var(--gf-gold)" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Active signal accounts */}
      <div className="gf-panel p-5">
        <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--gf-text-dim)" }}>Signal-Konten (Master)</h3>
        <div className="text-3xl font-bold mono mb-3" style={{ color: "var(--gf-text-bright)" }}>
          {stats.masters.active}<span className="text-sm" style={{ color: "var(--gf-text-dim)" }}> / {stats.masters.total}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {stats.masters.names.map((name: string, i: number) => (
            <span key={i} className="text-[10px] px-2 py-1 rounded" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(212,165,55,0.15)" }}>
              {name}
            </span>
          ))}
          {stats.masters.names.length === 0 && <span className="text-xs" style={{ color: "var(--gf-text-dim)" }}>None configured</span>}
        </div>
      </div>
    </div>
  );
}

export function AccountsTable({ stats }: Props) {
  const rows: any[] = stats.accountDetails || [];
  return (
    <div className="gf-panel p-5 mb-6 overflow-x-auto">
      <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--gf-text-dim)" }}>Account Details</h3>
      {rows.length === 0 ? (
        <div className="text-xs py-4 text-center" style={{ color: "var(--gf-text-dim)" }}>No accounts found</div>
      ) : (
        <table className="w-full text-xs" style={{ color: "var(--gf-text-dim)" }}>
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--gf-border)" }}>
              {["User", "Account", "Broker", "Login", "Platform", "Equity", "Profit", "Trades", "Win%", "Status", "Sync"].map(h => (
                <th key={h} className="text-left py-2 px-2 text-[9px] uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="border-b" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                <td className="py-2 px-2 truncate max-w-[120px]">{r.email}</td>
                <td className="py-2 px-2">{r.accountName || "—"}</td>
                <td className="py-2 px-2">{r.broker || "—"}</td>
                <td className="py-2 px-2 mono">{r.login}</td>
                <td className="py-2 px-2 uppercase">{r.platform}</td>
                <td className="py-2 px-2 mono" style={{ color: "var(--gf-text-bright)" }}>{r.equity.toLocaleString()}</td>
                <td className="py-2 px-2 mono" style={{ color: r.profit >= 0 ? "#2ecc71" : "#e74c3c" }}>{r.profit.toLocaleString()}</td>
                <td className="py-2 px-2 mono">{r.trades}</td>
                <td className="py-2 px-2 mono">{r.winRate > 0 ? `${r.winRate}%` : "—"}</td>
                <td className="py-2 px-2"><StatusDot active={r.copierActive} /></td>
                <td className="py-2 px-2 text-[9px]">{r.lastSync ? new Date(r.lastSync).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function RecentActivity({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      {/* Recent signals */}
      <div className="gf-panel p-5">
        <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--gf-text-dim)" }}>Recent Signals</h3>
        {(stats.recentSignals || []).length === 0 && <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>No signals yet</div>}
        <div className="space-y-2">
          {(stats.recentSignals || []).map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] mono" style={{ color: "var(--gf-text-bright)" }}>{s.symbol || "—"}</span>
                <SignalBadge status={s.status} />
              </div>
              <span className="text-[9px] mono" style={{ color: "var(--gf-text-dim)" }}>
                {s.created ? new Date(s.created).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div className="gf-panel p-5">
        <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: "var(--gf-text-dim)" }}>Recent Users</h3>
        {(stats.recentUsers || []).length === 0 && <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>No users yet</div>}
        <div className="space-y-2">
          {(stats.recentUsers || []).map((u: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
              <div>
                <div className="text-[10px]" style={{ color: "var(--gf-text-bright)" }}>{u.name || u.email}</div>
                {u.name && <div className="text-[9px]" style={{ color: "var(--gf-text-dim)" }}>{u.email}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)" }}>{u.tier || "free"}</span>
                <span className="text-[9px] mono" style={{ color: "var(--gf-text-dim)" }}>
                  {u.created ? new Date(u.created).toLocaleDateString("de-DE") : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
