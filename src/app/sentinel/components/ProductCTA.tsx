'use client'

import MQL5Buttons from './MQL5Buttons'
import type { SentinelSlug } from '../_data/mql5-links'

export default function ProductCTA({ slug }: { slug: SentinelSlug }) {
  return (
    <section
      style={{
        padding: '80px 24px',
        background: '#0a0a0a',
        borderTop: '1px solid #222222',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: '#f5f5f5',
            margin: '0 0 16px',
            letterSpacing: '-0.02em',
          }}
        >
          Get it on MQL5 Market
        </h2>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            color: '#888888',
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Instant activation via your MQL5 account. Choose MT5 or MT4.
        </p>

        <MQL5Buttons slug={slug} variant="primary" size="lg" />

        <div style={{ marginTop: 28 }}>
          <a
            href="/sentinel#trial"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 22px',
              background: 'transparent',
              border: '1px solid rgba(212,175,55,0.25)',
              color: '#d4af37',
              fontWeight: 500,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: 10,
              textDecoration: 'none',
              transition: 'all 0.25s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(212,175,55,0.06)'
              el.style.borderColor = 'rgba(212,175,55,0.5)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.borderColor = 'rgba(212,175,55,0.25)'
            }}
          >
            Or try free on goldfoundry →
          </a>
        </div>
      </div>
    </section>
  )
}
