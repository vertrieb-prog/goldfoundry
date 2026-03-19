"use client";
import Link from "next/link";
import { useState } from "react";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: 9,
    firstMonth: 2,
    desc: "Perfekt fuer den Einstieg",
    features: [
      "Trade-History Analyse",
      "1 MT-Account",
      "FORGE Mentor (5/Tag)",
      "Community Zugang",
      "Leaderboard",
    ],
  },
  {
    key: "copier",
    name: "Smart Copier",
    price: 29,
    firstMonth: 6,
    popular: true,
    desc: "Der beliebteste Plan",
    features: [
      "Alles aus Starter",
      "Smart Copier (1 Account)",
      "Telegram Copier + Trade Management",
      "7-Faktor Risk Engine",
      "Market Intel + News Pause",
      "FORGE Mentor unbegrenzt",
      "50% Affiliate Provision",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 79,
    firstMonth: 16,
    desc: "Fuer ernsthafte Trader",
    features: [
      "Alles aus Smart Copier",
      "Smart Copier (5 Accounts)",
      "Telegram Copier (3 Channels)",
      "MQL4/MQL5 Code-Optimierung",
      "Backtest mit Monte Carlo",
      "Strategy Marketplace",
      "50% Affiliate Provision",
    ],
  },
];

const FEATURE_MATRIX: {
  category: string;
  features: { name: string; starter: string | boolean; copier: string | boolean; pro: string | boolean }[];
}[] = [
  {
    category: "Trading Tools",
    features: [
      { name: "Command Center", starter: true, copier: true, pro: true },
      { name: "Accounts (MT4/MT5)", starter: "1 Account", copier: "1 Account", pro: "5 Accounts" },
      { name: "Trade Ledger", starter: true, copier: true, pro: true },
      { name: "Leaderboard", starter: true, copier: true, pro: true },
    ],
  },
  {
    category: "Copy Trading",
    features: [
      { name: "Smart Copier", starter: false, copier: "1 Account", pro: "5 Accounts" },
      { name: "Telegram Copier", starter: false, copier: "1 Channel", pro: "3 Channels" },
      { name: "7-Faktor Risk Engine", starter: false, copier: true, pro: true },
      { name: "Market Intel + News Pause", starter: false, copier: true, pro: true },
    ],
  },
  {
    category: "Analyse & Mentoring",
    features: [
      { name: "FORGE Mentor", starter: "5/Tag", copier: "Unbegrenzt", pro: "Unbegrenzt" },
      { name: "Trade-History Analyse", starter: true, copier: true, pro: true },
      { name: "MQL4/MQL5 Code-Optimierung", starter: false, copier: false, pro: true },
    ],
  },
  {
    category: "Strategy Lab",
    features: [
      { name: "Backtest mit Monte Carlo", starter: false, copier: false, pro: true },
      { name: "Strategy Marketplace", starter: false, copier: false, pro: true },
    ],
  },
  {
    category: "Partner & Provision",
    features: [
      { name: "Affiliate Link", starter: false, copier: true, pro: true },
      { name: "Bis zu 50% Provision", starter: false, copier: true, pro: true },
    ],
  },
];

export default function PricingPage() {
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  function openFunnel(plan: string) {
    window.dispatchEvent(new CustomEvent("openFunnel", { detail: { plan } }));
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#040302" }}>
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 600, height: 600, top: -100, right: -100 }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <nav className="flex items-center justify-between mb-20">
          <Link href="/" className="text-xl font-extrabold tracking-wide" style={{ color: "#d4a537" }}>
            GOLD FOUNDRY
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors hidden sm:inline">
              Startseite
            </Link>
            <Link href="/auth/login" className="gf-btn-outline gf-btn-sm">
              Login
            </Link>
          </div>
        </nav>

        <div className="text-center mb-16">
          <div className="text-xs tracking-[4px] uppercase mb-4" style={{ color: "#d4a537" }}>
            Pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4" style={{ color: "#fff8e8" }}>
            Einfach. Transparent.
            <br />
            <span style={{ color: "#d4a537" }}>Ab €2/Monat.</span>
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-6">
            80% Rabatt im ersten Monat. Kein Vertrag. Jederzeit kuendbar.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">&#x2713;</span> 80% Rabatt
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">&#x2713;</span> Jederzeit kuendbar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">&#x2713;</span> Crypto + Stripe
            </span>
          </div>
        </div>

        {/* Coupon */}
        <div className="max-w-sm mx-auto mb-10 flex gap-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="Gutscheincode (optional)"
            className="flex-1 px-4 py-2.5 rounded text-sm bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:border-[#d4a537] focus:outline-none"
          />
          <button
            onClick={() => {
              if (["FORGE", "FORGE50", "FREETRIAL", "PROPFIRM"].includes(coupon.toUpperCase())) setCouponApplied(true);
            }}
            className="px-4 py-2.5 rounded text-sm font-bold"
            style={{ background: "#d4a537", color: "#040302" }}
          >
            Anwenden
          </button>
        </div>
        {couponApplied && (
          <div className="text-center text-emerald-400 text-sm mb-6 font-mono">
            &#x2713; Code &quot;{coupon}&quot; angewendet!
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-lg p-6 flex flex-col relative border ${
                plan.popular ? "border-[#d4a537]/50 bg-[#d4a537]/5" : "border-white/5 bg-white/[0.02]"
              }`}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 text-[10px] tracking-widest font-bold rounded-full font-mono"
                  style={{ background: "linear-gradient(135deg, #d4a537, #f0d070)", color: "#040302" }}
                >
                  EMPFOHLEN
                </div>
              )}
              <h3 className="text-lg font-bold mb-1" style={{ color: "#fff8e8" }}>
                {plan.name}
              </h3>
              <p className="text-xs text-zinc-500 mb-4">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold font-mono" style={{ color: "#d4a537" }}>
                  €{plan.firstMonth}
                </span>
                <span className="text-sm text-zinc-500">/1. Monat</span>
              </div>
              <div className="text-xs text-zinc-600 mb-6">
                danach €{plan.price}/Monat
              </div>
              <div className="flex-1 space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 text-xs" style={{ color: "#d4a537" }}>
                      &#x2726;
                    </span>
                    <span className="text-zinc-400">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => openFunnel(plan.key)}
                className={`w-full py-3 rounded font-bold text-sm transition-all ${
                  plan.popular
                    ? "text-[#040302] hover:brightness-110"
                    : "border border-[#d4a537]/30 text-[#d4a537] hover:bg-[#d4a537]/10"
                }`}
                style={plan.popular ? { background: "linear-gradient(135deg, #d4a537, #f0d070)" } : {}}
              >
                Plan waehlen &rarr;
              </button>
            </div>
          ))}
        </div>

        {/* Feature Matrix */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <div className="text-xs tracking-[4px] uppercase mb-4" style={{ color: "#d4a537" }}>
              Feature-Vergleich
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold mb-3" style={{ color: "#fff8e8" }}>
              Alle Features im <span style={{ color: "#d4a537" }}>Ueberblick</span>
            </h2>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 text-zinc-500 font-normal w-[220px]">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.key} className="py-4 px-3 text-center">
                      <div className="font-bold text-sm" style={{ color: "#fff8e8" }}>{p.name}</div>
                      <div className="font-mono text-xs mt-0.5" style={{ color: "#d4a537" }}>€{p.price}/Mo</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_MATRIX.map((cat, ci) => (
                  <tbody key={ci}>
                    <tr>
                      <td colSpan={4} className="pt-5 pb-2 px-4">
                        <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase font-mono">
                          {cat.category}
                        </span>
                      </td>
                    </tr>
                    {cat.features.map((f, fi) => (
                      <tr key={fi} className="border-b border-white/[0.03] hover:bg-white/[0.01]">
                        <td className="py-3 px-4 text-zinc-400">{f.name}</td>
                        {(["starter", "copier", "pro"] as const).map((plan) => {
                          const val = f[plan];
                          return (
                            <td key={plan} className="py-3 px-3 text-center">
                              {val === true ? (
                                <span className="text-emerald-400 text-base">&#x2713;</span>
                              ) : val === false ? (
                                <span className="text-zinc-700 text-base">&mdash;</span>
                              ) : (
                                <span className="text-xs font-medium font-mono" style={{ color: "#d4a537" }}>
                                  {val}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center">
          <button
            onClick={() => openFunnel("copier")}
            className="px-10 py-4 rounded font-bold text-base"
            style={{ background: "linear-gradient(135deg, #d4a537, #f0d070)", color: "#040302" }}
          >
            Plan waehlen &mdash; 80% Rabatt &rarr;
          </button>
          <p className="text-xs text-zinc-600 mt-3 font-mono">
            80% Rabatt im 1. Monat &middot; Jederzeit kuendbar &middot; Sofortiger Zugang
          </p>
        </div>

        {/* Risk */}
        <div className="mt-16 pt-8 border-t border-white/[0.04] text-xs text-zinc-600 text-center max-w-2xl mx-auto">
          Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust
          des eingesetzten Kapitals fuehren. Vergangene Ergebnisse sind keine Garantie fuer zukuenftige Performance.
          Gold Foundry ist kein Broker und bietet keine Anlageberatung.
        </div>
      </div>
    </div>
  );
}
