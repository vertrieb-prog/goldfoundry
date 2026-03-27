export const dynamic = "force-dynamic";
export const maxDuration = 60;
// ═══════════════════════════════════════════════════════════════
// CRON: Strategy Engine v3 Tick
// Calls engine.tick() every minute via Vercel Cron
// Uses MetaApi REST API (NOT SDK) — same approach as telegram-signals cron
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { MasterStrategyEngine, DEFAULT_CONFIG } from "@/lib/strategy-engine";

const META_PROV_BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

function getClientBase(region?: string): string {
  if (region && region !== "default") return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
  return "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";
}

const regionCache = new Map<string, { region: string; ts: number }>();
const REGION_TTL = 24 * 60 * 60 * 1000;

// ── MetaApi REST wrapper (matches SafeAPI interface) ──
function createMetaApiRest(token: string, accountId: string) {
  let clientBase = "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";

  async function ensureRegion() {
    const cached = regionCache.get(accountId);
    if (cached && Date.now() - cached.ts < REGION_TTL) {
      clientBase = getClientBase(cached.region);
      return;
    }
    try {
      const res = await fetch(`${META_PROV_BASE}/users/current/accounts/${accountId}`, {
        headers: { "auth-token": token },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const acc = await res.json();
        if (acc.region) {
          clientBase = getClientBase(acc.region);
          regionCache.set(accountId, { region: acc.region, ts: Date.now() });
        }
      }
    } catch {}
  }

  async function apiFetch(url: string, options?: RequestInit) {
    const res = await fetch(url, {
      ...options,
      headers: { "auth-token": token, "Content-Type": "application/json", ...(options?.headers ?? {}) },
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

  // Build the metaApi-like interface the SafeAPI wrapper expects
  return {
    _ensureRegion: ensureRegion,
    async getSymbolPrice(symbol: string) {
      await ensureRegion();
      return apiFetch(`${clientBase}/users/current/accounts/${accountId}/symbols/${symbol}/current-price`);
    },
    async getCandles(symbol: string, timeframe: string, count: number) {
      await ensureRegion();
      // MetaApi REST candles endpoint
      const url = `${clientBase}/users/current/accounts/${accountId}/historical-market-data/symbols/${symbol}/timeframes/${timeframe}/candles?limit=${count}`;
      return apiFetch(url);
    },
    async createMarketBuyOrder(symbol: string, lots: number, sl?: number | null, tp?: number | null) {
      await ensureRegion();
      const payload: any = { actionType: "ORDER_TYPE_BUY", symbol, volume: lots };
      if (sl) payload.stopLoss = sl;
      if (tp) payload.takeProfit = tp;
      return apiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    async createMarketSellOrder(symbol: string, lots: number, sl?: number | null, tp?: number | null) {
      await ensureRegion();
      const payload: any = { actionType: "ORDER_TYPE_SELL", symbol, volume: lots };
      if (sl) payload.stopLoss = sl;
      if (tp) payload.takeProfit = tp;
      return apiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    async createLimitBuyOrder(symbol: string, lots: number, price: number, sl: number, tp: number) {
      await ensureRegion();
      const payload: any = { actionType: "ORDER_TYPE_BUY_LIMIT", symbol, volume: lots, openPrice: price, stopLoss: sl, takeProfit: tp };
      return apiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    async createLimitSellOrder(symbol: string, lots: number, price: number, sl: number, tp: number) {
      await ensureRegion();
      const payload: any = { actionType: "ORDER_TYPE_SELL_LIMIT", symbol, volume: lots, openPrice: price, stopLoss: sl, takeProfit: tp };
      return apiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    async modifyPosition(positionId: string, sl: number | null, tp: number | null) {
      await ensureRegion();
      const payload: any = { actionType: "POSITION_MODIFY", positionId };
      if (sl !== null) payload.stopLoss = sl;
      if (tp !== null) payload.takeProfit = tp;
      return apiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    async closePosition(positionId: string) {
      await ensureRegion();
      const payload = { actionType: "POSITION_CLOSE_ID", positionId };
      return apiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    async cancelOrder(orderId: string) {
      await ensureRegion();
      const payload = { actionType: "ORDER_CANCEL", orderId };
      return apiFetch(`${clientBase}/users/current/accounts/${accountId}/trade`, { method: "POST", body: JSON.stringify(payload) });
    },
    async getPosition(positionId: string) {
      await ensureRegion();
      return apiFetch(`${clientBase}/users/current/accounts/${accountId}/positions/${positionId}`);
    },
  };
}

// Engine singleton per account (reused across cron invocations within same serverless instance)
const engineCache = new Map<string, MasterStrategyEngine>();

export async function GET(request: Request) {
  // Auth: only allow cron calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metaApiToken = (process.env.METAAPI_TOKEN || process.env.META_API_TOKEN || "").trim();
  if (!metaApiToken) {
    return NextResponse.json({ error: "METAAPI_TOKEN not configured" }, { status: 500 });
  }

  const db = createSupabaseAdmin();

  try {
    // Get all users with active copier accounts
    const { data: accounts } = await db
      .from("slave_accounts")
      .select("user_id, metaapi_account_id")
      .eq("copier_active", true);

    if (!accounts?.length) {
      return NextResponse.json({ message: "No active accounts", ticked: 0 });
    }

    let ticked = 0;
    const errors: string[] = [];

    for (const account of accounts) {
      try {
        const cacheKey = account.metaapi_account_id;
        let engine = engineCache.get(cacheKey);

        if (!engine) {
          const metaApi = createMetaApiRest(metaApiToken, account.metaapi_account_id);
          engine = new MasterStrategyEngine(
            metaApi,
            db,
            null, // AI client — null for now (code-scoring only)
            { ...DEFAULT_CONFIG, testMode: true, propFirmMode: false }
          );
          engineCache.set(cacheKey, engine);
        }

        await engine.tick();
        ticked++;
      } catch (err: any) {
        console.error(`[ENGINE-CRON] Tick error for ${account.metaapi_account_id}:`, err.message);
        errors.push(`${account.metaapi_account_id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      ticked,
      total: accounts.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[ENGINE-CRON] Fatal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
