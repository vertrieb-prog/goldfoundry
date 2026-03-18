// src/lib/payments/cryptomus-client.ts
// ============================================================
// GOLD FOUNDRY — Cryptomus Payment Integration
// https://doc.cryptomus.com/
// Supports: BTC, ETH, USDT (TRC20/ERC20), LTC, SOL, DOGE, etc.
// ============================================================

import crypto from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { trackConversion } from "@/lib/mlm/affiliate-engine";
import { trackUserEvent } from "@/lib/crm/crm-engine";

const CRYPTOMUS_API = "https://api.cryptomus.com/v1";
const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID ?? "";
const PAYMENT_KEY = process.env.CRYPTOMUS_PAYMENT_KEY ?? "";

export const PLAN_PRICES: Record<string, number> = {
  analyzer: 9, copier: 29, pro: 59, provider: 99,
};

// ── Cryptomus Signature ───────────────────────────────────────
function createSign(body: Record<string, any>): string {
  const jsonStr = JSON.stringify(body);
  const base64 = Buffer.from(jsonStr).toString("base64");
  return crypto.createHash("md5").update(base64 + PAYMENT_KEY).digest("hex");
}

function verifySign(body: Record<string, any>, receivedSign: string): boolean {
  const sign = createSign(body);
  return sign === receivedSign;
}

// ── Create Invoice ────────────────────────────────────────────
export async function createCryptomusInvoice(data: {
  userId: string;
  email: string;
  plan: string;
  currency?: string; // Optional: BTC, ETH, USDT, etc. Null = user chooses on Cryptomus page
}): Promise<{ paymentUrl: string; invoiceId: string }> {
  const price = PLAN_PRICES[data.plan];
  if (!price) throw new Error("Ungültiger Plan");

  const orderId = `gf_${data.plan}_${data.userId.slice(0, 8)}_${Date.now()}`;

  const body: Record<string, any> = {
    amount: price.toString(),
    currency: "EUR",
    order_id: orderId,
    url_return: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://goldfoundry.de"}/dashboard?payment=success`,
    url_callback: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://goldfoundry.de"}/api/cryptomus/webhook`,
    is_payment_multiple: false,
    lifetime: 3600, // 1 hour to pay
    additional_data: JSON.stringify({ userId: data.userId, plan: data.plan }),
  };

  // If specific currency requested
  if (data.currency) {
    body.to_currency = data.currency;
  }

  const sign = createSign(body);

  const response = await fetch(`${CRYPTOMUS_API}/payment`, {
    method: "POST",
    headers: {
      merchant: MERCHANT_ID,
      sign,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cryptomus Error: ${errText}`);
  }

  const result = await response.json();
  const invoice = result.result;

  // Store in DB
  const db = createSupabaseAdmin();
  await db.from("crypto_payments").insert({
    user_id: data.userId,
    order_id: orderId,
    plan: data.plan,
    amount_usd: price,
    crypto_currency: data.currency ?? "USER_CHOICE",
    payment_url: invoice.url,
    provider: "cryptomus",
    status: "pending",
    metadata: { cryptomus_uuid: invoice.uuid },
  });

  return { paymentUrl: invoice.url, invoiceId: orderId };
}

// ── Webhook Handler ───────────────────────────────────────────
export async function handleCryptomusWebhook(body: any, signHeader: string): Promise<{ success: boolean }> {
  // Verify signature
  if (!verifySign(body, signHeader)) {
    console.error("[CRYPTOMUS] Invalid webhook signature");
    return { success: false };
  }

  const orderId = body.order_id;
  const status = body.status; // paid, paid_over, wrong_amount, cancel, fail, etc.
  const isFinal = body.is_final;

  const db = createSupabaseAdmin();

  // Find our payment record
  const { data: payment } = await db.from("crypto_payments")
    .select("*").eq("order_id", orderId).single();

  if (!payment) {
    console.error(`[CRYPTOMUS] Payment not found: ${orderId}`);
    return { success: false };
  }

  // Map Cryptomus status to our status
  const statusMap: Record<string, string> = {
    paid: "completed",
    paid_over: "completed",
    confirm_check: "confirming",
    wrong_amount: "pending",
    cancel: "cancelled",
    fail: "cancelled",
    system_fail: "cancelled",
    process: "confirming",
    check: "confirming",
  };

  const ourStatus = statusMap[status] ?? "pending";

  // Update payment
  await db.from("crypto_payments").update({
    status: ourStatus,
    crypto_currency: body.currency ?? payment.crypto_currency,
    crypto_amount: body.payment_amount,
    tx_hash: body.txid,
    completed_at: ourStatus === "completed" ? new Date().toISOString() : null,
    metadata: { ...((payment.metadata as any) ?? {}), last_webhook: body },
  }).eq("order_id", orderId);

  // If PAID → activate subscription + track affiliate
  if ((status === "paid" || status === "paid_over") && isFinal) {
    // Idempotency: Skip if already completed (webhook retry)
    if (payment.status === "completed") {
      console.log(`[CRYPTOMUS] Webhook duplicate ignored: ${orderId} already completed`);
      return { success: true };
    }

    // Parse additional_data to get userId and plan
    let userId = payment.user_id;
    let plan = payment.plan;

    try {
      const additional = JSON.parse(body.additional_data ?? "{}");
      userId = additional.userId ?? userId;
      plan = additional.plan ?? plan;
    } catch {}

    // Check if subscription already active for this user (prevents double activation)
    const { data: profile } = await db.from("profiles")
      .select("subscription_active, subscription_tier")
      .eq("id", userId).single();

    const alreadyActive = profile?.subscription_active && profile?.subscription_tier === plan;

    // Activate subscription
    await db.from("profiles").update({
      subscription_tier: plan,
      subscription_active: true,
    }).eq("id", userId);

    // Track affiliate conversion ONLY if not already active (prevents double commission)
    if (!alreadyActive) {
      const price = PLAN_PRICES[plan] ?? 0;
      try {
        await trackConversion({
          referredUserId: userId,
          eventType: "first_payment",
          subscriptionTier: plan,
          paymentAmount: price,
        });
      } catch (err) {
        console.error("[CRYPTOMUS] Affiliate tracking failed:", err);
      }

      // CRM event
      try {
        await trackUserEvent(userId, "subscription_start", `${plan} Abo via Crypto (${body.currency})`);
      } catch {}
    }

    console.log(`[CRYPTOMUS] Payment completed: ${orderId} → ${plan} for ${userId}${alreadyActive ? " (already active, skipped commission)" : ""}`);
  }

  return { success: true };
}

// ── Check Payment Status ──────────────────────────────────────
export async function checkPaymentStatus(orderId: string): Promise<any> {
  const body = { order_id: orderId };
  const sign = createSign(body);

  const response = await fetch(`${CRYPTOMUS_API}/payment/info`, {
    method: "POST",
    headers: { merchant: MERCHANT_ID, sign, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) return null;
  const result = await response.json();
  return result.result;
}
