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
    perf: "+1.0%/Tag",
    wr: "68%",
    maxDd: "6.7%",
    since: "2022",
    metaApiId: "cb652594-04e0-4123-a89b-7528250958ed",
    mtLogin: "50707464",
    maxDdFallback: 6.7,
  },
  {
    codename: "VIPER",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#22c55e",
    perf: "+15.1%",
    wr: "68%",
    maxDd: "6.8%",
    since: "2025",
    metaApiId: "e4be2f32-6fb9-42fa-a5f4-aba2095bdbcd",
    mtLogin: "50701398",
    maxDdFallback: 6.8,
  },
  {
    codename: "APEX",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#3b82f6",
    perf: "+3.8%",
    wr: "65%",
    maxDd: "11.5%",
    since: "2025",
    metaApiId: "fa8a5353-d029-42f5-922c-f5a003fc482b",
    mtLogin: "68297968",
    maxDdFallback: 11.5,
  },
  {
    codename: "SPECTRE",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#f59e0b",
    perf: "+1.6%",
    wr: "70%",
    maxDd: "0.7%",
    since: "2025",
    metaApiId: "2a729049-374d-496e-86dd-805b942f1e9d",
    mtLogin: "2100151348",
    maxDdFallback: 0.7,
  },
  {
    codename: "HYDRA",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#a855f7",
    perf: "+370.8%",
    wr: "74%",
    maxDd: "17.7%",
    since: "2024",
    metaApiId: "f89ce377-fcef-48a0-8d4a-b517b8f38a7f",
    mtLogin: "23651610",
    // Withdrawals gemacht (balance < profit) → initial deposit muss hart gesetzt werden
    // 1337.11 profit / 3.708 gain = ~360€ initial → passt zu "+370.8%"
    initialDeposit: 360,
    maxDdFallback: 17.7,
  },
  {
    codename: "RONIN",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#ef4444",
    perf: "-2.9%",
    wr: "58%",
    maxDd: "5.7%",
    since: "2025",
    metaApiId: "e4098442-dbb5-47d0-8864-014ed934bcd6",
    mtLogin: "50713387",
    maxDdFallback: 5.7,
  },
];

export function getTraderByMetaApiId(id: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.metaApiId === id);
}

export function getTraderByLogin(login: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.mtLogin === login);
}
