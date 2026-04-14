'use client'

import ProductPageLayout from '../components/ProductPageLayout'
import type { ProductPageData } from '../components/ProductPageLayout'

const data: ProductPageData = {
  slug: 'airbag',
  name: 'Airbag',
  tagline: '41 checks. Every trade. Under 500ms.',
  description:
    'Airbag intercepts every trade before execution and runs 41 AI-powered checks in real-time. Spread, session, news, volume, correlation — if the context is wrong, the trade does not go through.',
  basePrice: '$99',
  aiPrice: '+$29/mo',
  problem:
    'You paid $1,500 for a Gold EA. It makes money for 3 months. Then it takes one bad trade in the wrong session with high spread during news — and blows 2 weeks of profit in 5 minutes. The EA does not know context. It only knows its strategy.',
  steps: [
    { title: 'Your EA opens a trade', description: 'Any expert advisor sends a trade order to MT5 as normal.' },
    { title: 'Airbag intercepts', description: 'Before execution, Airbag catches the order and holds it for validation.' },
    { title: '41 checks in <500ms', description: 'Spread, session, news, volume, correlation, drawdown, and 35 more checks run instantly.' },
    { title: 'AI Brain validates context', description: 'The AI model evaluates the full market context — not just individual rules.' },
    { title: 'ALLOW / SKIP / MODIFY', description: 'Trade goes through, gets blocked, or gets modified (tighter SL, smaller lot) based on results.' },
  ],
  terminalLines: [
    { text: '[AIRBAG] Intercepting trade...', color: '#d4af37' },
    { text: 'EA: GoldMaster v3 | XAUUSD BUY 0.5', color: '#f5f5f5' },
    { text: 'Running 41 checks...', color: '#888888' },
    { text: '  ✓ Spread: 2.8 (max 3.5)', color: '#44ff88' },
    { text: '  ✓ Session: London/NY overlap', color: '#44ff88' },
    { text: '  ✓ Volume: above average', color: '#44ff88' },
    { text: '  ✓ Correlation: no conflict', color: '#44ff88' },
    { text: '  ✓ Daily loss: 23% of limit', color: '#44ff88' },
    { text: '  ✓ News: clear (next: 4h)', color: '#44ff88' },
    { text: '  ✓ ATR regime: trending', color: '#44ff88' },
    { text: '[AI BRAIN] High confidence setup (87%)', color: '#d4af37', bold: true },
    { text: 'DECISION: ALLOW', color: '#44ff88', bold: true },
    { text: 'Trade executed in 340ms', color: '#888888' },
  ],
  terminalTitle: 'airbag · intercepting',
  features: [
    { title: '41 AI checks', description: 'Spread, session, news, volume, ATR, correlation, drawdown, and 34 more.' },
    { title: 'Works with ANY EA', description: 'Drop Airbag onto any chart. It intercepts trades from any expert advisor.' },
    { title: 'Explainable decisions', description: 'Every SKIP shows exactly which checks failed and why. No black box.' },
    { title: 'Daily loss protection', description: 'Built-in daily loss tracking. Blocks trades when approaching your limit.' },
    { title: 'Natural language config', description: 'Configure rules in plain English: "Skip if spread above 3.5 on Gold".' },
    { title: 'FTMO ready', description: 'Pre-configured to respect prop firm rules. Never breach by accident.' },
    { title: 'Paper mode', description: 'Test Airbag without blocking real trades. See what would have been filtered.' },
    { title: 'Magic number filter', description: 'Only intercept specific EAs. Leave others untouched.' },
    { title: 'Telegram alerts', description: 'Real-time notifications for every ALLOW, SKIP, and MODIFY decision.' },
  ],
  goodToKnow: [
    'Airbag needs internet for the full 41-check AI validation (~500ms per check). Without internet, 15+ local checks still run.',
    'If the connection drops mid-check, Airbag fails safe — trades go through. Protection > blocking everything.',
    'Airbag does not guarantee all bad trades are caught. It significantly reduces low-quality entries, not eliminates them.',
    'Paper mode is recommended for the first week. See what Airbag would filter before letting it block real trades.',
  ],
  basePriceDisplay: '$99',
  aiPriceDisplay: '+$29/mo',
  baseFeatures: [
    '15+ local checks (spread, session, time, drawdown)',
    'Works with any EA',
    'Explainable decisions',
    'Magic number filter',
    'Paper mode for testing',
    'FTMO-compatible rules',
    'Telegram alerts',
    'Runs offline for local checks',
  ],
  aiFeatures: [
    'Everything in Base, plus:',
    'Full 41 AI-powered checks',
    'AI Brain context validation',
    'Correlation analysis across open trades',
    'Community learning (anonymized signal quality data)',
    'Natural language rule configuration',
    'Adaptive thresholds per symbol and session',
  ],
  performanceEyebrow: 'VALIDATION',
  performanceTitle: 'Filter Performance',
  performanceSubtitle: 'How Airbag vetoes bad trades while letting good ones through. Measured on internal test streams.',
  performanceData: [
    {
      symbol: 'XAUUSD',
      metrics: [
        { label: 'Bad Trades Vetoed', value: '23%' },
        { label: 'Winning Trades Preserved', value: '91%' },
        { label: 'Avg Response Time', value: '420ms' },
      ],
    },
    {
      symbol: 'EURUSD',
      metrics: [
        { label: 'Bad Trades Vetoed', value: '28%' },
        { label: 'Winning Trades Preserved', value: '93%' },
        { label: 'Avg Response Time', value: '380ms' },
      ],
    },
    {
      symbol: 'Multi-Symbol',
      metrics: [
        { label: 'Bad Trades Vetoed', value: '25%' },
        { label: 'Winning Trades Preserved', value: '92%' },
        { label: 'Avg Response Time', value: '445ms' },
      ],
    },
  ],
}

export default function AirbagPage() {
  return <ProductPageLayout data={data} />
}
