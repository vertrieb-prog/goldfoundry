// src/app/api/mlm/earnings/route.ts
// Consolidated: Uses new affiliate-engine, fallback to legacy referral-engine
import { createSupabaseServer } from "@/lib/supabase/server";
import { getAffiliateDashboard } from "@/lib/mlm/affiliate-engine";
import { getUserEarnings } from "@/lib/mlm/referral-engine";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Try new affiliate system first
  const affDashboard = await getAffiliateDashboard(user.id);
  if (affDashboard) {
    return NextResponse.json({
      earnings: { total: affDashboard.stats.totalEarned, unpaid: affDashboard.stats.currentBalance, paid: affDashboard.stats.totalPaid },
      structure: affDashboard.structure.stats,
      referralLink: `https://goldfoundry.de/r/${affDashboard.profile.customSlug}`,
      affiliateProfile: affDashboard.profile,
    });
  }

  // Fallback to legacy
  const earnings = await getUserEarnings(user.id);
  const { data: profile } = await supabase.from("profiles").select("referral_code").eq("id", user.id).single();
  return NextResponse.json({ earnings, referralLink: `https://goldfoundry.de/r/${profile?.referral_code}` });
}
