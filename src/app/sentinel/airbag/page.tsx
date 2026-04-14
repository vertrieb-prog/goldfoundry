'use client'

import ProductPageLayout from '../components/ProductPageLayout'
import type { ProductPageData } from '../components/ProductPageLayout'

const data: ProductPageData = {
  slug: 'airbag',
  name: 'Airbag',
  tagline: 'Catches bad trades your EA shouldn\'t have taken.',
  description:
    'Airbag sits between your existing EA and the broker. Before OrderSend completes, it runs 41 checks on context: spread vs 14d average, session winrate, correlation with open trades, minutes to red news, daily drawdown state. Wrong context, order cancelled. Right context, order through in under 500ms.',
  basePrice: '$99',
  aiPrice: '+$29/mo',
    problem:
    'You paid $1,500 for GoldMaster v3 on MQL5. Three green months. Then one Wednesday at 14:28 it opens XAUUSD BUY 0.5 lot, spread is 4.2 because CPI is two minutes out, and five minutes later you\'re down $1,800. The EA didn\'t know about the news. The dev who sold it to you assumed you\'d handle news yourself.',
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
    { title: 'Push alerts', description: 'Real-time MT5 push notifications for every ALLOW, SKIP, and MODIFY decision.' },
  ],
  goodToKnow: [
    'Full 41-check pipeline needs internet (about 450ms median). Offline, 15 local checks still run.',
    'Fails open. If the cloud is unreachable, trades go through — I\'d rather let a bad one pass than lock you out of exits.',
    'This reduces the worst trades. It does not turn a losing EA into a winner. If your EA has a real edge problem, Airbag won\'t fix it.',
    'Run Paper Mode for week one. It logs what it would have blocked without blocking anything. Check the CSV, then flip to live.',
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
    'Push alerts',
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
