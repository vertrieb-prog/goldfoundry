// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — SEO MEGA EXPANSION
//
// Erweitert die SEO Engine auf das GESAMTE Trading-Universum:
//
// GOLD      — XAUUSD (Kernprodukt, bereits abgedeckt)
// FOREX     — EUR/USD, GBP/USD, USD/JPY, alle Majors + Minors
// CRYPTO    — BTC, ETH, SOL, XRP, alle Top 20
// INDICES   — US500, DAX, NASDAQ, FTSE
// ROHSTOFFE — Silber, Öl, Gas
//
// Ziel: 10.000+ indexierte Seiten
// Dominanz in JEDEM Trading-Thema auf Deutsch
// ═══════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────
// COMPLETE ASSET DATABASE
// ─────────────────────────────────────────────────────────────

export const ASSETS = {
  // ── GOLD & METALLE ─────────────────────────────────────────
  metals: [
    { symbol: "XAUUSD", name: "Gold", slug: "gold", emoji: "🥇", category: "metalle" },
    { symbol: "XAGUSD", name: "Silber", slug: "silber", emoji: "🥈", category: "metalle" },
    { symbol: "XPTUSD", name: "Platin", slug: "platin", emoji: "⬜", category: "metalle" },
  ],

  // ── FOREX MAJORS ───────────────────────────────────────────
  forexMajors: [
    { symbol: "EURUSD", name: "EUR/USD", slug: "eurusd", emoji: "🇪🇺", category: "forex", desc: "Euro gegen US-Dollar — meistgehandeltes Währungspaar der Welt" },
    { symbol: "GBPUSD", name: "GBP/USD", slug: "gbpusd", emoji: "🇬🇧", category: "forex", desc: "Britisches Pfund gegen US-Dollar — Cable" },
    { symbol: "USDJPY", name: "USD/JPY", slug: "usdjpy", emoji: "🇯🇵", category: "forex", desc: "US-Dollar gegen Japanischen Yen — Gopher" },
    { symbol: "USDCHF", name: "USD/CHF", slug: "usdchf", emoji: "🇨🇭", category: "forex", desc: "US-Dollar gegen Schweizer Franken — Swissy" },
    { symbol: "AUDUSD", name: "AUD/USD", slug: "audusd", emoji: "🇦🇺", category: "forex", desc: "Australischer Dollar gegen US-Dollar — Aussie" },
    { symbol: "USDCAD", name: "USD/CAD", slug: "usdcad", emoji: "🇨🇦", category: "forex", desc: "US-Dollar gegen Kanadischen Dollar — Loonie" },
    { symbol: "NZDUSD", name: "NZD/USD", slug: "nzdusd", emoji: "🇳🇿", category: "forex", desc: "Neuseeländischer Dollar gegen US-Dollar — Kiwi" },
  ],

  // ── FOREX MINORS ───────────────────────────────────────────
  forexMinors: [
    { symbol: "EURGBP", name: "EUR/GBP", slug: "eurgbp", emoji: "🇪🇺🇬🇧", category: "forex" },
    { symbol: "EURJPY", name: "EUR/JPY", slug: "eurjpy", emoji: "🇪🇺🇯🇵", category: "forex" },
    { symbol: "GBPJPY", name: "GBP/JPY", slug: "gbpjpy", emoji: "🇬🇧🇯🇵", category: "forex", desc: "Das Beast — extrem volatil" },
    { symbol: "EURCHF", name: "EUR/CHF", slug: "eurchf", emoji: "🇪🇺🇨🇭", category: "forex" },
    { symbol: "AUDNZD", name: "AUD/NZD", slug: "audnzd", emoji: "🇦🇺🇳🇿", category: "forex" },
    { symbol: "EURAUD", name: "EUR/AUD", slug: "euraud", emoji: "🇪🇺🇦🇺", category: "forex" },
    { symbol: "GBPAUD", name: "GBP/AUD", slug: "gbpaud", emoji: "🇬🇧🇦🇺", category: "forex" },
  ],

  // ── CRYPTO TOP 20 ──────────────────────────────────────────
  crypto: [
    { symbol: "BTCUSD", name: "Bitcoin", slug: "bitcoin", emoji: "₿", category: "crypto", desc: "Die erste und größte Kryptowährung — digitales Gold" },
    { symbol: "ETHUSD", name: "Ethereum", slug: "ethereum", emoji: "⟠", category: "crypto", desc: "Smart Contract Plattform #1 — DeFi Backbone" },
    { symbol: "SOLUSD", name: "Solana", slug: "solana", emoji: "◎", category: "crypto", desc: "High-Speed Blockchain — 65.000 TPS" },
    { symbol: "XRPUSD", name: "XRP", slug: "xrp", emoji: "✕", category: "crypto", desc: "Ripple — Cross-Border Zahlungen" },
    { symbol: "BNBUSD", name: "BNB", slug: "bnb", emoji: "🔶", category: "crypto", desc: "Binance Token — Exchange Ökosystem" },
    { symbol: "ADAUSD", name: "Cardano", slug: "cardano", emoji: "🔵", category: "crypto", desc: "Peer-reviewed Blockchain — akademischer Ansatz" },
    { symbol: "DOGEUSD", name: "Dogecoin", slug: "dogecoin", emoji: "🐕", category: "crypto", desc: "Der Meme-Coin der ernst genommen wird" },
    { symbol: "AVAXUSD", name: "Avalanche", slug: "avalanche", emoji: "🔺", category: "crypto", desc: "Subnet-Architektur — Enterprise Blockchain" },
    { symbol: "DOTUSD", name: "Polkadot", slug: "polkadot", emoji: "⚫", category: "crypto", desc: "Multi-Chain Interoperabilität" },
    { symbol: "MATICUSD", name: "Polygon", slug: "polygon", emoji: "🟣", category: "crypto", desc: "Ethereum Layer-2 Scaling" },
    { symbol: "LINKUSD", name: "Chainlink", slug: "chainlink", emoji: "🔗", category: "crypto", desc: "Dezentrales Oracle Netzwerk" },
    { symbol: "UNIUSD", name: "Uniswap", slug: "uniswap", emoji: "🦄", category: "crypto", desc: "Größte dezentrale Exchange (DEX)" },
    { symbol: "LTCUSD", name: "Litecoin", slug: "litecoin", emoji: "Ł", category: "crypto", desc: "Silber zu Bitcoins Gold" },
    { symbol: "ATOMUSD", name: "Cosmos", slug: "cosmos", emoji: "⚛️", category: "crypto", desc: "Internet of Blockchains" },
    { symbol: "ARBUSD", name: "Arbitrum", slug: "arbitrum", emoji: "🔵", category: "crypto", desc: "Ethereum Layer-2 Optimistic Rollup" },
  ],

  // ── INDICES ────────────────────────────────────────────────
  indices: [
    { symbol: "US500", name: "S&P 500", slug: "sp500", emoji: "🇺🇸", category: "indices", desc: "Die 500 größten US-Unternehmen" },
    { symbol: "US100", name: "NASDAQ 100", slug: "nasdaq", emoji: "💻", category: "indices", desc: "Tech-lastig — Apple, Microsoft, NVIDIA" },
    { symbol: "US30", name: "Dow Jones", slug: "dow-jones", emoji: "🏛️", category: "indices", desc: "30 Blue-Chip US-Aktien" },
    { symbol: "DE40", name: "DAX 40", slug: "dax", emoji: "🇩🇪", category: "indices", desc: "Die 40 größten deutschen Unternehmen" },
    { symbol: "UK100", name: "FTSE 100", slug: "ftse", emoji: "🇬🇧", category: "indices", desc: "Top 100 London Stock Exchange" },
    { symbol: "JP225", name: "Nikkei 225", slug: "nikkei", emoji: "🇯🇵", category: "indices", desc: "Japanischer Leitindex" },
  ],

  // ── ROHSTOFFE ──────────────────────────────────────────────
  commodities: [
    { symbol: "USOIL", name: "Rohöl WTI", slug: "oel-wti", emoji: "🛢️", category: "rohstoffe" },
    { symbol: "UKOIL", name: "Brent Öl", slug: "oel-brent", emoji: "🛢️", category: "rohstoffe" },
    { symbol: "NATGAS", name: "Erdgas", slug: "erdgas", emoji: "🔥", category: "rohstoffe" },
  ],
};

const ALL_ASSETS = [
  ...ASSETS.metals,
  ...ASSETS.forexMajors,
  ...ASSETS.forexMinors,
  ...ASSETS.crypto,
  ...ASSETS.indices,
  ...ASSETS.commodities,
];


// ═══════════════════════════════════════════════════════════════
// EXPANDED CONTENT CLUSTERS
// 40+ Artikel pro Bereich = 200+ Blog-Posts total
// ═══════════════════════════════════════════════════════════════

export const EXPANDED_CLUSTERS = {

  // ── FOREX EDUCATION ─────────────────────────────────────────
  "forex-grundlagen": {
    pillar: "Forex Trading lernen 2026 — Der komplette Anfänger-Guide",
    articles: [
      "Was ist Forex Trading? Einfach erklärt",
      "Forex Markt Öffnungszeiten — Wann traden?",
      "Währungspaare verstehen — Majors, Minors, Exotics",
      "Wie liest man einen Forex Chart?",
      "Bid, Ask und Spread erklärt",
      "Hebel im Forex — Chance und Risiko",
      "Margin Call vermeiden — So schützt du dein Konto",
      "Forex Broker auswählen — Worauf achten?",
      "Demo-Konto vs Live-Konto — Wann wechseln?",
      "Die häufigsten Anfängerfehler im Forex Trading",
    ],
  },

  "forex-strategien": {
    pillar: "Die besten Forex Trading Strategien 2026",
    articles: [
      "Scalping Strategie — Schnelle Gewinne in Minuten",
      "Swing Trading — Positionen über Tage halten",
      "Breakout Trading — Ausbrüche profitabel handeln",
      "Trend Following — Mit dem Trend Geld verdienen",
      "Range Trading — Seitwärtsmärkte ausnutzen",
      "News Trading — FOMC, NFP, CPI richtig handeln",
      "Price Action Trading — Charts lesen ohne Indikatoren",
      "ICT Smart Money Concepts erklärt",
      "Supply and Demand Zonen finden",
      "Fibonacci im Forex — Retracements und Extensions",
    ],
  },

  "forex-analyse": {
    pillar: "Forex Analyse lernen — Technisch und Fundamental",
    articles: [
      "Technische Analyse Grundlagen für Forex",
      "Die wichtigsten Forex Indikatoren 2026",
      "Candlestick Patterns die du kennen musst",
      "Support und Resistance richtig einzeichnen",
      "Trendlinien und Channels verstehen",
      "Moving Averages — SMA, EMA, welchen nehmen?",
      "RSI Divergenz — Verstecktes Umkehrsignal",
      "MACD Strategie für Anfänger",
      "Fundamentalanalyse im Forex — Zinsen, Inflation, BIP",
      "Korrelationen zwischen Währungspaaren nutzen",
    ],
  },

  // ── CRYPTO EDUCATION ────────────────────────────────────────
  "crypto-grundlagen": {
    pillar: "Kryptowährungen verstehen 2026 — Der komplette Guide",
    articles: [
      "Was sind Kryptowährungen? Einfach erklärt",
      "Bitcoin verstehen — Wie funktioniert BTC?",
      "Ethereum vs Bitcoin — Die Unterschiede",
      "Wallet erstellen — Hot Wallet vs Cold Wallet",
      "Krypto kaufen in Deutschland — Schritt für Schritt",
      "Was ist DeFi? Dezentrale Finanzen erklärt",
      "NFTs und ihre Bedeutung für den Markt",
      "Staking erklärt — Passives Einkommen mit Krypto",
      "Krypto Steuern Deutschland 2026 — Was du wissen musst",
      "Die größten Krypto Scams und wie du dich schützt",
    ],
  },

  "crypto-trading": {
    pillar: "Krypto Trading Guide 2026 — Strategien für Bitcoin & Altcoins",
    articles: [
      "Bitcoin Trading Strategie für Anfänger",
      "Altcoin Season erkennen — Wann rotiert Geld?",
      "Krypto Scalping auf 5-Minuten Charts",
      "Bitcoin Halving und der Preiszyklus",
      "Krypto Futures Trading erklärt",
      "Leverage Trading mit Krypto — Vorsicht geboten",
      "On-Chain Analyse für Trader",
      "Krypto Fear & Greed Index nutzen",
      "Bitcoin Dominanz Chart lesen und interpretieren",
      "Top 10 Krypto Trading Fehler vermeiden",
    ],
  },

  "crypto-analyse": {
    pillar: "Krypto Analyse 2026 — So bewertest du Coins richtig",
    articles: [
      "Fundamentalanalyse für Kryptowährungen",
      "Tokenomics verstehen — Supply, Demand, Inflation",
      "Whitepaper lesen und bewerten",
      "Market Cap vs Fully Diluted Valuation",
      "TVL (Total Value Locked) als Metrik",
      "Krypto Sentiment Analyse — Tools und Methoden",
      "Bitcoin On-Chain Metriken die du kennen musst",
      "Technische Analyse für Krypto — funktioniert das?",
      "Krypto Korrelation mit traditionellen Märkten",
      "Airdrop Farming — Strategie und Risiken",
    ],
  },

  // ── INDICES & ROHSTOFFE ─────────────────────────────────────
  "index-trading": {
    pillar: "Index Trading 2026 — S&P 500, DAX, NASDAQ handeln",
    articles: [
      "S&P 500 Trading — Der US-Markt für Anfänger",
      "DAX Trading Strategie — Deutsche Aktien handeln",
      "NASDAQ 100 — Tech-Aktien mit Hebel",
      "Index CFDs vs ETFs — Was ist besser?",
      "US-Markt Öffnungszeiten für deutsche Trader",
      "Earnings Season traden — Quartalszahlen nutzen",
      "Index Futures erklärt — CME und Co",
      "Dow Jones vs S&P 500 — Welchen Index handeln?",
    ],
  },

  // ── PROP FIRM (erweitert) ───────────────────────────────────
  "prop-firm-komplett": {
    pillar: "Prop Firm Trading 2026 — Der definitive Guide",
    articles: [
      "Was ist eine Prop Firm? Funded Accounts erklärt",
      "Die besten Prop Firms 2026 im Vergleich",
      "Prop Firm Challenge bestehen — 10 bewährte Tipps",
      "Prop Firm Drawdown Regeln verstehen und einhalten",
      "FTMO Erfahrung und Review 2026",
      "MyFundedFX Review — Lohnt es sich?",
      "Prop Firm für Gold Trading — Welche passt?",
      "Prop Firm für Crypto — Gibt es das?",
      "Prop Firm Payout — Wie funktioniert die Auszahlung?",
      "Prop Firm Steuern — Wie wird das versteuert?",
      "Prop Firm Regeln die jeder kennen muss",
      "Scaling Plan bei Prop Firms — Mehr Kapital verdienen",
    ],
  },

  // ── TRADING PSYCHOLOGIE ─────────────────────────────────────
  "trading-psychologie": {
    pillar: "Trading Psychologie — Der unterschätzte Erfolgsfaktor",
    articles: [
      "FOMO im Trading — Fear of Missing Out überwinden",
      "Revenge Trading stoppen — Nach Verlusten ruhig bleiben",
      "Trading Journal führen — Warum und wie",
      "Overtrading vermeiden — Qualität über Quantität",
      "Geduld im Trading lernen — Auf Setups warten",
      "Verluste akzeptieren — Teil des Spiels",
      "Trading Routine aufbauen — Struktur bringt Erfolge",
      "Emotionsloses Trading — Geht das überhaupt?",
    ],
  },

  // ── TOOLS & PLATTFORMEN ─────────────────────────────────────
  "trading-tools": {
    pillar: "Die besten Trading Tools und Plattformen 2026",
    articles: [
      "MetaTrader 5 Guide — Alles was du wissen musst",
      "MetaTrader 4 vs MetaTrader 5 — Welchen nehmen?",
      "TradingView Guide — Charts wie ein Profi",
      "cTrader Review — Alternative zu MetaTrader",
      "Die besten Trading Indikatoren 2026",
      "VPS für Trading — Brauche ich das?",
      "Expert Advisor installieren — Schritt für Schritt",
      "Backtesting richtig machen — So testest du Strategien",
      "Trading Simulator — Üben ohne Risiko",
      "Die besten Wirtschaftskalender für Trader",
    ],
  },

  // ── GELD & FINANZEN (breiteres Publikum) ────────────────────
  "geld-finanzen": {
    pillar: "Geld verdienen mit Trading 2026 — Realistischer Guide",
    articles: [
      "Kann man vom Trading leben? Ehrliche Antwort",
      "Wie viel Kapital braucht man zum Traden?",
      "Trading als Nebeneinkommen — Realistisch?",
      "Passives Einkommen durch Copy Trading",
      "Trading Steuern Deutschland — Kompletter Guide",
      "Trading vs Investieren — Was passt zu dir?",
      "Die besten Broker für deutsche Trader 2026",
      "Konto-Aufbau Strategie — Von €500 zu €50.000",
    ],
  },
};


// ═══════════════════════════════════════════════════════════════
// EXPANDED GLOSSARY — 200+ Begriffe
// ═══════════════════════════════════════════════════════════════

export const EXPANDED_GLOSSARY = [
  // Forex Basics
  "Pip", "Lot", "Micro Lot", "Mini Lot", "Standard Lot",
  "Leverage", "Hebel", "Margin", "Free Margin", "Margin Level", "Margin Call",
  "Spread", "Bid", "Ask", "Slippage", "Requote", "Execution",
  "Stop Loss", "Take Profit", "Trailing Stop", "Break Even",
  "Market Order", "Limit Order", "Stop Order", "OCO Order",
  "Long Position", "Short Position", "Flat", "Exposure",

  // Analysis
  "Support", "Resistance", "Trendline", "Channel", "Range",
  "Breakout", "Pullback", "Reversal", "Continuation", "Consolidation",
  "Higher High", "Higher Low", "Lower High", "Lower Low",
  "Moving Average", "SMA", "EMA", "VWAP",
  "RSI", "MACD", "Stochastic", "Bollinger Bands", "ATR",
  "Fibonacci Retracement", "Fibonacci Extension",
  "Candlestick", "Doji", "Engulfing", "Hammer", "Shooting Star", "Pin Bar",
  "Head and Shoulders", "Double Top", "Double Bottom", "Triangle",
  "Order Block", "Fair Value Gap", "Liquidity", "Smart Money Concept",
  "Volume Profile", "VPOC", "Value Area",

  // Risk & Performance
  "Drawdown", "Max Drawdown", "Equity", "Balance",
  "Profit Factor", "Win Rate", "Risk Reward Ratio", "Expectancy",
  "Sharpe Ratio", "Sortino Ratio", "Calmar Ratio",
  "Risk Management", "Position Sizing", "Kelly Criterion",
  "Compounding", "Risk of Ruin", "Recovery Factor",

  // Trading Styles
  "Scalping", "Day Trading", "Swing Trading", "Position Trading",
  "Algorithmic Trading", "High Frequency Trading", "Quantitative Trading",
  "Copy Trading", "Social Trading", "Mirror Trading",
  "Hedging", "Martingale", "Grid Trading", "Averaging Down",

  // Forex Market
  "Forex", "Devisen", "Währungspaar", "Base Currency", "Quote Currency",
  "Major Pairs", "Minor Pairs", "Exotic Pairs", "Cross Pairs",
  "Asian Session", "London Session", "New York Session", "Session Overlap",
  "Liquidity", "Volatility", "Volume", "Open Interest",
  "Carry Trade", "Interest Rate Differential", "Swap", "Rollover",

  // Crypto
  "Bitcoin", "Altcoin", "Stablecoin", "Token", "Coin",
  "Blockchain", "Block", "Hash", "Mining", "Proof of Work", "Proof of Stake",
  "Wallet", "Hot Wallet", "Cold Wallet", "Seed Phrase", "Private Key",
  "DeFi", "DEX", "CEX", "AMM", "Liquidity Pool",
  "Smart Contract", "Gas Fee", "Gwei", "Layer 1", "Layer 2",
  "NFT", "Airdrop", "Staking", "Yield Farming", "Impermanent Loss",
  "Market Cap", "Fully Diluted Valuation", "TVL", "Circulating Supply",
  "Halving", "Bull Run", "Bear Market", "Altseason",
  "HODL", "WAGMI", "DYOR", "FUD", "FOMO",
  "ICO", "IDO", "IEO", "Launchpad",
  "Tokenomics", "Whitepaper", "Roadmap", "Use Case",
  "Rug Pull", "Pump and Dump", "Whale", "Bagholder",

  // Broker & Regulation
  "Broker", "Market Maker", "ECN Broker", "STP Broker", "NDD",
  "Regulation", "FCA", "CySEC", "ASIC", "BaFin", "SEC",
  "KYC", "AML", "Segregated Accounts", "Investor Protection",
  "MetaTrader 4", "MetaTrader 5", "cTrader", "TradingView",

  // Prop Firms
  "Prop Firm", "Funded Account", "Challenge", "Verification Phase",
  "Profit Split", "Profit Target", "Daily Loss Limit", "Max Drawdown",
  "Trailing Drawdown", "Fixed Drawdown", "Scaling Plan", "Payout",

  // Economics
  "FOMC", "Federal Reserve", "Fed Funds Rate", "Quantitative Easing",
  "NFP", "Non Farm Payrolls", "Unemployment Rate",
  "CPI", "Inflation", "Core Inflation", "PCE",
  "GDP", "BIP", "PMI", "ISM Manufacturing",
  "ECB", "EZB", "BOJ", "BOE", "RBA", "SNB",
  "Interest Rate", "Leitzins", "Hawkish", "Dovish", "Tapering",
  "Yield Curve", "Inversion", "Recession", "Stagflation",
];


// ═══════════════════════════════════════════════════════════════
// ASSET-SPECIFIC PAGE GENERATORS
// Für JEDES Asset: Analyse, Guide, FAQ, Vergleich
// ═══════════════════════════════════════════════════════════════

export const ASSET_PAGE_TEMPLATES = {

  // Pro Asset: "[Name] Trading Guide"
  guide: (asset: any) => `
Schreibe einen Trading Guide für ${asset.name} (${asset.symbol}).
${asset.desc ? `Beschreibung: ${asset.desc}` : ""}

FORMAT:
- H1: ${asset.name} Trading 2026 — Kompletter Guide
- H2: Was ist ${asset.name}? (3 Sätze)
- H2: Warum ${asset.name} traden? (3 Sätze, Vorteile)
- H2: Wie ${asset.name} traden? (4 Sätze, praktisch)
- H2: Beste Strategie für ${asset.name} (3 Sätze)
- H2: Risiken (2 Sätze, ehrlich)
- CTA: Gold Foundry Copier → /products/copier
- Risikohinweis

Max 400 Wörter. SEO: ${asset.name} Trading, ${asset.symbol} handeln, ${asset.name} kaufen`,

  // Pro Asset: "Kurs heute"
  dailyPrice: (asset: any, price: number, change: number) => `
Kurzer Markt-Update für ${asset.name} (${asset.symbol}).
Kurs: ${price}, 24h Änderung: ${change > 0 ? "+" : ""}${change}%.

FORMAT:
- H1: ${asset.name} Kurs heute — ${change > 0 ? "steigt" : "fällt"} ${Math.abs(change).toFixed(1)}%
- 3 Sätze: Aktuelle Lage, Treiber, Ausblick
- Link: /products/copier
- Risikohinweis

Max 150 Wörter. SEO: ${asset.name} Kurs heute, ${asset.symbol} Preis, ${asset.name} Prognose`,

  // Pro Asset: "Prognose [Monat]"
  forecast: (asset: any, month: string) => `
Schreibe eine ${asset.name} Prognose für ${month}.

FORMAT:
- H1: ${asset.name} Prognose ${month} — Was Experten erwarten
- Aktuelle Lage (2 Sätze)
- Technische Analyse (2 Sätze: Support/Resistance Levels)
- Fundamentale Faktoren (2 Sätze)
- Fazit und Empfehlung (2 Sätze)
- Link: /products/copier
- Risikohinweis: "Dies ist keine Anlageberatung."

Max 300 Wörter. SEO: ${asset.name} Prognose ${month}, ${asset.symbol} Vorhersage, ${asset.name} Ausblick`,
};


// ═══════════════════════════════════════════════════════════════
// EXPANDED COMPARISON PAGES
// ═══════════════════════════════════════════════════════════════

export const EXPANDED_COMPARISONS = {
  // Asset vs Asset
  assetVsAsset: [
    ["Bitcoin", "Ethereum"],
    ["Bitcoin", "Gold"],
    ["Gold", "Silber"],
    ["S&P 500", "NASDAQ"],
    ["EUR/USD", "GBP/USD"],
    ["Bitcoin", "S&P 500"],
    ["Forex", "Krypto"],
    ["Forex", "Aktien"],
    ["CFDs", "Futures"],
    ["Trading", "Investieren"],
  ],

  // Broker vs Broker (erweitert)
  brokerVsBroker: [
    ["Tag Markets", "Tegas FX"],
    ["IC Markets", "Pepperstone"],
    ["Binance", "Coinbase"],
    ["Binance", "Kraken"],
    ["eToro", "Plus500"],
    ["Interactive Brokers", "Trade Republic"],
    ["FTMO", "MyFundedFX"],
    ["Bitget", "Bybit"],
  ],

  // Platform vs Platform
  platformVsPlatform: [
    ["MetaTrader 4", "MetaTrader 5"],
    ["MetaTrader", "cTrader"],
    ["TradingView", "MetaTrader"],
    ["Binance", "Bybit"],
  ],

  // Gold Foundry vs Everything
  gfVsCompetitors: [
    ["Gold Foundry", "ZuluTrade"],
    ["Gold Foundry", "eToro CopyTrader"],
    ["Gold Foundry", "MQL5 Signals"],
    ["Gold Foundry", "MyFxBook AutoTrade"],
    ["Gold Foundry", "FTMO"],
    ["Gold Foundry", "TelegramFX Copier"],
    ["Gold Foundry", "3Commas"],
    ["Gold Foundry", "Pionex"],
    ["Gold Foundry", "Cornix"],
  ],
};


// ═══════════════════════════════════════════════════════════════
// EXPANDED TOOLS
// ═══════════════════════════════════════════════════════════════

export const EXPANDED_TOOLS = [
  // Existing
  { slug: "profit-calculator", title: "Trading Profit Rechner", category: "calculator" },
  { slug: "lot-calculator", title: "Lot Size Calculator", category: "calculator" },
  { slug: "pip-calculator", title: "Pip Value Calculator", category: "calculator" },
  { slug: "drawdown-calculator", title: "Drawdown Rechner", category: "calculator" },
  { slug: "margin-calculator", title: "Margin Calculator", category: "calculator" },
  { slug: "risk-reward-calculator", title: "Risk/Reward Calculator", category: "calculator" },
  { slug: "compounding-calculator", title: "Zinseszins Rechner Trading", category: "calculator" },
  { slug: "session-timer", title: "Trading Session Timer", category: "tool" },
  { slug: "economic-calendar", title: "Wirtschaftskalender", category: "tool" },
  { slug: "position-size-planner", title: "Position Size Planner", category: "calculator" },

  // NEW Forex
  { slug: "swap-calculator", title: "Swap Rechner — Übernachtkosten berechnen", category: "calculator" },
  { slug: "currency-converter", title: "Währungsrechner Live", category: "tool" },
  { slug: "correlation-matrix", title: "Forex Korrelationsmatrix", category: "tool" },
  { slug: "volatility-calculator", title: "Volatilitäts-Rechner (ATR)", category: "calculator" },
  { slug: "fibonacci-calculator", title: "Fibonacci Level Calculator", category: "calculator" },
  { slug: "pivot-point-calculator", title: "Pivot Point Calculator", category: "calculator" },

  // NEW Crypto
  { slug: "crypto-profit-calculator", title: "Krypto Gewinn Rechner", category: "calculator" },
  { slug: "bitcoin-halving-countdown", title: "Bitcoin Halving Countdown", category: "tool" },
  { slug: "gas-fee-tracker", title: "Ethereum Gas Fee Tracker", category: "tool" },
  { slug: "fear-greed-index", title: "Krypto Fear & Greed Index", category: "tool" },
  { slug: "marketcap-ranking", title: "Krypto Market Cap Ranking", category: "tool" },
  { slug: "staking-calculator", title: "Staking Rewards Calculator", category: "calculator" },
  { slug: "impermanent-loss-calculator", title: "Impermanent Loss Rechner", category: "calculator" },
  { slug: "dca-calculator", title: "DCA Calculator — Dollar Cost Averaging", category: "calculator" },

  // NEW General
  { slug: "broker-finder", title: "Broker Finder — Welcher passt zu dir?", category: "tool" },
  { slug: "prop-firm-finder", title: "Prop Firm Finder — Challenge Vergleich", category: "tool" },
  { slug: "tax-calculator", title: "Trading Steuer Rechner Deutschland", category: "calculator" },
  { slug: "risk-of-ruin-calculator", title: "Risk of Ruin Calculator", category: "calculator" },
];


// ═══════════════════════════════════════════════════════════════
// DAILY NEWS EXPANSION — Alle Assets
// ═══════════════════════════════════════════════════════════════

export const NEWS_SCHEDULE = {
  // Jeden Tag generieren wir News für:
  daily: [
    { asset: "XAUUSD", name: "Gold", slug: "gold", priority: 1 },
    { asset: "BTCUSD", name: "Bitcoin", slug: "bitcoin", priority: 1 },
    { asset: "EURUSD", name: "EUR/USD", slug: "eurusd", priority: 2 },
    { asset: "US500", name: "S&P 500", slug: "sp500", priority: 2 },
  ],

  // 3x pro Woche:
  triweekly: [
    { asset: "ETHUSD", name: "Ethereum", slug: "ethereum" },
    { asset: "GBPUSD", name: "GBP/USD", slug: "gbpusd" },
    { asset: "USDJPY", name: "USD/JPY", slug: "usdjpy" },
    { asset: "DE40", name: "DAX", slug: "dax" },
  ],

  // 1x pro Woche:
  weekly: [
    { asset: "SOLUSD", name: "Solana", slug: "solana" },
    { asset: "XRPUSD", name: "XRP", slug: "xrp" },
    { asset: "XAGUSD", name: "Silber", slug: "silber" },
    { asset: "USOIL", name: "Öl WTI", slug: "oel" },
    { asset: "US100", name: "NASDAQ", slug: "nasdaq" },
    { asset: "GBPJPY", name: "GBP/JPY", slug: "gbpjpy" },
  ],

  // Monatliche Prognosen für ALLE Top Assets
  monthlyForecast: ALL_ASSETS.filter(a =>
    ["XAUUSD", "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "US500", "DE40", "SOLUSD", "XRPUSD", "XAGUSD"].includes(a.symbol)
  ),
};


// ═══════════════════════════════════════════════════════════════
// PAGE COUNT PROJECTION
// ═══════════════════════════════════════════════════════════════

export const SEO_PROJECTION = {
  month1: 642,
  month3: 1296,
  month6: 2277,
  month12: 4239,
  withTranslations: 10000,
  monthlyCost: 0.18,
  totalCostYear1: 2.16 + 0.08, // $2.24 total
};
