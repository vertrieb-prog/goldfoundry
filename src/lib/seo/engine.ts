// ═══════════════════════════════════════════════════════════════
// src/lib/seo/engine.ts — SEO Page Generator
// ═══════════════════════════════════════════════════════════════

import { cachedCall, PROMPTS } from "@/lib/ai/cached-client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MODELS, SEO_CONFIG, ASSETS } from "@/lib/config";

export interface SEOPage {
    slug: string;
    title: string;
    metaDescription: string;
    h1: string;
    content: string;
    locale: string;
    category: string;
    keywords: string[];
    internalLinks: string[];
    publishedAt: string;
}

// ── Generate SEO Page ───────────────────────────────────────
export async function generateSEOPage(opts: {
    asset: string;
    category: string;
    locale: string;
}): Promise<SEOPage | null> {
    try {
        const slug = `${opts.asset.toLowerCase()}-${opts.category}`;
        const result = await cachedCall({
            prompt: PROMPTS.seoContent,
            message: `Erstelle eine SEO-Seite für ${opts.asset} (Kategorie: ${opts.category}). Locale: ${opts.locale}. 
Antworte mit JSON: {"title":"...","metaDescription":"max 155 chars","h1":"...","content":"HTML content mit H2/H3","keywords":["..."],"internalLinks":["/pricing","/products/copier"]}`,
            model: MODELS.fast,
            maxTokens: 1500,
        });

        const cleaned = result.replace(/```json\n?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        return {
            slug,
            title: parsed.title || `${opts.asset} Trading | Gold Foundry`,
            metaDescription: parsed.metaDescription || "",
            h1: parsed.h1 || `${opts.asset} Trading`,
            content: parsed.content || "",
            locale: opts.locale,
            category: opts.category,
            keywords: parsed.keywords || [],
            internalLinks: parsed.internalLinks || [],
            publishedAt: new Date().toISOString(),
        };
    } catch (err) {
        console.error("[SEO] Generation error:", err);
        return null;
    }
}

// ── Save SEO Page ───────────────────────────────────────────
export async function saveSEOPage(page: SEOPage) {
    const { error } = await supabaseAdmin.from("seo_pages").upsert({
        slug: page.slug,
        title: page.title,
        meta_description: page.metaDescription,
        h1: page.h1,
        content: page.content,
        locale: page.locale,
        category: page.category,
        keywords: page.keywords,
        internal_links: page.internalLinks,
        published_at: page.publishedAt,
    }, { onConflict: "slug" });
    if (error) console.error("[SEO] Save error:", error);
}

// ── Get All Asset Slugs for Sitemap ─────────────────────────
export function getAllAssetSlugs(): string[] {
    const slugs: string[] = [];
    const allAssets = [...ASSETS.crypto, ...ASSETS.forex, ...ASSETS.indices, ...ASSETS.commodities];
    const categories = ["analyse", "prognose", "strategie", "signal", "trading"];

    for (const asset of allAssets) {
        for (const cat of categories) {
            slugs.push(`${asset.toLowerCase()}-${cat}`);
        }
    }
    return slugs;
}
