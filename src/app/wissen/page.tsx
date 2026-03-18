import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Wissen | Gold Foundry",
  description: "Trading-Wissen, Strategien und Marktanalysen von Gold Foundry. Lerne alles über professionelles Trading.",
};

export default async function WissenIndex() {
  const supabase = createSupabaseServer();
  const { data: pages } = await supabase
    .from("seo_pages")
    .select("slug, title, meta_description, category, published_at")
    .order("published_at", { ascending: false })
    .limit(100);

  const articles = pages || [];

  // Group by category
  const categories = articles.reduce<Record<string, typeof articles>>((acc, p) => {
    const cat = p.category || "Allgemein";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#0a0908] text-white px-6 py-20 max-w-5xl mx-auto">
      <nav className="mb-12">
        <Link href="/" className="text-sm font-bold gf-gold-text tracking-wide">GOLD FOUNDRY</Link>
      </nav>

      <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
        <span className="italic text-white/50">Trading-</span>
        <span className="italic font-bold gf-gold-text">Wissen</span>
      </h1>
      <p className="text-[#888] mb-12 max-w-2xl">
        Strategien, Marktanalysen und Guides fuer professionelle Trader. Powered by Gold Foundry.
      </p>

      {articles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#555] text-lg">Noch keine Artikel verfuegbar.</p>
          <p className="text-[#444] text-sm mt-2">Schau bald wieder vorbei!</p>
        </div>
      ) : (
        Object.entries(categories).map(([category, items]) => (
          <section key={category} className="mb-12">
            <h2 className="text-xs tracking-[3px] uppercase text-[#d4a537] mb-6 font-medium">{category}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((page) => (
                <Link
                  key={page.slug}
                  href={`/wissen/${page.slug}`}
                  className="group block p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#d4a537]/20 hover:bg-white/[0.04] transition-all"
                >
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#d4a537] transition-colors mb-2">
                    {page.title}
                  </h3>
                  {page.meta_description && (
                    <p className="text-sm text-[#666] leading-relaxed line-clamp-2">{page.meta_description}</p>
                  )}
                  {page.published_at && (
                    <span className="text-xs text-[#444] mt-3 block">
                      {new Date(page.published_at).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      <footer className="mt-16 pt-8 border-t border-gray-800 text-xs text-gray-500">
        <p>Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals führen. Vergangene Ergebnisse sind keine Garantie für zukünftige Performance.</p>
      </footer>
    </main>
  );
}
