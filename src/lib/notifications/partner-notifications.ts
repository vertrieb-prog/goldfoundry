// ═══════════════════════════════════════════════════════════════
// src/lib/notifications/partner-notifications.ts — Partner notification helpers
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

type NotificationType =
  | "rank_up"
  | "commission_earned"
  | "new_referral"
  | "payout_processed"
  | "milestone";

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

async function insertNotification(payload: NotificationPayload): Promise<boolean> {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata ?? {},
    read: false,
    created_at: new Date().toISOString(),
  });
  return !error;
}

export async function notifyRankUp(
  userId: string,
  newRank: string
): Promise<boolean> {
  return insertNotification({
    userId,
    type: "rank_up",
    title: "Neuer Rang erreicht!",
    message: `Herzlichen Gluckwunsch! Du bist jetzt ${newRank}.`,
    metadata: { rank: newRank },
  });
}

export async function notifyCommissionEarned(
  userId: string,
  amount: number,
  source: string
): Promise<boolean> {
  return insertNotification({
    userId,
    type: "commission_earned",
    title: "Provision erhalten",
    message: `Du hast ${amount.toFixed(2)} € Provision von ${source} erhalten.`,
    metadata: { amount, source },
  });
}

export async function notifyNewReferral(
  userId: string,
  referralName: string
): Promise<boolean> {
  return insertNotification({
    userId,
    type: "new_referral",
    title: "Neues Teammitglied",
    message: `${referralName} ist deinem Team beigetreten!`,
    metadata: { referralName },
  });
}

export async function notifyPayoutProcessed(
  userId: string,
  amount: number,
  method: string
): Promise<boolean> {
  return insertNotification({
    userId,
    type: "payout_processed",
    title: "Auszahlung verarbeitet",
    message: `Deine Auszahlung von ${amount.toFixed(2)} € via ${method} wurde verarbeitet.`,
    metadata: { amount, method },
  });
}

export async function notifyMilestone(
  userId: string,
  milestone: string,
  details: string
): Promise<boolean> {
  return insertNotification({
    userId,
    type: "milestone",
    title: `Meilenstein: ${milestone}`,
    message: details,
    metadata: { milestone },
  });
}
