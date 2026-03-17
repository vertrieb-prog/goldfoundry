export const dynamic = "force-dynamic";
// src/app/api/affiliate/links/route.ts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET — List all links
export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { data: aff } = await db.from("affiliate_profiles").select("id").eq("user_id", user.id).single();
  if (!aff) return NextResponse.json({ error: "Kein Affiliate" }, { status: 404 });

  const { data: links } = await db.from("affiliate_links").select("*")
    .eq("affiliate_id", aff.id).order("created_at", { ascending: false });

  return NextResponse.json({
    links: (links ?? []).map(l => ({
      ...l,
      fullUrl: `https://goldfoundry.de/r/${l.slug}`,
    })),
  });
}

// POST — Create new tracking link
export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { data: aff } = await db.from("affiliate_profiles").select("id").eq("user_id", user.id).single();
  if (!aff) return NextResponse.json({ error: "Kein Affiliate" }, { status: 404 });

  const { campaignName, destinationUrl, slug } = await request.json();

  // Generate unique slug if not provided
  const finalSlug = slug ?? `${(await db.from("profiles").select("referral_code").eq("id", user.id).single()).data?.referral_code}-${Date.now().toString(36)}`;

  const { data: link, error } = await db.from("affiliate_links").insert({
    affiliate_id: aff.id,
    slug: finalSlug,
    destination_url: destinationUrl ?? "/",
    campaign_name: campaignName ?? "Custom Link",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    link: { ...link, fullUrl: `https://goldfoundry.de/r/${link.slug}` },
  });
}
