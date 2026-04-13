'use client'

import { mql5Url, type SentinelSlug } from '../_data/mql5-links'

interface MQL5ButtonsProps {
  slug: SentinelSlug
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outline' | 'primary'
}

export default function MQL5Buttons({ slug, size = 'md', variant = 'outline' }: MQL5ButtonsProps) {
  const pad =
    size === 'sm' ? '10px 20px' : size === 'lg' ? '16px 28px' : '14px 24px'
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 14 : 13

  const isPrimary = variant === 'primary'

  const baseStyle: React.CSSProperties = isPrimary
    ? {
        background: '#d4af37',
        border: '1px solid #d4af37',
        color: '#0a0a0a',
        fontWeight: 700,
        boxShadow: '0 4px 20px rgba(212,175,55,0.15)',
      }
    : {
        background: 'transparent',
        border: '1px solid rgba(212,175,55,0.35)',
        color: '#d4af37',
        fontWeight: 600,
      }

  const btn = (platform: 'mt5' | 'mt4', label: string) => (
    <a
      key={platform}
      href={mql5Url(slug, platform)}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: pad,
        fontSize,
        fontFamily: "'JetBrains Mono', monospace",
        borderRadius: 12,
        textDecoration: 'none',
        transition: 'all 0.25s',
        letterSpacing: '0.01em',
        ...baseStyle,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        if (isPrimary) {
          el.style.background = '#f4cf47'
          el.style.borderColor = '#f4cf47'
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = '0 12px 40px rgba(212,175,55,0.35)'
        } else {
          el.style.background = 'rgba(212,175,55,0.08)'
          el.style.borderColor = 'rgba(212,175,55,0.6)'
          el.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        if (isPrimary) {
          el.style.background = '#d4af37'
          el.style.borderColor = '#d4af37'
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = '0 4px 20px rgba(212,175,55,0.15)'
        } else {
          el.style.background = 'transparent'
          el.style.borderColor = 'rgba(212,175,55,0.35)'
          el.style.transform = 'translateY(0)'
        }
      }}
    >
      <span style={{ fontSize: 10, opacity: isPrimary ? 0.6 : 0.7 }}>MQL5</span>
      Buy on MQL5 ({label})
    </a>
  )

  return (
    <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {btn('mt5', 'MT5')}
      {btn('mt4', 'MT4')}
    </div>
  )
}
