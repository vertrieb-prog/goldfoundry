// ═══════════════════════════════════════════════════════════════
// src/lib/crypto/crypto-copier.ts — Copy trades across crypto exchanges
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

type Exchange = "binance" | "bybit" | "bitget" | "okx";

interface CopySettings {
  userId: string;
  sizeMultiplier: number;
  maxPositions: number;
  maxRiskPercent: number;
  allowedSymbols?: string[];
  invertSignals?: boolean;
}

interface CopySession {
  id: string;
  userId: string;
  sourceExchange: Exchange;
  targetExchange: Exchange;
  status: "active" | "paused" | "stopped";
  settings: CopySettings;
  createdAt: string;
}

export async function startCopy(
  sourceExchange: Exchange,
  targetExchange: Exchange,
  settings: CopySettings
): Promise<CopySession> {
  const session: CopySession = {
    id: crypto.randomUUID(),
    userId: settings.userId,
    sourceExchange,
    targetExchange,
    status: "active",
    settings,
    createdAt: new Date().toISOString(),
  };

  await supabaseAdmin.from("crypto_copy_sessions").insert({
    id: session.id,
    user_id: session.userId,
    source_exchange: sourceExchange,
    target_exchange: targetExchange,
    status: "active",
    settings: session.settings,
    created_at: session.createdAt,
  });

  return session;
}

export async function stopCopy(sessionId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("crypto_copy_sessions")
    .update({ status: "stopped", stopped_at: new Date().toISOString() })
    .eq("id", sessionId);

  return !error;
}

export async function getCopyStatus(
  userId: string
): Promise<CopySession[]> {
  const { data } = await supabaseAdmin
    .from("crypto_copy_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "paused"])
    .order("created_at", { ascending: false });

  if (!data?.length) return [];

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    sourceExchange: row.source_exchange,
    targetExchange: row.target_exchange,
    status: row.status,
    settings: row.settings,
    createdAt: row.created_at,
  }));
}
