// src/app/pricing/page.tsx
"use client";
import Link from "next/link";
import { useState } from "react";

const PLANS = [
  {
    key: "analyzer",
    name: "Analyzer",
    price: 9,
    desc: "Perfekt für den Einstieg",
    features: ["Trade-History Analyse", "1 MT-Account", "FORGE Mentor (5/Tag)", "Community Zugang", "Leaderboard"],
  },
  {
    key: "copier",
    name: "Copier",
    price: 29,
    popular: true,
    desc: "Der beliebteste Plan",
    features: ["Alles aus Analyzer", "Smart Copier (1 Account)", "7-Faktor Risk Engine", "Market Intel + News Pause", "FORGE Mentor unbegrenzt", "Affiliate Link"],
  },
  {
    key: "pro",
    name: "Pro Trader",
    price: 79,
    desc: "Für ernsthafte Trader",
    features: ["Alles aus Copier", "Smart Copier (5 Accounts)", "MQL4/MQL5 Code-Optimierung", "Backtest mit Monte Carlo", "Strategy Marketplace", "MLM Trader Partner"],
  },
  {
    key: "provider",
    name: "Signal Provider",
    price: 149,
    desc: "Monetarisiere deine Trades",
    features: ["Alles aus Pro", "Unbegrenzte Follower", "Profit-Abrechnung 60/40", "Branded Landing Page", "API Zugang", "Dedicated Manager"],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(plan: string) {
    setLoading(plan);
    const res = await fetch("/api/cryptomus/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { alert(data.error ?? "Fehler"); setLoading(null); }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--gf-obsidian)" }}>
      {/* Background */}
      <div className="gf-grid-bg fixed inset-0 z-0" />
      <div className="gf-orb gf-orb-gold fixed z-0" style={{ width: 600, height: 600, top: -100, right: -100 }} />
      <div className="gf-orb gf-orb-warm fixed z-0" style={{ width: 400, height: 400, bottom: 100, left: -100 }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-20">
          <Link href="/" className="text-xl font-extrabold gf-gold-text tracking-wide">GOLD FOUNDRY</Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors hidden sm:inline">Startseite</Link>
            <Link href="/auth/login" className="gf-btn-outline gf-btn-sm">Login</Link>
          </div>
        </nav>

        {/* Header */}
        <div className="text-center mb-16">
          <span className="gf-eyebrow mb-4 block">Pricing</span>
          <h1 className="gf-heading text-4xl md:text-6xl mb-4">
            Einfach. Transparent.
            <br />
            <span className="gf-gold-text">Ab €9/Monat.</span>
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-6">
            Kein Vertrag. Jederzeit kündbar. In 2 Minuten startklar.
          </p>
          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 font-mono">
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Keine Kreditkarte</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Jederzeit kündbar</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Crypto-Payment</span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div key={plan.key} className={`gf-panel p-6 flex flex-col relative ${plan.popular ? "ring-1 ring-[var(--gf-gold)]" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] tracking-widest font-bold rounded-full font-mono" style={{ background: "var(--gf-gold)", color: "var(--gf-obsidian)" }}>
                  BELIEBTESTER
                </div>
              )}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-xs text-zinc-500 mb-4">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold gf-gold-text font-mono">€{plan.price}</span>
                <span className="text-sm text-zinc-500">/Monat</span>
              </div>
              <div className="flex-1 space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-[var(--gf-gold)] mt-0.5 text-xs">✦</span>
                    <span className="text-zinc-400">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => checkout(plan.key)}
                className={plan.popular ? "gf-btn gf-btn-shimmer w-full" : "gf-btn-outline w-full"}
                disabled={loading === plan.key}
              >
                {loading === plan.key ? "Laden..." : "Jetzt starten →"}
              </button>
            </div>
          ))}
        </div>

        {/* Payment info */}
        <div className="mt-12 text-center text-sm text-zinc-500">
          Zahlung via <span className="gf-gold-text font-semibold">Cryptomus</span> — USDT, BTC, ETH, und 15+ weitere Cryptos akzeptiert.
        </div>

        {/* Comparison to competitors */}
        <div className="mt-20 text-center">
          <h3 className="gf-heading text-2xl md:text-3xl mb-4">Zum Vergleich:</h3>
          <p className="text-zinc-500 mb-8 max-w-lg mx-auto">
            Andere verlangen 180€+/Monat für einzelne Features. Gold Foundry gibt dir <strong className="text-white">alles</strong> in einem System.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { tool: "MyFXBook Pro", price: "~30€" },
              { tool: "FX Blue", price: "~20€" },
              { tool: "TradingView", price: "~50€" },
              { tool: "Telegram Copier", price: "~80€" },
            ].map((c, i) => (
              <div key={i} className="gf-panel p-4 text-center">
                <div className="text-xs text-zinc-500 mb-1 line-through">{c.tool}</div>
                <div className="text-red-400 font-mono font-bold text-sm">{c.price}/Mo</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <span className="text-zinc-400 text-sm">Gold Foundry: <strong className="gf-gold-text text-lg font-mono">ab €9/Mo</strong> für alles.</span>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center">
          <Link href="/auth/register" className="gf-btn gf-btn-shimmer gf-btn-breathe text-base !px-10 !py-4">
            Jetzt starten — Kein Risiko →
          </Link>
          <p className="text-xs text-zinc-600 mt-3 font-mono">Keine Kreditkarte · Jederzeit kündbar · Sofortiger Zugang</p>
        </div>

        {/* Risk disclaimer */}
        <div className="mt-16 pt-8 border-t border-white/[0.04] text-xs text-zinc-600 text-center max-w-2xl mx-auto">
          Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals führen.
        </div>
      </div>
    </div>
  );
}
