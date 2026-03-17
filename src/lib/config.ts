// ═══════════════════════════════════════════════════════════════
// src/lib/config.ts — ZENTRALE KONFIGURATION
// Jedes Modul importiert von hier. Keine hardcoded Werte mehr.
// ═══════════════════════════════════════════════════════════════

// ── Models ──────────────────────────────────────────────────
export const MODELS = {
  fast: "claude-haiku-4-5-20251001",     // Crons, Parser, Trade Manager, SEO
  smart: "claude-sonnet-4-20250514",     // Mentor Chat, Strategy, Complex Analysis
} as const;

// ── Pricing ─────────────────────────────────────────────────
export const PRICING = {
  plans: {
    copier:    { name: "Smart Copier",     price: 29,  firstMonth: 6,  discount: 80 },
    starter:   { name: "Signal Starter",   price: 49,  firstMonth: 10, discount: 80 },
    pro:       { name: "Signal Pro",       price: 79,  firstMonth: 16, discount: 80 },
    unlimited: { name: "Signal Unlimited", price: 149, firstMonth: 30, discount: 80 },
    partner:   { name: "Partner",          price: 29,  firstMonth: 6,  discount: 80 },
  },
  currency: "€",
  profitSplit: { investor: 60, platform: 40 },
  firstMonthDiscount: 80,
} as const;

// ── Partner/Affiliate Tiers ─────────────────────────────────
export const PARTNER_TIERS = {
  bronze:  { name: "Bronze",  minPartners: 1,  l1: 30, l2: 0,  l3: 0 },
  silber:  { name: "Silber",  minPartners: 5,  l1: 35, l2: 10, l3: 0 },
  gold:    { name: "Gold",    minPartners: 15, l1: 40, l2: 12, l3: 5 },
  diamond: { name: "Diamond", minPartners: 50, l1: 50, l2: 15, l3: 8 },
} as const;

// ── Broker Models ───────────────────────────────────────────
export const BROKERS = {
  tag:    { name: "Tag Markets",     leverage: 12, dd: 10, ddType: "Fixed",    minDeposit: 500,  currency: "€" },
  tegas:  { name: "Tegas FX",       leverage: 24, dd: 5,  ddType: "Trailing", minDeposit: 200,  currency: "€" },
  standard: { name: "Standard Broker", leverage: 1,  dd: 100, ddType: "None",  minDeposit: 100,  currency: "€" },
} as const;

// ── Tier Limits (Messages/Month) ────────────────────────────
export const TIER_LIMITS = {
  free:   { messages: 5,   model: MODELS.fast,  label: "Free" },
  copier: { messages: 100, model: MODELS.smart, label: "Copier" },
  pro:    { messages: 300, model: MODELS.smart, label: "Pro" },
} as const;

// ── Risk Engine Thresholds ──────────────────────────────────
export const RISK_THRESHOLDS = {
  tag: {
    ddPause: 5,
    ddReduceLots: 7,
    ddKillSwitch: 2,
    maxDailyLoss: 2,
    maxOpenTrades: 4,
  },
  tegas: {
    ddPause: 3,
    ddReduceLots: 4,
    ddKillSwitch: 1.5,
    maxDailyLoss: 1,
    maxOpenTrades: 2,
    newsBlockMinutes: 30,
  },
  standard: {
    ddPause: 25,
    ddReduceLots: 35,
    ddKillSwitch: 10,
    maxDailyLoss: 5,
    maxOpenTrades: 10,
  },
} as const;

// ── MetaApi Costs ───────────────────────────────────────────
export const METAAPI_COSTS = {
  deployedAccount: 8.64,
  addAccount: 2.10,
} as const;

// ── SEO Config ──────────────────────────────────────────────
export const SEO_CONFIG = {
  baseUrl: "https://goldfoundry.de",
  defaultLocale: "de",
  tier1Locales: ["de", "en", "ar", "tr", "es", "pt", "id", "ms"],
  tier2Locales: ["fr", "ru", "hi", "zh", "ja", "ko", "vi", "th", "pl", "nl"],
  maxAutoLinksPerPage: 10,
  maxSameKeywordLinks: 1,
  dailyNewsAssets: ["XAUUSD", "BTCUSD", "EURUSD", "US500"],
  weeklyNewsAssets: ["ETHUSD", "GBPUSD", "USDJPY", "DE40", "SOLUSD", "XRPUSD"],
} as const;

// ── Risk Disclaimer (ALL languages) ────────────────────────
export const RISK_DISCLAIMER: Record<string, string> = {
  de: "Risikohinweis: Vergangene Performance ist kein verlässlicher Indikator für zukünftige Ergebnisse. Trading birgt erhebliche Verlustrisiken. Gold Foundry ist kein Broker und bietet keine Anlageberatung.",
  en: "Risk Disclaimer: Past performance is not indicative of future results. Trading involves substantial risk of loss. Gold Foundry is not a broker and does not provide investment advice.",
  ar: "تحذير من المخاطر: الأداء السابق لا يشير إلى النتائج المستقبلية. ينطوي التداول على مخاطر كبيرة للخسارة. Gold Foundry ليست وسيطًا ولا تقدم نصائح استثمارية.",
  tr: "Risk Uyarısı: Geçmiş performans gelecekteki sonuçların güvenilir bir göstergesi değildir. Alım satım önemli kayıp riskleri taşır. Gold Foundry bir broker değildir ve yatırım tavsiyesi vermez.",
  es: "Advertencia de riesgo: El rendimiento pasado no es un indicador fiable de resultados futuros. El trading conlleva un riesgo significativo de pérdida.",
  pt: "Aviso de risco: O desempenho passado não é um indicador confiável de resultados futuros. A negociação envolve risco substancial de perda.",
  fr: "Avertissement: Les performances passées ne sont pas un indicateur fiable des résultats futurs. Le trading comporte des risques importants de perte.",
  ru: "Предупреждение о рисках: Прошлые результаты не являются надежным индикатором будущих результатов. Торговля сопряжена с существенным риском потерь.",
  hi: "जोखिम चेतावनी: पिछला प्रदर्शन भविष्य के परिणामों का विश्वसनीय संकेतक नहीं है। ट्रेडिंग में नुकसान का पर्याप्त जोखिम शामिल है।",
  zh: "风险提示：过去的表现并不代表未来的结果。交易涉及重大亏损风险。",
  ja: "リスク警告：過去のパフォーマンスは将来の結果を保証するものではありません。取引には大きな損失リスクが伴います。",
  ko: "위험 경고: 과거 실적이 미래 결과를 보장하지 않습니다. 거래에는 상당한 손실 위험이 수반됩니다.",
  id: "Peringatan Risiko: Kinerja masa lalu bukan indikator yang dapat diandalkan untuk hasil di masa depan. Trading melibatkan risiko kerugian yang substansial.",
  vi: "Cảnh báo rủi ro: Hiệu suất trong quá khứ không phải là chỉ báo đáng tin cậy cho kết quả trong tương lai.",
  th: "คำเตือนความเสี่ยง: ผลการดำเนินงานในอดีตไม่ได้เป็นตัวบ่งชี้ที่เชื่อถือได้สำหรับผลลัพธ์ในอนาคต",
  pl: "Ostrzeżenie o ryzyku: Wyniki z przeszłości nie są wiarygodnym wskaźnikiem przyszłych wyników.",
  nl: "Risicowaarschuwing: In het verleden behaalde resultaten bieden geen garantie voor de toekomst.",
  ms: "Amaran Risiko: Prestasi masa lalu bukan petunjuk yang boleh dipercayai untuk hasil masa depan.",
};

// ── NAMING RULES (no AI/Claude mentions) ────────────────────
export const PRODUCT_NAMES = {
  copier: "Smart Copier",
  signals: "FORGE Signal Suite",
  shield: "Risk Shield",
  mentor: "FORGE Mentor",
  manager: "Trade Manager",
  riskEngine: "7-Faktor Risk Engine",
  platform: "Gold Foundry",
  agent: "FORGE Agent",
} as const;

// ── MetaAPI Config (für Scripts) ────────────────────────────
export function loadMetaApiConfig() {
  const token = process.env.METAAPI_TOKEN;
  const accountId = process.env.METAAPI_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error("METAAPI_TOKEN und METAAPI_ACCOUNT_ID müssen in .env.local gesetzt sein");
  }
  return { token, accountId };
}
