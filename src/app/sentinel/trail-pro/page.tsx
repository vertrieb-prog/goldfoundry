'use client'

import ProductPageLayout from '../components/ProductPageLayout'
import type { ProductPageData } from '../components/ProductPageLayout'

const data: ProductPageData = {
  slug: 'trail-pro',
  name: 'Trail Pro',
  tagline: '4 steps. Not continuous. Not symmetric. Not yours to worry about.',
  description:
    'Replaces the continuous trailing stop that keeps tagging you out at break-even. Trail Pro moves in ATR-sized jumps with a cooldown between jumps. BE is entry + small buffer (not exact entry, because noise). Default 30/30/40 partial close schedule.',
  basePrice: '$49',
  aiPrice: '+$19/mo',
  problem:
    'XAUUSD BUY, +$500 on the screen. You set a 20-pip trailing stop. A 12-pip wick during the London/NY handoff tags it. +$50 closed. The trade runs another 300 pips without you, and you watch it on a different account. Continuous trailing stops are too tight or too loose — never the right number.',
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
    'Works best in trends. In a ranging Asia session, a fixed wider SL might outperform. Know your market.',
    'Stepped means SL jumps in chunks. That\'s intentional. If you want continuous trailing, MT5 already has that built in.',
    'The BE buffer means you can still lose a few pips at "break-even". That\'s the tradeoff for not getting wicked out.',
    'Partial closes shrink your position. The runner rides with less size and more room — by design.',
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
  performanceEyebrow: 'VALIDATION',
  performanceTitle: 'Trailing Stop Analysis',
  performanceSubtitle: 'Measured improvement of Trail Pro stepped trailing vs a standard continuous trail on the same signals.',
  performanceData: [
    {
      symbol: 'XAUUSD',
      metrics: [
        { label: 'Avg Extra Profit vs Std Trail', value: '$340' },
        { label: 'Premature Stops Avoided', value: '12' },
        { label: 'Partial Closes Triggered', value: '45' },
      ],
    },
    {
      symbol: 'EURUSD',
      metrics: [
        { label: 'Avg Extra Profit vs Std Trail', value: '$125' },
        { label: 'Premature Stops Avoided', value: '18' },
        { label: 'Partial Closes Triggered', value: '32' },
      ],
    },
    {
      symbol: 'US30',
      metrics: [
        { label: 'Avg Extra Profit vs Std Trail', value: '$280' },
        { label: 'Premature Stops Avoided', value: '9' },
        { label: 'Partial Closes Triggered', value: '27' },
      ],
    },
  ],
}

export default function TrailProPage() {
  return <ProductPageLayout data={data} />
}
