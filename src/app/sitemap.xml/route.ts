import { supabaseAdmin } from "@/lib/supabase-admin";
import { SEO_CONFIG } from "@/lib/config";

export async function GET() {
  const { data: pages } = await supabaseAdmin
    .from("seo_pages")
    .select("slug, type, locale, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const typeToPath: Record<string, string> = {
    news: "news", blog: "blog", strategy: "strategy",
    compare: "compare", glossary: "glossary", tool: "tools",
    asset: "kurs", event: "events", forecast: "news",
  };

  const urls = (pages || []).map(p => {
    const path = typeToPath[p.type] || p.type;
    const loc = p.locale === "de"
      ? `${SEO_CONFIG.baseUrl}/${path}/${p.slug}`
      : `${SEO_CONFIG.baseUrl}/${p.locale}/${path}/${p.slug}`;
    return `<url><loc>${loc}</loc><lastmod>${p.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0]}</lastmod><changefreq>daily</changefreq></url>`;
  });

  const staticPages = [
    "", "pricing", "products/copier", "products/signals", "dashboard",
    "blog", "news", "glossary", "tools", "compare",
  ].map(p => `<url><loc>${SEO_CONFIG.baseUrl}/${p}</loc><changefreq>weekly</changefreq></url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.join("\n")}
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
