// src/lib/subdomain/niche-agent.ts
// Wöchentliche Nischen-Identifikation via Claude Sonnet

import { jsonCall } from "@/lib/ai/cached-client";
import { MODELS } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SUBDOMAIN_CONFIG, SUBDOMAIN_PROMPTS } from "./config";
import type { NicheProposal, SubdomainSite } from "./types";

export async function discoverNiches(): Promise<{
  discovered: number;
  niches: string[];
  skipped: string[];
}> {
  const db = supabaseAdmin;
  const result = { discovered: 0, niches: [] as string[], skipped: [] as string[] };

  // 1. Bestehende Sites laden
  const { data: existingSites } = await db
    .from("subdomain_sites")
    .select("slug, status")
    .order("created_at");

  const existingSlugs = (existingSites || []).map((s: any) => s.slug);
  const activeSites = (existingSites || []).filter((s: any) => s.status !== "paused");

  // Max Sites erreicht?
  if (activeSites.length >= SUBDOMAIN_CONFIG.maxSites) {
    return { ...result, skipped: ["Max sites limit reached"] };
  }

  // 2. Bestehende Artikel zählen
  const { count: totalArticles } = await db
    .from("subdomain_articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if ((totalArticles || 0) >= SUBDOMAIN_CONFIG.maxTotalArticles) {
    return { ...result, skipped: ["Max articles limit reached"] };
  }

  // 3. Nischen via Claude Sonnet identifizieren
  const slotsAvailable = SUBDOMAIN_CONFIG.maxSites - activeSites.length;
  const articlesRemaining = SUBDOMAIN_CONFIG.maxTotalArticles - (totalArticles || 0);

  const proposals = await jsonCall<NicheProposal[]>({
    prompt: SUBDOMAIN_PROMPTS.nicheDiscovery,
    message: `Identifiziere ${Math.min(slotsAvailable, 3)} neue Nischen-Subdomains.

BEREITS EXISTIEREND (nicht vorschlagen): ${existingSlugs.join(", ") || "keine"}

BUDGET: ${articlesRemaining} Artikel verbleibend. Verteile article_limit entsprechend.

Sprache: ${SUBDOMAIN_CONFIG.defaultLocale}`,
    model: MODELS.smart,
    maxTokens: 2000,
  });

  if (!proposals || !Array.isArray(proposals)) {
    return { ...result, skipped: ["AI returned invalid response"] };
  }

  // 4. Neue Sites in DB erstellen
  for (const proposal of proposals) {
    if (existingSlugs.includes(proposal.slug)) {
      result.skipped.push(`${proposal.slug} (already exists)`);
      continue;
    }

    const { error } = await db.from("subdomain_sites").insert({
      slug: proposal.slug,
      locale: SUBDOMAIN_CONFIG.defaultLocale,
      niche_topic: proposal.topic,
      niche_keywords: proposal.keywords,
      meta_title: proposal.meta_title,
      meta_description: proposal.meta_description,
      article_limit: Math.min(proposal.article_limit, 10),
      status: "active",
    });

    if (error) {
      result.skipped.push(`${proposal.slug} (DB error: ${error.message})`);
    } else {
      result.discovered++;
      result.niches.push(`${proposal.slug}: ${proposal.topic}`);
    }
  }

  return result;
}
