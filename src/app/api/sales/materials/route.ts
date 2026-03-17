// src/app/api/sales/materials/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateSalesMaterials } from "@/lib/sales/sales-director";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if affiliate
  const { data: aff } = await supabase.from("affiliate_profiles")
    .select("id, tier, custom_slug").eq("user_id", user.id).single();
  if (!aff) return NextResponse.json({ error: "Nur für Affiliate-Partner" }, { status: 403 });

  const materials = await generateSalesMaterials();

  // Add personalized referral link to all materials
  const refLink = `https://goldfoundry.de/r/${aff.custom_slug ?? aff.id.slice(0, 8)}`;

  return NextResponse.json({
    ...materials,
    referralLink: refLink,
    tip: "Ersetze [LINK] in den Vorlagen mit deinem persönlichen Link.",
  });
}
