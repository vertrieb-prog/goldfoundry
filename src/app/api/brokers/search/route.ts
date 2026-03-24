export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

// Fallback common brokers when MetaApi is unavailable
const COMMON_SERVERS = [
  // MT4
  { name: "ICMarkets-Demo", platform: "mt4" },
  { name: "ICMarkets-Live01", platform: "mt4" },
  { name: "ICMarkets-Live02", platform: "mt4" },
  { name: "ICMarkets-Live03", platform: "mt4" },
  { name: "ICMarkets-Live04", platform: "mt4" },
  { name: "ICMarkets-Live05", platform: "mt4" },
  { name: "ICMarkets-Live06", platform: "mt4" },
  { name: "ICMarkets-Live07", platform: "mt4" },
  { name: "ICMarketsSC-Demo", platform: "mt4" },
  { name: "ICMarketsSC-Live01", platform: "mt4" },
  { name: "ICMarketsSC-Live02", platform: "mt4" },
  { name: "ICMarketsSC-Live03", platform: "mt4" },
  { name: "ICMarketsSC-Live04", platform: "mt4" },
  { name: "ICMarketsSC-Live05", platform: "mt4" },
  { name: "Pepperstone-Demo", platform: "mt4" },
  { name: "Pepperstone-Live01", platform: "mt4" },
  { name: "Pepperstone-Live02", platform: "mt4" },
  { name: "Pepperstone-Edge01", platform: "mt4" },
  { name: "Pepperstone-Edge02", platform: "mt4" },
  { name: "FPMarkets-Demo", platform: "mt4" },
  { name: "FPMarkets-Live", platform: "mt4" },
  { name: "FPMarkets-Live2", platform: "mt4" },
  { name: "Exness-Real", platform: "mt4" },
  { name: "Exness-Real2", platform: "mt4" },
  { name: "Exness-Real3", platform: "mt4" },
  { name: "Exness-Real4", platform: "mt4" },
  { name: "Exness-Real5", platform: "mt4" },
  { name: "Exness-Trial", platform: "mt4" },
  { name: "XMGlobal-Real 1", platform: "mt4" },
  { name: "XMGlobal-Real 2", platform: "mt4" },
  { name: "XMGlobal-Real 3", platform: "mt4" },
  { name: "XMGlobal-Demo 3", platform: "mt4" },
  { name: "RoboForex-Demo", platform: "mt4" },
  { name: "RoboForex-Pro", platform: "mt4" },
  { name: "RoboForex-ECN", platform: "mt4" },
  { name: "Tickmill-Demo", platform: "mt4" },
  { name: "Tickmill-Live", platform: "mt4" },
  { name: "Tickmill-Pro", platform: "mt4" },
  { name: "VantageInternational-Demo", platform: "mt4" },
  { name: "VantageInternational-Live", platform: "mt4" },
  { name: "VantageInternational-Live 2", platform: "mt4" },
  { name: "FTMO-Demo", platform: "mt4" },
  { name: "FTMO-Server", platform: "mt4" },
  { name: "FTMO-Server2", platform: "mt4" },
  { name: "FTMO-Server3", platform: "mt4" },
  { name: "FundedNext-Demo", platform: "mt4" },
  { name: "FundedNext-Server", platform: "mt4" },
  { name: "FundedNext-Live", platform: "mt4" },
  { name: "ThePropTrading-Demo", platform: "mt4" },
  { name: "ThePropTrading-Server", platform: "mt4" },
  { name: "EightCap-Demo", platform: "mt4" },
  { name: "EightCap-Real", platform: "mt4" },
  { name: "EightCap-Real2", platform: "mt4" },
  { name: "BlackBull-Demo", platform: "mt4" },
  { name: "BlackBull-Live", platform: "mt4" },
  { name: "AdmiralsGroup-Demo", platform: "mt4" },
  { name: "AdmiralsGroup-Live", platform: "mt4" },
  { name: "AdmiralsGroup-Live2", platform: "mt4" },
  { name: "Axi-Demo", platform: "mt4" },
  { name: "Axi-Live", platform: "mt4" },
  { name: "FxPro.com-Demo01", platform: "mt4" },
  { name: "FxPro.com-Real01", platform: "mt4" },
  { name: "FxPro.com-Real02", platform: "mt4" },
  { name: "ThinkMarkets-Demo", platform: "mt4" },
  { name: "ThinkMarkets-Live", platform: "mt4" },
  { name: "OctaFX-Demo", platform: "mt4" },
  { name: "OctaFX-Real", platform: "mt4" },
  { name: "OctaFX-Real2", platform: "mt4" },
  { name: "Alpari-Demo", platform: "mt4" },
  { name: "Alpari-Standard2", platform: "mt4" },
  { name: "Alpari-ECN1", platform: "mt4" },
  // MT5
  { name: "ICMarkets-MT5", platform: "mt5" },
  { name: "ICMarkets-MT5-2", platform: "mt5" },
  { name: "ICMarkets-MT5-3", platform: "mt5" },
  { name: "ICMarketsSC-MT5", platform: "mt5" },
  { name: "ICMarketsSC-MT5-2", platform: "mt5" },
  { name: "ICMarketsSC-MT5-3", platform: "mt5" },
  { name: "ICMarketsSC-MT5-4", platform: "mt5" },
  { name: "Pepperstone-MT5-Demo", platform: "mt5" },
  { name: "Pepperstone-MT5-Live01", platform: "mt5" },
  { name: "Pepperstone-MT5-Edge01", platform: "mt5" },
  { name: "FPMarkets-MT5", platform: "mt5" },
  { name: "Exness-MT5Real", platform: "mt5" },
  { name: "Exness-MT5Real2", platform: "mt5" },
  { name: "Exness-MT5Real3", platform: "mt5" },
  { name: "Exness-MT5Trial", platform: "mt5" },
  { name: "XMGlobal-MT5", platform: "mt5" },
  { name: "RoboForex-MT5", platform: "mt5" },
  { name: "Tickmill-MT5", platform: "mt5" },
  { name: "VantageInternational-MT5", platform: "mt5" },
  { name: "FTMO-MT5", platform: "mt5" },
  { name: "FundedNext-MT5", platform: "mt5" },
  { name: "EightCap-MT5", platform: "mt5" },
  { name: "BlackBull-MT5", platform: "mt5" },
  { name: "AdmiralsGroup-MT5", platform: "mt5" },
  { name: "Axi-MT5", platform: "mt5" },
  { name: "FxPro-MT5", platform: "mt5" },
  { name: "ThinkMarkets-MT5", platform: "mt5" },
  { name: "OctaFX-MT5", platform: "mt5" },
  { name: "Alpari-MT5", platform: "mt5" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").toLowerCase().trim();
  const platform = searchParams.get("platform"); // mt4, mt5, or null for both

  // Must have a search query of at least 2 chars
  if (query.length < 2) {
    return NextResponse.json({ servers: [], message: "Mindestens 2 Zeichen eingeben" });
  }

  const token = process.env.META_API_TOKEN || process.env.METAAPI_TOKEN;

  // Try MetaApi provisioning API first
  if (token) {
    try {
      const platforms = platform ? [platform] : ["mt4", "mt5"];
      const allServers: { name: string; platform: string }[] = [];

      for (const p of platforms) {
        const res = await fetch(
          `https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/servers/${p}?query=${encodeURIComponent(query)}`,
          {
            headers: { "auth-token": token },
            next: { revalidate: 3600 }, // Cache for 1 hour
          }
        );

        if (res.ok) {
          const data = await res.json();
          // MetaApi returns array of server objects
          if (Array.isArray(data)) {
            allServers.push(...data.map((s: any) => ({
              name: s.name ?? s.id ?? s,
              platform: p,
            })));
          }
        }
      }

      if (allServers.length > 0) {
        return NextResponse.json({
          servers: allServers.slice(0, 50),
          source: "metaapi",
          allowCustom: true
        });
      }
    } catch (e) {
      console.error("MetaApi broker search failed:", e);
    }
  }

  // Fallback: filter common servers
  let filtered = COMMON_SERVERS.filter(s =>
    s.name.toLowerCase().includes(query)
  );

  if (platform) {
    filtered = filtered.filter(s => s.platform === platform);
  }

  return NextResponse.json({
    servers: filtered.slice(0, 30),
    source: "local",
    allowCustom: true,
    message: filtered.length === 0 ? "Server nicht gefunden. Du kannst den Namen manuell eingeben." : undefined
  });
}
