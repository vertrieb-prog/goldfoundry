// src/app/subdomain-pages/page.tsx
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import type { SubdomainSite } from "@/lib/subdomain/types";

export default async function SubdomainLanding() {
  const headersList = await headers();
  const niche = headersList.get("x-subdomain-niche");

  const { data: site } = await supabaseAdmin
    .from("subdomain_sites")
    .select("*")
    .eq("slug", niche)
    .single();

  const { data: articles } = await supabaseAdmin
    .from("subdomain_articles")
    .select("slug, title, excerpt, content_type, published_at")
    .eq("site_id", site?.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(6);

  const s = site as SubdomainSite;
  const keyword = s?.niche_keywords?.[0] || "";

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="gf-section" style={{ paddingTop: 60, paddingBottom: 40, textAlign: "center", position: "relative" }}>
        <div className="gf-glow gf-glow-gold" style={{ width: 800, height: 400, top: -100, left: "50%", transform: "translateX(-50%)" }} />

        <div className="animate-in delay-1">
          <span className="gf-badge">Gold Foundry Research</span>
        </div>

        <h1 className="gf-heading animate-in delay-2" style={{ fontSize: "clamp(32px, 5vw, 56px)", marginTop: 32, maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
          {s?.meta_title || ""}
        </h1>

        <p className="animate-in delay-3" style={{ fontSize: 17, lineHeight: 1.7, color: "var(--gf-text)", maxWidth: 560, margin: "20px auto 0" }}>
          {s?.meta_description || ""}
        </p>

        <div className="animate-in delay-4" style={{ marginTop: 36, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://goldfoundry.de/auth/register" className="gf-btn gf-btn-shimmer" style={{ textDecoration: "none" }}>
            Kostenlos starten
          </a>
          <a href="#artikel" className="gf-btn-outline" style={{ textDecoration: "none" }}>
            Artikel lesen ↓
          </a>
        </div>

        {/* Keyword Tags */}
        <div className="animate-in delay-5" style={{ marginTop: 40, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {(s?.niche_keywords || []).slice(0, 5).map((kw: string) => (
            <span key={kw} style={{
              padding: "5px 14px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
              color: "var(--gf-text-dim)", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: 999,
            }}>
              {kw}
            </span>
          ))}
        </div>
      </section>

      <div className="gf-separator" />

      {/* ═══ STATS BAR ═══ */}
      <section className="gf-glass-section animate-in delay-5" style={{ padding: "20px 24px", margin: "0 auto", maxWidth: 900 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
          {[
            { label: "Artikel", value: `${articles?.length || 0}` },
            { label: "Thema", value: keyword.slice(0, 20) || "Trading" },
            { label: "Sprache", value: s?.locale === "de" ? "Deutsch" : "English" },
            { label: "Updates", value: "Täglich", accent: true },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: stat.accent ? "var(--gf-gold)" : "var(--gf-text-bright)" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--gf-text-dim)", marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ARTIKEL GRID ═══ */}
      <section id="artikel" className="gf-section" style={{ paddingTop: 80 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="gf-eyebrow">Neueste Analysen</span>
          <h2 className="gf-heading" style={{ fontSize: "clamp(24px, 3.5vw, 36px)", marginTop: 12 }}>
            Aktuelle Artikel &amp; Insights
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }} className="gf-stagger visible">
          {(articles || []).map((article) => (
            <Link key={article.slug} href={`/${article.slug}`} className="gf-panel gf-refract" style={{ display: "block", padding: 28, textDecoration: "none", color: "inherit" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{
                  padding: "4px 12px", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                  letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--gf-gold)",
                  background: "rgba(212,165,55,0.06)", border: "1px solid rgba(212,165,55,0.12)", borderRadius: 6,
                }}>
                  {article.content_type}
                </span>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--gf-text-dim)" }}>
                  {new Date(article.published_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--gf-text-bright)", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                {article.title}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--gf-text)", marginTop: 10, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {article.excerpt}
              </p>
              <div style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: "var(--gf-gold)", display: "flex", alignItems: "center", gap: 6 }}>
                Weiterlesen <span>→</span>
              </div>
            </Link>
          ))}
          {(!articles || articles.length === 0) && (
            <div className="gf-panel" style={{ padding: 40, textAlign: "center", gridColumn: "1 / -1" }}>
              <p style={{ color: "var(--gf-text-dim)" }}>Noch keine Artikel vorhanden. Schau bald wieder vorbei.</p>
            </div>
          )}
        </div>
      </section>

      <div className="gf-separator" />

      {/* ═══ CTA ═══ */}
      <section className="gf-section" style={{ textAlign: "center" }}>
        <div className="gf-glass-strong" style={{ padding: "56px 32px", borderRadius: 20, maxWidth: 640, margin: "0 auto", position: "relative", overflow: "hidden" }}>
          <div className="gf-glow gf-glow-gold" style={{ width: 400, height: 400, top: -200, left: "50%", transform: "translateX(-50%)" }} />
          <span className="gf-eyebrow">Gold Foundry</span>
          <h2 className="gf-heading" style={{ fontSize: "clamp(22px, 3vw, 32px)", marginTop: 16 }}>
            Bereit durchzustarten?
          </h2>
          <p style={{ fontSize: 14, color: "var(--gf-text)", marginTop: 12, maxWidth: 420, margin: "12px auto 0", lineHeight: 1.7 }}>
            Trade Management Engine, Risk Shield &amp; FORGE Mentor — alles in einem Portal. 100% kostenlos.
          </p>
          <a href="https://goldfoundry.de/auth/register" className="gf-btn gf-btn-shimmer" style={{ marginTop: 28, textDecoration: "none", display: "inline-block" }}>
            Jetzt kostenlos starten →
          </a>
        </div>
      </section>
    </div>
  );
}
