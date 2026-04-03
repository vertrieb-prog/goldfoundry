// src/app/subdomain-pages/strategien/page.tsx
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";

export default async function StrategienPage() {
  const headersList = await headers();
  const niche = headersList.get("x-subdomain-niche");

  const { data: site } = await supabaseAdmin
    .from("subdomain_sites").select("id, slug, meta_title").eq("slug", niche).single();

  const { data: articles } = await supabaseAdmin
    .from("subdomain_articles")
    .select("slug, title, excerpt, content_type, published_at")
    .eq("site_id", site?.id).eq("status", "published")
    .in("content_type", ["strategy", "guide"])
    .order("published_at", { ascending: false });

  return (
    <div>
      <section className="gf-section" style={{ paddingTop: 40 }}>
        <div className="gf-glow gf-glow-gold" style={{ width: 500, height: 300, top: -100, left: "50%", transform: "translateX(-50%)" }} />

        <div className="animate-in delay-1">
          <span className="gf-eyebrow">Wissen &amp; Strategie</span>
        </div>
        <h1 className="gf-heading animate-in delay-2" style={{ fontSize: "clamp(28px, 4vw, 42px)", marginTop: 12 }}>
          Strategien &amp; Guides
        </h1>
        <p className="animate-in delay-3" style={{ fontSize: 15, color: "var(--gf-text)", marginTop: 12, maxWidth: 500 }}>
          Bewährte Trading-Strategien und Schritt-für-Schritt Guides.
        </p>

        <div className="gf-separator" style={{ marginTop: 40 }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20, marginTop: 40 }} className="gf-stagger visible">
          {(articles || []).map((article) => (
            <Link key={article.slug} href={`/${article.slug}`} className="gf-panel gf-refract" style={{ display: "block", padding: 28, textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{
                  padding: "4px 12px", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  color: article.content_type === "strategy" ? "var(--gf-gold)" : "var(--gf-blue)",
                  background: article.content_type === "strategy" ? "rgba(212,165,55,0.06)" : "rgba(59,130,246,0.06)",
                  border: `1px solid ${article.content_type === "strategy" ? "rgba(212,165,55,0.12)" : "rgba(59,130,246,0.12)"}`,
                  borderRadius: 6,
                }}>
                  {article.content_type === "strategy" ? "Strategie" : "Guide"}
                </span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--gf-text-bright)", lineHeight: 1.4 }}>
                {article.title}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--gf-text)", marginTop: 10, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {article.excerpt}
              </p>
              <div style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: "var(--gf-gold)" }}>
                Weiterlesen →
              </div>
            </Link>
          ))}
          {(!articles || articles.length === 0) && (
            <div className="gf-panel" style={{ padding: 48, textAlign: "center", gridColumn: "1 / -1" }}>
              <p style={{ color: "var(--gf-text-dim)", fontSize: 14 }}>Noch keine Strategien. Bald verfügbar.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
