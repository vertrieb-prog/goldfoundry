export const dynamic = "force-dynamic";
// src/app/api/accounts/list/route.ts — List user's tracking accounts
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { data: accounts, error } = await db
    .from("slave_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get linked channels for each account
  const { data: channels } = await db
    .from("telegram_active_channels")
    .select("channel_name, channel_id, settings")
    .eq("user_id", user.id);

  // Map linkedAccountId → channel name
  const channelMap: Record<string, string> = {};
  for (const ch of (channels || [])) {
    const linkedId = (ch.settings as any)?.linkedAccountId;
    if (linkedId) channelMap[linkedId] = ch.channel_name || ch.channel_id;
  }

  // Get last signal per channel
  const { data: lastSignals } = await db
    .from("telegram_signals")
    .select("channel_id, created_at, parsed, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Map channel → last signal time
  const lastSignalMap: Record<string, { time: string; action: string; symbol: string; status: string }> = {};
  for (const ch of (channels || [])) {
    const linkedId = (ch.settings as any)?.linkedAccountId;
    if (!linkedId) continue;
    const sig = (lastSignals || []).find((s: any) => s.channel_id === (ch.channel_id || ch.channel_name));
    if (sig) {
      const parsed = sig.parsed as any;
      lastSignalMap[linkedId] = {
        time: sig.created_at,
        action: parsed?.action || "?",
        symbol: parsed?.symbol || "?",
        status: sig.status,
      };
    }
  }

  // Add linked channel name + last signal to each account
  const enriched = (accounts ?? []).map((a: any) => ({
    ...a,
    linked_channel: channelMap[a.id] || null,
    last_signal: lastSignalMap[a.id] || null,
  }));

  return NextResponse.json({ accounts: enriched });
}
