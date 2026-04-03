// src/app/_subdomain/[slug]/page.tsx
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
    .select("slug, title, content_type")
    .eq("site_id", site.id).eq("status", "published")
    .neq("slug", slug).limit(3);

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <header className="mb-8">
        <span className="text-xs text-gold-400 uppercase">{article.content_type}</span>
        <h1 className="text-3xl font-bold mt-2">{article.title}</h1>
        <time className="text-sm text-gray-500 mt-2 block">
          {new Date(article.published_at).toLocaleDateString("de-DE")}
        </time>
      </header>

      <div
        className="prose prose-invert prose-gold max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      <div className="mt-12 p-8 bg-gradient-to-r from-gold-500/10 to-gold-400/5 rounded-xl border border-gold-500/20 text-center">
        <h3 className="text-xl font-bold text-gold-400">Bereit zu starten?</h3>
        <p className="text-gray-300 mt-2">Gold Foundry — Dein Trading. Automatisch. Geschützt.</p>
        <a
          href="https://goldfoundry.de/auth/register"
          className="inline-block mt-4 px-8 py-3 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition"
        >
          Kostenlos registrieren
        </a>
      </div>

      {related && related.length > 0 && (
        <section className="mt-12">
          <h3 className="text-lg font-bold mb-4">Weitere Artikel</h3>
          <div className="grid gap-3">
            {related.map((r) => (
              <a key={r.slug} href={`/${r.slug}`}
                className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition">
                <span className="text-xs text-gold-400 uppercase w-20">{r.content_type}</span>
                <span>{r.title}</span>
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
