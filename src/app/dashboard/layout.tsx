// src/app/dashboard/layout.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import RiskDisclaimer from "@/components/RiskDisclaimer";

const NAV = [
  { href: "/dashboard", label: "Command Center", icon: "◆" },
  { href: "/dashboard/accounts", label: "Accounts", icon: "📊" },
  { href: "/dashboard/copier", label: "Smart Copier", icon: "⚡" },
  { href: "/dashboard/chat", label: "FORGE Mentor", icon: "🧠" },
  { href: "/dashboard/trades", label: "Trade Ledger", icon: "📋" },
  { href: "/dashboard/strategy", label: "Strategy Lab", icon: "🔬" },
  { href: "/dashboard/affiliate", label: "Partner", icon: "💰" },
  { href: "/dashboard/profit", label: "Profit Share", icon: "📈" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Client-side auth guard (middleware handles redirect, this is a safety net)
    fetch("/api/auth/me")
      .then(r => {
        if (!r.ok) { router.push("/auth/login"); return; }
        setAuthChecked(true);
      })
      .catch(() => router.push("/auth/login"));

    fetch("/api/admin/overview").then(r => { if (r.ok) setIsAdmin(true); }).catch(() => {});
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gf-obsidian)" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gf-obsidian)" }}>
      {/* SIDEBAR — Desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r shrink-0" style={{ background: "var(--gf-dark)", borderColor: "var(--gf-border)" }}>
        {/* Brand */}
        <Link href="/" className="px-6 py-6 border-b" style={{ borderColor: "var(--gf-border)" }}>
          <span className="text-lg font-extrabold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
          <div className="text-[9px] tracking-[3px] mt-1 text-zinc-600 font-mono">FORGE TERMINAL</div>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1 p-3 overflow-y-auto">
          {NAV.map(n => {
            const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href + "/"));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "font-semibold bg-[rgba(250,239,112,0.06)] text-[var(--gf-gold)]"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                }`}
              >
                <span className="text-base w-5 text-center">{n.icon}</span>
                <span>{n.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--gf-gold)]" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t" style={{ borderColor: "var(--gf-border)" }}>
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/5 transition-colors mb-1">
              <span>🔐</span> Admin Panel
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-colors text-left"
          >
            <span>→</span> Logout
          </button>
        </div>
      </aside>

      {/* MOBILE NAV — Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t overflow-x-auto" style={{ background: "rgba(9,9,11,0.95)", backdropFilter: "blur(12px)", borderColor: "var(--gf-border)" }}>
        <div className="flex min-w-max">
          {NAV.map(n => {
            const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href + "/"));
            return (
              <Link
                key={n.href}
                href={n.href}
                className="flex-shrink-0 flex flex-col items-center py-2.5 px-3 text-xs gap-1 transition-colors"
                style={{
                  color: active ? "var(--gf-gold)" : "var(--gf-text-dim)",
                  borderTop: active ? "2px solid var(--gf-gold)" : "2px solid transparent",
                }}
              >
                <span className="text-lg">{n.icon}</span>
                <span className="text-[10px] whitespace-nowrap font-medium">{n.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in">
          {children}
          <RiskDisclaimer compact />
        </div>
      </main>
    </div>
  );
}
