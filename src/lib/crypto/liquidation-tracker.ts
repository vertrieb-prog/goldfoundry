// ═══════════════════════════════════════════════════════════════
// src/lib/crypto/liquidation-tracker.ts — Liquidation price & auto-close
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

interface Position {
  id: string;
  userId: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  leverage: number;
  margin: number;
  currentPrice?: number;
}

interface LiquidationResult {
  positionId: string;
  liquidationPrice: number;
  distancePercent: number;
  atRisk: boolean;
}

export function calculateLiquidationPrice(position: Position): number {
  const { entryPrice, leverage, side } = position;
  // Simplified: maintenance margin ratio ~0.5%
  const mmr = 0.005;
  if (side === "long") {
    return entryPrice * (1 - 1 / leverage + mmr);
  }
  return entryPrice * (1 + 1 / leverage - mmr);
}

export async function monitorPositions(userId: string): Promise<LiquidationResult[]> {
  const { data: positions } = await supabaseAdmin
    .from("crypto_positions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open");

  if (!positions?.length) return [];

  return positions.map((pos) => {
    const p: Position = {
      id: pos.id,
      userId: pos.user_id,
      symbol: pos.symbol,
      side: pos.side,
      size: pos.size,
      entryPrice: pos.entry_price,
      leverage: pos.leverage ?? 1,
      margin: pos.margin ?? 0,
      currentPrice: pos.current_price,
    };
    const liqPrice = calculateLiquidationPrice(p);
    const current = p.currentPrice ?? p.entryPrice;
    const distance = Math.abs(current - liqPrice) / current;

    return {
      positionId: p.id,
      liquidationPrice: liqPrice,
      distancePercent: distance * 100,
      atRisk: distance < 0.1, // within 10%
    };
  });
}

export async function autoCloseAtRisk(
  userId: string,
  threshold: number = 0.1
): Promise<string[]> {
  const results = await monitorPositions(userId);
  const atRisk = results.filter((r) => r.distancePercent / 100 < threshold);
  const closed: string[] = [];

  for (const r of atRisk) {
    const { error } = await supabaseAdmin
      .from("crypto_positions")
      .update({ status: "auto_closed", closed_at: new Date().toISOString() })
      .eq("id", r.positionId);

    if (!error) closed.push(r.positionId);
  }

  return closed;
}
