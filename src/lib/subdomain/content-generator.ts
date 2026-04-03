// src/lib/subdomain/content-generator.ts
// Tägliche Artikel-Generierung via Claude Haiku

import { jsonCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { autoLink } from "@/lib/seo/auto-linker";
import { SUBDOMAIN_CONFIG, SUBDOMAIN_PROMPTS } from "./config";
import { buildGeoEnrichedContent } from "./geo-optimizer";
import type { SubdomainSite, SubdomainArticle } from "./types";

const CONTENT_TYPES = ["news", "strategy", "guide", "faq", "comparison"] as const;

export async function generateDailyContent(): Promise<{
  generated: number;
  articles: string[];
  skipped: string[];
}> {
  const db = supabaseAdmin;
  const result = { generated: 0, articles: [] as string[], skipped: [] as string[] };

  // 1. Globales Artikel-Budget prüfen
  const { count: totalPublished } = await db
    .from("subdomain_articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if ((totalPublished || 0) >= SUBDOMAIN_CONFIG.maxTotalArticles) {
    return { ...result, skipped: ["Global article limit reached"] };
  }

  // 2. Aktive Sites laden
  const { data: sites } = await db
    .from("subdomain_sites")
    .select("*")
    .eq("status", "active");

  if (!sites || sites.length === 0) {
    return { ...result, skipped: ["No active sites"] };
  }

  // 3. Für jede Site: prüfen ob unter Limit, dann generieren
  let dailyGenerated = 0;

  for (const site of sites as SubdomainSite[]) {
    if (dailyGenerated >= SUBDOMAIN_CONFIG.dailyArticleLimit) break;

    const { count: siteArticles } = await db
      .from("subdomain_articles")
      .select("id", { count: "exact", head: true })
      .eq("site_id", site.id)
      .eq("status", "published");

    if ((siteArticles || 0) >= site.article_limit) {
      result.skipped.push(`${site.slug} (site limit reached)`);
      continue;
    }

    const { data: existingArticles } = await db
      .from("subdomain_articles")
      .select("slug, title, content_type")
      .eq("site_id", site.id);

    const existingSlugs = (existingArticles || []).map((a: Pick<SubdomainArticle, "slug">) => a.slug);
    const existingTypes = (existingArticles || []).map((a: Pick<SubdomainArticle, "content_type">) => a.content_type);

    const nextType = CONTENT_TYPES.find((t) => !existingTypes.includes(t)) || CONTENT_TYPES[dailyGenerated % CONTENT_TYPES.length];

    const article = await generateArticle(site, nextType, existingSlugs);
    if (!article) {
      result.skipped.push(`${site.slug} (generation failed)`);
      continue;
    }

    const { error } = await db.from("subdomain_articles").insert({
      site_id: site.id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      content_type: nextType,
      seo_data: article.seo_data,
      geo_data: article.geo_data,
      internal_links: article.internal_links,
      published_at: new Date().toISOString(),
      status: "published",
    });

    if (error) {
      result.skipped.push(`${site.slug}/${article.slug} (DB: ${error.message})`);
    } else {
      dailyGenerated++;
      result.generated++;
      result.articles.push(`${site.slug}/${article.slug}`);
    }
  }

  return result;
}

async function generateArticle(
  site: SubdomainSite,
  contentType: string,
  existingSlugs: string[]
): Promise<Omit<SubdomainArticle, "id" | "site_id" | "published_at" | "status" | "created_at"> | null> {
  const locale = site.locale || "de";
  const disclaimer = SUBDOMAIN_PROMPTS.riskDisclaimer[locale] || SUBDOMAIN_PROMPTS.riskDisclaimer.de;

  let generated: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    seo_data: { meta_title: string; meta_description: string; keywords: string[]; schema_org?: Record<string, unknown> };
    geo_data: { sources: string[]; statistics: string[]; qa_pairs: Array<{ question: string; answer: string }> };
  } | null = null;

  try {
    generated = await jsonCall({
      prompt: SUBDOMAIN_PROMPTS.contentGeneration,
      message: `NISCHE: ${site.niche_topic}
KEYWORDS: ${site.niche_keywords.join(", ")}
CONTENT-TYP: ${contentType}
SPRACHE: ${locale === "de" ? "Deutsch" : "English"}
BEREITS EXISTIERENDE SLUGS (nicht wiederholen): ${existingSlugs.join(", ") || "keine"}

Erstelle einen ${contentType}-Artikel für die Subdomain ${site.slug}.goldfoundry.de.
400-600 Wörter. HTML mit H2/H3 Struktur. Kompakt aber informativ.`,
      model: MODELS.smart,
      maxTokens: 4000,
    });
  } catch (err) {
    console.error("[SUBDOMAIN-CONTENT] AI call failed:", err instanceof Error ? err.message : err);
    return null;
  }

  if (!generated || !generated.title || !generated.content) {
    console.error("[SUBDOMAIN-CONTENT] Invalid AI response for", site.slug, contentType);
    return null;
  }

  const linkedContent = autoLink(generated.content, `/${generated.slug}`);

  const enrichedContent = buildGeoEnrichedContent(
    linkedContent,
    generated.geo_data || { sources: [], statistics: [], qa_pairs: [] },
    disclaimer
  );

  return {
    slug: generated.slug,
    title: generated.title,
    content: enrichedContent,
    excerpt: generated.excerpt || "",
    content_type: contentType as SubdomainArticle["content_type"],
    seo_data: {
      meta_title: generated.seo_data?.meta_title || generated.title,
      meta_description: generated.seo_data?.meta_description || "",
      keywords: generated.seo_data?.keywords || [],
      schema_org: generated.seo_data?.schema_org || {},
    },
    geo_data: generated.geo_data || { sources: [], statistics: [], qa_pairs: [] },
    internal_links: [],
  };
}
