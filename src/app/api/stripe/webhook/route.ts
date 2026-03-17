// src/app/api/stripe/webhook/route.ts
import { stripe } from "@/lib/stripe/stripe-client";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { trackConversion } from "@/lib/mlm/affiliate-engine";
import { trackUserEvent } from "@/lib/crm/crm-engine";
import { sendPaymentFailed } from "@/lib/email/email-engine";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 });
  }

  const db = createSupabaseAdmin();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      if (userId && plan) {
        await db.from("profiles").update({
          subscription_tier: plan,
          subscription_active: true,
          stripe_customer_id: session.customer,
        }).eq("id", userId);

        // AFFILIATE: Track first payment → commissions fließen!
        try {
          const price = { analyzer: 9, copier: 29, pro: 79, provider: 149 }[plan] ?? 0;
          await trackConversion({ referredUserId: userId, eventType: "first_payment", subscriptionTier: plan, paymentAmount: price });
        } catch {}
        try { await trackUserEvent(userId, "subscription_start", `${plan} Abo gestartet`); } catch {}
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as any;
      const sub = await stripe.subscriptions.retrieve(invoice.subscription);
      const userId = sub.metadata?.userId;
      const plan = sub.metadata?.plan;
      if (userId && plan) {
        // Recurring payment → affiliate recurring commission
        const price = { analyzer: 9, copier: 29, pro: 79, provider: 149 }[plan] ?? 0;
        try { await trackConversion({ referredUserId: userId, eventType: "recurring_payment", subscriptionTier: plan, paymentAmount: price }); } catch {}
        try { await trackUserEvent(userId, "payment_success", `Monatliche Zahlung $${price}`); } catch {}
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const customer = await stripe.customers.retrieve(invoice.customer) as any;
      const { data: profile } = await db.from("profiles").select("id, email, full_name").eq("stripe_customer_id", invoice.customer).single();
      if (profile) {
        try { await sendPaymentFailed(profile.email, profile.full_name ?? "", 5); } catch {}
        try { await trackUserEvent(profile.id, "payment_failed", "Zahlung fehlgeschlagen"); } catch {}
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as any;
      const userId = sub.metadata?.userId;
      if (userId) {
        await db.from("profiles").update({ subscription_active: false, subscription_tier: "free" }).eq("id", userId);

        // Copier auto-pause on churn
        await db.from("slave_accounts").update({ copier_active: false, copier_paused_reason: "Abo gekündigt" }).eq("user_id", userId);

        try { await trackConversion({ referredUserId: userId, eventType: "churn" }); } catch {}
        try { await trackUserEvent(userId, "subscription_cancel", "Abo gekündigt"); } catch {}
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as any;
      const userId = sub.metadata?.userId;
      const plan = sub.metadata?.plan;
      if (userId) {
        await db.from("profiles").update({ subscription_tier: plan, subscription_active: sub.status === "active" }).eq("id", userId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
