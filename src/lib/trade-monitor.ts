// src/lib/trade-monitor.ts
// ============================================================
// GOLD FOUNDRY — Real-Time Trade Monitor
// MetaApi SynchronizationListener for instant trade detection
// ============================================================

import { type SupabaseClient } from "@supabase/supabase-js";
import {
  executeCopy,
  type CopyPair,
  type CopyPosition,
} from "./copier/copy-executor";
import { createRestAdapter } from "./engine-adapter";

// ── TradeMonitor ─────────────────────────────────────────────

export class TradeMonitor {
  private token: string;
  private copyPairs: CopyPair[];
  private supabase: SupabaseClient;
  private connections: Map<string, any> = new Map();
  private fallbackPollers: Map<string, any> = new Map();
  private running = false;

  constructor(token: string, copyPairs: CopyPair[], supabase: SupabaseClient) {
    this.token = token;
    this.copyPairs = copyPairs;
    this.supabase = supabase;
  }

  // ── Start ────────────────────────────────────────────────────

  async start(): Promise<void> {
    console.log("[MONITOR] Starting Trade Monitor...");
    await this.logEvent("start", "Trade Monitor gestartet", `${this.copyPairs.length} Paare`, "#4ade80");

    try {
      const { default: MetaApi } = await import("metaapi.cloud-sdk");
      const api = new MetaApi(this.token, {
        retryOpts: { retries: 3, minDelayInSeconds: 1, maxDelayInSeconds: 10 },
      });

      for (const pair of this.copyPairs) {
        try {
          await this.connectPair(pair, api);
        } catch (err) {
          console.error(`[MONITOR] Failed to connect pair ${pair.name}:`, (err as Error).message);
          await this.logEvent("error", `Verbindung fehlgeschlagen: ${pair.name}`, (err as Error).message, "#ef4444");
        }
      }

      this.running = true;
      console.log("[MONITOR] Trade Monitor running.");
    } catch (err) {
      console.error("[MONITOR] Fatal start error:", (err as Error).message);
      await this.logEvent("error", "Monitor Start fehlgeschlagen", (err as Error).message, "#ef4444");
    }
  }

  // ── Stop ─────────────────────────────────────────────────────

  async stop(): Promise<void> {
    console.log("[MONITOR] Stopping Trade Monitor...");
    this.running = false;

    // Stop all fallback pollers
    for (const [key, poller] of this.fallbackPollers) {
      try {
        poller.stop?.();
        console.log(`[MONITOR] Fallback poller stopped: ${key}`);
      } catch (err) {
        console.error(`[MONITOR] Error stopping poller ${key}:`, (err as Error).message);
      }
    }
    this.fallbackPollers.clear();

    // Close all streaming connections
    for (const [key, conn] of this.connections) {
      try {
        await conn.close?.();
        console.log(`[MONITOR] Connection closed: ${key}`);
      } catch (err) {
        console.error(`[MONITOR] Error closing connection ${key}:`, (err as Error).message);
      }
    }
    this.connections.clear();

    await this.logEvent("stop", "Trade Monitor gestoppt", "Alle Verbindungen geschlossen", "#94a3b8");
    console.log("[MONITOR] Trade Monitor stopped.");
  }

  // ── Connect a single copy pair ───────────────────────────────

  private async connectPair(pair: CopyPair, api: any): Promise<void> {
    console.log(`[MONITOR] Connecting pair: ${pair.name} (signal=${pair.signal})`);

    const account = await api.metatraderAccountApi.getAccount(pair.signal);

    if (account.state !== "DEPLOYED") {
      console.log(`[MONITOR] Deploying account ${pair.signal}...`);
      await account.deploy();
    }
    await account.waitConnected();

    const connection = account.getStreamingConnection();

    // Build SynchronizationListener
    const listener = {
      onDealAdded: (_instanceIndex: number, deal: any) => {
        this.handleDeal(pair, deal).catch((err) => {
          console.error(`[MONITOR] handleDeal error:`, (err as Error).message);
        });
      },
      onDisconnected: (_instanceIndex: number) => {
        this.handleDisconnect(pair).catch((err) => {
          console.error(`[MONITOR] handleDisconnect error:`, (err as Error).message);
        });
      },
      onReconnected: () => {
        console.log(`[MONITOR] Reconnected: ${pair.name}`);
        // Stop fallback poller if running
        const poller = this.fallbackPollers.get(pair.signal);
        if (poller) {
          poller.stop?.();
          this.fallbackPollers.delete(pair.signal);
          console.log(`[MONITOR] Fallback poller stopped after reconnect: ${pair.name}`);
        }
        this.logEvent("reconnect", `Reconnected: ${pair.name}`, "Streaming wiederhergestellt", "#4ade80");
      },
    };

    connection.addSynchronizationListener(listener);
    await connection.connect();
    await connection.waitSynchronized();

    this.connections.set(pair.signal, connection);
    console.log(`[MONITOR] Connected: ${pair.name}`);
    await this.logEvent("connected", `Verbunden: ${pair.name}`, `Signal: ${pair.signal}`, "#4ade80");
  }

  // ── Handle incoming deal ─────────────────────────────────────

  private async handleDeal(pair: CopyPair, deal: any): Promise<void> {
    console.log(`[MONITOR] Deal: ${deal.symbol} ${deal.type} ${deal.volume}L @ ${deal.price} | Entry: ${deal.entryType}`);

    // Log every deal to Supabase
    await this.logEvent(
      "signal",
      `Deal erkannt: ${deal.symbol} ${deal.type}`,
      `${deal.volume}L @ ${deal.price} | Position: ${deal.positionId}`,
      "#d4a537"
    );

    // New trade entry
    if (deal.entryType === "DEAL_ENTRY_IN") {
      const position: CopyPosition = {
        id: deal.positionId || deal.id,
        symbol: deal.symbol,
        type: deal.type === "DEAL_TYPE_BUY" ? "POSITION_TYPE_BUY" : "POSITION_TYPE_SELL",
        openPrice: deal.price,
        stopLoss: deal.stopLoss,
        takeProfit: deal.takeProfit,
        volume: deal.volume,
      };

      console.log(`[MONITOR] New trade detected — copying to ${pair.name} (${pair.copy})`);

      try {
        const result = await executeCopy(position, pair.copy, this.token);
        console.log(`[MONITOR] Copy result: ${result.action} — ${result.ordersPlaced ?? 0}/${result.totalOrders ?? 0} splits`);

        const color = result.action === "COPIED" ? "#4ade80" : result.action === "BLOCKED" ? "#f59e0b" : "#ef4444";
        await this.logEvent(
          "copy",
          `Copy ${result.action}: ${deal.symbol}`,
          `${result.ordersPlaced ?? 0}/${result.totalOrders ?? 0} splits | ${result.latencyMs ?? 0}ms | ${result.reason ?? ""}`,
          color
        );
      } catch (err) {
        console.error(`[MONITOR] Copy execution failed:`, (err as Error).message);
        await this.logEvent("error", `Copy fehlgeschlagen: ${deal.symbol}`, (err as Error).message, "#ef4444");
      }
    }

    // Trade closed
    if (deal.entryType === "DEAL_ENTRY_OUT") {
      console.log(`[MONITOR] Trade closed: ${deal.symbol} positionId=${deal.positionId}`);
      await this.logEvent("close", `Trade geschlossen: ${deal.symbol}`, `Position: ${deal.positionId}`, "#94a3b8");

      try {
        await this.closeFollowerPositions(pair, deal.positionId);
      } catch (err) {
        console.error(`[MONITOR] Close follower positions failed:`, (err as Error).message);
        await this.logEvent("error", `Follower Close fehlgeschlagen`, (err as Error).message, "#ef4444");
      }
    }
  }

  // ── Close matching follower positions ────────────────────────

  private async closeFollowerPositions(pair: CopyPair, signalPositionId: string): Promise<void> {
    if (!signalPositionId) return;

    const api = createRestAdapter(this.token, pair.copy);
    const positions = await api.getPositions();

    if (!Array.isArray(positions)) return;

    let closed = 0;
    for (const pos of positions) {
      // Match by comment containing the signal position ID
      const comment = pos.comment || pos.clientId || "";
      if (comment.includes(signalPositionId)) {
        try {
          await api.closePosition(pos.id);
          closed++;
          console.log(`[MONITOR] Closed follower position ${pos.id} (matched ${signalPositionId})`);
        } catch (err) {
          console.error(`[MONITOR] Failed to close follower position ${pos.id}:`, (err as Error).message);
        }
      }
    }

    if (closed > 0) {
      await this.logEvent("close", `${closed} Follower-Positionen geschlossen`, `Signal: ${signalPositionId}`, "#4ade80");
    }
  }

  // ── Handle disconnect — start fallback polling ───────────────

  private async handleDisconnect(pair: CopyPair): Promise<void> {
    console.warn(`[MONITOR] Disconnected: ${pair.name}`);
    await this.logEvent("disconnect", `Verbindung verloren: ${pair.name}`, "Fallback-Polling wird gestartet", "#ef4444");

    // Start fallback poller
    try {
      const { FallbackPoller } = await import("./copier/fallback-poller");
      const poller = new FallbackPoller(pair, this.token, this.supabase);
      poller.start(5000);
      this.fallbackPollers.set(pair.signal, poller);
      console.log(`[MONITOR] Fallback poller started for ${pair.name}`);
    } catch (err) {
      console.error(`[MONITOR] Failed to start fallback poller:`, (err as Error).message);
    }

    // Attempt reconnection after 30s
    if (this.running) {
      setTimeout(async () => {
        if (!this.running) return;
        console.log(`[MONITOR] Attempting reconnection for ${pair.name}...`);
        try {
          const { default: MetaApi } = await import("metaapi.cloud-sdk");
          const api = new MetaApi(this.token, {
            retryOpts: { retries: 3, minDelayInSeconds: 1, maxDelayInSeconds: 10 },
          });
          await this.connectPair(pair, api);
          // Stop fallback poller on successful reconnect
          const poller = this.fallbackPollers.get(pair.signal);
          if (poller) {
            poller.stop?.();
            this.fallbackPollers.delete(pair.signal);
          }
        } catch (err) {
          console.error(`[MONITOR] Reconnection failed for ${pair.name}:`, (err as Error).message);
        }
      }, 30_000);
    }
  }

  // ── Log to engine_events ─────────────────────────────────────

  private async logEvent(type: string, text: string, detail: string, color: string): Promise<void> {
    try {
      await this.supabase.from("engine_events").insert({
        type,
        icon: type === "error" ? "\u274C" : type === "signal" ? "\uD83D\uDCE1" : type === "copy" ? "\uD83D\uDD04" : type === "close" ? "\uD83D\uDED1" : type === "disconnect" ? "\u26A0\uFE0F" : "\u2705",
        badge: type.toUpperCase(),
        text,
        detail,
        color,
      });
    } catch (err) {
      console.error(`[MONITOR] Failed to log event:`, (err as Error).message);
    }
  }
}
