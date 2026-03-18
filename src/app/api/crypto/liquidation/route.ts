export const dynamic = "force-dynamic";
// src/app/api/crypto/liquidation/route.ts — Liquidation risk & alerts for open positions
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface LiquidationRisk {
  position_id: string;
  symbol: string;
  side: string;
  entry_price: number;
  mark_price: number;
  liquidation_price: number;
  leverage: number;
  margin: number;
  unrealized_pnl: number;
  distance_to_liquidation_pct: number;
  risk_level: "low" | "medium" | "high" | "critical";
}

function calculateRiskLevel(distancePct: number): LiquidationRisk["risk_level"] {
  if (distancePct <= 5) return "critical";
  if (distancePct <= 15) return "high";
  if (distancePct <= 30) return "medium";
  return "low";
}

function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  side: string,
  maintenanceMarginRate = 0.005
): number {
  if (side === "long") {
    return entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
  }
  return entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
}

export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const riskFilter = searchParams.get("risk"); // low | medium | high | critical

  // Fetch user's open crypto positions
  const { data: positions, error } = await db
    .from("crypto_positions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch current mark prices for position symbols
  const symbols = [...new Set((positions ?? []).map((p: any) => p.symbol))];
  let markPrices: Record<string, number> = {};

  if (symbols.length > 0) {
    try {
      const res = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex");
      if (res.ok) {
        const data = await res.json();
        for (const item of data) {
          if (symbols.includes(item.symbol)) {
            markPrices[item.symbol] = parseFloat(item.markPrice);
          }
        }
      }
    } catch {
      // Fall back to stored prices
    }
  }

  const risks: LiquidationRisk[] = (positions ?? []).map((pos: any) => {
    const markPrice = markPrices[pos.symbol] ?? pos.current_price ?? pos.entry_price;
    const leverage = pos.leverage ?? 1;
    const liquidationPrice = calculateLiquidationPrice(pos.entry_price, leverage, pos.side);
    const distanceToLiq = Math.abs((markPrice - liquidationPrice) / markPrice) * 100;
    const unrealizedPnl = pos.side === "long"
      ? (markPrice - pos.entry_price) * pos.quantity
      : (pos.entry_price - markPrice) * pos.quantity;

    return {
      position_id: pos.id,
      symbol: pos.symbol,
      side: pos.side,
      entry_price: pos.entry_price,
      mark_price: markPrice,
      liquidation_price: Math.round(liquidationPrice * 100) / 100,
      leverage,
      margin: pos.margin ?? 0,
      unrealized_pnl: Math.round(unrealizedPnl * 100) / 100,
      distance_to_liquidation_pct: Math.round(distanceToLiq * 100) / 100,
      risk_level: calculateRiskLevel(distanceToLiq),
    };
  });

  const filtered = riskFilter
    ? risks.filter(r => r.risk_level === riskFilter)
    : risks;

  // Sort by risk (critical first)
  const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  filtered.sort((a, b) => (riskOrder[a.risk_level] ?? 4) - (riskOrder[b.risk_level] ?? 4));

  return NextResponse.json({
    positions: filtered,
    summary: {
      total: filtered.length,
      critical: filtered.filter(r => r.risk_level === "critical").length,
      high: filtered.filter(r => r.risk_level === "high").length,
      medium: filtered.filter(r => r.risk_level === "medium").length,
      low: filtered.filter(r => r.risk_level === "low").length,
    },
  });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabaseAdmin();
  const body = await request.json();
  const { position_id, alert_type, threshold } = body;

  if (!position_id || !alert_type) {
    return NextResponse.json(
      { error: "position_id and alert_type (distance_pct|price_level) required" },
      { status: 400 }
    );
  }

  // Verify the position belongs to this user
  const { data: position } = await db
    .from("crypto_positions")
    .select("id, user_id")
    .eq("id", position_id)
    .eq("user_id", user.id)
    .single();

  if (!position) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  const { data: alert, error } = await db
    .from("liquidation_alerts")
    .upsert({
      user_id: user.id,
      position_id,
      alert_type,
      threshold: threshold ?? 10, // default 10% distance
      active: true,
      created_at: new Date().toISOString(),
    }, { onConflict: "user_id,position_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, alert });
}
