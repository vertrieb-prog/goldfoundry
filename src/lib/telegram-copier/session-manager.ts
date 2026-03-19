// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/session-manager.ts — GramJS Session Manager
// Manages encrypted Telegram sessions stored in Supabase
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TELEGRAM_SESSION_KEY;
  if (!key) throw new Error("TELEGRAM_SESSION_KEY not set");
  return crypto.scryptSync(key, "salt", 32);
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Get a GramJS TelegramClient for a user.
 * Returns null if no session exists.
 */
export async function getClient(userId: string): Promise<any | null> {
  const { data } = await supabaseAdmin
    .from("telegram_sessions")
    .select("session_data, api_id, api_hash")
    .eq("user_id", userId)
    .single();

  if (!data?.session_data) return null;

  try {
    const sessionString = decrypt(data.session_data);
    const { TelegramClient } = await import("telegram" as any);
    const { StringSession } = await import("telegram/sessions" as any);

    const session = new StringSession(sessionString);
    const client = new TelegramClient(
      session,
      Number(data.api_id || process.env.TELEGRAM_API_ID),
      data.api_hash || process.env.TELEGRAM_API_HASH || "",
      { connectionRetries: 3 }
    );

    await client.connect();
    return client;
  } catch (err) {
    console.error("[SESSION-MGR] Failed to create client:", (err as Error).message);
    return null;
  }
}

/**
 * Save an encrypted session string for a user.
 */
export async function saveSession(
  userId: string,
  sessionString: string,
  phoneNumber: string
): Promise<void> {
  const encrypted = encrypt(sessionString);

  await supabaseAdmin.from("telegram_sessions").upsert(
    {
      user_id: userId,
      session_data: encrypted,
      phone_number: phoneNumber,
      api_id: process.env.TELEGRAM_API_ID || "",
      api_hash: process.env.TELEGRAM_API_HASH || "",
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

/**
 * Delete a user's Telegram session.
 */
export async function deleteSession(userId: string): Promise<void> {
  // Disconnect client first
  const client = await getClient(userId);
  if (client) {
    try {
      await client.destroy();
    } catch {
      // Ignore disconnect errors
    }
  }

  await supabaseAdmin
    .from("telegram_sessions")
    .delete()
    .eq("user_id", userId);

  // Also remove active channels
  await supabaseAdmin
    .from("telegram_active_channels")
    .delete()
    .eq("user_id", userId);
}

/**
 * Check if a user has an active Telegram connection.
 */
export async function isConnected(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("telegram_sessions")
    .select("session_data")
    .eq("user_id", userId)
    .single();

  return !!data?.session_data;
}

/**
 * Get channels a user is monitoring.
 */
export async function getUserChannels(
  userId: string
): Promise<
  Array<{
    id: string;
    channelId: string;
    channelName: string;
    status: string;
    settings: any;
  }>
> {
  const { data } = await supabaseAdmin
    .from("telegram_active_channels")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data || []).map((ch: any) => ({
    id: ch.id,
    channelId: ch.channel_id,
    channelName: ch.channel_name || ch.channel_id,
    status: ch.status || "active",
    settings: ch.settings || { autoExecute: true, riskPercent: 1 },
  }));
}

/**
 * List all dialogs/channels the user's Telegram account is in.
 */
export async function listTelegramChannels(
  userId: string
): Promise<Array<{ id: string; title: string; type: string }>> {
  const client = await getClient(userId);
  if (!client) return [];

  try {
    const dialogs = await client.getDialogs({ limit: 100 });
    return dialogs
      .filter((d: any) => d.isChannel || d.isGroup)
      .map((d: any) => ({
        id: String(d.id),
        title: d.title || "Unknown",
        type: d.isChannel ? "channel" : "group",
      }));
  } catch (err) {
    console.error("[SESSION-MGR] Failed to list channels:", (err as Error).message);
    return [];
  }
}
