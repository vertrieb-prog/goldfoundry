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
    perf: "+53%",
    wr: "65%",
    maxDd: "15.7%",
    since: "2022",
    metaApiId: "cb652594-04e0-4123-a89b-7528250958ed",
    mtLogin: "50707464",
  },
  {
    codename: "VIPER",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#22c55e",
    perf: "0%",
    wr: "0%",
    maxDd: "0%",
    since: "2025",
    metaApiId: "e4be2f32-6fb9-42fa-a5f4-aba2095bdbcd",
    mtLogin: "50701398",
  },
  {
    codename: "APEX",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#3b82f6",
    perf: "+12%",
    wr: "56%",
    maxDd: "11.5%",
    since: "2025",
    metaApiId: "fa8a5353-d029-42f5-922c-f5a003fc482b",
    mtLogin: "68297968",
  },
  {
    codename: "RONIN",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#ef4444",
    perf: "+12.7%",
    wr: "60%",
    maxDd: "5.7%",
    since: "2025",
    metaApiId: "e4098442-dbb5-47d0-8864-014ed934bcd6",
    mtLogin: "50713387",
  },
  {
    codename: "TITAN",
    asset: "Multi",
    assetLabel: "Multi-Asset",
    color: "#06b6d4",
    perf: "0%",
    wr: "0%",
    maxDd: "0%",
    since: "2026",
    metaApiId: "f7dd5d65-35dc-4366-8aa7-48e1350c6e5c",
    mtLogin: "1172901340",
  },
];

export function getTraderByMetaApiId(id: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.metaApiId === id);
}

export function getTraderByLogin(login: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.mtLogin === login);
}