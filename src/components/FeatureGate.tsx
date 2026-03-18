"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const TIER_LEVELS: Record<string, number> = {
  free: 0, analyzer: 1, copier: 2, pro: 3, provider: 4,
};

const TIER_PRICES: Record<string, string> = {
  analyzer: "€9/Monat",
  copier: "€29/Monat",
  pro: "€79/Monat",
};

interface FeatureGateProps {
  minTier: string;
  featureName: string;
  featureDescription?: string;
  features?: string[];
  landingPage?: string;
  children: React.ReactNode;
}

export default function FeatureGate({ minTier, featureName, landingPage, children }: FeatureGateProps) {
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setTier(d.user?.subscription_tier || "free"))
      .catch(() => setTier("free"));
  }, []);

  if (tier === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--gf-gold)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const userLevel = TIER_LEVELS[tier] ?? 0;
  const requiredLevel = TIER_LEVELS[minTier] ?? 0;

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  // Show upsell card with link to landing page
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="gf-panel p-8 max-w-lg w-full text-center">
        {/* Lock icon */}
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(212,165,55,0.1)" }}>
          <span className="text-3xl">🔒</span>
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--gf-text-bright)" }}>
          {featureName}
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--gf-text-dim)" }}>
          Dieses Feature ist ab dem <span className="font-semibold gf-gold-text">{minTier.charAt(0).toUpperCase() + minTier.slice(1)}</span> Plan verfügbar.
        </p>

        {/* Price badge */}
        {TIER_PRICES[minTier] && (
          <div className="inline-block px-4 py-2 rounded-lg mb-6" style={{ background: "rgba(212,165,55,0.08)", border: "1px solid rgba(212,165,55,0.2)" }}>
            <span className="text-lg font-bold gf-gold-text">{TIER_PRICES[minTier]}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Direct to upgrade/checkout */}
          <Link href="/dashboard/upgrade" className="gf-btn gf-btn-shimmer text-center py-3 text-base font-semibold">
            Jetzt upgraden →
          </Link>

          {/* Link to landing page for details */}
          {landingPage && (
            <Link href={landingPage} target="_blank" className="gf-btn-outline text-center py-3 text-sm">
              Mehr über {featureName} erfahren
            </Link>
          )}
        </div>

        {/* Current tier info */}
        <p className="text-xs mt-6" style={{ color: "var(--gf-text-dim)" }}>
          Dein aktueller Plan: <span className="font-semibold" style={{ color: "var(--gf-text)" }}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
        </p>
      </div>
    </div>
  );
}
