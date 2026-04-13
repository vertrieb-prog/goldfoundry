// Single-source-of-truth for MQL5 Market product IDs.
// All 28 listings (14 products x MT5 + MT4). Public URL format:
//   https://www.mql5.com/en/market/product/{ID}

export type Platform = 'mt5' | 'mt4'

export type SentinelSlug =
  | 'guardian'
  | 'news-shield'
  | 'trail-pro'
  | 'airbag'
  | 'dss'
  | 'copier'
  | 'lot-calc'
  | 'close-all'
  | 'spread-monitor'
  | 'session-timer'
  | 'trade-journal'
  | 'equity-guard'
  | 'margin-alert'
  | 'break-even'

export const MQL5_IDS: Record<SentinelSlug, { mt5: number; mt4: number }> = {
  guardian:         { mt5: 172901, mt4: 172902 },
  'news-shield':    { mt5: 172904, mt4: 172906 },
  'trail-pro':      { mt5: 172908, mt4: 172909 },
  airbag:           { mt5: 172910, mt4: 172911 },
  dss:              { mt5: 172912, mt4: 172913 },
  copier:           { mt5: 172914, mt4: 172915 },
  'lot-calc':       { mt5: 172916, mt4: 172918 },
  'close-all':      { mt5: 172919, mt4: 172920 },
  'spread-monitor': { mt5: 172921, mt4: 172922 },
  'session-timer':  { mt5: 172923, mt4: 172924 },
  'trade-journal':  { mt5: 172925, mt4: 172926 },
  'equity-guard':   { mt5: 172927, mt4: 172929 },
  'margin-alert':   { mt5: 172930, mt4: 172931 },
  'break-even':     { mt5: 172932, mt4: 172933 },
}

export const MQL5_SELLER_URL = 'https://www.mql5.com/en/users/goldfoundry/seller'

export const MQL5_TOTAL_LISTINGS = Object.keys(MQL5_IDS).length * 2 // 28

export function mql5Url(slug: SentinelSlug, platform: Platform): string {
  const ids = MQL5_IDS[slug]
  if (!ids) throw new Error(`Unknown MQL5 slug: ${slug}`)
  return `https://www.mql5.com/en/market/product/${ids[platform]}`
}
