// src/lib/subdomain/geo-optimizer.ts
// Schema.org Markup & GEO-Signale für Subdomain-Artikel

import type { ArticleGeoData, SubdomainSite, SubdomainArticle } from "./types";

export function generateArticleSchema(article: SubdomainArticle, site: SubdomainSite): Record<string, unknown> {
  const baseUrl = `https://${site.slug}.goldfoundry.de`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    url: `${baseUrl}/${article.slug}`,
    datePublished: article.published_at,
    dateModified: article.published_at,
    publisher: {
      "@type": "Organization",
      name: "Gold Foundry",
      url: "https://goldfoundry.de",
    },
    author: {
      "@type": "Organization",
      name: "Gold Foundry",
    },
  };

  return schema;
}

export function generateFaqSchema(qaPairs: ArticleGeoData["qa_pairs"]): Record<string, unknown> | null {
  if (!qaPairs || qaPairs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qaPairs.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
      },
    })),
  };
}

export function generateWebSiteSchema(site: SubdomainSite): Record<string, unknown> {
  const baseUrl = `https://${site.slug}.goldfoundry.de`;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.meta_title,
    url: baseUrl,
    description: site.meta_description,
    publisher: {
      "@type": "Organization",
      name: "Gold Foundry",
      url: "https://goldfoundry.de",
    },
  };
}

export function buildGeoEnrichedContent(
  htmlContent: string,
  geoData: ArticleGeoData,
  riskDisclaimer: string
): string {
  let enriched = htmlContent;

  // FAQ-Sektion am Ende einfügen
  if (geoData.qa_pairs && geoData.qa_pairs.length > 0) {
    const faqHtml = `
<section class="mt-12">
<h2 class="text-2xl font-bold mb-6">Häufig gestellte Fragen</h2>
${geoData.qa_pairs
  .map(
    (qa) => `
<details class="mb-4 border border-gold-500/20 rounded-lg p-4">
<summary class="font-semibold cursor-pointer">${qa.question}</summary>
<p class="mt-2 text-gray-300">${qa.answer}</p>
</details>`
  )
  .join("")}
</section>`;
    enriched += faqHtml;
  }

  // Quellen-Sektion
  if (geoData.sources && geoData.sources.length > 0) {
    const sourcesHtml = `
<section class="mt-8 text-sm text-gray-400">
<h3 class="font-semibold mb-2">Quellen</h3>
<ul class="list-disc pl-4">
${geoData.sources.map((s) => `<li>${s}</li>`).join("")}
</ul>
</section>`;
    enriched += sourcesHtml;
  }

  // Risikohinweis
  enriched += `
<div class="mt-8 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg text-sm text-yellow-200">
${riskDisclaimer}
</div>`;

  return enriched;
}
