// src/app/pricing/page.tsx
"use client";
import Link from "next/link";
import { useState } from "react";

const PLANS = [
  { key: "analyzer", name: "Analyzer", price: 9, features: ["Trade-History Analyse", "1 MT-Account", "FORGE Mentor (5/Tag)", "Community", "Leaderboard"] },
  { key: "copier", name: "Copier", price: 29, popular: true, features: ["Alles aus Analyzer", "Smart Copier (1 Account)", "7-Faktor Risk Engine", "Market Intel + News Pause", "FORGE Mentor unbegrenzt", "Affiliate Link"] },
  { key: "pro", name: "Pro Trader", price: 79, features: ["Alles aus Copier", "Smart Copier (5 Accounts)", "MQL4/MQL5 Code-Optimierung", "Backtest mit Monte Carlo", "Strategy Marketplace", "MLM Trader Partner"] },
  { key: "provider", name: "Signal Provider", price: 149, features: ["Alles aus Pro", "Unbegrenzte Follower", "Profit-Abrechnung 60/40", "Branded Landing Page", "API Zugang", "Dedicated Manager"] },
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
    <div className="min-h-screen py-20 px-4" style={{ background: "var(--gf-obsidian)" }}>
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center justify-between mb-16">
          <Link href="/"><span className="text-xl font-bold gf-gold-text">GOLD FOUNDRY</span></Link>
          <Link href="/auth/login" className="gf-btn-outline text-xs !px-4 !py-2">Login</Link>
        </nav>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--gf-text-bright)" }}>
            Einfach. Transparent. <span className="gf-gold-text">Ab €9/mo.</span>
          </h1>
          <p className="text-lg" style={{ color: "var(--gf-text-dim)" }}>Kein Vertrag. Jederzeit kündbar. Crypto-Payment via Cryptomus.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div key={plan.key} className={`gf-panel p-6 flex flex-col relative ${plan.popular ? "ring-1 ring-[#d4a537]" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] tracking-widest font-bold rounded" style={{ background: "var(--gf-gold)", color: "var(--gf-obsidian)" }}>BELIEBTESTER</div>
              )}
              <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--gf-text-bright)" }}>{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold gf-gold-text">€{plan.price}</span>
                <span className="text-sm" style={{ color: "var(--gf-text-dim)" }}>/Monat</span>
              </div>
              <div className="flex-1 space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span style={{ color: "var(--gf-gold)" }}>✦</span>
                    <span style={{ color: "var(--gf-text)" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => checkout(plan.key)} className={plan.popular ? "gf-btn w-full" : "gf-btn-outline w-full"} disabled={loading === plan.key}>
                {loading === plan.key ? "Laden..." : "Starten →"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm" style={{ color: "var(--gf-text-dim)" }}>
          Zahlung via <span className="gf-gold-text">Cryptomus</span> — USDT, BTC, ETH, und 15+ weitere Cryptos akzeptiert.
        </div>
      </div>
    </div>
  );
}
