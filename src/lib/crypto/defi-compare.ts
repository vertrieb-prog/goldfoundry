// ═══════════════════════════════════════════════════════════════
// src/lib/crypto/defi-compare.ts — Gold Foundry vs DeFi yield comparison
// ═══════════════════════════════════════════════════════════════

interface YieldSource {
  name: string;
  protocol: string;
  apy: number;
  risk: "low" | "medium" | "high";
  lockup: string;
  minDeposit: number;
  currency: string;
}

interface ComparisonResult {
  goldFoundry: YieldSource;
  defiSources: YieldSource[];
  advantages: string[];
}

const DEFI_SOURCES: YieldSource[] = [
  {
    name: "Aave USDC Lending",
    protocol: "Aave",
    apy: 3.5,
    risk: "low",
    lockup: "Keine",
    minDeposit: 0,
    currency: "USDC",
  },
  {
    name: "Lido stETH Staking",
    protocol: "Lido",
    apy: 3.8,
    risk: "low",
    lockup: "Keine (liquid)",
    minDeposit: 0,
    currency: "ETH",
  },
  {
    name: "Curve 3pool LP",
    protocol: "Curve",
    apy: 2.1,
    risk: "medium",
    lockup: "Keine",
    minDeposit: 0,
    currency: "USDT/USDC/DAI",
  },
  {
    name: "Curve stETH/ETH LP",
    protocol: "Curve",
    apy: 4.2,
    risk: "medium",
    lockup: "Keine",
    minDeposit: 0,
    currency: "ETH",
  },
];

const GOLD_FOUNDRY_YIELD: YieldSource = {
  name: "Gold Foundry Smart Copier",
  protocol: "Gold Foundry",
  apy: 15.0, // Target based on copy trading performance
  risk: "medium",
  lockup: "Keine",
  minDeposit: 100,
  currency: "EUR",
};

export async function getComparison(): Promise<ComparisonResult> {
  // TODO: Fetch live DeFi rates from DeFiLlama or similar
  return {
    goldFoundry: GOLD_FOUNDRY_YIELD,
    defiSources: DEFI_SOURCES,
    advantages: getAdvantages(),
  };
}

export function getAdvantages(): string[] {
  return [
    "Hohere Zielrendite als passive DeFi-Strategien",
    "Kein Smart-Contract-Risiko (kein Impermanent Loss)",
    "Professionelle Trader kopieren statt eigene Strategien",
    "Keine Wallet oder DeFi-Kenntnisse erforderlich",
    "Risk Shield schutzt vor ubermassigen Verlusten",
    "In Euro — keine Stablecoin-Conversion notig",
    "Partner-Programm: Zusatzliches Einkommen durch Empfehlungen",
    "FORGE Mentor KI beratet individuell",
  ];
}
