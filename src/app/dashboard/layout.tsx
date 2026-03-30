// src/app/dashboard/layout.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import GoldFoundryLogo from "@/components/GoldFoundryLogo";
import { UserProvider, useUser } from "@/contexts/UserContext";
import RiskDisclaimer from "@/components/RiskDisclaimer";

const TIER_LEVELS: Record<string, number> = {
  free: 0, analyzer: 1, copier: 2, pro: 3, provider: 4,
};

const TIER_COLORS: Record<string, string> = {
  free: "#71717a", analyzer: "#3b82f6", copier: "var(--gf-gold)",
  pro: "#a855f7", provider: "#ef4444",
};

const TIER_LABELS: Record<string, string> = {
  free: "Free", analyzer: "Analyzer", copier: "Copier",
  pro: "Pro", provider: "Provider",
};

interface NavItem {
  href: string;
  label: string;
  icon: string;
  group?: string;
  minTier?: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Command Center", icon: "\u25c6", group: "main" },
  { href: "/dashboard/accounts", label: "Accounts", icon: "\ud83d\udcca", group: "trading" },
  { href: "/dashboard/copier", label: "Smart Copier", icon: "\u26a1", group: "trading", minTier: "copier" },
  { href: "/dashboard/trades", label: "Trade Ledger", icon: "\ud83d\udccb", group: "trading" },
  { href: "/dashboard/chat", label: "FORGE Mentor", icon: "\ud83e\udde0", group: "ai", minTier: "analyzer" },
  { href: "/dashboard/settings", label: "Settings", icon: "\u2699", group: "system" },
];

const MOBILE_NAV = NAV.filter(n => [
  "/dashboard", "/dashboard/copier", "/dashboard/chat",
  "/dashboard/accounts",
].includes(n.href));

const GROUP_LABELS: Record<string, string> = {
  main: "", trading: "Trading", ai: "KI", system: "System",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, tier, isLoggedIn } = useUser();
  const path = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/auth/login");
    }
  }, [loading, isLoggedIn, router]);

  useEffect(() => {
    fetch("/api/admin/overview").then(r => { if (r.ok) setIsAdmin(true); }).catch(() => {});
  }, []);

  if (loading || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gf-obsidian)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
          <span className="text-xs text-zinc-600 font-mono tracking-wider">LOADING</span>
        </div>
      </div>
    );
  }

  function hasAccess(n: NavItem): boolean {
    if (!n.minTier) return true;
    return (TIER_LEVELS[tier] ?? 0) >= (TIER_LEVELS[n.minTier] ?? 0);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  // Get page title from NAV
  const currentNav = NAV.find(n => path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href + "/")));
  const pageTitle = currentNav?.label ?? "Dashboard";

  // Group nav items
  const groups = [...new Set(NAV.map(n => n.group ?? "main"))];

  // User initials
  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "GF";

  const tierColor = TIER_COLORS[tier] ?? TIER_COLORS.free;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gf-obsidian)" }}>
      {/* ── SIDEBAR (Desktop) ──────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col border-r shrink-0 transition-all duration-300"
        style={{
          width: sidebarCollapsed ? 72 : 240,
          background: "var(--gf-dark)",
          borderColor: "var(--gf-border)",
        }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--gf-border)" }}>
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <GoldFoundryLogo size={sidebarCollapsed ? 28 : 32} showText={!sidebarCollapsed} />
          </Link>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs p-1"
          >
            {sidebarCollapsed ? "\u25b6" : "\u25c0"}
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="flex flex-col flex-1 p-2 overflow-y-auto gap-1">
          {groups.map(group => (
            <div key={group}>
              {GROUP_LABELS[group] && !sidebarCollapsed && (
                <div className="px-3 pt-4 pb-1 text-[9px] font-semibold text-zinc-600 uppercase tracking-[2px] font-mono">
                  {GROUP_LABELS[group]}
                </div>
              )}
              {GROUP_LABELS[group] && sidebarCollapsed && <div className="mx-2 my-2 h-px bg-zinc-800" />}
              {NAV.filter(n => (n.group ?? "main") === group).map(n => {
                const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href + "/"));
                const locked = !hasAccess(n);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    title={sidebarCollapsed ? n.label : undefined}
                    className={`flex items-center gap-3 rounded-lg text-sm transition-all duration-200 relative ${
                      sidebarCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                    } ${
                      active
                        ? "font-semibold text-[var(--gf-gold)]"
                        : locked
                          ? "text-zinc-700 hover:text-zinc-500"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                    }`}
                    style={active ? { background: "rgba(250,239,112,0.05)" } : undefined}
                  >
                    {active && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r" style={{ background: "var(--gf-gold)" }} />
                    )}
                    <span className="text-base w-5 text-center flex-shrink-0">{n.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="truncate">{n.label}</span>
                        {locked && (
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(250,239,112,0.08)", color: "var(--gf-gold)" }}>
                            {n.minTier?.toUpperCase()}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Section (Bottom) */}
        <div className="p-3 border-t" style={{ borderColor: "var(--gf-border)" }}>
          {isAdmin && !sidebarCollapsed && (
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/5 transition-colors mb-2">
              <span>\ud83d\udd10</span> Admin Panel
            </Link>
          )}

          <div className={`flex items-center gap-3 p-2 rounded-xl ${sidebarCollapsed ? "justify-center" : ""}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--gf-border)" }}>
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: `${tierColor}15`, border: `2px solid ${tierColor}40`, color: tierColor }}
            >
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.full_name ?? user?.email?.split("@")[0]}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tierColor }} />
                  <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: tierColor }}>
                    {TIER_LABELS[tier]}
                  </span>
                </div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="text-zinc-600 hover:text-red-400 transition-colors p-1 text-xs"
                title="Logout"
              >
                \u2192
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── MOBILE NAV (Bottom) ──────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t" style={{ background: "rgba(9,9,11,0.97)", backdropFilter: "blur(20px)", borderColor: "var(--gf-border)" }}>
        <div className="flex justify-around px-1">
          {MOBILE_NAV.map(n => {
            const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href + "/"));
            return (
              <Link
                key={n.href}
                href={n.href}
                className="flex flex-col items-center py-2.5 px-2 transition-colors relative"
                style={{ color: active ? "var(--gf-gold)" : "var(--gf-text-dim)" }}
              >
                {active && <div className="absolute top-0 left-2 right-2 h-0.5 rounded-b" style={{ background: "var(--gf-gold)" }} />}
                <span className="text-lg">{n.icon}</span>
                <span className="text-[9px] font-medium mt-0.5">{n.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center py-2.5 px-2 text-zinc-600"
          >
            <span className="text-lg">\u2192</span>
            <span className="text-[9px] font-medium mt-0.5">Logout</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 flex flex-col">
        {/* TopBar */}
        <div className="sticky top-0 z-40 border-b px-4 md:px-8 py-3 flex items-center justify-between" style={{ background: "rgba(9,9,11,0.85)", backdropFilter: "blur(16px)", borderColor: "var(--gf-border)" }}>
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-white">{pageTitle}</h1>
            <span className="hidden sm:inline-block text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider" style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}>
              {TIER_LABELS[tier]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings" className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/[0.03]" style={{ color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.15)" }}>
              <span>\u2699</span> Settings
            </Link>
            {/* Mobile Avatar */}
            <div className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: `${tierColor}15`, border: `1px solid ${tierColor}30`, color: tierColor }}>
              {initials}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-in">
          {children}
          <RiskDisclaimer compact />
        </div>
      </main>
    </div>
  );
}
