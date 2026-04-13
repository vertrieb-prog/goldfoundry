'use client'

import { MQL5_SELLER_URL } from '../_data/mql5-links'

interface MQL5TrustBadgeProps {
  align?: 'center' | 'left'
}

export default function MQL5TrustBadge({ align = 'center' }: MQL5TrustBadgeProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        marginBottom: 24,
      }}
    >
      <a
        href={MQL5_SELLER_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 14px',
          background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: 999,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: '#d4af37',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          transition: 'all 0.25s',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'rgba(212,175,55,0.12)'
          el.style.borderColor = 'rgba(212,175,55,0.5)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'rgba(212,175,55,0.06)'
          el.style.borderColor = 'rgba(212,175,55,0.25)'
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#d4af37',
            boxShadow: '0 0 8px rgba(212,175,55,0.8)',
          }}
        />
        Available on MQL5 Market — MetaQuotes verified
      </a>
    </div>
  )
}
