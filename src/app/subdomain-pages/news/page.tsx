// src/app/subdomain-pages/news/page.tsx
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";

export default async function NewsPage() {
  const headersList = await headers();
  const niche = headersList.get("x-subdomain-niche");

  const { data: site } = await supabaseAdmin
    .from("subdomain_sites").select("id, slug, meta_title").eq("slug", niche).single();

  const { data: articles } = await supabaseAdmin
    .from("subdomain_articles")
    .select("slug, title, excerpt, published_at")
    .eq("site_id", site?.id).eq("status", "published").eq("content_type", "news")
    .order("published_at", { ascending: false });

  return (
    <div>
      <section className="gf-section" style={{ paddingTop: 40 }}>
        <div className="gf-glow gf-glow-gold" style={{ width: 500, height: 300, top: -100, left: "50%", transform: "translateX(-50%)" }} />

        <div className="animate-in delay-1">
          <span className="gf-eyebrow">News &amp; Updates</span>
        </div>
        <h1 className="gf-heading animate-in delay-2" style={{ fontSize: "clamp(28px, 4vw, 42px)", marginTop: 12 }}>
          Aktuelle News
        </h1>
        <p className="animate-in delay-3" style={{ fontSize: 15, color: "var(--gf-text)", marginTop: 12, maxWidth: 500 }}>
          Die neuesten Marktanalysen und Nachrichten rund um {site?.meta_title?.split(" - ")[0] || "Trading"}.
        </p>

        <div className="gf-separator" style={{ marginTop: 40 }} />

        <div style={{ display: "grid", gap: 16, marginTop: 40 }} className="gf-stagger visible">
          {(articles || []).map((article) => (
            <Link key={article.slug} href={`/${article.slug}`} className="gf-panel gf-refract" style={{ display: "block", padding: "24px 28px", textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--gf-text-bright)", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                    {article.title}
                  </h2>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--gf-text)", marginTop: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {article.excerpt}
                  </p>
                </div>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--gf-text-dim)", flexShrink: 0, marginTop: 4 }}>
                  {new Date(article.published_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                </span>
              </div>
            </Link>
          ))}
          {(!articles || articles.length === 0) && (
            <div className="gf-panel" style={{ padding: 48, textAlign: "center" }}>
              <p style={{ color: "var(--gf-text-dim)", fontSize: 14 }}>Noch keine News. Bald verfügbar.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
