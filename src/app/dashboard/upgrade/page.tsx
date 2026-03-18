// src/app/dashboard/upgrade/page.tsx — BRUTALE Upgrade/Checkout Page
"use client";
import { useState, useEffect } from "react";

const PLANS = [
  {
    key: "analyzer",
    name: "Analyzer",
    price: 9,
    desc: "Dein Einstieg ins professionelle Trading",
    tagline: "Analysiere. Verstehe. Wachse.",
    features: [
      "Trade-History Analyse",
      "1 MT-Account verbinden",
      "FORGE Mentor (5 Anfragen/Tag)",
      "Community Zugang",
      "Leaderboard",
    ],
    color: "#a855f7",
  },
  {
    key: "copier",
    name: "Smart Copier",
    price: 29,
    popular: true,
    desc: "Copy Trading auf Steroiden",
    tagline: "Kopiere. Automatisiere. Profitiere.",
    features: [
      "Alles aus Analyzer",
      "Smart Copier (1 Account)",
      "Telegram Copier + AI",
      "7-Faktor Risk Engine",
      "Market Intel + Auto News-Pause",
      "FORGE Mentor unbegrenzt",
      "Affiliate Link",
    ],
    color: "#d4a537",
  },
  {
    key: "pro",
    name: "Pro Trader",
    price: 79,
    desc: "Für Trader die es ernst meinen",
    tagline: "Skaliere. Optimiere. Dominiere.",
    features: [
      "Alles aus Smart Copier",
      "Smart Copier (5 Accounts)",
      "Telegram Copier (3 Channels)",
      "MQL4/MQL5 Code-Optimierung",
      "Backtest mit Monte Carlo",
      "Strategy Marketplace",
      "MLM Trader Partner",
    ],
    color: "#3b82f6",
  },
  {
    key: "provider",
    name: "Signal Provider",
    price: 149,
    desc: "Werde zum Trading-Unternehmer",
    tagline: "Monetarisiere. Skaliere. Herrsche.",
    features: [
      "Alles aus Pro Trader",
      "Unbegrenzte Follower",
      "Telegram Copier (unbegrenzt)",
      "Profit-Abrechnung 60/40",
      "Branded Landing Page",
      "API Zugang",
      "Dedicated Manager",
    ],
    color: "#27ae60",
  },
];

const STATS = [
  { value: "2.400+", label: "Aktive Trader" },
  { value: "84%", label: "Challenge Pass-Rate" },
  { value: "<50ms", label: "Copy-Latenz" },
  { value: "€12M+", label: "Managed Volume" },
];

const TESTIMONIALS = [
  { name: "Marco T.", tier: "Smart Copier", text: "Phase 1 in 12 Tagen bestanden. Der Risk Engine hat mein Konto gerettet als NFP kam.", profit: "+€4.200" },
  { name: "Sarah K.", tier: "Pro Trader", text: "5 Accounts parallel. Alle profitabel. Die Telegram-Integration ist ein Gamechanger.", profit: "+€11.800" },
  { name: "Alen M.", tier: "Smart Copier", text: "Vorher 3x gebustet. Mit Gold Foundry erste Challenge bestanden. DD-Buffer ist genial.", profit: "+€2.900" },
];

const FEATURE_MATRIX: { category: string; features: { name: string; analyzer: string | boolean; copier: string | boolean; pro: string | boolean; provider: string | boolean }[] }[] = [
  {
    category: "Trading Tools",
    features: [
      { name: "Command Center", analyzer: true, copier: true, pro: true, provider: true },
      { name: "Accounts (MT4/MT5)", analyzer: "1", copier: "1", pro: "5", provider: "∞" },
      { name: "Trade Ledger", analyzer: true, copier: true, pro: true, provider: true },
    ],
  },
  {
    category: "Copy Trading",
    features: [
      { name: "Smart Copier", analyzer: false, copier: "1 Acc", pro: "5 Acc", provider: "∞" },
      { name: "Telegram Copier", analyzer: false, copier: "1 Ch", pro: "3 Ch", provider: "∞" },
      { name: "7-Faktor Risk Engine", analyzer: false, copier: true, pro: true, provider: true },
      { name: "Market Intel + News Pause", analyzer: false, copier: true, pro: true, provider: true },
    ],
  },
  {
    category: "KI & Analyse",
    features: [
      { name: "FORGE Mentor", analyzer: "5/Tag", copier: "∞", pro: "∞", provider: "∞" },
      { name: "MQL Code-Optimierung", analyzer: false, copier: false, pro: true, provider: true },
      { name: "Monte Carlo Backtest", analyzer: false, copier: false, pro: true, provider: true },
    ],
  },
  {
    category: "Partner & Revenue",
    features: [
      { name: "Affiliate Link", analyzer: false, copier: true, pro: true, provider: true },
      { name: "MLM Partner", analyzer: false, copier: false, pro: true, provider: true },
      { name: "Follower monetarisieren", analyzer: false, copier: false, pro: false, provider: true },
      { name: "Branded Landing Page", analyzer: false, copier: false, pro: false, provider: true },
    ],
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("free");
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d?.user?.subscription_tier) setCurrentTier(d.user.subscription_tier); })
      .catch(() => {});
  }, []);

  async function checkout(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/cryptomus/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { alert(data.error ?? "Fehler beim Checkout"); setLoading(null); }
    } catch { alert("Verbindung fehlgeschlagen"); setLoading(null); }
  }

  const TIER_ORDER = ["free", "analyzer", "copier", "pro", "provider"];
  const currentLevel = TIER_ORDER.indexOf(currentTier);

  return (
    <div className="-m-4 md:-m-8">
      {/* HERO */}
      <div className="relative overflow-hidden px-6 py-16 md:py-24 text-center" style={{ background: "linear-gradient(180deg, rgba(212,165,55,0.06) 0%, transparent 100%)" }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #d4a537 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-xs tracking-[6px] font-mono mb-4 gf-gold-text font-bold">UPGRADE</div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight" style={{ color: "var(--gf-text-bright)" }}>
            Dein Trading.{" "}
            <span className="gf-gold-text">Nächstes Level.</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-xl mx-auto" style={{ color: "var(--gf-text-dim)" }}>
            Wähle deinen Plan. Starte in 2 Minuten. Jederzeit kündbar.
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-black font-mono gf-gold-text">{s.value}</div>
                <div className="text-[10px] tracking-widest uppercase mt-1 font-mono" style={{ color: "var(--gf-text-dim)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRUST BADGES */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-6 px-4 text-xs font-mono" style={{ color: "var(--gf-text-dim)", borderBottom: "1px solid var(--gf-border)" }}>
        <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Keine Kreditkarte nötig</span>
        <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Jederzeit kündbar</span>
        <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Crypto-Payment</span>
        <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Sofort aktiv</span>
      </div>

      {/* PLANS */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map(plan => {
            const planLevel = TIER_ORDER.indexOf(plan.key);
            const isCurrent = plan.key === currentTier;
            const isDowngrade = planLevel <= currentLevel && !isCurrent && currentTier !== "free";

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 hover:translate-y-[-4px] ${plan.popular ? "ring-2 ring-[var(--gf-gold)] shadow-[0_0_40px_rgba(212,165,55,0.12)]" : ""} ${isCurrent ? "ring-2 ring-emerald-500/50" : ""}`}
                style={{
                  background: "var(--gf-dark)",
                  border: plan.popular || isCurrent ? undefined : "1px solid var(--gf-border)",
                }}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 text-[10px] tracking-[3px] font-black rounded-full font-mono shadow-lg shadow-[#d4a537]/30" style={{ background: "linear-gradient(135deg, #d4a537, #f0d070)", color: "#0a0a0a" }}>
                    BELIEBTESTER
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 text-[10px] tracking-[3px] font-black rounded-full font-mono" style={{ background: "rgba(39,174,96,0.15)", color: "#27ae60", border: "1px solid rgba(39,174,96,0.3)" }}>
                    AKTIV
                  </div>
                )}

                {/* Color accent line */}
                <div className="w-12 h-1 rounded-full mb-4" style={{ background: plan.color }} />

                <h3 className="text-xl font-black text-white mb-0.5">{plan.name}</h3>
                <p className="text-xs mb-1 font-mono" style={{ color: plan.color }}>{plan.tagline}</p>
                <p className="text-xs mb-5" style={{ color: "var(--gf-text-dim)" }}>{plan.desc}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black font-mono" style={{ color: plan.popular ? "var(--gf-gold)" : "var(--gf-text-bright)" }}>€{plan.price}</span>
                  <span className="text-sm" style={{ color: "var(--gf-text-dim)" }}>/Monat</span>
                </div>

                <div className="flex-1 space-y-2.5 mb-8">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 text-xs shrink-0" style={{ color: plan.color }}>✦</span>
                      <span style={{ color: "var(--gf-text)" }}>{f}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="w-full py-3.5 text-center text-sm font-bold rounded-xl tracking-wide" style={{
                    background: "rgba(39,174,96,0.08)",
                    border: "1px solid rgba(39,174,96,0.2)",
                    color: "#27ae60",
                  }}>
                    ✓ Dein aktiver Plan
                  </div>
                ) : isDowngrade ? (
                  <div className="w-full py-3.5 text-center text-sm rounded-xl" style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "var(--gf-text-dim)",
                  }}>
                    Inkludiert
                  </div>
                ) : (
                  <button
                    onClick={() => checkout(plan.key)}
                    className={`w-full py-3.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                      plan.popular
                        ? "text-black shadow-lg shadow-[#d4a537]/20 hover:shadow-[#d4a537]/40 hover:scale-[1.02]"
                        : "text-white hover:opacity-90"
                    }`}
                    style={{
                      background: plan.popular
                        ? "linear-gradient(135deg, #d4a537, #f0d070)"
                        : `linear-gradient(135deg, ${plan.color}dd, ${plan.color}99)`,
                    }}
                    disabled={loading === plan.key}
                  >
                    {loading === plan.key ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Laden...
                      </span>
                    ) : (
                      currentTier === "free" ? "Jetzt starten →" : "Upgrade →"
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <div className="text-center mb-8">
          <div className="text-xs tracking-[4px] font-mono gf-gold-text font-bold mb-2">ERGEBNISSE</div>
          <h2 className="text-2xl md:text-3xl font-black" style={{ color: "var(--gf-text-bright)" }}>
            Was unsere Trader sagen
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="gf-panel p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-sm" style={{ color: "var(--gf-text-bright)" }}>{t.name}</div>
                  <div className="text-[10px] font-mono gf-gold-text">{t.tier}</div>
                </div>
                <div className="text-lg font-black font-mono" style={{ color: "var(--gf-green)" }}>{t.profit}</div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--gf-text-dim)" }}>"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE COMPARISON TABLE */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <button
          onClick={() => setShowMatrix(!showMatrix)}
          className="w-full gf-panel p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <div>
            <span className="font-bold text-sm" style={{ color: "var(--gf-text-bright)" }}>Feature-Vergleich</span>
            <span className="text-xs ml-3" style={{ color: "var(--gf-text-dim)" }}>Alle Features im Detail</span>
          </div>
          <span className="text-lg" style={{ color: "var(--gf-text-dim)", transform: showMatrix ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
        </button>

        {showMatrix && (
          <div className="gf-panel mt-1 overflow-x-auto animate-in">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--gf-border)" }}>
                  <th className="text-left py-4 px-4 font-normal w-[200px]" style={{ color: "var(--gf-text-dim)" }}>Feature</th>
                  {PLANS.map(p => (
                    <th key={p.key} className="py-4 px-3 text-center">
                      <div className="font-bold" style={{ color: p.color }}>{p.name}</div>
                      <div className="font-mono text-xs mt-0.5" style={{ color: "var(--gf-text-dim)" }}>€{p.price}/Mo</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_MATRIX.map((cat, ci) => (
                  <>{/* Fragment key on tr below */}
                    <tr key={`cat-${ci}`}>
                      <td colSpan={5} className="pt-5 pb-2 px-4">
                        <span className="text-[10px] font-bold tracking-[3px] uppercase font-mono" style={{ color: "var(--gf-text-dim)" }}>{cat.category}</span>
                      </td>
                    </tr>
                    {cat.features.map((f, fi) => (
                      <tr key={`${ci}-${fi}`} className="border-b last:border-0 hover:bg-white/[0.01]" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                        <td className="py-3 px-4" style={{ color: "var(--gf-text)" }}>{f.name}</td>
                        {(["analyzer", "copier", "pro", "provider"] as const).map(plan => {
                          const val = f[plan];
                          return (
                            <td key={plan} className="py-3 px-3 text-center">
                              {val === true ? (
                                <span className="text-emerald-400 text-base font-bold">✓</span>
                              ) : val === false ? (
                                <span className="text-zinc-700">—</span>
                              ) : (
                                <span className="text-xs font-bold font-mono gf-gold-text">{val}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOTTOM CTA */}
      <div className="text-center px-6 py-16" style={{ background: "linear-gradient(0deg, rgba(212,165,55,0.04) 0%, transparent 100%)" }}>
        <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ color: "var(--gf-text-bright)" }}>
          Bereit? <span className="gf-gold-text">Jetzt starten.</span>
        </h2>
        <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--gf-text-dim)" }}>
          Keine Kreditkarte. Zahle mit Crypto. In 2 Minuten live.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="px-8 py-4 text-sm font-bold rounded-xl text-black shadow-lg shadow-[#d4a537]/20 hover:shadow-[#d4a537]/40 hover:scale-[1.02] transition-all"
          style={{ background: "linear-gradient(135deg, #d4a537, #f0d070)" }}
        >
          Plan wählen →
        </button>
        <div className="mt-6 text-xs font-mono" style={{ color: "var(--gf-text-dim)" }}>
          Zahlung via <span className="gf-gold-text font-bold">Cryptomus</span> — USDT, BTC, ETH + 15 weitere
        </div>
      </div>
    </div>
  );
}
