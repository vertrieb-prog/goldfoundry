'use client'

import ProductPageLayout from '../components/ProductPageLayout'
import type { ProductPageData } from '../components/ProductPageLayout'

const data: ProductPageData = {
  name: 'Trail Pro',
  tagline: 'Stop leaving money on the table.',
  description:
    'Trail Pro replaces your basic trailing stop with a 4-step ATR-based system that locks in profit in stages. Partial closes, break-even with buffer, and symbol-aware defaults — all automatic.',
  basePrice: '$49',
  aiPrice: '+$19/mo',
  problem:
    'You watch a trade go +$500 in profit. Then it retraces. Your trailing stop was too tight. Stopped out at +$50. The trade then goes to +$800 without you. Standard trailing stops are a blunt instrument. They either lock in too little or get hit too early.',
  steps: [
    { title: 'Trade reaches profit threshold', description: 'Trail Pro activates once your trade hits the minimum profit level you set.' },
    { title: 'Break Even with buffer', description: 'SL moves to entry + buffer (not exact entry). Small cushion prevents premature stop-outs.' },
    { title: 'Step 1: SL to entry + ATR', description: 'Stop loss moves to entry plus one ATR step. First real profit lock.' },
    { title: 'Steps 2-3: SL follows in ATR steps', description: 'As price moves further, SL jumps in ATR-calculated increments. Not continuous — by design.' },
    { title: 'Partial close at profit targets', description: 'Lock in 30% at target 1, 30% at target 2, let the rest ride with trailing.' },
  ],
  terminalLines: [
    { text: '[TRAIL PRO] Monitoring XAUUSD BUY', color: '#d4af37' },
    { text: 'Entry: 2847.30 | SL: 2839.50 | TP: none', color: '#f5f5f5' },
    { text: 'ATR(14): 8.2 | Step size: 4.1', color: '#888888' },
    { text: 'Price: 2855.50 (+8.2) → BE triggered', color: '#44ff88' },
    { text: '> SL moved to 2848.50 (entry + 1.2 buffer)', color: '#44ff88' },
    { text: 'Price: 2860.10 (+12.8) → Step 1', color: '#44ff88' },
    { text: '> SL moved to 2851.40 | Partial close: 30%', color: '#d4af37', bold: true },
    { text: 'Price: 2868.30 (+21.0) → Step 2', color: '#44ff88' },
    { text: '> SL moved to 2859.60 | Partial close: 30%', color: '#d4af37', bold: true },
    { text: 'Remaining 40% trailing with 4.1 ATR step', color: '#888888' },
    { text: 'Locked profit: $385 (vs $50 with standard trail)', color: '#44ff88', bold: true },
  ],
  terminalTitle: 'trail-pro · xauusd',
  features: [
    { title: '4-step ATR trailing', description: 'Stop loss moves in calculated ATR-based increments, not continuous ticks.' },
    { title: 'Break even with buffer', description: 'BE is not at exact entry — small buffer prevents noise stop-outs.' },
    { title: 'Minimum SL distance', description: 'SL never gets closer than your minimum distance. Prevents broker rejections.' },
    { title: 'Partial closes', description: 'Lock in profit at configurable targets. 30/30/40 split by default.' },
    { title: 'Cooldown between steps', description: 'Prevents rapid SL movements during volatile spikes.' },
    { title: 'Symbol-aware defaults', description: 'Different ATR multipliers for Gold, Forex, and Indices automatically.' },
    { title: 'Magic number filter', description: 'Only trail specific EAs by magic number. Leave manual trades alone.' },
    { title: 'Easy / Advanced mode', description: 'Easy: pick your symbol, Trail Pro handles the rest. Advanced: full control.' },
  ],
  goodToKnow: [
    'Trail Pro works best in trending markets. In choppy/ranging conditions, stepped trailing may lock less profit than a wider fixed SL.',
    'Stepped trailing means SL jumps (not continuous movement). This is by design — continuous trailing gets stopped out more often.',
    'The buffer at break-even means a small loss is possible at BE level. This trade-off prevents the most common stop-out scenario.',
    'Partial closes reduce total position size. Your remaining trail rides with less volume but more room.',
  ],
  basePriceDisplay: '$49',
  aiPriceDisplay: '+$19/mo',
  baseFeatures: [
    'Full 4-step ATR trailing system',
    'Break even with buffer',
    'Partial closes at configurable targets',
    'Symbol-aware ATR defaults',
    'Minimum SL distance protection',
    'Magic number filter',
    'Easy & Advanced mode',
    'Runs offline — no internet needed',
  ],
  aiFeatures: [
    'Everything in Base, plus:',
    'Context-aware trailing (adjusts to market regime)',
    'Exhaustion detection (tightens trail near reversals)',
    'Optimal TP level suggestions',
    'Volatility regime classification',
    'Historical ATR step optimization per symbol',
  ],
  performanceTitle: 'Performance Data',
  performanceSubtitle: 'Stepped trailing captures 30-50% more profit than standard continuous trailing.',
  performanceData: [
    {
      symbol: 'XAUUSD',
      metrics: [
        { label: 'Profit Factor', value: '1.82' },
        { label: 'Win Rate', value: '61%' },
        { label: 'Max Drawdown', value: '8.3%' },
      ],
      trades: '847',
    },
    {
      symbol: 'EURUSD',
      metrics: [
        { label: 'Profit Factor', value: '1.45' },
        { label: 'Win Rate', value: '58%' },
        { label: 'Max Drawdown', value: '5.1%' },
      ],
      trades: '1,203',
    },
    {
      symbol: 'US30',
      metrics: [
        { label: 'Profit Factor', value: '1.67' },
        { label: 'Win Rate', value: '56%' },
        { label: 'Max Drawdown', value: '9.7%' },
      ],
      trades: '634',
    },
  ],
}

export default function TrailProPage() {
  return <ProductPageLayout data={data} />
}
