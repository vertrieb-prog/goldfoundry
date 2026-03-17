// src/app/dashboard/layout.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/admin/overview").then(r => { if (r.ok) setIsAdmin(true); }).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gf-obsidian)" }}>
      {/* SIDEBAR — Desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r py-6 px-4 shrink-0" style={{ background: "var(--gf-dark)", borderColor: "var(--gf-border)" }}>
        <Link href="/" className="mb-8 px-2">
          <span className="text-lg font-bold gf-gold-text">GOLD FOUNDRY</span>
          <div className="text-[8px] tracking-[2px] mt-0.5" style={{ color: "var(--gf-text-dim)" }}>FORGE TERMINAL</div>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(n => {
            const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href));
            return (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all ${active ? "font-semibold" : "hover:bg-white/[0.02]"}`}
                style={{ color: active ? "var(--gf-gold)" : "var(--gf-text-dim)", background: active ? "rgba(212,165,55,0.06)" : undefined, borderLeft: active ? "2px solid var(--gf-gold)" : "2px solid transparent" }}>
                <span className="text-base w-5 text-center">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <Link href="/admin" className="mt-2 flex items-center gap-2 px-3 py-2 rounded text-xs transition-colors hover:bg-white/[0.02]" style={{ color: "#e74c3c", borderTop: "1px solid var(--gf-border)" }}>
            <span>🔐</span> Admin Panel
          </Link>
        )}
        <button onClick={handleLogout} className="mt-2 px-3 py-2 text-xs text-left transition-colors hover:text-[#c0392b]" style={{ color: "var(--gf-text-dim)" }}>
          Logout →
        </button>
      </aside>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t" style={{ background: "var(--gf-dark)", borderColor: "var(--gf-border)" }}>
        {NAV.slice(0, 5).map(n => {
          const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href));
          return (
            <Link key={n.href} href={n.href} className="flex-1 flex flex-col items-center py-2 text-xs gap-0.5" style={{ color: active ? "var(--gf-gold)" : "var(--gf-text-dim)" }}>
              <span className="text-lg">{n.icon}</span>
              <span className="text-[10px]">{n.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* CONTENT */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
