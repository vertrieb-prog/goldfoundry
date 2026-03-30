// src/lib/copy-health-check.ts
// ============================================================
// GOLD FOUNDRY — Copy Health Check
// Detects missing copies: Master has position, Follower does not
// ============================================================

import { type SupabaseClient } from "@supabase/supabase-js";
import { type CopyPair } from "./copier/copy-executor";
import { createRestAdapter } from "./engine-adapter";

// ── Types ────────────────────────────────────────────────────

interface PairHealth {
  pair: CopyPair;
  masterPositions: number;
  followerPositions: number;
  missing: MissingTrade[];
  lastCheck: string;
  healthy: boolean;
}

interface MissingTrade {
  positionId: string;
  symbol: string;
  direction: string;
  volume: number;
  openPrice: number;
  openTime: string;
  reason: string; // "NOT_COPIED" | "COPY_FAILED" | "UNKNOWN"
}

export interface HealthResult {
  pairs: PairHealth[];
  alerts: MissingTrade[];
  checkedAt: string;
}

const GRACE_PERIOD_MS = 30_000; // 30s — skip freshly opened positions

// ── Class ────────────────────────────────────────────────────

export class CopyHealthCheck {
  private token: string;
  private pairs: CopyPair[];
  private supabase: SupabaseClient;
  private interval: ReturnType<typeof setInterval> | null = null;
  private lastAlertedPositions: Set<string> = new Set();

  constructor(token: string, pairs: CopyPair[], supabase: SupabaseClient) {
    this.token = token;
    this.pairs = pairs;
    this.supabase = supabase;
  }

  start(intervalMs = 60_000): void {
    console.log(`[HEALTH] Starting health check every ${intervalMs / 1000}s`);
    this.check(); // first check immediately
    this.interval = setInterval(() => this.check(), intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log("[HEALTH] Stopped");
  }

  async check(): Promise<HealthResult> {
    const checkedAt = new Date().toISOString();
    const pairResults: PairHealth[] = [];
    const allAlerts: MissingTrade[] = [];

    for (const pair of this.pairs) {
      try {
        const health = await this.checkPair(pair);
        pairResults.push(health);
        for (const m of health.missing) {
          allAlerts.push(m);
          await this.alertMissing(pair, m);
        }
      } catch (err) {
        console.error(`[HEALTH] Pair ${pair.name} check failed:`, (err as Error).message);
        pairResults.push({
          pair, masterPositions: 0, followerPositions: 0,
          missing: [], lastCheck: checkedAt, healthy: false,
        });
      }
    }

    return { pairs: pairResults, alerts: allAlerts, checkedAt };
  }

  // ── Check single pair ──────────────────────────────────────

  private async checkPair(pair: CopyPair): Promise<PairHealth> {
    const masterAdapter = createRestAdapter(this.token, pair.signal);
    const followerAdapter = createRestAdapter(this.token, pair.copy);

    const [masterPositions, followerPositions] = await Promise.all([
      masterAdapter.getPositions(),
      followerAdapter.getPositions(),
    ]);

    // Build follower lookup: comment-based + symbol+direction fuzzy
    const followerByComment = new Set<string>();
    const followerSigs = new Set<string>();

    for (const fp of followerPositions) {
      if (fp.comment?.startsWith("COPY-")) followerByComment.add(fp.comment);
      const dir = fp.type?.includes("BUY") ? "BUY" : "SELL";
      followerSigs.add(`${fp.symbol}-${dir}`);
    }

    const missing: MissingTrade[] = [];
    const now = Date.now();

    for (const mp of masterPositions) {
      // Grace period — skip positions opened < 30s ago
      if (mp.time && now - new Date(mp.time).getTime() < GRACE_PERIOD_MS) continue;

      const dir = mp.type?.includes("BUY") ? "BUY" : "SELL";
      const commentMatch = followerByComment.has(`COPY-${mp.id}`);
      const sigMatch = followerSigs.has(`${mp.symbol}-${dir}`);

      if (commentMatch || sigMatch) continue; // matched — healthy

      // No match — check copy_events for intentional blocks
      const { data: events } = await this.supabase
        .from("copy_events")
        .select("action")
        .eq("source_position_id", mp.id)
        .eq("copy_account_id", pair.copy)
        .limit(1);

      const action = events?.[0]?.action;
      if (action === "BLOCKED") continue; // intentionally skipped
      if (action === "COPIED") continue;  // was copied, maybe closed separately

      // Truly missed
      missing.push({
        positionId: mp.id,
        symbol: mp.symbol,
        direction: dir,
        volume: mp.volume,
        openPrice: mp.openPrice,
        openTime: mp.time ?? "",
        reason: "NOT_COPIED",
      });
    }

    return {
      pair,
      masterPositions: masterPositions.length,
      followerPositions: followerPositions.length,
      missing,
      lastCheck: new Date().toISOString(),
      healthy: missing.length === 0,
    };
  }

  // ── Alert for a single missed trade ────────────────────────

  private async alertMissing(pair: CopyPair, missing: MissingTrade): Promise<void> {
    const key = `${pair.name}-${missing.positionId}`;
    if (this.lastAlertedPositions.has(key)) return;

    try {
      await this.supabase.from("copy_events").insert({
        pair_name: pair.name,
        signal_account_id: pair.signal,
        copy_account_id: pair.copy,
        position_id: missing.positionId,
        symbol: missing.symbol,
        direction: missing.direction,
        volume: missing.volume,
        open_price: missing.openPrice,
        status: "MISSED",
        block_reason: `Not copied: ${missing.reason}`,
      });

      await this.supabase.from("engine_events").insert({
        type: "signal", icon: "🚨", badge: "MISSED",
        text: "ALARM: Trade nicht kopiert!",
        detail: `${missing.symbol} ${missing.direction} ${missing.volume}L @ ${missing.openPrice} auf ${pair.name}`,
        color: "#ff5045",
      });
    } catch (err) {
      console.error("[HEALTH] Alert insert failed:", (err as Error).message);
    }

    this.lastAlertedPositions.add(key);
    console.log(`[HEALTH] ALARM: ${missing.symbol} ${missing.direction} on ${pair.name} — MISSED!`);
  }
}
