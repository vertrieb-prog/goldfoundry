'use client'

import ProductPageLayout from '../components/ProductPageLayout'
import type { ProductPageData } from '../components/ProductPageLayout'

const data: ProductPageData = {
  name: 'DSS',
  tagline: 'Decision Support System. 13 strategies. One brain.',
  description:
    'DSS analyzes the market continuously with 13 independent strategies, scores setups by confidence, and executes automatically. Auto, Semi-Auto, or Manual — you choose how much control to keep.',
  basePrice: '$199',
  aiPrice: '+$49/mo',
  problem:
    'You spend hours analyzing charts. You miss setups because you are sleeping. You second-guess your entries. Your emotions cost you thousands every year. You need a system that does not sleep, does not doubt, and does not revenge trade.',
  steps: [
    { title: 'Continuous analysis', description: 'DSS runs 13 independent strategies across your configured symbols 24/5.' },
    { title: 'AI Brain evaluates context', description: 'Each setup gets a confidence score based on strategy agreement, market regime, and historical accuracy.' },
    { title: 'Signal generated', description: 'When the score exceeds your threshold, a signal is generated with entry, SL, TP, and confidence.' },
    { title: 'Auto / Semi / Manual execution', description: 'Auto: trades instantly. Semi: sends alert, you confirm. Manual: signal only, you execute.' },
    { title: 'Full trade management', description: 'SL, TP, DCA, and trailing stop are managed automatically after entry.' },
  ],
  terminalLines: [
    { text: '[DSS] Scanning 6 symbols...', color: '#d4af37' },
    { text: 'XAUUSD: 4/13 strategies aligned', color: '#888888' },
    { text: 'EURUSD: 2/13 strategies aligned', color: '#888888' },
    { text: 'US30: 8/13 strategies aligned', color: '#44ff88' },
    { text: '[AI BRAIN] US30 setup evaluation:', color: '#d4af37' },
    { text: '  SMC: bullish | FVG: present', color: '#f5f5f5' },
    { text: '  Volume: confirming | Session: optimal', color: '#f5f5f5' },
    { text: '  Confidence: 82% (threshold: 70%)', color: '#44ff88' },
    { text: '  Kelly size: 1.2 lots ($50K account)', color: '#888888' },
    { text: 'SIGNAL: US30 BUY @ 42,180', color: '#d4af37', bold: true },
    { text: 'SL: 42,050 | TP1: 42,340 | TP2: 42,500', color: '#f5f5f5' },
    { text: '[AUTO] Trade executed. Managing...', color: '#44ff88', bold: true },
  ],
  terminalTitle: 'dss · auto-mode',
  features: [
    { title: '13 strategies', description: 'SMC, FVG, order blocks, liquidity sweeps, divergence, and 8 more — combined for high-confidence setups.' },
    { title: 'Multi-symbol scanning', description: 'Monitor Gold, Forex pairs, and Indices simultaneously.' },
    { title: 'Auto / Semi / Manual modes', description: 'Full automation, confirmation-based, or signal-only. Switch anytime.' },
    { title: 'Kelly Criterion sizing', description: 'Position size calculated by edge and bankroll. No arbitrary lot sizes.' },
    { title: 'Integrated SL / DCA / Trail', description: 'Complete trade management from entry to exit. No extra EAs needed.' },
    { title: 'FTMO compatible', description: 'Respects prop firm drawdown rules. Auto-pauses when approaching limits.' },
    { title: 'Learning from 100K+ trades', description: 'AI model trained on historical trade outcomes. Continuously improving.' },
    { title: 'Telegram control', description: 'Start, stop, switch modes, and confirm trades directly from Telegram.' },
  ],
  goodToKnow: [
    'DSS needs internet for AI-powered analysis and signal generation. Without internet, 5 local strategies still work.',
    'Best with $2,000+ accounts. Smaller accounts limit Kelly Criterion sizing effectiveness.',
    'Start in Manual mode for your first week. Understand the signals before letting DSS trade for you.',
    'DSS is not "set and forget" — monitor the first week actively, then reduce oversight as you build confidence.',
  ],
  basePriceDisplay: '$199',
  aiPriceDisplay: '+$49/mo',
  baseFeatures: [
    '5 local strategies (SMC, divergence, breakout, mean reversion, momentum)',
    'Multi-symbol scanning',
    'Auto / Semi / Manual modes',
    'Integrated SL and TP management',
    'Basic position sizing',
    'Telegram alerts',
    'FTMO-compatible rules',
    'Runs offline for local strategies',
  ],
  aiFeatures: [
    'Everything in Base, plus:',
    'Full 13 AI-powered strategies',
    'AI Brain confidence scoring',
    'Kelly Criterion optimal sizing',
    'DCA and advanced trailing',
    'Live learning from trade outcomes',
    'Monte Carlo risk simulation',
    'Cross-symbol correlation analysis',
  ],
  performanceTitle: 'Performance Data',
  performanceSubtitle: 'DSS generates 15-25 trades per week with 55-65% win rate on Gold.',
  performanceData: [
    {
      symbol: 'XAUUSD',
      metrics: [
        { label: 'Profit Factor', value: '1.94' },
        { label: 'Win Rate', value: '63%' },
        { label: 'Max Drawdown', value: '7.8%' },
      ],
      trades: '1,847',
    },
    {
      symbol: 'EURUSD',
      metrics: [
        { label: 'Profit Factor', value: '1.51' },
        { label: 'Win Rate', value: '57%' },
        { label: 'Max Drawdown', value: '5.4%' },
      ],
      trades: '2,103',
    },
    {
      symbol: 'US30',
      metrics: [
        { label: 'Profit Factor', value: '1.73' },
        { label: 'Win Rate', value: '59%' },
        { label: 'Max Drawdown', value: '9.2%' },
      ],
      trades: '1,234',
    },
  ],
}

export default function DSSPage() {
  return <ProductPageLayout data={data} />
}
