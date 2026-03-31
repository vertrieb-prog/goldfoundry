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
    codename: "NEXUS",
    asset: "US500",
    assetLabel: "S&P 500",
    color: "#3b82f6",
    perf: "+0.7%/Tag",
    wr: "68%",
    maxDd: "3.8%",
    since: "2023",
    metaApiId: "85755595-b2ec-498c-8fbf-ee62cafd3cc6",
    mtLogin: "50684429",
  },
  {
    codename: "SENTINEL",
    asset: "DAX40",
    assetLabel: "Deutscher Leitindex",
    color: "#a855f7",
    perf: "+0.8%/Tag",
    wr: "65%",
    maxDd: "5.2%",
    since: "2023",
    metaApiId: "66d8fe15-368b-4e3c-8c6c-ed32bea5b56b",
    mtLogin: "50701689",
  },
  {
    codename: "SPECTRE",
    asset: "EURUSD",
    assetLabel: "Euro/Dollar",
    color: "#22c55e",
    perf: "+0.5%/Tag",
    wr: "74%",
    maxDd: "3.2%",
    since: "2022",
    metaApiId: "02f08a16-ae02-40f4-9195-2c62ec52e8eb",
    mtLogin: "50701707",
  },
];

export function getTraderByMetaApiId(id: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.metaApiId === id);
}

export function getTraderByLogin(login: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.mtLogin === login);
}
