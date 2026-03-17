import { supabaseAdmin } from "@/lib/supabase-admin";
import { RISK_DISCLAIMER } from "@/lib/config";
import { notFound } from "next/navigation";

export const revalidate = 3600; // ISR: 1 hour

export default async function Page({ params }: { params: { slug: string } }) {
  const { data: page } = await supabaseAdmin
    .from("seo_pages")
    .select("*")
    .eq("slug", params.slug)
    .eq("type", "asset")
    .single();

  if (!page) notFound();

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[#d4a537] mb-4">{page.title}</h1>
      {page.excerpt && <p className="text-[#a09070] mb-8 text-lg">{page.excerpt}</p>}
      <div
        className="prose prose-invert prose-gold max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content || "" }}
      />
      <div className="mt-12 pt-6 border-t border-[#2a2218] text-xs text-[#5a4f3a]">
        {RISK_DISCLAIMER.de}
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: page } = await supabaseAdmin
    .from("seo_pages")
    .select("title, meta_title, meta_description")
    .eq("slug", params.slug)
    .eq("type", "asset")
    .single();

  return {
    title: page?.meta_title || page?.title || "Gold Foundry",
    description: page?.meta_description || "",
  };
}
