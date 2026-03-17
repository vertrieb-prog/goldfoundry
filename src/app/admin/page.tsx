// src/app/admin/page.tsx — Admin Overview Dashboard
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  users: { total: number; paying: number; free: number; thisMonth: number };
  accounts: { total: number; copier: number; tracking: number; copierActive: number };
  masters: { total: number; active: number; names: string[] };
  financials: { totalEquity: number; totalProfit: number; platformFees: number; totalTrades: number };
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!stats) return <div style={{ color: "var(--gf-text-dim)" }}>Fehler beim Laden.</div>;

  const kpis = [
    { label: "Users gesamt", value: stats.users.total, sub: `${stats.users.paying} zahlend`, icon: "👥" },
    { label: "Neue (30 Tage)", value: stats.users.thisMonth, sub: "Registrierungen", icon: "📈" },
    { label: "Accounts", value: stats.accounts.total, sub: `${stats.accounts.copier} Copier · ${stats.accounts.tracking} Tracking`, icon: "📊" },
    { label: "Signal-Konten", value: stats.masters.total, sub: `${stats.masters.active} aktiv`, icon: "📡" },
    { label: "Copier aktiv", value: stats.accounts.copierActive, sub: `von ${stats.accounts.copier}`, icon: "⚡" },
    { label: "Total Equity", value: `$${stats.financials.totalEquity.toLocaleString()}`, sub: "Verwaltetes Kapital", icon: "💎" },
    { label: "Total Profit", value: `$${stats.financials.totalProfit.toLocaleString()}`, sub: "Alle Konten", icon: "💰" },
    { label: "Platform Fees", value: `$${stats.financials.platformFees.toLocaleString()}`, sub: "Earned", icon: "🏦" },
    { label: "Trades", value: stats.financials.totalTrades.toLocaleString(), sub: "Insgesamt", icon: "📋" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gf-text-bright)" }}>Admin Overview</h1>
          <p className="text-sm mt-1" style={{ color: "var(--gf-text-dim)" }}>Gold Foundry Platform — Gesamtübersicht</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 mb-8">
        {kpis.map((k, i) => (
          <div key={i} className="gf-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{k.icon}</span>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--gf-text-dim)" }}>{k.label}</span>
            </div>
            <div className="text-xl font-bold mono" style={{ color: "var(--gf-text-bright)" }}>{k.value}</div>
            <div className="text-[10px] mt-1" style={{ color: "var(--gf-text-dim)" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/accounts" className="gf-panel p-5 block group">
          <div className="text-lg mb-2">📊</div>
          <div className="font-semibold text-sm mb-1" style={{ color: "var(--gf-text-bright)" }}>Alle Accounts</div>
          <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>
            Signal-, Copy- und Tracking-Konten verwalten. Sehen welches Konto an welches Signal gekoppelt ist.
          </div>
        </Link>
        <Link href="/admin/signals" className="gf-panel p-5 block group">
          <div className="text-lg mb-2">📡</div>
          <div className="font-semibold text-sm mb-1" style={{ color: "var(--gf-text-bright)" }}>Signal-Konten</div>
          <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>
            Master-Accounts erstellen und verwalten. Signal-Provider konfigurieren.
          </div>
        </Link>
        <Link href="/admin/crm" className="gf-panel p-5 block group">
          <div className="text-lg mb-2">👥</div>
          <div className="font-semibold text-sm mb-1" style={{ color: "var(--gf-text-bright)" }}>CRM</div>
          <div className="text-xs" style={{ color: "var(--gf-text-dim)" }}>
            Kontakte, Pipeline, Kampagnen — alle CRM-Daten.
          </div>
        </Link>
      </div>

      {/* Signal Accounts quick view */}
      {stats.masters.names.length > 0 && (
        <div className="mt-8 gf-panel p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--gf-text-bright)" }}>Aktive Signal-Konten</h3>
          <div className="flex flex-wrap gap-2">
            {stats.masters.names.map((name, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(212,165,55,0.08)", color: "var(--gf-gold)", border: "1px solid rgba(212,165,55,0.15)" }}>
                📡 {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
