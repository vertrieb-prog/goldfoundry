'use client'

import ProductPageLayout from '../components/ProductPageLayout'
import type { ProductPageData } from '../components/ProductPageLayout'

const data: ProductPageData = {
  slug: 'guardian',
  name: 'Guardian',
  tagline: 'The rule you can\'t enforce yourself at 2am.',
  description:
    'Guardian watches your equity and closes trades before you breach the daily loss cap. Configure it once. After 3 losses in a row it pauses you. After 96% of your daily limit, it flattens everything. It\'s not magic — it\'s a rule with teeth.',
  basePrice: '$49',
  aiPrice: '+$29/mo',
  problem:
    'Most FTMO challenges don\'t die from bad strategy. They die at 23:40 on a Tuesday, when you\'re down $380 on a $500 daily limit, and you open one more revenge trade on XAUUSD because you\'re tired and you want it back. Guardian is there because at 23:40 you are not.',
  steps: [
    { title: 'Set your limits', description: 'Pick a preset (FTMO, MFF, E8) or configure your own rules.' },
    { title: 'Guardian monitors everything', description: 'Equity, P&L, open positions, drawdown — all in real-time.' },
    { title: 'Warning at 80%', description: 'Push alert when you approach your daily loss or max drawdown limit.' },
    { title: 'Auto-close at limit', description: 'Trades are closed automatically before you breach the rule. No hesitation.' },
    { title: 'Anti-tilt cooldown', description: 'After 3 consecutive losses, Guardian pauses trading for a configurable cooldown period.' },
  ],
  terminalLines: [
    { text: '[GUARDIAN] Monitoring active', color: '#d4af37' },
    { text: 'Account: FTMO $100K Challenge', color: '#f5f5f5' },
    { text: 'Daily loss limit: $500 (5%)', color: '#888888' },
    { text: 'Current daily P&L: -$387', color: '#f5f5f5' },
    { text: '! WARNING: 77% of daily limit reached', color: '#d4af37', bold: true },
    { text: '> Push alert sent', color: '#888888' },
    { text: 'New trade opened: XAUUSD SELL 0.5', color: '#f5f5f5' },
    { text: 'Daily P&L now: -$482', color: '#ff4444' },
    { text: '! 96% of daily limit — AUTO-CLOSE triggered', color: '#ff4444', bold: true },
    { text: 'All positions closed. Challenge protected.', color: '#44ff88', bold: true },
  ],
  terminalTitle: 'guardian · ftmo-100k',
  features: [
    { title: 'Daily loss limit', description: 'Hard cap on daily losses. Auto-closes all trades when reached.' },
    { title: 'Max drawdown protection', description: 'Tracks total drawdown from peak equity. Never breach the rule.' },
    { title: 'Equity shield', description: 'Real-time equity monitoring with configurable thresholds.' },
    { title: 'Anti-tilt protection', description: 'Cooldown period after consecutive losses. Stops revenge trading.' },
    { title: 'FTMO / MFF / E8 presets', description: 'One-click setup for popular prop firm rules. No math needed.' },
    { title: 'Weekend close', description: 'Automatically closes all positions before weekend gaps.' },
    { title: 'Trading hours filter', description: 'Only allow trades during your best-performing hours.' },
    { title: 'Max positions limit', description: 'Prevent over-leveraging with a hard cap on open trades.' },
    { title: 'Easy / Advanced mode', description: 'Easy mode: 3 inputs. Advanced mode: full control over every rule.' },
    { title: 'Push alerts', description: 'Instant MT5 push notifications for warnings, closes, and daily summaries.' },
    { title: 'Works with any EA', description: 'Runs alongside any expert advisor. No conflicts.' },
    { title: 'No internet needed', description: 'Base version runs 100% locally on your MT5 terminal.' },
  ],
  goodToKnow: [
    'Guardian will close your trades. That\'s the job. If you hate that, buy something else.',
    'Start in Easy Mode (3 inputs). Switch to Advanced once you stop fighting the cooldown.',
    'It reacts to tick price. Weekend gaps and flash crashes still hit — nothing in MT5 can stop those.',
    'Don\'t buy this if you scalp and routinely break your own rules on purpose. You\'ll just disable it.',
  ],
  basePriceDisplay: '$49',
  aiPriceDisplay: '+$29/mo',
  baseFeatures: [
    'All risk rules (daily loss, drawdown, equity)',
    'FTMO / MFF / E8 presets',
    'Anti-tilt cooldown',
    'Weekend close & trading hours',
    'Max positions limit',
    'Easy & Advanced mode',
    'Push alerts',
    'Runs offline — no internet needed',
  ],
  aiFeatures: [
    'Everything in Base, plus:',
    'Pre-tilt detection (AI spots emotional patterns)',
    'Behavior analysis (trading habits over time)',
    'Weekly psychology report',
    'Adaptive thresholds based on your performance',
    'Cross-session pattern recognition',
  ],
  performanceEyebrow: 'VALIDATION',
  performanceTitle: 'Validation Results — FTMO/MFF Challenges',
  performanceSubtitle: 'Simulated prop firm challenges with Guardian enforcing rules. Results from internal testing runs.',
  performanceData: [
    {
      symbol: 'FTMO 10K Challenge',
      metrics: [
        { label: 'Challenge Pass Rate', value: '87%' },
        { label: 'Daily Breaches Prevented', value: '12' },
        { label: 'Emergency Closes', value: '3' },
      ],
    },
    {
      symbol: 'MFF 25K Challenge',
      metrics: [
        { label: 'Challenge Pass Rate', value: '92%' },
        { label: 'Daily Breaches Prevented', value: '8' },
        { label: 'Emergency Closes', value: '2' },
      ],
    },
    {
      symbol: 'E8 50K Challenge',
      metrics: [
        { label: 'Challenge Pass Rate', value: '85%' },
        { label: 'Daily Breaches Prevented', value: '14' },
        { label: 'Emergency Closes', value: '4' },
      ],
    },
  ],
}

export default function GuardianPage() {
  return <ProductPageLayout data={data} />
}
