// src/app/admin/overview-cards.tsx — Metric cards + broker/platform charts
"use client";

interface Props {
  stats: any;
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="gf-panel p-4 flex flex-col justify-between">
      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--gf-text-dim)" }}>{label}</div>
      <div className="text-2xl font-bold mono" style={{ color: accent ? "var(--gf-gold)" : "var(--gf-text-bright)" }}>{value}</div>
      {sub && <div className="text-[10px] mt-1.5" style={{ color: "var(--gf-text-dim)" }}>{sub}</div>}
    </div>
  );
}

function CssBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[10px] mb-1">
        <span style={{ color: "var(--gf-text-dim)" }}>{label}</span>
        <span className="mono" style={{ color: "var(--gf-text-bright)" }}>{value}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function KeyMetrics({ stats }: Props) {
  const kpis = [
    { label: "Total Users", value: stats.users.total, sub: `${stats.users.paying} paying / ${stats.users.free} free` },
    { label: "Active Copiers", value: stats.accounts.copierActive, sub: `of ${stats.accounts.copier} copier accounts`, accent: true },
    { label: "Total Accounts", value: stats.accounts.total, sub: `${stats.accounts.copier} copier + ${stats.accounts.tracking} tracking` },
    { label: "Total Equity", value: `${stats.financials.totalEquity.toLocaleString()}`, sub: "Combined equity", accent: true },
    { label: "Total Trades", value: stats.financials.totalTrades.toLocaleString(), sub: "All-time executed trades" },
    { label: "Telegram Channels", value: stats.telegram.activeChannels, sub: `${stats.telegram.totalChannels} total` },
  ];
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-6">
      {kpis.map((k, i) => <MetricCard key={i} {...k} />)}
    </div>
  );
}

export function RevenueGrowth({ stats }: Props) {
  const items = [
    { label: "Total Revenue", value: `${stats.financials.totalRevenue.toLocaleString()}`, sub: "Crypto payments completed", accent: true },
    { label: "Platform Fees", value: `${stats.financials.platformFees.toLocaleString()}`, sub: "Profit-share collected" },
    { label: "Total Profit", value: `${stats.financials.totalProfit.toLocaleString()}`, sub: "All accounts combined" },
    { label: "New Users (7d)", value: stats.users.thisWeek, sub: "This week" },
    { label: "New Users (30d)", value: stats.users.thisMonth, sub: "This month" },
    { label: "Conversion Rate", value: `${stats.users.conversionRate}%`, sub: "Users with accounts" },
  ];
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-6">
      {items.map((k, i) => <MetricCard key={i} {...k} />)}
    </div>
  );
}

export function BrokerDistribution({ stats }: Props) {
  const brokers = Object.entries(stats.brokers || {}).sort((a: any, b: any) => b[1] - a[1]);
  const platforms = Object.entries(stats.platforms || {}).sort((a: any, b: any) => b[1] - a[1]);
  const maxBroker = brokers.length > 0 ? (brokers[0][1] as number) : 1;
  const colors = ["#D4A537", "#E8A838", "#C49030", "#B8860B", "#9B7530", "#806020"];

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      <div className="gf-panel p-5">
        <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--gf-text-dim)" }}>Broker Distribution</h3>
        {brokers.length === 0 && <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>No data</div>}
        {brokers.map(([name, count], i) => (
          <CssBar key={name} label={name} value={count as number} max={maxBroker} color={colors[i % colors.length]} />
        ))}
      </div>
      <div className="gf-panel p-5">
        <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: "var(--gf-text-dim)" }}>Platform Split</h3>
        <div className="flex gap-4 items-end h-32">
          {platforms.map(([name, count]) => {
            const total = platforms.reduce((s, [, c]) => s + (c as number), 0);
            const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
            return (
              <div key={name} className="flex flex-col items-center flex-1">
                <span className="text-lg font-bold mono mb-1" style={{ color: "var(--gf-text-bright)" }}>{pct}%</span>
                <div className="w-full rounded-t" style={{ height: `${Math.max(pct, 5)}%`, background: name === "MT5" ? "var(--gf-gold)" : "#806020", minHeight: 8 }} />
                <span className="text-[10px] mt-2 uppercase" style={{ color: "var(--gf-text-dim)" }}>{name}</span>
                <span className="text-[10px] mono" style={{ color: "var(--gf-text-dim)" }}>{count as number}</span>
              </div>
            );
          })}
        </div>
        {platforms.length === 0 && <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>No data</div>}
      </div>
    </div>
  );
}

export function ExtraMetrics({ stats }: Props) {
  const items = [
    { label: "Signal-Konten", value: stats.masters.total, sub: `${stats.masters.active} active` },
    { label: "Affiliates", value: stats.affiliates.total, sub: `${stats.affiliates.approved} approved` },
    { label: "Affiliate Earned", value: `${Math.round(stats.affiliates.totalEarned).toLocaleString()}`, sub: "Total commissions" },
    { label: "Funnel Leads", value: stats.funnel.total, sub: `${stats.funnel.converted} converted` },
    { label: "FORGE Points", value: stats.forgePoints.totalBalance.toLocaleString(), sub: `${stats.forgePoints.holders} holders` },
    { label: "FP Earned (all)", value: stats.forgePoints.totalEarned.toLocaleString(), sub: "Lifetime earned" },
  ];
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-6">
      {items.map((k, i) => <MetricCard key={i} {...k} />)}
    </div>
  );
}
