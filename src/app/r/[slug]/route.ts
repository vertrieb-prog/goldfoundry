// src/app/r/[slug]/route.ts
// Referral Link Handler: goldfoundry.de/r/abc123 → Track click + redirect + set cookie
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { trackClick } from "@/lib/mlm/affiliate-engine";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const db = createSupabaseAdmin();
  const { slug } = params;

  // Find affiliate link
  const { data: link } = await db.from("affiliate_links").select("*, affiliate_profiles(user_id)")
    .eq("slug", slug).eq("active", true).single();

  // Fallback: try referral_code from profiles
  let referralCode = slug;
  let destination = "/";

  if (link) {
    referralCode = slug;
    destination = link.destination_url ?? "/";

    // Increment link click counter
    await db.from("affiliate_links").update({ clicks: (link.clicks ?? 0) + 1 }).eq("id", link.id);
  }

  // Track click
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";
  const ua = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer") ?? "";

  await trackClick({
    referralCode,
    ipAddress: ip.split(",")[0]?.trim(),
    userAgent: ua,
    refererUrl: referer,
    landingUrl: destination,
  });

  // Redirect with referral cookie (30 days)
  const url = new URL(destination, request.url);
  url.searchParams.set("ref", referralCode);

  const response = NextResponse.redirect(url);
  response.cookies.set("gf_ref", referralCode, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
