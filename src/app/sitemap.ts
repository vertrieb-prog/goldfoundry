// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://goldfoundry.de", lastModified: new Date() },
    { url: "https://goldfoundry.de/risikohinweis", lastModified: new Date() },
    { url: "https://goldfoundry.de/impressum", lastModified: new Date() },
    { url: "https://goldfoundry.de/datenschutz", lastModified: new Date() },
    { url: "https://goldfoundry.de/agb", lastModified: new Date() },
    { url: "https://goldfoundry.de/auth/login", lastModified: new Date() },
    { url: "https://goldfoundry.de/auth/register", lastModified: new Date() },
  ];

  // Subdomain-Sites
  const { data: sites } = await supabaseAdmin
    .from("subdomain_sites")
    .select("slug, updated_at")
    .eq("status", "active");

  const siteRoutes: MetadataRoute.Sitemap = (sites || []).map((site) => ({
    url: `https://${site.slug}.goldfoundry.de`,
    lastModified: new Date(site.updated_at),
  }));

  // Subdomain-Artikel
  const { data: articles } = await supabaseAdmin
    .from("subdomain_articles")
    .select("slug, published_at, site_id, subdomain_sites!inner(slug)")
    .eq("status", "published");

  const articleRoutes: MetadataRoute.Sitemap = (articles || []).map((article: any) => ({
    url: `https://${article.subdomain_sites.slug}.goldfoundry.de/${article.slug}`,
    lastModified: new Date(article.published_at),
  }));

  return [...staticRoutes, ...siteRoutes, ...articleRoutes];
}
