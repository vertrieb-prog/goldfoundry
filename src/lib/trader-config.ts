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
}

export const TRADER_CONFIG: TraderConfig[] = [
  {
    codename: "PHANTOM",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#d4a537",
    perf: "+1.0%/Tag",
    wr: "72%",
    maxDd: "4.5%",
    since: "2022",
    metaApiId: "cb652594-04e0-4123-a89b-7528250958ed",
    mtLogin: "50707464",
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
  },
  {
    codename: "TITAN",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#3b82f6",
    perf: "+3.8%",
    wr: "65%",
    maxDd: "11.5%",
    since: "2025",
    metaApiId: "fa8a5353-d029-42f5-922c-f5a003fc482b",
    mtLogin: "68297968",
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
  },
  {
    codename: "PHANTOM-V4",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#e8785e",
    perf: "+0%",
    wr: "0%",
    maxDd: "0%",
    since: "2026",
    metaApiId: "fcff4919-51f9-42e5-af90-8179b0b41f31",
    mtLogin: "50715676",
  },
  {
    codename: "SHADOW",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#ef4444",
    perf: "-2.9%",
    wr: "58%",
    maxDd: "5.7%",
    since: "2025",
    metaApiId: "e4098442-dbb5-47d0-8864-014ed934bcd6",
    mtLogin: "50713387",
  },
];

export function getTraderByMetaApiId(id: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.metaApiId === id);
}

export function getTraderByLogin(login: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.mtLogin === login);
}
