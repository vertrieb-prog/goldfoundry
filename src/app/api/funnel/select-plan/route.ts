// ═══════════════════════════════════════════════════════════════
// POST /api/funnel/select-plan — Select plan + apply coupon
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PRICING, COUPON_CODES } from "@/lib/config";

export async function POST(request: Request) {
  try {
    const { email, plan, couponCode } = await request.json();

    if (!email || !plan) {
      return NextResponse.json(
        { error: "E-Mail und Plan erforderlich" },
        { status: 400 }
      );
    }

    // Validate plan
    const planKey = plan as keyof typeof PRICING.plans;
    const planConfig = PRICING.plans[planKey];
    if (!planConfig) {
      return NextResponse.json(
        { error: "Ungueltiger Plan" },
        { status: 400 }
      );
    }

    // Find lead
    const { data: lead } = await supabaseAdmin
      .from("funnel_leads")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!lead) {
      return NextResponse.json(
        { error: "Lead nicht gefunden" },
        { status: 404 }
      );
    }

    // Apply coupon
    let finalPrice: number = planConfig.firstMonth;
    let couponApplied = false;
    let couponLabel = "";

    if (couponCode) {
      const coupon = COUPON_CODES[couponCode.toUpperCase()];
      if (coupon) {
        couponApplied = true;
        couponLabel = coupon.label;
        if (coupon.type === "percent") {
          finalPrice = Math.round(planConfig.price * (1 - coupon.value / 100) * 100) / 100;
        } else if (coupon.type === "trial") {
          finalPrice = 0;
        }
      }
    }

    // Update lead
    const { error } = await supabaseAdmin
      .from("funnel_leads")
      .update({
        selected_plan: plan,
        coupon_code: couponCode?.toUpperCase() || null,
        status: "plan_selected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    if (error) throw error;

    // Generate checkout URL (placeholder for Stripe/Cryptomus integration)
    const checkoutUrl = finalPrice > 0
      ? `/checkout?plan=${plan}&price=${finalPrice}`
      : null;

    return NextResponse.json({
      success: true,
      plan: planConfig.name,
      originalPrice: planConfig.price,
      firstMonthPrice: finalPrice,
      couponApplied,
      couponLabel,
      checkoutUrl,
    });
  } catch (err: any) {
    console.error("[FUNNEL] Select plan error:", err.message);
    return NextResponse.json(
      { error: err.message || "Plan-Auswahl fehlgeschlagen" },
      { status: 500 }
    );
  }
}
