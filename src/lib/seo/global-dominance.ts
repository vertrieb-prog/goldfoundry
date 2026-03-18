// ═══════════════════════════════════════════════════════════════
// GOLD FOUNDRY — GLOBAL DOMINANCE ENGINE
// Influencer Tracker, 40+ Languages, Regional SEO
// ═══════════════════════════════════════════════════════════════

// ── Influencer Database ─────────────────────────────────────

export const INFLUENCERS = {
  gold_forex: [
    { handle: "PeterSchiff", name: "Peter Schiff", platform: "twitter", focus: "Gold Bull, Macro", followers: "1M+" },
    { handle: "jimrickards", name: "Jim Rickards", platform: "twitter", focus: "Gold, Dollar Collapse", followers: "300K+" },
    { handle: "GoldTelegraph", name: "Gold Telegraph", platform: "twitter", focus: "Gold News, Charts", followers: "500K+" },
    { handle: "Schuldensuehner", name: "Holger Zschäpitz", platform: "twitter", focus: "Gold, Macro, DE", followers: "200K+" },
    { handle: "KitcoNewsNow", name: "Kitco News", platform: "twitter", focus: "Gold Prices, Interviews", followers: "400K+" },
    { handle: "ForexLive", name: "Forex Live", platform: "twitter", focus: "Forex News, Analysis", followers: "300K+" },
    { handle: "FXStreetNews", name: "FXStreet", platform: "twitter", focus: "Forex, Crypto News", followers: "500K+" },
  ],
  crypto: [
    { handle: "saylor", name: "Michael Saylor", platform: "twitter", focus: "Bitcoin Maximalist", followers: "3M+" },
    { handle: "VitalikButerin", name: "Vitalik Buterin", platform: "twitter", focus: "Ethereum, DeFi", followers: "5M+" },
    { handle: "AltcoinDailyio", name: "Altcoin Daily", platform: "youtube", focus: "Crypto News", followers: "1.3M+" },
    { handle: "BenjaminCowen", name: "Benjamin Cowen", platform: "youtube", focus: "Crypto Quant Analysis", followers: "800K+" },
    { handle: "PlanB", name: "PlanB", platform: "twitter", focus: "Bitcoin S2F Model", followers: "1.9M+" },
    { handle: "APompliano", name: "Anthony Pompliano", platform: "twitter", focus: "Bitcoin, Investing", followers: "1.6M+" },
  ],
  macro: [
    { handle: "RayDalio", name: "Ray Dalio", platform: "twitter", focus: "Macro, Diversification", followers: "3M+" },
    { handle: "CathieDWood", name: "Cathie Wood", platform: "twitter", focus: "Innovation, ARK", followers: "1.5M+" },
    { handle: "elerianm", name: "Mohamed El-Erian", platform: "twitter", focus: "Macro Economics", followers: "500K+" },
  ],
  retail: [
    { handle: "theICT", name: "ICT (Inner Circle Trader)", platform: "youtube", focus: "Smart Money, Forex", followers: "1.5M+" },
    { handle: "Rayner_Teo", name: "Rayner Teo", platform: "youtube", focus: "Price Action, Education", followers: "1M+" },
  ],
  german: [
    { handle: "FINANZFLUSSde", name: "Finanzfluss", platform: "youtube", focus: "Finanzen, Investieren DE", followers: "1.3M+" },
    { handle: "aktienmitkopf", name: "Aktien mit Kopf", platform: "youtube", focus: "Aktien, Trading DE", followers: "500K+" },
    { handle: "MissionMoney", name: "Mission Money", platform: "youtube", focus: "Investing DE", followers: "400K+" },
  ],
};

// ── Prognose Prompt ─────────────────────────────────────────

export const PROGNOSE_PROMPT = `Du bist der Prognose-Analyst für Gold Foundry. Fasse die Meinungen von Influencern und Analysten zusammen.

KRITISCHE REGELN:
1. IMMER Risikohinweis: "Dies sind Meinungen Dritter, keine Anlageberatung."
2. NIEMALS eine eigene Prognose abgeben
3. NUR zusammenfassen was andere gesagt haben
4. Quelle IMMER nennen (Name + Handle)
5. Beide Seiten zeigen — Bullish UND Bearish
6. Sachlich, neutral, datengetrieben
7. NIEMALS zum Kauf/Verkauf auffordern`;

// ── News Sources ────────────────────────────────────────────

export const NEWS_SOURCES = [
  { url: "https://www.kitco.com/news/gold", asset: "gold", name: "Kitco" },
  { url: "https://www.fxstreet.com/currencies/xauusd", asset: "gold", name: "FXStreet" },
  { url: "https://www.forexlive.com/gold", asset: "gold", name: "ForexLive" },
  { url: "https://www.forexlive.com", asset: "forex", name: "ForexLive" },
  { url: "https://www.fxstreet.com", asset: "forex", name: "FXStreet" },
  { url: "https://www.coindesk.com", asset: "crypto", name: "CoinDesk" },
  { url: "https://cointelegraph.com", asset: "crypto", name: "CoinTelegraph" },
  { url: "https://decrypt.co", asset: "crypto", name: "Decrypt" },
];

// ── Prognose Page Generator ─────────────────────────────────

export function generatePrognosePageTypes(): Array<{ asset: string; slug: string; frequency: string }> {
  const pages: Array<{ asset: string; slug: string; frequency: string }> = [];
  const date = new Date().toISOString().split("T")[0];
  const month = new Date().toLocaleString("de-DE", { month: "long", year: "numeric" });

  for (const asset of ["gold", "bitcoin", "ethereum", "eurusd", "sp500"]) {
    pages.push({ asset, slug: `${asset}-prognose-heute-${date}`, frequency: "daily" });
  }
  const weekNum = Math.ceil((new Date().getDate()) / 7);
  for (const asset of ["gold", "bitcoin", "forex", "crypto"]) {
    pages.push({ asset, slug: `${asset}-wochenruckblick-kw${weekNum}`, frequency: "weekly" });
  }
  for (const asset of ["gold", "bitcoin", "ethereum", "eurusd", "sp500", "dax", "solana", "xrp"]) {
    pages.push({ asset, slug: `${asset}-prognose-${month.toLowerCase().replace(/\s+/g, "-")}`, frequency: "monthly" });
  }
  return pages;
}

// ── 40+ Languages ───────────────────────────────────────────

export const ALL_LANGUAGES = [
  { code: "en", name: "English", native: "English", region: "Global", priority: 1 },
  { code: "de", name: "German", native: "Deutsch", region: "DACH", priority: 1 },
  { code: "ar", name: "Arabic", native: "العربية", region: "MENA", priority: 1, rtl: true },
  { code: "tr", name: "Turkish", native: "Türkçe", region: "Turkey", priority: 1 },
  { code: "es", name: "Spanish", native: "Español", region: "LATAM+Spain", priority: 1 },
  { code: "pt", name: "Portuguese", native: "Português", region: "Brazil+Portugal", priority: 1 },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", region: "Indonesia", priority: 1 },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", region: "Malaysia", priority: 1 },
  { code: "fr", name: "French", native: "Français", region: "France+Africa", priority: 2 },
  { code: "ru", name: "Russian", native: "Русский", region: "Russia+CIS", priority: 2 },
  { code: "hi", name: "Hindi", native: "हिन्दी", region: "India", priority: 2 },
  { code: "zh", name: "Chinese", native: "中文", region: "China", priority: 2 },
  { code: "ja", name: "Japanese", native: "日本語", region: "Japan", priority: 2 },
  { code: "ko", name: "Korean", native: "한국어", region: "Korea", priority: 2 },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", region: "Vietnam", priority: 2 },
  { code: "th", name: "Thai", native: "ภาษาไทย", region: "Thailand", priority: 2 },
  { code: "pl", name: "Polish", native: "Polski", region: "Poland", priority: 2 },
  { code: "nl", name: "Dutch", native: "Nederlands", region: "Netherlands", priority: 2 },
  { code: "it", name: "Italian", native: "Italiano", region: "Italy", priority: 3 },
  { code: "sv", name: "Swedish", native: "Svenska", region: "Sweden", priority: 3 },
  { code: "el", name: "Greek", native: "Ελληνικά", region: "Greece+Cyprus", priority: 3 },
  { code: "ro", name: "Romanian", native: "Română", region: "Romania", priority: 3 },
  { code: "uk", name: "Ukrainian", native: "Українська", region: "Ukraine", priority: 3 },
  { code: "cs", name: "Czech", native: "Čeština", region: "Czech Republic", priority: 3 },
  { code: "hu", name: "Hungarian", native: "Magyar", region: "Hungary", priority: 3 },
  { code: "bg", name: "Bulgarian", native: "Български", region: "Bulgaria", priority: 3 },
  { code: "bn", name: "Bengali", native: "বাংলা", region: "Bangladesh+India", priority: 4 },
  { code: "ur", name: "Urdu", native: "اردو", region: "Pakistan", priority: 4, rtl: true },
  { code: "fa", name: "Persian", native: "فارسی", region: "Iran", priority: 4, rtl: true },
  { code: "sw", name: "Swahili", native: "Kiswahili", region: "East Africa", priority: 4 },
  { code: "tl", name: "Filipino", native: "Filipino", region: "Philippines", priority: 4 },
  { code: "he", name: "Hebrew", native: "עברית", region: "Israel", priority: 4, rtl: true },
];

// ── Risk Disclaimers (all languages) ────────────────────────

export const RISK_DISCLAIMERS: Record<string, string> = {
  de: "Risikohinweis: Vergangene Performance ist kein verlässlicher Indikator für zukünftige Ergebnisse. Trading birgt erhebliche Verlustrisiken. Gold Foundry ist kein Broker und bietet keine Anlageberatung.",
  en: "Risk Disclaimer: Past performance is not indicative of future results. Trading involves substantial risk of loss. Gold Foundry is not a broker and does not provide investment advice.",
  ar: "تحذير من المخاطر: الأداء السابق لا يشير إلى النتائج المستقبلية. ينطوي التداول على مخاطر كبيرة للخسارة.",
  tr: "Risk Uyarısı: Geçmiş performans gelecekteki sonuçların güvenilir bir göstergesi değildir. Alım satım önemli kayıp riskleri taşır.",
  es: "Advertencia de riesgo: El rendimiento pasado no es un indicador fiable de resultados futuros. El trading conlleva un riesgo significativo de pérdida.",
  pt: "Aviso de risco: O desempenho passado não é um indicador confiável de resultados futuros. A negociação envolve risco substancial de perda.",
  fr: "Avertissement de risque: Les performances passées ne sont pas un indicateur fiable des résultats futurs. Le trading comporte des risques importants de perte.",
  ru: "Предупреждение о рисках: Прошлые результаты не являются надежным индикатором будущих результатов. Торговля сопряжена с существенным риском потерь.",
  hi: "जोखिम चेतावनी: पिछला प्रदर्शन भविष्य के परिणामों का विश्वसनीय संकेतक नहीं है। ट्रेडिंग में नुकसान का पर्याप्त जोखिम शामिल है।",
  zh: "风险提示：过去的表现并不代表未来的结果。交易涉及重大亏损风险。",
  ja: "リスク警告：過去のパフォーマンスは将来の結果を保証するものではありません。取引には大きな損失リスクが伴います。",
  ko: "위험 경고: 과거 실적이 미래 결과를 보장하지 않습니다. 거래에는 상당한 손실 위험이 수반됩니다.",
  id: "Peringatan Risiko: Kinerja masa lalu bukan indikator yang dapat diandalkan untuk hasil di masa depan.",
  vi: "Cảnh báo rủi ro: Hiệu suất trong quá khứ không phải là chỉ báo đáng tin cậy cho kết quả trong tương lai.",
  th: "คำเตือนความเสี่ยง: ผลการดำเนินงานในอดีตไม่ได้เป็นตัวบ่งชี้ที่เชื่อถือได้สำหรับผลลัพธ์ในอนาคต",
  pl: "Ostrzeżenie o ryzyku: Wyniki z przeszłości nie są wiarygodnym wskaźnikiem przyszłych wyników.",
  nl: "Risicowaarschuwing: In het verleden behaalde resultaten bieden geen garantie voor de toekomst.",
};

// ── Regional Keywords ───────────────────────────────────────

export const REGIONAL_KEYWORDS: Record<string, string[]> = {
  "de": ["Gold Trading Deutschland", "Forex Broker Deutschland", "Prop Firm Deutschland", "Copy Trading Deutschland"],
  "at": ["Forex Trading Österreich", "Prop Firm Österreich", "Trading Steuer Österreich"],
  "ch": ["Forex Trading Schweiz", "Trading Steuer Schweiz", "Broker Schweiz"],
  "ng": ["Best Gold Copier Nigeria", "Forex Trading Nigeria", "Prop Firm Nigeria"],
  "za": ["Gold Trading South Africa", "Best Forex Broker South Africa"],
  "ae": ["Gold Trading Dubai", "Forex Broker UAE", "Best Trading Platform UAE"],
  "tr": ["Altın Trading Türkiye", "En iyi Forex Broker Türkiye"],
  "id": ["Trading Emas Indonesia", "Broker Forex Indonesia", "Copy Trading Indonesia"],
  "my": ["Gold Trading Malaysia", "Best Forex Broker Malaysia"],
  "in": ["Gold Trading India", "Best Forex Broker India", "Copy Trading India"],
  "br": ["Trading de Ouro Brasil", "Melhor Broker Forex Brasil"],
  "ru": ["Торговля золотом", "Лучший Форекс брокер", "Копитрейдинг золото"],
  "kr": ["금 거래 한국", "최고의 외환 브로커", "카피 트레이딩"],
  "jp": ["金取引 日本", "ベストFXブローカー", "コピートレーディング"],
  "cn": ["黄金交易", "最佳外汇经纪商", "跟单交易"],
};

// ── Dominance Numbers ───────────────────────────────────────

export const DOMINANCE_NUMBERS = {
  year1Pages: 12000,
  year2Pages: 25000,
  languages: 40,
  assets: 45,
  countries: 30,
};
