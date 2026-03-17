// src/app/api/stripe/checkout/route.ts
import { createSupabaseServer } from "@/lib/supabase/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe/stripe-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await request.json();
  if (!PLANS[plan as PlanKey]) return NextResponse.json({ error: "Ungültiger Plan" }, { status: 400 });

  const selectedPlan = PLANS[plan as PlanKey];

  // Get or create Stripe customer
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id, email").eq("id", user.id).single();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: profile?.email ?? user.email, metadata: { userId: user.id } });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
    success_url: `${new URL(request.url).origin}/dashboard?checkout=success`,
    cancel_url: `${new URL(request.url).origin}/pricing?checkout=cancelled`,
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
  });

  return NextResponse.json({ url: session.url });
}
