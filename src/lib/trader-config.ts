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
    codename: "PHANTOM-V4",
    asset: "XAUUSD",
    assetLabel: "Gold",
    color: "#e8785e",
    perf: "+1.0%/Tag",
    wr: "72%",
    maxDd: "4.5%",
    since: "2024",
    metaApiId: "fcff4919-51f9-42e5-af90-8179b0b41f31",
    mtLogin: "50715676",
  },
];

export function getTraderByMetaApiId(id: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.metaApiId === id);
}

export function getTraderByLogin(login: string): TraderConfig | undefined {
  return TRADER_CONFIG.find((t) => t.mtLogin === login);
}
