import Link from "next/link";

const SECTIONS = [
  {
    title: "User Flow",
    desc: "Der rote Faden f\u00fcr neue Kunden",
    links: [
      { href: "/", label: "Landing Page", desc: "Startseite", icon: "\ud83c\udfe0" },
      { href: "/auth/register", label: "Registrierung", desc: "Account erstellen", icon: "\ud83d\udcdd" },
      { href: "/auth/verify-email", label: "Email Best\u00e4tigen", desc: "Nach Registrierung", icon: "\u2709\ufe0f" },
      { href: "/auth/login", label: "Login", desc: "Bestehende User", icon: "\ud83d\udd11" },
      { href: "/dashboard/onboarding", label: "Onboarding (7 Steps)", desc: "Wizard nach Registrierung", icon: "\ud83d\ude80" },
      { href: "/dashboard", label: "Dashboard", desc: "Command Center", icon: "\ud83d\udcca" },
    ],
  },
  {
    title: "Dashboard",
    desc: "Alle Dashboard-Seiten (Login erforderlich)",
    links: [
      { href: "/dashboard", label: "Command Center", desc: "KPIs, Equity, Trades", icon: "\u25c6" },
      { href: "/dashboard/accounts", label: "Accounts", desc: "MT4/MT5 Konten", icon: "\ud83d\udcca" },
      { href: "/dashboard/accounts/add", label: "Konto verbinden", desc: "Neues MT-Konto", icon: "\u2795" },
      { href: "/dashboard/copier", label: "Smart Copier", desc: "Copier Status & Risk", icon: "\u26a1" },
      { href: "/dashboard/telegram", label: "Telegram Copier", desc: "Signal-Channels", icon: "\ud83d\udce1" },
      { href: "/dashboard/chat", label: "FORGE Mentor", desc: "KI-Trading-Mentor", icon: "\ud83e\udde0" },
      { href: "/dashboard/trades", label: "Trade Ledger", desc: "Alle Trades", icon: "\ud83d\udccb" },
      { href: "/dashboard/strategy", label: "Strategy Lab", desc: "Backtest & Analyse", icon: "\ud83d\udd2c" },
      { href: "/dashboard/partner", label: "Partner Hub", desc: "MLM & Affiliate", icon: "\ud83d\udcb0" },
      { href: "/dashboard/partner/earnings", label: "Partner Earnings", desc: "Provisionen", icon: "\ud83d\udcb5" },
      { href: "/dashboard/partner/invite", label: "Partner Invite", desc: "Einladungen", icon: "\ud83d\udce8" },
      { href: "/dashboard/partner/team", label: "Partner Team", desc: "Netzwerk", icon: "\ud83d\udc65" },
      { href: "/dashboard/partner/coach", label: "Partner Coach", desc: "KI-Coach", icon: "\ud83c\udfc6" },
      { href: "/dashboard/partner/hot-leads", label: "Hot Leads", desc: "Warme Kontakte", icon: "\ud83d\udd25" },
      { href: "/dashboard/partner/material", label: "Material", desc: "Marketing-Material", icon: "\ud83d\udcc2" },
      { href: "/dashboard/partner/landing", label: "Landing Pages", desc: "Partner-LPs", icon: "\ud83c\udfaf" },
      { href: "/dashboard/partner/tasks", label: "Partner Tasks", desc: "Aufgaben", icon: "\u2705" },
      { href: "/dashboard/partner/network", label: "Network", desc: "MLM-Baum", icon: "\ud83c\udf10" },
      { href: "/dashboard/profit", label: "Profit Share", desc: "Gewinnbeteiligung", icon: "\ud83d\udcc8" },
      { href: "/dashboard/affiliate", label: "Affiliate", desc: "Affiliate-Dashboard", icon: "\ud83d\udd17" },
      { href: "/dashboard/upgrade", label: "Upgrade", desc: "Plan wechseln", icon: "\ud83d\udc8e" },
      { href: "/dashboard/settings", label: "Settings", desc: "Einstellungen", icon: "\u2699\ufe0f" },
    ],
  },
  {
    title: "Public Pages",
    desc: "\u00d6ffentliche Seiten (kein Login)",
    links: [
      { href: "/pricing", label: "Pricing", desc: "Pl\u00e4ne & Preise", icon: "\ud83d\udcb3" },
      { href: "/smart-copier", label: "Smart Copier", desc: "Produkt-LP", icon: "\u26a1" },
      { href: "/telegram-copier", label: "Telegram Copier", desc: "Produkt-LP", icon: "\ud83d\udce1" },
      { href: "/forge-mentor", label: "FORGE Mentor", desc: "KI-Mentor LP", icon: "\ud83e\udde0" },
      { href: "/risk-shield", label: "Risk Shield", desc: "Risk Engine LP", icon: "\ud83d\udee1\ufe0f" },
      { href: "/strategy-lab", label: "Strategy Lab", desc: "Strategie LP", icon: "\ud83d\udd2c" },
      { href: "/crypto", label: "Crypto", desc: "Krypto-Bereich", icon: "\u20bf" },
      { href: "/partner", label: "Partner", desc: "Partner-Programm", icon: "\ud83e\udd1d" },
      { href: "/leaderboard", label: "Leaderboard", desc: "Top Trader", icon: "\ud83c\udfc6" },
    ],
  },
  {
    title: "Admin",
    desc: "Admin Panel (Admin-Rechte erforderlich)",
    links: [
      { href: "/admin", label: "Admin Dashboard", desc: "\u00dcbersicht", icon: "\ud83d\udd10" },
      { href: "/admin/accounts", label: "Accounts", desc: "Alle Konten", icon: "\ud83d\udcca" },
      { href: "/admin/crm", label: "CRM", desc: "Leads & Kontakte", icon: "\ud83d\udcde" },
      { href: "/admin/signals", label: "Signals", desc: "Signal-Management", icon: "\ud83d\udce1" },
      { href: "/admin/settlements", label: "Settlements", desc: "Auszahlungen", icon: "\ud83d\udcb8" },
      { href: "/admin/system", label: "System", desc: "System-Status", icon: "\ud83d\udda5\ufe0f" },
    ],
  },
  {
    title: "Legal",
    desc: "Rechtliche Seiten",
    links: [
      { href: "/agb", label: "AGB", desc: "Gesch\u00e4ftsbedingungen", icon: "\ud83d\udcc4" },
      { href: "/datenschutz", label: "Datenschutz", desc: "Datenschutzerkl\u00e4rung", icon: "\ud83d\udd12" },
      { href: "/impressum", label: "Impressum", desc: "Anbieterkennzeichnung", icon: "\ud83c\udfdb\ufe0f" },
      { href: "/risk-disclaimer", label: "Risk Disclaimer", desc: "Risikohinweis", icon: "\u26a0\ufe0f" },
    ],
  },
];

export default function LinktreePage() {
  const totalLinks = SECTIONS.reduce((s, sec) => s + sec.links.length, 0);

  return (
    <div className="min-h-screen relative" style={{ background: "var(--gf-obsidian)" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 500, height: 500, top: "5%", left: "50%", transform: "translateX(-50%)" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/">
            <span className="text-2xl font-extrabold gf-gold-text tracking-wide">GOLD FOUNDRY</span>
          </Link>
          <div className="text-[9px] tracking-[3px] mt-1.5 text-zinc-600 font-mono">SITEMAP &middot; {totalLinks} SEITEN</div>
          <h1 className="gf-heading text-3xl mt-6 mb-2">Alle Seiten</h1>
          <p className="text-sm text-zinc-500">Komplette &Uuml;bersicht aller Gold Foundry Seiten &amp; Features.</p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">{sec.title}</h2>
                <p className="text-xs text-zinc-500">{sec.desc}</p>
              </div>
              <div className="grid gap-2">
                {sec.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="gf-panel flex items-center gap-4 px-5 py-3.5 group hover:!border-[rgba(250,239,112,0.2)]"
                  >
                    <span className="text-xl w-8 text-center flex-shrink-0">{link.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-[var(--gf-gold)] transition-colors">{link.label}</div>
                      <div className="text-[11px] text-zinc-500">{link.desc}</div>
                    </div>
                    <div className="text-[10px] text-zinc-700 font-mono truncate max-w-[200px] hidden sm:block">{link.href}</div>
                    <span className="text-zinc-700 group-hover:text-[var(--gf-gold)] transition-colors">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 text-center" style={{ borderTop: "1px solid var(--gf-border)" }}>
          <p className="text-xs text-zinc-600">Gold Foundry &middot; goldfoundry.de</p>
        </div>
      </div>
    </div>
  );
}
