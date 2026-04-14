'use client'

import ProductPageLayout from '../components/ProductPageLayout'
import type { ProductPageData } from '../components/ProductPageLayout'

const data: ProductPageData = {
  slug: 'dss',
  name: 'DSS',
  tagline: '13 strategies vote. Majority wins.',
  description:
    'DSS runs 13 independent strategies (SMC, FVG, order blocks, divergence, 9 more) across 6 symbols. When enough of them agree on the same setup, and the market regime lines up, it fires an entry. Auto mode trades it, Semi pings you, Manual just shows the signal.',
  basePrice: '$199',
  aiPrice: '+$49/mo',
    problem:
    'You see a textbook XAUUSD setup at 3am Frankfurt time and you\'re asleep. You see one at 14:30 and you second-guess it until it\'s gone. You journal your best trades and 80% of them are ones you didn\'t take. DSS isn\'t smarter than you — it\'s just awake and unbothered.',
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
    { title: 'Dashboard control', description: 'Start, stop, switch modes, and confirm trades directly from the MT5 dashboard.' },
  ],
  goodToKnow: [
    'Needs internet for the full 13-strategy model. Offline, 5 local strategies still run.',
    'Under $2k accounts starve the Kelly sizing. You\'ll get the same signals but disproportionate risk.',
    'Run Manual for week one. Watch the signals. If you don\'t agree with most of them, don\'t switch to Auto.',
    'Not set-and-forget. Check the log weekly. Broker spread changes at 17:00 NY kill the M15 US30 signals.',
  ],
  basePriceDisplay: '$199',
  aiPriceDisplay: '+$49/mo',
  baseFeatures: [
    '5 local strategies (SMC, divergence, breakout, mean reversion, momentum)',
    'Multi-symbol scanning',
    'Auto / Semi / Manual modes',
    'Integrated SL and TP management',
    'Basic position sizing',
    'Push alerts',
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
  performanceEyebrow: 'BACKTEST',
  performanceTitle: 'Strategy Tester Results',
  performanceSubtitle: 'DSS is an active trading EA. These are MT5 Strategy Tester results from internal runs.',
  performanceData: [
    {
      symbol: 'XAUUSD H1',
      metrics: [
        { label: 'Profit Factor', value: '1.82' },
        { label: 'Win Rate', value: '61%' },
        { label: 'Max Drawdown', value: '8.3%' },
        { label: 'Total Trades', value: '847' },
      ],
    },
    {
      symbol: 'EURUSD H1',
      metrics: [
        { label: 'Profit Factor', value: '1.45' },
        { label: 'Win Rate', value: '58%' },
        { label: 'Max Drawdown', value: '5.1%' },
        { label: 'Total Trades', value: '1,203' },
      ],
    },
    {
      symbol: 'US30 M15',
      metrics: [
        { label: 'Profit Factor', value: '1.67' },
        { label: 'Win Rate', value: '56%' },
        { label: 'Max Drawdown', value: '9.7%' },
        { label: 'Total Trades', value: '634' },
      ],
    },
  ],
}

export default function DSSPage() {
  return <ProductPageLayout data={data} />
}
