'use client'

import { MQL5_SELLER_URL, MQL5_TOTAL_LISTINGS } from '../_data/mql5-links'

export default function MQL5TrustStrip() {
  return (
    <section
      style={{
        background: '#0a0a0a',
        borderTop: '1px solid #1a1a1a',
        borderBottom: '1px solid #1a1a1a',
        padding: '24px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#d4af37',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#d4af37',
              boxShadow: '0 0 8px rgba(212,175,55,0.8)',
              display: 'inline-block',
            }}
          />
          Now Live on MQL5 Market
        </div>

        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: '#f5f5f5',
            fontWeight: 500,
          }}
        >
          <span style={{ color: '#d4af37', fontWeight: 700 }}>{MQL5_TOTAL_LISTINGS} listings</span>{' '}
          <span style={{ color: '#888888' }}>— 14 products across MT5 and MT4, MetaQuotes verified</span>
        </div>

        <a
          href={MQL5_SELLER_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: '#d4af37',
            textDecoration: 'none',
            padding: '6px 14px',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 999,
            transition: 'all 0.25s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(212,175,55,0.08)'
            el.style.borderColor = 'rgba(212,175,55,0.6)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'transparent'
            el.style.borderColor = 'rgba(212,175,55,0.3)'
          }}
        >
          View seller page →
        </a>
      </div>
    </section>
  )
}
