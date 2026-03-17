export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { cachedCall, PROMPTS } from "@/lib/ai/cached-client";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Generate SEO content for trending topics
    const topics = [
      { type: "news", keyword: "Gold Preis heute", locale: "de" },
      { type: "forecast", keyword: "XAUUSD Prognose", locale: "de" },
      { type: "strategy", keyword: "Gold Trading Strategie", locale: "de" },
    ];

    let generated = 0;

    for (const topic of topics) {
      // Check if we already have recent content for this keyword
      const { data: existing } = await supabaseAdmin
        .from("seo_pages")
        .select("id, updated_at")
        .eq("type", topic.type)
        .eq("locale", topic.locale)
        .ilike("title", `%${topic.keyword}%`)
        .gte("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      const content = await cachedCall({
        prompt: PROMPTS.seoContent,
        message: `Erstelle einen SEO-optimierten Artikel für das Keyword "${topic.keyword}". Typ: ${topic.type}. Sprache: Deutsch. Max 800 Wörter. Format: JSON mit { title, excerpt, content, meta_title, meta_description, tags }`,
        maxTokens: 1500,
      });

      try {
        const parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```/g, "").trim());
        const slug = (parsed.title || topic.keyword)
          .toLowerCase()
          .replace(/[^a-z0-9äöüß]+/g, "-")
          .replace(/^-|-$/g, "");

        await supabaseAdmin.from("seo_pages").upsert({
          slug,
          type: topic.type,
          title: parsed.title || topic.keyword,
          excerpt: parsed.excerpt || "",
          content: parsed.content || "",
          category: topic.type,
          tags: parsed.tags || [],
          locale: topic.locale,
          meta_title: parsed.meta_title || parsed.title,
          meta_description: parsed.meta_description || parsed.excerpt,
          updated_at: new Date().toISOString(),
        }, { onConflict: "slug,locale" });

        generated++;
      } catch {
        console.error("[SEO] Failed to parse AI content for:", topic.keyword);
      }
    }

    return NextResponse.json({ success: true, generated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
