// ═══════════════════════════════════════════════════════════════
// src/lib/seo/expansion.ts — 200 Assets, 12 Content Clusters
// ═══════════════════════════════════════════════════════════════

import { ASSETS, SEO_CONFIG } from "@/lib/config";

export const CONTENT_CLUSTERS = [
  { id: "analyse", label: "Technische Analyse", template: "asset-analyse" },
  { id: "prognose", label: "Kurs Prognose", template: "asset-prognose" },
  { id: "strategie", label: "Trading Strategien", template: "asset-strategie" },
  { id: "signal", label: "Trading Signale", template: "asset-signal" },
  { id: "broker", label: "Broker Vergleich", template: "broker-compare" },
  { id: "lernen", label: "Trading lernen", template: "education" },
  { id: "tools", label: "Trading Tools", template: "tools" },
  { id: "news", label: "Marktnachrichten", template: "news" },
  { id: "glossar", label: "Trading Glossar", template: "glossary" },
  { id: "vergleich", label: "Plattform Vergleich", template: "compare" },
  { id: "copy", label: "Copy Trading", template: "copy-trading" },
  { id: "prop", label: "Prop Firm", template: "prop-firm" },
] as const;

// ── Get All Expansion URLs ──────────────────────────────────
export function getExpansionUrls(): Array<{ path: string; asset: string; cluster: string; priority: number }> {
  const urls: Array<{ path: string; asset: string; cluster: string; priority: number }> = [];
  const allAssets = [
    ...ASSETS.crypto.map(a => ({ symbol: a, type: "crypto" })),
    ...ASSETS.forex.map(a => ({ symbol: a, type: "forex" })),
    ...ASSETS.indices.map(a => ({ symbol: a, type: "indices" })),
    ...ASSETS.commodities.map(a => ({ symbol: a, type: "commodities" })),
  ];

  for (const asset of allAssets) {
    for (const cluster of CONTENT_CLUSTERS) {
      const slug = asset.symbol.toLowerCase();
      const priority = asset.type === "commodities" ? 0.9 : asset.type === "crypto" ? 0.8 : 0.7;
      urls.push({
        path: `/asset/${slug}/${cluster.id}`,
        asset: asset.symbol,
        cluster: cluster.id,
        priority,
      });
    }
  }
  return urls;
}

// ── Get Content Plan ────────────────────────────────────────
export function getContentPlan(daysAhead: number = 30) {
  const plan: Array<{ date: string; asset: string; cluster: string; locale: string }> = [];
  const allAssets = [...ASSETS.crypto, ...ASSETS.forex, ...ASSETS.indices, ...ASSETS.commodities];
  const locales = SEO_CONFIG.tier1Locales;

  let dayIndex = 0;
  for (let d = 0; d < daysAhead; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];

    // 5 pages per day
    for (let i = 0; i < 5; i++) {
      const assetIdx = (dayIndex * 5 + i) % allAssets.length;
      const clusterIdx = (dayIndex * 5 + i) % CONTENT_CLUSTERS.length;
      const localeIdx = (dayIndex * 5 + i) % locales.length;

      plan.push({
        date: dateStr,
        asset: allAssets[assetIdx],
        cluster: CONTENT_CLUSTERS[clusterIdx].id,
        locale: locales[localeIdx],
      });
    }
    dayIndex++;
  }
  return plan;
}
