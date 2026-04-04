// ═══════════════════════════════════════════════════════════════
// src/lib/seo/auto-linker.ts — Internal Link Rules (50+)
// ═══════════════════════════════════════════════════════════════

import { SEO_CONFIG } from "@/lib/config";

interface LinkRule {
    keyword: string;
    url: string;
    maxPerPage: number;
}

const LINK_RULES: LinkRule[] = [
    // Products
    { keyword: "Smart Copier", url: "/products/copier", maxPerPage: 1 },
    { keyword: "Copy Trading", url: "/products/copier", maxPerPage: 1 },
    { keyword: "FORGE Mentor", url: "/products/mentor", maxPerPage: 1 },
    { keyword: "Risk Shield", url: "/products/risk-shield", maxPerPage: 1 },
    { keyword: "Trading Signale", url: "/products/signals", maxPerPage: 1 },
    { keyword: "Signal Suite", url: "/products/signals", maxPerPage: 1 },
    // Pages
    { keyword: "Preise", url: "/pricing", maxPerPage: 1 },
    { keyword: "Pricing", url: "/pricing", maxPerPage: 1 },
    { keyword: "Leaderboard", url: "/leaderboard", maxPerPage: 1 },
    { keyword: "Blog", url: "/blog", maxPerPage: 1 },
    { keyword: "Glossar", url: "/glossary", maxPerPage: 1 },
    // Assets - Gold
    { keyword: "XAUUSD", url: "/asset/xauusd", maxPerPage: 1 },
    { keyword: "Gold Trading", url: "/asset/xauusd", maxPerPage: 1 },
    { keyword: "Goldpreis", url: "/kurs/xauusd", maxPerPage: 1 },
    // Assets - Crypto
    { keyword: "Bitcoin", url: "/asset/btcusd", maxPerPage: 1 },
    { keyword: "BTCUSD", url: "/asset/btcusd", maxPerPage: 1 },
    { keyword: "Ethereum", url: "/asset/ethusd", maxPerPage: 1 },
    { keyword: "ETHUSD", url: "/asset/ethusd", maxPerPage: 1 },
    { keyword: "Solana", url: "/asset/solusd", maxPerPage: 1 },
    { keyword: "XRP", url: "/asset/xrpusd", maxPerPage: 1 },
    // Assets - Forex
    { keyword: "EURUSD", url: "/asset/eurusd", maxPerPage: 1 },
    { keyword: "GBPUSD", url: "/asset/gbpusd", maxPerPage: 1 },
    { keyword: "USDJPY", url: "/asset/usdjpy", maxPerPage: 1 },
    // Assets - Indices
    { keyword: "US500", url: "/asset/us500", maxPerPage: 1 },
    { keyword: "S&P 500", url: "/asset/us500", maxPerPage: 1 },
    { keyword: "DAX", url: "/asset/de40", maxPerPage: 1 },
    { keyword: "DE40", url: "/asset/de40", maxPerPage: 1 },
    { keyword: "Nasdaq", url: "/asset/nas100", maxPerPage: 1 },
    // Education
    { keyword: "Trading lernen", url: "/lernen/basics", maxPerPage: 1 },
    { keyword: "Risikomanagement", url: "/lernen/risikomanagement", maxPerPage: 1 },
    { keyword: "Technische Analyse", url: "/lernen/technische-analyse", maxPerPage: 1 },
    { keyword: "Prop Firm", url: "/lernen/prop-firms", maxPerPage: 1 },
    { keyword: "Prop Trading", url: "/lernen/prop-firms", maxPerPage: 1 },
    // Tools
    { keyword: "Positionsrechner", url: "/tools/position-calculator", maxPerPage: 1 },
    { keyword: "Lot Rechner", url: "/tools/lot-calculator", maxPerPage: 1 },
    { keyword: "Wirtschaftskalender", url: "/tools/calendar", maxPerPage: 1 },
    // Comparisons
    { keyword: "Broker Vergleich", url: "/vergleich/broker", maxPerPage: 1 },
    { keyword: "Copy Trading Vergleich", url: "/vergleich/copy-trading", maxPerPage: 1 },
    { keyword: "Aave", url: "/vergleich/defi", maxPerPage: 1 },
    // Partner
    { keyword: "Partner werden", url: "/partner", maxPerPage: 1 },
    { keyword: "Affiliate", url: "/partner", maxPerPage: 1 },
    { keyword: "Provision", url: "/partner", maxPerPage: 1 },
    // Exchanges
    { keyword: "Binance", url: "/exchange/binance", maxPerPage: 1 },
    { keyword: "Bybit", url: "/exchange/bybit", maxPerPage: 1 },
    { keyword: "Bitget", url: "/exchange/bitget", maxPerPage: 1 },
    { keyword: "OKX", url: "/exchange/okx", maxPerPage: 1 },
    // Legal
    { keyword: "Risikohinweis", url: "/risk-disclaimer", maxPerPage: 1 },
    { keyword: "Impressum", url: "/impressum", maxPerPage: 1 },
    { keyword: "Datenschutz", url: "/datenschutz", maxPerPage: 1 },
    { keyword: "AGB", url: "/agb", maxPerPage: 1 },
    // Strategy
    { keyword: "Scalping", url: "/strategy/scalping", maxPerPage: 1 },
    { keyword: "Swing Trading", url: "/strategy/swing", maxPerPage: 1 },
    { keyword: "News Trading", url: "/strategy/news", maxPerPage: 1 },
    // ── Subdomain Cross-Links (Backlinks zwischen Subdomains) ──
    { keyword: "Prop Firm Challenge", url: "https://prop-firm-challenge.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Funded Trader", url: "https://prop-firm-challenge.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Gold Trading Signale", url: "https://gold-trading-signale.goldfoundry.de", maxPerPage: 1 },
    { keyword: "XAUUSD Signale", url: "https://gold-trading-signale.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Gold Analyse", url: "https://gold-trading-signale.goldfoundry.de", maxPerPage: 1 },
    { keyword: "MetaTrader Automation", url: "https://metatrader-automation.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Expert Advisor", url: "https://metatrader-automation.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Trading Bot", url: "https://metatrader-automation.goldfoundry.de", maxPerPage: 1 },
    { keyword: "EA Programmierung", url: "https://metatrader-automation.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Broker Vergleich", url: "https://broker-vergleich.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Broker Test", url: "https://broker-vergleich.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Tegas FX", url: "https://tegas-fx-guide.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Tegas", url: "https://tegas-fx-guide.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Tag Markets", url: "https://tag-markets-guide.goldfoundry.de", maxPerPage: 1 },
    { keyword: "Gold Foundry", url: "https://goldfoundry.de", maxPerPage: 1 },
];

// ── Auto-Link Content ───────────────────────────────────────
export function autoLink(html: string, currentPath: string): string {
    let result = html;
    let totalLinksAdded = 0;
    const usedKeywords = new Set<string>();

    for (const rule of LINK_RULES) {
        if (totalLinksAdded >= SEO_CONFIG.maxAutoLinksPerPage) break;
        if (rule.url === currentPath) continue; // Don't link to self
        if (usedKeywords.has(rule.keyword.toLowerCase())) continue;

        const regex = new RegExp(`(?<!<[^>]*)(\\b${escapeRegex(rule.keyword)}\\b)(?![^<]*>)`, "i");
        if (regex.test(result)) {
            result = result.replace(regex, `<a href="${rule.url}" class="internal-link">$1</a>`);
            usedKeywords.add(rule.keyword.toLowerCase());
            totalLinksAdded++;
        }
    }

    return result;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export { LINK_RULES };
