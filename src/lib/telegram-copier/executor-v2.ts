// ═══════════════════════════════════════════════════════════════
// src/lib/telegram-copier/executor-v2.ts — MetaApi Order Execution
// Executes SmartOrder[] on a MetaApi account
// ═══════════════════════════════════════════════════════════════

import type { SmartOrder } from "./types";

let _metaApi: any = null;

async function getMetaApi(): Promise<any> {
  const token = process.env.METAAPI_TOKEN;
  if (!token) throw new Error("METAAPI_TOKEN not set");
  if (!_metaApi) {
    const { default: MetaApi } = await import("metaapi.cloud-sdk" as any);
    _metaApi = new MetaApi(token, {
      retryOpts: { retries: 3, minDelayInSeconds: 1, maxDelayInSeconds: 10 },
    });
  }
  return _metaApi;
}

const connectionCache: Map<string, { conn: any; lastUsed: number }> = new Map();
const CONN_TTL = 10 * 60 * 1000;

async function getConnection(api: any, accountId: string): Promise<any> {
  const cached = connectionCache.get(accountId);
  if (cached && Date.now() - cached.lastUsed < CONN_TTL) {
    cached.lastUsed = Date.now();
    try {
      await cached.conn.getAccountInformation();
      return cached.conn;
    } catch {
      connectionCache.delete(accountId);
    }
  }

  const account = await api.metatraderAccountApi.getAccount(accountId);
  const conn = account.getRPCConnection();
  await conn.connect();
  await conn.waitSynchronized();
  connectionCache.set(accountId, { conn, lastUsed: Date.now() });
  return conn;
}

// Cleanup stale connections
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of connectionCache) {
    if (now - entry.lastUsed > CONN_TTL) {
      entry.conn.close?.();
      connectionCache.delete(id);
    }
  }
}, 60_000);

/**
 * Execute an array of SmartOrders on the given MetaApi account.
 * Each order is placed as a market order with SL/TP.
 */
export async function executeOrders(
  orders: SmartOrder[],
  metaApiAccountId: string
): Promise<void> {
  if (orders.length === 0) return;

  const api = await getMetaApi();
  const conn = await getConnection(api, metaApiAccountId);

  // Verify margin before placing
  const info = await conn.getAccountInformation();
  const totalLots = orders.reduce((s, o) => s + o.lots, 0);
  const symbol = orders[0].symbol;
  const estimatedMargin = symbol === "XAUUSD" ? totalLots * 1000 : totalLots * 330;

  if (info.freeMargin < estimatedMargin) {
    throw new Error(
      `Insufficient margin: need ~${estimatedMargin}, have ${info.freeMargin}`
    );
  }

  for (const order of orders) {
    if (order.lots < 0.01) continue;

    const method =
      order.action === "BUY"
        ? "createMarketBuyOrder"
        : "createMarketSellOrder";

    await conn[method](
      order.symbol,
      order.lots,
      order.stopLoss || undefined,
      order.takeProfit || undefined,
      {
        comment: `TG-${order.label}`,
      }
    );

    console.log(
      `[TG-EXEC] ${order.action} ${order.symbol} ${order.lots}L ` +
      `SL:${order.stopLoss} TP:${order.takeProfit} (${order.label})`
    );
  }
}

/**
 * Close all positions for a symbol on the given account.
 */
export async function closePositions(
  symbol: string,
  metaApiAccountId: string,
  partialPercent?: number
): Promise<number> {
  const api = await getMetaApi();
  const conn = await getConnection(api, metaApiAccountId);
  const positions = await conn.getPositions();

  const matching = positions.filter(
    (p: any) => p.symbol === symbol && p.comment?.startsWith("TG-")
  );

  let closed = 0;
  for (const pos of matching) {
    if (partialPercent && partialPercent < 100) {
      const closeLots = Math.max(
        0.01,
        Math.floor(pos.volume * (partialPercent / 100) * 100) / 100
      );
      await conn.closePosition(pos.id, { volume: closeLots });
    } else {
      await conn.closePosition(pos.id);
    }
    closed++;
  }

  return closed;
}
