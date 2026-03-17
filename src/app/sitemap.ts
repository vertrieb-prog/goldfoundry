import { MetadataRoute } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseServer();
  const { data: pages } = await supabase
    .from("seo_pages")
    .select("slug, updated_at")
    .order("published_at", { ascending: false });

  const seoPages = (pages || []).map((p) => ({
    url: `https://goldfoundry.de/wissen/${p.slug}`,
    lastModified: p.updated_at,
  }));

  return [
    { url: "https://goldfoundry.de", lastModified: new Date() },
    { url: "https://goldfoundry.de/dashboard", lastModified: new Date() },
    { url: "https://goldfoundry.de/pricing", lastModified: new Date() },
    { url: "https://goldfoundry.de/leaderboard", lastModified: new Date() },
    { url: "https://goldfoundry.de/wissen", lastModified: new Date() },
    ...seoPages,
  ];
}
