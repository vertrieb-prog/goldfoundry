// src/app/subdomain-pages/[slug]/page.tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateArticleSchema, generateFaqSchema } from "@/lib/subdomain/geo-optimizer";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const niche = headersList.get("x-subdomain-niche");

  const { data: site } = await supabaseAdmin
    .from("subdomain_sites").select("id, slug").eq("slug", niche).single();
  const { data: article } = await supabaseAdmin
    .from("subdomain_articles").select("title, excerpt, seo_data")
    .eq("site_id", site?.id).eq("slug", slug).eq("status", "published").single();

  if (!article) return {};
  return {
    title: article.seo_data?.meta_title || article.title,
    description: article.seo_data?.meta_description || article.excerpt,
    keywords: article.seo_data?.keywords?.join(", ") || "",
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const headersList = await headers();
  const niche = headersList.get("x-subdomain-niche");

  const { data: site } = await supabaseAdmin
    .from("subdomain_sites").select("*").eq("slug", niche).single();
  if (!site) return notFound();

  const { data: article } = await supabaseAdmin
    .from("subdomain_articles").select("*")
    .eq("site_id", site.id).eq("slug", slug).eq("status", "published").single();
  if (!article) return notFound();

  const articleSchema = generateArticleSchema(article, site);
  const faqSchema = generateFaqSchema(article.geo_data?.qa_pairs || []);

  const { data: related } = await supabaseAdmin
    .from("subdomain_articles")
    .select("slug, title, content_type, published_at")
    .eq("site_id", site.id).eq("status", "published")
    .neq("slug", slug).limit(3);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}

      {/* ═══ ARTICLE HEADER ═══ */}
      <section className="gf-section" style={{ paddingTop: 40, paddingBottom: 0, maxWidth: 780, position: "relative" }}>
        <div className="gf-glow gf-glow-gold" style={{ width: 600, height: 300, top: -100, left: "50%", transform: "translateX(-50%)" }} />

        {/* Breadcrumb */}
        <div className="animate-in delay-1" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--gf-text-dim)", marginBottom: 24 }}>
          <a href="/" style={{ color: "var(--gf-gold)", textDecoration: "none" }}>
            {site.slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </a>
          <span style={{ color: "var(--gf-border-active)" }}>›</span>
          <span>{article.content_type}</span>
        </div>

        <div className="animate-in delay-1" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{
            padding: "4px 14px", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
            letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--gf-gold)",
            background: "rgba(212,165,55,0.06)", border: "1px solid rgba(212,165,55,0.12)", borderRadius: 6,
          }}>
            {article.content_type}
          </span>
          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "var(--gf-text-dim)" }}>
            {new Date(article.published_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>

        <h1 className="gf-heading animate-in delay-2" style={{ fontSize: "clamp(28px, 4vw, 42px)", maxWidth: 700 }}>
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="animate-in delay-3" style={{ fontSize: 16, lineHeight: 1.7, color: "var(--gf-text)", marginTop: 16, maxWidth: 600 }}>
            {article.excerpt}
          </p>
        )}

        <div className="gf-separator" style={{ marginTop: 40 }} />
      </section>

      {/* ═══ ARTICLE CONTENT ═══ */}
      <section className="gf-section animate-in delay-4" style={{ paddingTop: 40, paddingBottom: 40, maxWidth: 780 }}>
        <div
          className="gf-article-content"
          style={{
            fontSize: 15,
            lineHeight: 1.85,
            color: "var(--gf-text)",
            letterSpacing: "0.01em",
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          .gf-article-content h2 {
            font-size: clamp(20px, 2.5vw, 26px);
            font-weight: 800;
            color: var(--gf-text-bright);
            letter-spacing: -0.02em;
            line-height: 1.2;
            margin: 48px 0 16px;
          }
          .gf-article-content h3 {
            font-size: clamp(17px, 2vw, 20px);
            font-weight: 700;
            color: var(--gf-text-bright);
            letter-spacing: -0.01em;
            margin: 36px 0 12px;
          }
          .gf-article-content p { margin: 0 0 16px; }
          .gf-article-content ul, .gf-article-content ol {
            margin: 0 0 20px;
            padding-left: 24px;
          }
          .gf-article-content li {
            margin-bottom: 8px;
            position: relative;
          }
          .gf-article-content li::marker { color: var(--gf-gold); }
          .gf-article-content strong { color: var(--gf-text-bright); font-weight: 600; }
          .gf-article-content a {
            color: var(--gf-gold);
            text-decoration: underline;
            text-underline-offset: 3px;
            text-decoration-color: rgba(212,165,55,0.3);
            transition: text-decoration-color 0.2s;
          }
          .gf-article-content a:hover { text-decoration-color: var(--gf-gold); }
          .gf-article-content blockquote {
            border-left: 3px solid var(--gf-gold);
            padding: 16px 20px;
            margin: 24px 0;
            background: rgba(212,165,55,0.03);
            border-radius: 0 12px 12px 0;
            font-style: italic;
            color: var(--gf-text-bright);
          }
          .gf-article-content details {
            margin-bottom: 12px;
            border: 1px solid rgba(212,165,55,0.12);
            border-radius: 12px;
            padding: 16px 20px;
            background: rgba(212,165,55,0.02);
            transition: border-color 0.2s;
          }
          .gf-article-content details:hover { border-color: rgba(212,165,55,0.25); }
          .gf-article-content summary {
            font-weight: 600;
            color: var(--gf-text-bright);
            cursor: pointer;
            list-style: none;
          }
          .gf-article-content summary::before {
            content: "◆ ";
            color: var(--gf-gold);
            font-size: 10px;
          }
          .gf-article-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            font-size: 13px;
            font-family: 'JetBrains Mono', monospace;
          }
          .gf-article-content th {
            text-align: left;
            padding: 10px 14px;
            border-bottom: 1px solid rgba(212,165,55,0.15);
            color: var(--gf-gold);
            font-weight: 600;
            font-size: 10px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
          }
          .gf-article-content td {
            padding: 10px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            color: var(--gf-text);
          }
          .gf-article-content tr:hover td { background: rgba(212,165,55,0.02); }
        `}} />
      </section>

      <div className="gf-separator" style={{ maxWidth: 780, marginLeft: "auto", marginRight: "auto" }} />

      {/* ═══ CTA ═══ */}
      <section className="gf-section" style={{ maxWidth: 780, textAlign: "center" }}>
        <div className="gf-glass-strong" style={{ padding: "48px 32px", borderRadius: 20, position: "relative", overflow: "hidden" }}>
          <div className="gf-glow gf-glow-gold" style={{ width: 400, height: 300, top: -150, left: "50%", transform: "translateX(-50%)" }} />
          <span className="gf-eyebrow">Gold Foundry</span>
          <h3 className="gf-heading" style={{ fontSize: "clamp(20px, 2.5vw, 28px)", marginTop: 14 }}>
            Bereit zu starten?
          </h3>
          <p style={{ fontSize: 14, color: "var(--gf-text)", marginTop: 10, maxWidth: 400, margin: "10px auto 0", lineHeight: 1.7 }}>
            Dein Trading. Automatisch. Geschützt. — 100% kostenlos.
          </p>
          <a href="https://goldfoundry.de/auth/register" className="gf-btn gf-btn-shimmer" style={{ marginTop: 24, textDecoration: "none", display: "inline-block" }}>
            Kostenlos registrieren →
          </a>
        </div>
      </section>

      {/* ═══ RELATED ARTICLES ═══ */}
      {related && related.length > 0 && (
        <section className="gf-section" style={{ maxWidth: 780, paddingTop: 20 }}>
          <span className="gf-eyebrow" style={{ marginBottom: 20, display: "block" }}>Weitere Artikel</span>
          <div style={{ display: "grid", gap: 12 }}>
            {related.map((r) => (
              <a key={r.slug} href={`/${r.slug}`} className="gf-panel gf-refract" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", textDecoration: "none", color: "inherit" }}>
                <span style={{
                  padding: "3px 10px", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--gf-gold)",
                  background: "rgba(212,165,55,0.06)", border: "1px solid rgba(212,165,55,0.12)", borderRadius: 4,
                  flexShrink: 0,
                }}>
                  {r.content_type}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gf-text-bright)", flex: 1 }}>
                  {r.title}
                </span>
                <span style={{ fontSize: 12, color: "var(--gf-gold)", flexShrink: 0 }}>→</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
