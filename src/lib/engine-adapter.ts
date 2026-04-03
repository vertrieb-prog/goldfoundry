// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — MetaApi REST Adapter
// Wraps MetaApi REST API to match the interface SafeAPI expects
// Uses london region: https://mt-client-api-v1.london.agiliumtrade.ai
// ═══════════════════════════════════════════════════════════════

const CLIENT_BASE = "https://mt-client-api-v1.london.agiliumtrade.ai";

async function apiFetch(
  token: string,
  accountId: string,
  path: string,
  options?: RequestInit
) {
  const url = `${CLIENT_BASE}/users/current/accounts/${accountId}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "auth-token": token,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text();
    let msg = `MetaApi ${res.status}`;
    try { msg = JSON.parse(body).message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/** Returns a metaApi-like object that SafeAPI can wrap */
export function createRestAdapter(token: string, accountId: string) {
  return {
    async getSymbolPrice(symbol: string) {
      return apiFetch(token, accountId, `/symbols/${symbol}/current-price`);
    },
    async getCandles(symbol: string, timeframe: string, count: number) {
      return apiFetch(
        token, accountId,
        `/historical-market-data/symbols/${symbol}/timeframes/${timeframe}/candles?limit=${count}`
      );
    },
    async createMarketBuyOrder(symbol: string, lots: number, sl?: number | null, tp?: number | null) {
      const payload: any = { actionType: "ORDER_TYPE_BUY", symbol, volume: lots };
      if (sl) payload.stopLoss = sl;
      if (tp) payload.takeProfit = tp;
      return apiFetch(token, accountId, "/trade", { method: "POST", body: JSON.stringify(payload) });
    },
    async createMarketSellOrder(symbol: string, lots: number, sl?: number | null, tp?: number | null) {
      const payload: any = { actionType: "ORDER_TYPE_SELL", symbol, volume: lots };
      if (sl) payload.stopLoss = sl;
      if (tp) payload.takeProfit = tp;
      return apiFetch(token, accountId, "/trade", { method: "POST", body: JSON.stringify(payload) });
    },
    async createLimitBuyOrder(symbol: string, lots: number, price: number, sl: number, tp: number) {
      const payload = { actionType: "ORDER_TYPE_BUY_LIMIT", symbol, volume: lots, openPrice: price, stopLoss: sl, takeProfit: tp };
      return apiFetch(token, accountId, "/trade", { method: "POST", body: JSON.stringify(payload) });
    },
    async createLimitSellOrder(symbol: string, lots: number, price: number, sl: number, tp: number) {
      const payload = { actionType: "ORDER_TYPE_SELL_LIMIT", symbol, volume: lots, openPrice: price, stopLoss: sl, takeProfit: tp };
      return apiFetch(token, accountId, "/trade", { method: "POST", body: JSON.stringify(payload) });
    },
    async createStopBuyOrder(symbol: string, lots: number, price: number, sl: number, tp: number) {
      const payload = { actionType: "ORDER_TYPE_BUY_STOP", symbol, volume: lots, openPrice: price, stopLoss: sl, takeProfit: tp };
      return apiFetch(token, accountId, "/trade", { method: "POST", body: JSON.stringify(payload) });
    },
    async createStopSellOrder(symbol: string, lots: number, price: number, sl: number, tp: number) {
      const payload = { actionType: "ORDER_TYPE_SELL_STOP", symbol, volume: lots, openPrice: price, stopLoss: sl, takeProfit: tp };
      return apiFetch(token, accountId, "/trade", { method: "POST", body: JSON.stringify(payload) });
    },
    async modifyPosition(positionId: string, sl: number | null, tp: number | null) {
      const payload: any = { actionType: "POSITION_MODIFY", positionId };
      if (sl !== null) payload.stopLoss = sl;
      if (tp !== null) payload.takeProfit = tp;
      return apiFetch(token, accountId, "/trade", { method: "POST", body: JSON.stringify(payload) });
    },
    async closePosition(positionId: string) {
      return apiFetch(token, accountId, "/trade", {
        method: "POST",
        body: JSON.stringify({ actionType: "POSITION_CLOSE_ID", positionId }),
      });
    },
    async cancelOrder(orderId: string) {
      return apiFetch(token, accountId, "/trade", {
        method: "POST",
        body: JSON.stringify({ actionType: "ORDER_CANCEL", orderId }),
      });
    },
    async getPosition(positionId: string) {
      return apiFetch(token, accountId, `/positions/${positionId}`);
    },
    async getPositions() {
      return apiFetch(token, accountId, "/positions");
    },
    async getAccountInfo() {
      return apiFetch(token, accountId, "/account-information");
    },
  };
}

export type RestAdapter = ReturnType<typeof createRestAdapter>;
