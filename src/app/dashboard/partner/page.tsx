"use client";
import { useState } from "react";
import Link from "next/link";

const fpBalance = 12480;
const earnedThisMonth = 3200;
const rankProgress = 65;

const revenueBreakdown = [
  { label: "Provisionen", amount: 5200, icon: "\ud83d\udcb5" },
  { label: "Matching Bonus", amount: 3800, icon: "\ud83c\udfaf" },
  { label: "Pool-Aussch\u00fcttung", amount: 3480, icon: "\ud83c\udfc6" },
];

const liveFeed = [
  { time: "14:32", text: "Neuer Referral: Max M. (L1)", type: "referral" },
  { time: "13:15", text: "Provision erhalten: +120 FP", type: "earning" },
  { time: "12:01", text: "Matching Bonus: +80 FP", type: "earning" },
  { time: "10:45", text: "Neuer Referral: Lisa K. (L2)", type: "referral" },
  { time: "09:30", text: "Pool-Aussch\u00fcttung: +200 FP", type: "earning" },
];

const quickLinks = [
  { href: "/dashboard/partner/earnings", label: "Earnings", icon: "\ud83d\udcb0", desc: "Provisionen & Auszahlungen" },
  { href: "/dashboard/partner/invite", label: "Einladen", icon: "\ud83d\udce8", desc: "Link teilen & einladen" },
  { href: "/dashboard/partner/team", label: "Team", icon: "\ud83d\udc65", desc: "Dein Netzwerk" },
  { href: "/dashboard/partner/coach", label: "Coach", icon: "\ud83c\udfc6", desc: "KI Partner-Coach" },
  { href: "/dashboard/partner/hot-leads", label: "Hot Leads", icon: "\ud83d\udd25", desc: "Warme Kontakte" },
  { href: "/dashboard/partner/material", label: "Material", icon: "\ud83d\udcc2", desc: "Marketing-Material" },
];

export default function PartnerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="gf-heading text-2xl">Partner Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Verdiene bis zu 50% Provision auf jede Empfehlung</p>
        </div>
        <Link href="/dashboard/partner/invite" className="gf-btn gf-btn-sm">Link teilen &rarr;</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="gf-panel p-6">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-600 mb-2">FP Guthaben</div>
          <div className="text-3xl font-bold gf-gold-text">{fpBalance.toLocaleString("de-DE")} FP</div>
          <div className="text-xs text-emerald-400 mt-1">+{earnedThisMonth.toLocaleString("de-DE")} FP diesen Monat</div>
          <div className="text-[10px] text-zinc-600 mt-1">1 FP = \u20ac0,10</div>
        </div>

        <div className="gf-panel p-6">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-600 mb-2">Aktueller Rang</div>
          <div className="text-xl font-bold text-white">Gold Partner</div>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
              <span>GOLD</span><span>PLATIN</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: "var(--gf-border)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${rankProgress}%`, background: "var(--gf-gold)" }} />
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">{rankProgress}% zum n\u00e4chsten Rang</div>
          </div>
        </div>

        <div className="gf-panel p-6">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-600 mb-2">Gesamt verdient</div>
          <div className="text-3xl font-bold" style={{ color: "var(--gf-green)" }}>\u20ac{(fpBalance * 0.1).toFixed(0)}</div>
          <div className="text-[10px] text-zinc-600 mt-1">{fpBalance.toLocaleString("de-DE")} FORGE Points</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickLinks.map(l => (
          <Link key={l.href} href={l.href} className="gf-panel p-4 text-center group">
            <div className="text-2xl mb-2">{l.icon}</div>
            <div className="text-xs font-semibold text-white group-hover:text-[var(--gf-gold)] transition-colors">{l.label}</div>
            <div className="text-[9px] text-zinc-600 mt-0.5">{l.desc}</div>
          </Link>
        ))}
      </div>

      {/* Revenue + Live Feed */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="gf-panel p-5">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-600 mb-4">Einnahmen</div>
          <div className="space-y-3">
            {revenueBreakdown.map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--gf-obsidian)", border: "1px solid var(--gf-border)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-zinc-300">{item.label}</span>
                </div>
                <span className="text-sm font-bold font-mono gf-gold-text">{item.amount.toLocaleString("de-DE")} FP</span>
              </div>
            ))}
          </div>
        </div>

        <div className="gf-panel p-5">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-600 mb-4">Live Feed</div>
          <div className="space-y-3">
            {liveFeed.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-zinc-600 w-10 flex-shrink-0">{e.time}</span>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.type === "referral" ? "var(--gf-blue)" : "var(--gf-gold)" }} />
                <span className="text-sm text-zinc-400">{e.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
