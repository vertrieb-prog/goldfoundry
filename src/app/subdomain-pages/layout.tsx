// src/app/_subdomain/layout.tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Metadata } from "next";
import type { SubdomainSite } from "@/lib/subdomain/types";
import { generateWebSiteSchema } from "@/lib/subdomain/geo-optimizer";

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="bg-gray-950 text-white min-h-screen">
        <header className="border-b border-gold-500/20 bg-gray-950/95 backdrop-blur sticky top-0 z-50">
          <nav className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-gold-400">
              {site.meta_title}
            </a>
            <div className="flex gap-6 text-sm">
              <a href="/" className="hover:text-gold-400 transition">Startseite</a>
              <a href="/news" className="hover:text-gold-400 transition">News</a>
              <a href="/strategien" className="hover:text-gold-400 transition">Strategien</a>
              <a
                href="https://goldfoundry.de"
                className="text-gold-400 hover:text-gold-300 transition"
                target="_blank"
                rel="noopener"
              >
                Gold Foundry &rarr;
              </a>
            </div>
          </nav>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-gold-500/20 mt-16 py-8 text-center text-sm text-gray-500">
          <p>
            Powered by{" "}
            <a href="https://goldfoundry.de" className="text-gold-400 hover:underline">
              Gold Foundry
            </a>
          </p>
          <div className="mt-2 flex gap-4 justify-center">
            <a href="https://goldfoundry.de/impressum" className="hover:text-gray-300">Impressum</a>
            <a href="https://goldfoundry.de/datenschutz" className="hover:text-gray-300">Datenschutz</a>
            <a href="https://goldfoundry.de/risikohinweis" className="hover:text-gray-300">Risikohinweis</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
