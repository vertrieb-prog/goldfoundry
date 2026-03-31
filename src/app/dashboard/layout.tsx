// src/app/dashboard/layout.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import GoldFoundryLogo from "@/components/GoldFoundryLogo";
import { UserProvider, useUser } from "@/contexts/UserContext";
import RiskDisclaimer from "@/components/RiskDisclaimer";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  group: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Command Center", icon: "◆", group: "main" },
  { href: "/dashboard/trader", label: "Trader", icon: "📊", group: "trading" },
  { href: "/dashboard/engine", label: "KI-Engine", icon: "🛡️", group: "trading" },
  { href: "/dashboard/trades", label: "Trades", icon: "📋", group: "trading" },
  { href: "/dashboard/konto", label: "Konto", icon: "💰", group: "konto" },
  { href: "/dashboard/rechner", label: "Rechner", icon: "📊", group: "konto" },
  { href: "/dashboard/chat", label: "FORGE Mentor", icon: "🧠", group: "hilfe" },
  { href: "/dashboard/support", label: "Support", icon: "💬", group: "hilfe" },
  { href: "/dashboard/settings", label: "Einstellungen", icon: "⚙️", group: "system" },
];

const MOBILE_NAV = NAV.filter(n => [
  "/dashboard", "/dashboard/trader", "/dashboard/engine",
  "/dashboard/konto", "/dashboard/settings",
].includes(n.href));

const GROUP_LABELS: Record<string, string> = {
  main: "", trading: "Trading", konto: "Konto", hilfe: "Hilfe", system: "",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, isLoggedIn, onboardingDone } = useUser();
  const path = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push("/auth/login");
    }
  }, [loading, isLoggedIn, router]);

  // Redirect to onboarding if not completed (skip for admins)
  useEffect(() => {
    if (!loading && isLoggedIn && !onboardingDone && !isAdmin && path !== "/dashboard/onboarding") {
      router.push("/dashboard/onboarding");
    }
  }, [loading, isLoggedIn, onboardingDone, isAdmin, path, router]);

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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  const currentNav = NAV.find(n => path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href + "/")));
  const pageTitle = currentNav?.label ?? "Dashboard";
  const groups = [...new Set(NAV.map(n => n.group))];

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "GF";

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gf-obsidian)" }}>
      {/* SIDEBAR (Desktop) */}
      <aside
        className="hidden md:flex flex-col border-r shrink-0 transition-all duration-300"
        style={{ width: sidebarCollapsed ? 72 : 240, background: "var(--gf-dark)", borderColor: "var(--gf-border)" }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--gf-border)" }}>
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <GoldFoundryLogo size={sidebarCollapsed ? 28 : 32} showText={!sidebarCollapsed} />
          </Link>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs p-1">
            {sidebarCollapsed ? "▶" : "◀"}
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
              {NAV.filter(n => n.group === group).map(n => {
                const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href + "/"));
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
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                    }`}
                    style={active ? { background: "rgba(250,239,112,0.05)" } : undefined}
                  >
                    {active && (
                      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r" style={{ background: "var(--gf-gold)" }} />
                    )}
                    <span className="text-base w-5 text-center flex-shrink-0">{n.icon}</span>
                    {!sidebarCollapsed && <span className="truncate">{n.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Broker + Plan Info */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 text-[10px] text-zinc-600 border-t" style={{ borderColor: "var(--gf-border)" }}>
            <div className="flex items-center justify-between">
              <span>Broker: Tegas FX</span>
              <span className="text-green-400">&#x1F7E2;</span>
            </div>
            <div className="mt-1">Plan: Kostenlos</div>
          </div>
        )}

        {/* User Section (Bottom) */}
        <div className="p-3 border-t" style={{ borderColor: "var(--gf-border)" }}>
          {isAdmin && !sidebarCollapsed && (
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/5 transition-colors mb-2">
              <span>&#x1F510;</span> Admin Panel
            </Link>
          )}
          <div className={`flex items-center gap-3 p-2 rounded-xl ${sidebarCollapsed ? "justify-center" : ""}`} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--gf-border)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: "rgba(250,239,112,0.06)", border: "2px solid rgba(250,239,112,0.2)", color: "var(--gf-gold)" }}>
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.full_name ?? user?.email?.split("@")[0]}
                </div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button onClick={handleLogout} className="text-zinc-600 hover:text-red-400 transition-colors p-1 text-xs" title="Logout">
                &#x2192;
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MOBILE NAV (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t" style={{ background: "rgba(9,9,11,0.97)", backdropFilter: "blur(20px)", borderColor: "var(--gf-border)" }}>
        <div className="flex justify-around px-1">
          {MOBILE_NAV.map(n => {
            const active = path === n.href || (n.href !== "/dashboard" && path.startsWith(n.href + "/"));
            return (
              <Link key={n.href} href={n.href} className="flex flex-col items-center py-2.5 px-2 transition-colors relative" style={{ color: active ? "var(--gf-gold)" : "var(--gf-text-dim)" }}>
                {active && <div className="absolute top-0 left-2 right-2 h-0.5 rounded-b" style={{ background: "var(--gf-gold)" }} />}
                <span className="text-lg">{n.icon}</span>
                <span className="text-[9px] font-medium mt-0.5">{n.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex flex-col items-center py-2.5 px-2 text-zinc-600">
            <span className="text-lg">&#x2192;</span>
            <span className="text-[9px] font-medium mt-0.5">Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0 flex flex-col">
        {/* TopBar */}
        <div className="sticky top-0 z-40 border-b px-4 md:px-8 py-3 flex items-center justify-between" style={{ background: "rgba(9,9,11,0.85)", backdropFilter: "blur(16px)", borderColor: "var(--gf-border)" }}>
          <h1 className="text-sm font-semibold text-white">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings" className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/[0.03]" style={{ color: "var(--gf-gold)", border: "1px solid rgba(250,239,112,0.15)" }}>
              <span>&#x2699;</span> Einstellungen
            </Link>
            <div className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(250,239,112,0.06)", border: "1px solid rgba(250,239,112,0.15)", color: "var(--gf-gold)" }}>
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
