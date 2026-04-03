-- 20260403_subdomain_tables.sql
-- Subdomain Content Agent: Sites + Articles

CREATE TABLE IF NOT EXISTS subdomain_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  locale TEXT NOT NULL DEFAULT 'de',
  niche_topic TEXT NOT NULL,
  niche_keywords TEXT[] NOT NULL DEFAULT '{}',
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  schema_org JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'paused')),
  article_limit INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subdomain_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES subdomain_sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL CHECK (content_type IN ('news', 'strategy', 'guide', 'faq', 'comparison')),
  seo_data JSONB DEFAULT '{}',
  geo_data JSONB DEFAULT '{}',
  internal_links JSONB DEFAULT '[]',
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

CREATE INDEX idx_subdomain_sites_status ON subdomain_sites(status);
CREATE INDEX idx_subdomain_sites_slug ON subdomain_sites(slug);
CREATE INDEX idx_subdomain_articles_site_id ON subdomain_articles(site_id);
CREATE INDEX idx_subdomain_articles_status ON subdomain_articles(status);
CREATE INDEX idx_subdomain_articles_published ON subdomain_articles(published_at DESC);
CREATE INDEX idx_subdomain_articles_type ON subdomain_articles(content_type);
