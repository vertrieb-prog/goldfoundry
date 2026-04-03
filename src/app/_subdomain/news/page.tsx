// src/app/_subdomain/news/page.tsx
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";

export default async function NewsPage() {
  const headersList = await headers();
  const niche = headersList.get("x-subdomain-niche");

  const { data: site } = await supabaseAdmin
    .from("subdomain_sites").select("id").eq("slug", niche).single();

  const { data: articles } = await supabaseAdmin
    .from("subdomain_articles")
    .select("slug, title, excerpt, published_at")
    .eq("site_id", site?.id).eq("status", "published").eq("content_type", "news")
    .order("published_at", { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">News</h1>
      <div className="space-y-4">
        {(articles || []).map((article) => (
          <Link key={article.slug} href={`/${article.slug}`}
            className="block p-6 bg-gray-900 rounded-xl border border-gold-500/10 hover:border-gold-500/30 transition">
            <h2 className="text-lg font-semibold">{article.title}</h2>
            <p className="text-gray-400 text-sm mt-2">{article.excerpt}</p>
            <time className="text-xs text-gray-500 mt-2 block">
              {new Date(article.published_at).toLocaleDateString("de-DE")}
            </time>
          </Link>
        ))}
        {(!articles || articles.length === 0) && (
          <p className="text-gray-500">Noch keine News vorhanden.</p>
        )}
      </div>
    </div>
  );
}
