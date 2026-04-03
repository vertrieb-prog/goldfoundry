// src/lib/subdomain/types.ts
// Subdomain Content Agent — Type Definitions

export interface SubdomainSite {
  id: string;
  slug: string;
  locale: string;
  niche_topic: string;
  niche_keywords: string[];
  meta_title: string;
  meta_description: string;
  schema_org: Record<string, unknown>;
  status: "active" | "draft" | "paused";
  article_limit: number;
  created_at: string;
  updated_at: string;
}

export interface SubdomainArticle {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  content_type: "news" | "strategy" | "guide" | "faq" | "comparison";
  seo_data: ArticleSeoData;
  geo_data: ArticleGeoData;
  internal_links: InternalLink[];
  published_at: string | null;
  status: "published" | "draft";
  created_at: string;
}

export interface ArticleSeoData {
  meta_title: string;
  meta_description: string;
  schema_org: Record<string, unknown>;
  keywords: string[];
}

export interface ArticleGeoData {
  sources: string[];
  statistics: string[];
  qa_pairs: Array<{ question: string; answer: string }>;
}

export interface InternalLink {
  anchor: string;
  url: string;
}

export interface NicheProposal {
  slug: string;
  topic: string;
  keywords: string[];
  meta_title: string;
  meta_description: string;
  article_limit: number;
  reasoning: string;
}
