// src/lib/copier/fallback-poller.ts
// ============================================================
// GOLD FOUNDRY — Fallback Poller (5s REST Polling)
// Activated when SynchronizationListener disconnects
// ============================================================

import { type SupabaseClient } from "@supabase/supabase-js";
import { executeCopy, type CopyPair, type CopyPosition } from "./copy-executor";
import { createRestAdapter } from "@/lib/engine-adapter";

export class FallbackPoller {
  private pair: CopyPair;
  private token: string;
  private supabase: SupabaseClient;
  private interval: ReturnType<typeof setInterval> | null = null;
  private polling = false;

  constructor(pair: CopyPair, token: string, supabase: SupabaseClient) {
    this.pair = pair;
    this.token = token;
    this.supabase = supabase;
  }

  start(intervalMs = 5000): void {
    console.log(
      `[FALLBACK] Starting poller for ${this.pair.name} (every ${intervalMs}ms)`
    );

    // Log mode switch to engine_events
    this.supabase
      .from("engine_events")
      .insert({
        type: "mode",
        icon: "🔄",
        badge: "FALLBACK",
        text: `Fallback-Poller aktiv: ${this.pair.name}`,
        detail: `Polling alle ${intervalMs}ms`,
        color: "#f0d060",
      })
      .then(() => {}, () => {});

    // Run first poll immediately
    this.poll();

    // Set interval for subsequent polls
    this.interval = setInterval(() => this.poll(), intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.polling = false;
    console.log(`[FALLBACK] Stopped poller for ${this.pair.name}`);
  }

  private async poll(): Promise<void> {
    // Prevent overlapping polls
    if (this.polling) return;
    this.polling = true;

    try {
      // Fetch positions from signal account via REST
      const adapter = createRestAdapter(this.token, this.pair.signal);
      const positions = await adapter.getPositions();

      // Get known position IDs from Supabase (persistent state)
      const knownIds = await this.getKnownPositionIds();

      for (const pos of positions) {
        const posId = String(pos.id);
        if (knownIds.has(posId)) continue;

        // Convert to CopyPosition
        const copyPos: CopyPosition = {
          id: posId,
          symbol: pos.symbol,
          type: pos.type,
          openPrice: pos.openPrice,
          stopLoss: pos.stopLoss,
          takeProfit: pos.takeProfit,
          volume: pos.volume,
          time: pos.time,
        };

        console.log(
          `[FALLBACK] DETECTED new position ${posId}: ${pos.type} ${pos.symbol} ${pos.volume}L @ ${pos.openPrice}`
        );

        // Log DETECTED to copy_events so we don't reprocess on next poll
        await this.supabase.from("copy_events").insert({
          pair_name: this.pair.name,
          signal_account_id: this.pair.signal,
          copy_account_id: this.pair.copy,
          position_id: posId,
          symbol: pos.symbol,
          direction: pos.type?.replace("POSITION_TYPE_", "") || "UNKNOWN",
          volume: pos.volume,
          open_price: pos.openPrice,
          status: "DETECTED",
        });

        // Execute copy — executeCopy handles its own logging
        try {
          await executeCopy(copyPos, this.pair.copy, this.token);
        } catch (err) {
          console.error(
            `[FALLBACK] executeCopy failed for ${posId}:`,
            (err as Error).message
          );
        }
      }
    } catch (err) {
      console.error(
        `[FALLBACK] Poll error for ${this.pair.name}:`,
        (err as Error).message
      );
    } finally {
      this.polling = false;
    }
  }

  private async getKnownPositionIds(): Promise<Set<string>> {
    const { data } = await this.supabase
      .from("copy_events")
      .select("position_id")
      .eq("signal_account_id", this.pair.signal)
      .in("status", ["COPIED", "BLOCKED", "DETECTED"])
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );
    return new Set((data || []).map((d) => d.position_id));
  }
}
