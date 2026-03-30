// src/app/admin/page.tsx — Admin Overview Dashboard
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyMetrics, RevenueGrowth, BrokerDistribution, ExtraMetrics } from "./overview-cards";
import { TelegramStats, AccountsTable, RecentActivity } from "./overview-tables";

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/overview")
      .then(r => r.json())
      .then(d => { if (!d.error) { setStats(d); setLastRefresh(new Date()); } setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!stats) return <div style={{ color: "var(--gf-text-dim)" }}>Fehler beim Laden der Daten.</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold truncate" style={{ color: "var(--gf-text-bright)" }}>Admin Overview</h1>
          <p className="text-[10px] sm:text-xs mt-1" style={{ color: "var(--gf-text-dim)" }}>
            <span className="hidden sm:inline">Gold Foundry Platform — </span>Dashboard
            {lastRefresh && <span className="ml-2">Updated {lastRefresh.toLocaleTimeString("de-DE")}</span>}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="text-[11px] sm:text-xs px-3 sm:px-4 py-2 rounded transition-all shrink-0" style={{ background: "rgba(212,165,55,0.1)", color: "var(--gf-gold)", border: "1px solid rgba(212,165,55,0.2)", opacity: loading ? 0.5 : 1 }}>
          {loading ? "..." : "Refresh"}
        </button>
      </div>

      {/* Row 1: Key Metrics */}
      <SectionLabel label="Key Metrics" />
      <KeyMetrics stats={stats} />

      {/* Row 2: Revenue & Growth */}
      <SectionLabel label="Revenue & Growth" />
      <RevenueGrowth stats={stats} />

      {/* Row 3: Extra Metrics (Affiliates, FORGE Points, etc.) */}
      <SectionLabel label="Partners & Points" />
      <ExtraMetrics stats={stats} />

      {/* Row 4: Broker Distribution */}
      <SectionLabel label="Broker & Platform Distribution" />
      <BrokerDistribution stats={stats} />

      {/* Row 5: Telegram Copier Stats */}
      <SectionLabel label="Telegram Copier" />
      <TelegramStats stats={stats} />

      {/* Row 6: Account Details Table */}
      <SectionLabel label="Account Details" />
      <AccountsTable stats={stats} />

      {/* Row 7: Recent Activity */}
      <SectionLabel label="Recent Activity" />
      <RecentActivity stats={stats} />

      {/* Quick Links */}
      <SectionLabel label="Quick Links" />
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
        {[
          { href: "/admin/accounts", label: "Accounts", desc: "Manage all trading accounts" },
          { href: "/admin/signals", label: "Signal-Konten", desc: "Master accounts & providers" },
          { href: "/admin/crm", label: "CRM", desc: "Contacts, pipeline, campaigns" },
          { href: "/admin/settlements", label: "Settlements", desc: "Profit-sharing & payouts" },
        ].map(l => (
          <Link key={l.href} href={l.href} className="gf-panel p-4 block group hover:border-[var(--gf-gold)] transition-colors" style={{ borderColor: "var(--gf-border)" }}>
            <div className="font-semibold text-sm mb-1" style={{ color: "var(--gf-text-bright)" }}>{l.label}</div>
            <div className="text-[10px]" style={{ color: "var(--gf-text-dim)" }}>{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-3 mt-2">
      <div className="h-px flex-1" style={{ background: "var(--gf-border)" }} />
      <span className="text-[10px] sm:text-[11px] uppercase tracking-[1.5px] sm:tracking-[2px] font-medium whitespace-nowrap" style={{ color: "var(--gf-text-dim)" }}>{label}</span>
      <div className="h-px flex-1" style={{ background: "var(--gf-border)" }} />
    </div>
  );
}
