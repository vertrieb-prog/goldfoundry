// ═══════════════════════════════════════════════════════════════
// src/lib/partner/content-generator.ts — Social Media Content
// ═══════════════════════════════════════════════════════════════

import { cachedCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";

export type Platform = "instagram" | "whatsapp" | "telegram" | "twitter";

export async function generateContent(platform: Platform, context: { profit?: number; referrals?: number; rank?: string }): Promise<string> {
    const limits: Record<Platform, number> = { instagram: 500, whatsapp: 200, telegram: 300, twitter: 280 };
    return cachedCall({
        prompt: `Erstelle einen ${platform} Post für Gold Foundry Partner. Max ${limits[platform]} Zeichen. USER-Profit, nicht Trader-Performance. Ref-Link: goldfoundry.de/r/DEIN-CODE. Deutsch, authentisch, kein Spam.`,
        message: `Kontext: Profit ${context.profit || 0}€, ${context.referrals || 0} Partner, Rang: ${context.rank || "Starter"}`,
        model: MODELS.fast,
        maxTokens: 200,
    });
}

export function getShareLinks(refCode: string, platform: Platform): string {
    const baseUrl = `https://goldfoundry.de/r/${refCode}`;
    const text = encodeURIComponent("Schau dir Gold Foundry an — professionelles Trading für jeden!");
    switch (platform) {
        case "whatsapp": return `https://wa.me/?text=${text}%20${baseUrl}`;
        case "telegram": return `https://t.me/share/url?url=${baseUrl}&text=${text}`;
        case "twitter": return `https://twitter.com/intent/tweet?text=${text}&url=${baseUrl}`;
        default: return baseUrl;
    }
}
