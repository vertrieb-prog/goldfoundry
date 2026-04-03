// src/app/subdomain-pages/layout.tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Metadata } from "next";
import type { SubdomainSite } from "@/lib/subdomain/types";
import { generateWebSiteSchema } from "@/lib/subdomain/geo-optimizer";
import "@/app/globals.css";

async function getSite(): Promise<SubdomainSite | null> {
  const headersList = await headers();
  const niche = headersList.get("x-subdomain-niche");
  if (!niche) return null;

  const { data } = await supabaseAdmin
    .from("subdomain_sites")
    .select("*")
    .eq("slug", niche)
    .eq("status", "active")
    .single();

  return data as SubdomainSite | null;
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  if (!site) return {};

  return {
    title: site.meta_title,
    description: site.meta_description,
    keywords: site.niche_keywords.join(", "),
    openGraph: {
      title: site.meta_title,
      description: site.meta_description,
      url: `https://${site.slug}.goldfoundry.de`,
      siteName: "Gold Foundry",
      type: "website",
    },
  };
}

export default async function SubdomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSite();
  if (!site) return notFound();

  const websiteSchema = generateWebSiteSchema(site);

  return (
    <html lang={site.locale || "de"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body
        className="min-h-screen gf-grid-bg"
        style={{ background: "var(--gf-obsidian, #040302)", color: "var(--gf-text, #a1a1aa)" }}
      >
        {/* ── Ambient Glow Orbs ── */}
        <div className="gf-orb gf-orb-gold" style={{ width: 600, height: 600, top: -200, right: -200 }} />
        <div className="gf-orb gf-orb-warm" style={{ width: 400, height: 400, bottom: 200, left: -100 }} />

        {/* ── Navigation ── */}
        <nav className="gf-nav" style={{ maxWidth: 720 }}>
          <a
            href="/"
            className="gf-eyebrow"
            style={{ letterSpacing: "1.5px", fontSize: 12, padding: "6px 14px", textDecoration: "none" }}
          >
            ◆ {site.slug.replace(/-/g, " ").toUpperCase()}
          </a>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
          <a href="/" className="gf-nav-link" style={navLinkStyle}>Start</a>
          <a href="/news" className="gf-nav-link" style={navLinkStyle}>News</a>
          <a href="/strategien" className="gf-nav-link" style={navLinkStyle}>Strategien</a>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
          <a
            href="https://goldfoundry.de"
            target="_blank"
            rel="noopener"
            className="gf-btn gf-btn-sm gf-btn-shimmer"
            style={{ padding: "7px 16px", fontSize: 11, borderRadius: 999, textDecoration: "none" }}
          >
            Gold Foundry →
          </a>
        </nav>

        {/* ── Content ── */}
        <main style={{ position: "relative", zIndex: 10, paddingTop: 80 }}>
          {children}
        </main>

        {/* ── Footer ── */}
        <footer style={{
          position: "relative",
          zIndex: 10,
          marginTop: 120,
          borderTop: "1px solid rgba(212,165,55,0.08)",
          padding: "60px 24px 40px",
          textAlign: "center",
        }}>
          <div className="gf-separator" style={{ marginBottom: 40 }} />

          <a
            href="https://goldfoundry.de"
            style={{ textDecoration: "none" }}
          >
            <span className="gf-gold-text" style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}>
              GOLD FOUNDRY
            </span>
          </a>
          <p style={{
            marginTop: 12,
            fontSize: 13,
            color: "var(--gf-text-dim)",
            maxWidth: 400,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Dein Trading. Automatisch. Geschützt.
          </p>

          <div style={{
            marginTop: 24,
            display: "flex",
            gap: 24,
            justifyContent: "center",
            fontSize: 12,
          }}>
            <a href="https://goldfoundry.de/impressum" style={footerLinkStyle}>Impressum</a>
            <a href="https://goldfoundry.de/datenschutz" style={footerLinkStyle}>Datenschutz</a>
            <a href="https://goldfoundry.de/risikohinweis" style={footerLinkStyle}>Risikohinweis</a>
            <a href="https://goldfoundry.de/agb" style={footerLinkStyle}>AGB</a>
          </div>

          <p style={{
            marginTop: 32,
            fontSize: 11,
            color: "var(--gf-text-dim)",
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
            padding: "16px 20px",
            background: "rgba(212,165,55,0.03)",
            borderRadius: 12,
            border: "1px solid rgba(212,165,55,0.06)",
          }}>
            Risikohinweis: Vergangene Performance ist kein verlässlicher Indikator für zukünftige Ergebnisse. Trading birgt erhebliche Verlustrisiken. Gold Foundry ist ein Technologie-Anbieter, kein Broker, und bietet keine Anlageberatung.
          </p>
        </footer>
      </body>
    </html>
  );
}

const navLinkStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#a1a1aa",
  textDecoration: "none",
  borderRadius: 8,
  transition: "all 0.2s",
};

const footerLinkStyle: React.CSSProperties = {
  color: "#52525b",
  textDecoration: "none",
  transition: "color 0.2s",
};
