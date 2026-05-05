export interface TraderConfig {
  codename: string;
  asset: string;
  assetLabel: string;
  color: string;
  perf: string;
  wr: string;
  maxDd: string;
  since: string;
  metaApiId: string;
  mtLogin: string;
  /** Ursprünglicher Deposit in EUR — für Gain-Berechnung wenn Withdrawals gemacht wurden */
  initialDeposit?: number;
  /** Statischer maxDd-Fallback in % falls MetaStats + MyFXBook beide 0 liefern */
  maxDdFallback?: number;
}

export const TRADER_CONFIG: TraderConfig[] = [
  {
    codename: "PHANTOM",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#d4a537",
    perf: "0%",
    wr: "0%",
    maxDd: "0%",
    since: "2026",
    metaApiId: "e534fb5e-c8f7-44e3-a4f9-ab49b3e76d77",
    mtLogin: "",
  },
];

export function getTraderByMetaApiId(id: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.metaApiId === id);
}

export function getTraderByLogin(login: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.mtLogin === login);
}
