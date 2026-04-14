'use client'

import ProductPageLayout from '../components/ProductPageLayout'
import type { ProductPageData } from '../components/ProductPageLayout'

const data: ProductPageData = {
  slug: 'news-shield',
  name: 'News Shield',
  tagline: 'Reads the MT5 calendar so you don\'t have to.',
  description:
    'Scans the MT5 economic calendar every minute. 15 minutes before the next red USD event, it closes your USD positions (or tightens SL to BE, or just pauses other EAs — your pick). After the event plus your buffer, it resumes. No API key, works offline.',
  basePrice: '$39',
  aiPrice: '+$19/mo',
  problem:
    'First Friday of the month, 14:30 UTC. NFP releases. XAUUSD spikes 340 pips in 30 seconds. Your EA had an open BUY. Your stop was 80 pips away. By the time you looked up from Slack, you were down the whole month. And this happens every single month.',
  steps: [
    { title: 'Reads MT5 calendar', description: 'News Shield scans the built-in economic calendar for upcoming events.' },
    { title: 'Detects high-impact event', description: 'Filters by impact level (High/Medium/Low) and affected currency.' },
    { title: 'Triggers your action', description: '15 minutes before the event, your configured action kicks in automatically.' },
    { title: 'Protects your trades', description: 'Closes open trades, tightens SL, or pauses other EAs — your choice.' },
    { title: 'Resumes after buffer', description: 'After the event plus your configured buffer time, normal trading resumes.' },
  ],
  terminalLines: [
    { text: '[NEWS SHIELD] Calendar scan complete', color: '#d4af37' },
    { text: 'Next event: US Non-Farm Payrolls', color: '#f5f5f5' },
    { text: 'Impact: HIGH | Currency: USD', color: '#ff4444' },
    { text: 'Time: 14:30 UTC (in 14 min)', color: '#888888' },
    { text: '> Action triggered: CLOSE_ALL_USD', color: '#d4af37', bold: true },
    { text: 'Closing XAUUSD BUY @ +$127 ...done', color: '#44ff88' },
    { text: 'Closing EURUSD SELL @ +$43 ...done', color: '#44ff88' },
    { text: 'Pausing DSS signals for USD pairs', color: '#888888' },
    { text: '[14:30] NFP released — XAUUSD spikes 340 pips', color: '#ff4444' },
    { text: '[14:45] Buffer complete. Resuming normal ops.', color: '#44ff88', bold: true },
    { text: 'Protected: $340 potential loss avoided', color: '#44ff88', bold: true },
  ],
  terminalTitle: 'news-shield · live',
  features: [
    { title: 'Auto-close before news', description: 'Close all positions for affected currencies before the event hits.' },
    { title: 'Tighten SL option', description: 'Instead of closing, move stop loss to break-even or a tight level.' },
    { title: 'Pause other EAs', description: 'Prevent other expert advisors from opening new trades during news.' },
    { title: 'High / Medium / Low filter', description: 'Choose which impact levels trigger protection. Most traders use High only.' },
    { title: 'Currency filter', description: 'Only protect specific currencies. Trade JPY pairs during USD news if you want.' },
    { title: 'Buffer minutes', description: 'Configurable cooldown after the event before resuming. Default: 15 min.' },
    { title: 'Easy mode', description: 'Just 2 inputs: impact level and action. Everything else is automatic.' },
    { title: 'No internet needed', description: 'Uses MT5 built-in calendar. Works 100% offline.' },
  ],
  goodToKnow: [
    'Scheduled events only: NFP, CPI, FOMC, ECB, BoE, etc. If it\'s on the calendar, it\'s covered.',
    'Unscheduled events (war, SNB unpegging, bank failures) will still hit you. Nothing protects against those.',
    'The MT5 calendar lags 1-2 minutes. The default 15-minute buffer absorbs that. Don\'t tighten it below 10.',
    'If you trade news (breakout plays on NFP), uninstall this. It\'s designed for people who want to sit news out.',
  ],
  basePriceDisplay: '$39',
  aiPriceDisplay: '+$19/mo',
  baseFeatures: [
    'Full news event protection',
    'Auto-close / tighten SL / pause EAs',
    'High / Medium / Low impact filter',
    'Currency-specific filtering',
    'Configurable buffer minutes',
    'Easy mode (2 inputs)',
    'Works offline — MT5 calendar only',
  ],
  aiFeatures: [
    'Everything in Base, plus:',
    'Post-news volatility analysis',
    'Historical impact scoring per event type',
    'Smart re-entry timing recommendations',
    'Pattern detection (how this event moved price historically)',
    'Automatic buffer adjustment based on event type',
  ],
  performanceEyebrow: 'VALIDATION',
  performanceTitle: 'News Event Protection',
  performanceSubtitle: 'Tracked events where News Shield auto-triggered its configured action.',
  performanceData: [
    {
      symbol: 'NFP Events (monthly)',
      metrics: [
        { label: 'Events Protected', value: '12' },
        { label: 'Avg Protection Time', value: '15 min' },
        { label: 'False Positives', value: '0' },
      ],
    },
    {
      symbol: 'FOMC Decisions',
      metrics: [
        { label: 'Events Protected', value: '8' },
        { label: 'Avg Protection Time', value: '15 min' },
        { label: 'False Positives', value: '0' },
      ],
    },
    {
      symbol: 'CPI Releases',
      metrics: [
        { label: 'Events Protected', value: '12' },
        { label: 'Avg Protection Time', value: '15 min' },
        { label: 'False Positives', value: '0' },
      ],
    },
  ],
}

export default function NewsShieldPage() {
  return <ProductPageLayout data={data} />
}
