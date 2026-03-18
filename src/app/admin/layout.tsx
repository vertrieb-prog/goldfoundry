// src/app/admin/layout.tsx — Admin Panel Layout
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: "◆" },
  { href: "/admin/accounts", label: "Accounts", icon: "📊" },
  { href: "/admin/signals", label: "Signal-Konten", icon: "📡" },
  { href: "/admin/crm", label: "CRM", icon: "👥" },
  { href: "/admin/settlements", label: "Abrechnungen", icon: "💰" },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/partners", label: "Partners", icon: "🤝" },
  { href: "/admin/tickets", label: "Tickets", icon: "🎫" },
  { href: "/admin/system", label: "System", icon: "⚙" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(r => {
        if (r.status === 403 || r.status === 401) {
          router.push("/dashboard");
        } else {
          setAuthorized(true);
        }
        setLoading(false);
      })
      .catch(() => { router.push("/dashboard"); setLoading(false); });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gf-obsidian)" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gf-obsidian)" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r py-6 px-4 shrink-0" style={{ background: "var(--gf-dark)", borderColor: "var(--gf-border)" }}>
        <Link href="/admin" className="mb-2 px-2">
          <span className="text-lg font-bold gf-gold-text">GOLD FOUNDRY</span>
          <div className="text-[8px] tracking-[2px] mt-0.5" style={{ color: "var(--gf-text-dim)" }}>ADMIN PANEL</div>
        </Link>

        <div className="px-2 mb-6">
          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(192,57,43,0.15)", color: "#e74c3c" }}>ADMIN</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {ADMIN_NAV.map(n => {
            const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href + "/"));
            return (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all ${active ? "font-semibold" : "hover:bg-white/[0.02]"}`}
                style={{ color: active ? "var(--gf-gold)" : "var(--gf-text-dim)", background: active ? "rgba(212,165,55,0.06)" : undefined, borderLeft: active ? "2px solid var(--gf-gold)" : "2px solid transparent" }}>
                <span className="text-base w-5 text-center">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t pt-4 mt-4" style={{ borderColor: "var(--gf-border)" }}>
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:text-[var(--gf-gold)]" style={{ color: "var(--gf-text-dim)" }}>
            ← Zum Dashboard
          </Link>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex border-b overflow-x-auto" style={{ background: "var(--gf-dark)", borderColor: "var(--gf-border)" }}>
        {ADMIN_NAV.map(n => {
          const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href + "/"));
          return (
            <Link key={n.href} href={n.href} className="flex items-center gap-1.5 px-4 py-3 text-xs whitespace-nowrap shrink-0" style={{ color: active ? "var(--gf-gold)" : "var(--gf-text-dim)", borderBottom: active ? "2px solid var(--gf-gold)" : "2px solid transparent" }}>
              <span>{n.icon}</span> {n.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto mt-12 md:mt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
