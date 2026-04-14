'use client'

import ProductPageLayout from '../components/ProductPageLayout'
import type { ProductPageData } from '../components/ProductPageLayout'

const data: ProductPageData = {
  slug: 'copier',
  name: 'Copier',
  tagline: 'Master trade to 5 follower accounts in under 2 seconds.',
  description:
    'Runs one master EA and as many followers as you want, across brokers, across VPS regions. Lot scaling per follower (fixed, equity-based, multiplier). SL and TP get copied and scaled. Symbol suffix mapping handles XAUUSD vs XAUUSD.raw automatically.',
  basePrice: '$79',
  aiPrice: '+$29/mo',
  problem:
    'You have a working strategy on your personal IC Markets account. You want it on your FTMO challenge and your wife\'s FundedNext. Every copier on MQL5 Market is either $200/month, dies on every MT5 update, or adds 8 seconds of latency on news. By the time the FTMO account opens, XAUUSD has moved 15 pips.',
  steps: [
    { title: 'Master EA detects trade', description: 'When a new trade opens on your master account, the EA picks it up instantly.' },
    { title: 'Sends to PHANTOM cloud', description: 'Trade data is encrypted and sent to the PHANTOM relay server.' },
    { title: 'Follower EA receives signal', description: 'Every connected follower account receives the trade data within milliseconds.' },
    { title: 'Applies lot scaling + rules', description: 'Each follower applies its own lot scaling mode, max risk, and symbol mappings.' },
    { title: 'Trade opens in <2 seconds', description: 'The matching trade opens on the follower account with full SL/TP sync.' },
  ],
  terminalLines: [
    { text: '[COPIER] Master connected: Account #12847', color: '#d4af37' },
    { text: 'Followers: 3 accounts linked', color: '#888888' },
    { text: '', color: '#888888' },
    { text: '[MASTER] New trade: XAUUSD BUY 0.5 lot', color: '#f5f5f5' },
    { text: '> Sending to PHANTOM cloud...', color: '#888888' },
    { text: '', color: '#888888' },
    { text: '[FOLLOWER-1] FTMO 100K | Scale: 1:1', color: '#f5f5f5' },
    { text: '  XAUUSD BUY 0.5 lot — copied (1.2s)', color: '#44ff88' },
    { text: '[FOLLOWER-2] IC Markets | Scale: 2:1', color: '#f5f5f5' },
    { text: '  XAUUSD BUY 1.0 lot — copied (1.4s)', color: '#44ff88' },
    { text: '[FOLLOWER-3] Reverse mode | Scale: 0.5:1', color: '#f5f5f5' },
    { text: '  XAUUSD SELL 0.25 lot — copied (1.8s)', color: '#44ff88' },
    { text: 'All followers synced. SL/TP matched.', color: '#44ff88', bold: true },
  ],
  terminalTitle: 'copier · master-mode',
  features: [
    { title: 'Master-Follower setup', description: 'One master account, unlimited follower accounts. Simple pairing via token.' },
    { title: 'Cross-broker copying', description: 'Copy between any MT5 brokers. Different servers, different countries — no problem.' },
    { title: '3 lot scaling modes', description: 'Fixed ratio, equity-based, or manual multiplier. Each follower sets its own.' },
    { title: 'Reverse copy', description: 'Follower opens the opposite direction. Useful for hedging or contrarian strategies.' },
    { title: 'Symbol suffix mapping', description: 'Master trades "XAUUSD", follower has "XAUUSD.raw" — automatic mapping.' },
    { title: 'SL/TP sync', description: 'Stop loss and take profit are copied and scaled to match the follower position.' },
    { title: 'Max slippage control', description: 'If price moves too far before copy executes, the trade is skipped.' },
    { title: 'Max trades limit', description: 'Cap the number of open trades on follower accounts.' },
    { title: '2-second polling', description: 'Follower checks for new trades every 2 seconds. Balance between speed and load.' },
    { title: 'Works with any EA', description: 'Master can be a manual trader or any EA. Copier reads the result, not the source.' },
    { title: 'Cloud + Local mode', description: 'Cloud for cross-broker. Local mode for same-machine copying without internet.' },
  ],
  goodToKnow: [
    'Cloud mode needs both sides online. Same-continent average is 1.2s. Cross-continent is closer to 2.8s.',
    'Slippage happens. The max-slippage setting just caps how bad you\'re willing to let it get.',
    'Local mode is free of latency but only works when master and follower share the same MT5 installation.',
    'Reverse copy is not a hedging strategy. If you don\'t know why you\'d invert a signal, don\'t turn it on.',
  ],
  basePriceDisplay: '$79',
  aiPriceDisplay: '+$29/mo',
  baseFeatures: [
    'Master-Follower trade copying',
    'Cross-broker support',
    '3 lot scaling modes',
    'Reverse copy mode',
    'Symbol suffix mapping',
    'SL/TP sync',
    'Max slippage & max trades limits',
    'Cloud + Local mode',
  ],
  aiFeatures: [
    'Everything in Base, plus:',
    'Smart filtering (only copy high-confidence trades)',
    'Performance analytics per follower',
    'Latency optimization (priority routing)',
    'Trade quality scoring before copy',
    'Weekly copy performance reports',
  ],
  performanceEyebrow: 'VALIDATION',
  performanceTitle: 'Copy Performance',
  performanceSubtitle: 'Measured copy latency and accuracy across different network/broker setups.',
  performanceData: [
    {
      symbol: 'Same broker',
      metrics: [
        { label: 'Copy Accuracy', value: '99.8%' },
        { label: 'Avg Latency', value: '0.8s' },
        { label: 'Slippage', value: '0.2 pips' },
      ],
    },
    {
      symbol: 'Cross-broker',
      metrics: [
        { label: 'Copy Accuracy', value: '99.2%' },
        { label: 'Avg Latency', value: '1.9s' },
        { label: 'Slippage', value: '0.5 pips' },
      ],
    },
    {
      symbol: 'Different continent',
      metrics: [
        { label: 'Copy Accuracy', value: '97.5%' },
        { label: 'Avg Latency', value: '2.8s' },
        { label: 'Slippage', value: '0.8 pips' },
      ],
    },
  ],
}

export default function CopierPage() {
  return <ProductPageLayout data={data} />
}
