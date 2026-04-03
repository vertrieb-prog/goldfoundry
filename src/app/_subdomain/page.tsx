// src/app/_subdomain/page.tsx
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";

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

  return (
    <div>
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold text-gold-400 mb-4">{site?.meta_title}</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">{site?.meta_description}</p>
        <a
          href="https://goldfoundry.de/auth/register"
          className="inline-block mt-8 px-8 py-3 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition"
        >
          Jetzt kostenlos starten
        </a>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-8">Neueste Artikel</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(articles || []).map((article) => (
            <Link
              key={article.slug}
              href={`/${article.slug}`}
              className="block p-6 bg-gray-900 rounded-xl border border-gold-500/10 hover:border-gold-500/30 transition"
            >
              <span className="text-xs text-gold-400 uppercase">{article.content_type}</span>
              <h3 className="text-lg font-semibold mt-2">{article.title}</h3>
              <p className="text-gray-400 text-sm mt-2 line-clamp-3">{article.excerpt}</p>
              <time className="text-xs text-gray-500 mt-3 block">
                {new Date(article.published_at).toLocaleDateString("de-DE")}
              </time>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
