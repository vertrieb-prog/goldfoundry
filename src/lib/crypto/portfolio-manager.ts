// ═══════════════════════════════════════════════════════════════
// src/lib/crypto/portfolio-manager.ts — Crypto Portfolio Manager
// ═══════════════════════════════════════════════════════════════

import { supabaseAdmin } from "@/lib/supabase-admin";

export function calculateLiquidationPrice(entryPrice: number, leverage: number, direction: "long" | "short", maintenanceMargin: number = 0.5): number {
    if (direction === "long") return entryPrice * (1 - (1 / leverage) + (maintenanceMargin / 100));
    return entryPrice * (1 + (1 / leverage) - (maintenanceMargin / 100));
}

export function shouldAutoClose(currentPrice: number, liquidationPrice: number, direction: "long" | "short"): boolean {
    const buffer = 0.10; // 10% buffer before liquidation
    if (direction === "long") return currentPrice <= liquidationPrice * (1 + buffer);
    return currentPrice >= liquidationPrice * (1 - buffer);
}

export async function getFundingRates(): Promise<Array<{ symbol: string; rate: number; nextFunding: string }>> {
    try {
        const resp = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex");
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data || []).slice(0, 20).map((d: any) => ({
            symbol: d.symbol,
            rate: parseFloat(d.lastFundingRate) * 100,
            nextFunding: new Date(d.nextFundingTime).toISOString(),
        }));
    } catch { return []; }
}

export function defiCompare() {
    return {
        goldFoundry: { apy: "15-45%", risk: "Managed", minDeposit: "€500", features: ["Smart Copier", "Risk Shield", "FORGE Mentor"] },
        aave: { apy: "2-5%", risk: "Smart Contract", minDeposit: "$1", features: ["Lending", "Flash Loans"] },
        lido: { apy: "3-4%", risk: "Staking", minDeposit: "$1", features: ["ETH Staking", "stETH"] },
        curve: { apy: "2-8%", risk: "IL + Smart Contract", minDeposit: "$1", features: ["Stablecoin Pools", "CRV Rewards"] },
    };
}
