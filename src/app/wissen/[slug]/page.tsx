import { createSupabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createSupabaseServer();
  const { data } = await supabase.from("seo_pages").select("title, meta_description, og_image").eq("slug", params.slug).single();
  if (!data) return {};
  return {
    title: data.title + " | Gold Foundry",
    description: data.meta_description,
    openGraph: { images: data.og_image ? [data.og_image] : [] },
  };
}

export default async function WissenPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServer();
  const { data: page } = await supabase.from("seo_pages").select("*").eq("slug", params.slug).single();
  if (!page) notFound();
  return (
    <main className="min-h-screen bg-[#0a0908] text-white px-6 py-20 max-w-4xl mx-auto">
      <nav className="mb-12">
        <Link href="/" className="text-sm font-bold gf-gold-text tracking-wide">GOLD FOUNDRY</Link>
        <span className="mx-2 text-[#555]">/</span>
        <Link href="/wissen" className="text-sm text-[#888] hover:text-[#d4a537] transition-colors">Wissen</Link>
      </nav>
      <article>
        <h1 className="text-3xl font-bold text-[#d4a537] mb-4">{page.title}</h1>
        {page.category && <span className="text-sm text-gray-400 mb-6 block">{page.category}</span>}
        <div className="prose prose-invert prose-gold" dangerouslySetInnerHTML={{ __html: page.content || "" }} />
      </article>
      <footer className="mt-16 pt-8 border-t border-gray-800 text-xs text-gray-500">
        <p>Risikohinweis: Der Handel mit Finanzinstrumenten ist mit erheblichen Risiken verbunden und kann zum Verlust des eingesetzten Kapitals führen. Vergangene Ergebnisse sind keine Garantie für zukünftige Performance.</p>
      </footer>
    </main>
  );
}
