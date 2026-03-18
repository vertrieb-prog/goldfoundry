// ═══════════════════════════════════════════════════════════════
// src/lib/partner/share-links.ts — Auto-add referral params to URLs
// ═══════════════════════════════════════════════════════════════

type Platform = "whatsapp" | "telegram" | "instagram" | "twitter" | "email";

interface ShareLink {
  platform: Platform;
  url: string;
  label: string;
}

const BASE_URL = "https://goldfoundry.de";

function buildRefUrl(partnerId: string, platform: Platform): string {
  const params = new URLSearchParams({
    ref: partnerId,
    utm_source: platform,
    utm_medium: "partner",
    utm_campaign: "referral",
  });
  return `${BASE_URL}/?${params.toString()}`;
}

const DEFAULT_MESSAGE = "Gold Foundry — Professionelles Trading mit Smart Copier und KI-Mentor.";

export function generateShareLink(partnerId: string, platform: Platform): string {
  const refUrl = buildRefUrl(partnerId, platform);
  const text = encodeURIComponent(`${DEFAULT_MESSAGE} ${refUrl}`);

  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${text}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(refUrl)}&text=${encodeURIComponent(DEFAULT_MESSAGE)}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${text}`;
    case "email":
      return `mailto:?subject=${encodeURIComponent("Gold Foundry Trading")}&body=${text}`;
    case "instagram":
      // Instagram has no direct share URL — return the ref link to copy
      return refUrl;
    default:
      return refUrl;
  }
}

export function getShareLinks(partnerId: string): ShareLink[] {
  const platforms: { platform: Platform; label: string }[] = [
    { platform: "whatsapp", label: "WhatsApp" },
    { platform: "telegram", label: "Telegram" },
    { platform: "instagram", label: "Instagram" },
    { platform: "twitter", label: "Twitter / X" },
    { platform: "email", label: "E-Mail" },
  ];

  return platforms.map(({ platform, label }) => ({
    platform,
    label,
    url: generateShareLink(partnerId, platform),
  }));
}
