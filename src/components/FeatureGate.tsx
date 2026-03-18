"use client";
import { useState, useEffect } from "react";

const TIER_LEVELS: Record<string, number> = {
  free: 0, analyzer: 1, copier: 2, pro: 3, provider: 4,
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

  // No landing page configured — show simple lock message
  if (!landingPage) {
    return <>{children}</>;
  }

  // Show landing page as iframe inside dashboard (embed mode hides nav)
  return (
    <div className="-m-4 md:-m-8">
      <iframe
        src={`${landingPage}?embed=1`}
        className="w-full border-0"
        style={{ height: "calc(100vh - 4px)", minHeight: 800 }}
        title={featureName}
      />
    </div>
  );
}
