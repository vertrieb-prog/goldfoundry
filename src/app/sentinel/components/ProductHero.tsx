'use client'

import MQL5Buttons from './MQL5Buttons'
import MQL5TrustBadge from './MQL5TrustBadge'
import type { SentinelSlug } from '../_data/mql5-links'

interface ProductHeroProps {
  slug: SentinelSlug
  name: string
  tagline: string
  description: string
  basePrice: string
  aiPrice: string
}

export default function ProductHero({ slug, name, tagline, description, basePrice, aiPrice }: ProductHeroProps) {
  return (
    <section
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        background: '#0a0a0a',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 120,
        paddingBottom: 80,
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />
      {/* Glow orb */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Back link */}
        <a
          href="/sentinel"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: '#888888',
            textDecoration: 'none',
            marginBottom: 32,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#d4af37')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#888888')}
        >
          ← Back to Suite Overview
        </a>

        {/* MQL5 Trust Badge */}
        <MQL5TrustBadge />

        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#d4af37',
            marginBottom: 20,
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
          PHANTOM SENTINEL
        </div>

        {/* Product name */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(36px, 5vw, 64px)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#f5f5f5',
            margin: '0 0 12px',
          }}
        >
          {name}
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            fontWeight: 500,
            color: '#d4af37',
            margin: '0 0 24px',
            lineHeight: 1.3,
          }}
        >
          {tagline}
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: '#888888',
            marginBottom: 32,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {description}
        </p>

        {/* Price badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 40,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: '#f5f5f5',
              background: '#111111',
              border: '1px solid #222222',
              borderRadius: 8,
              padding: '8px 16px',
            }}
          >
            Base: {basePrice}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: '#d4af37',
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 8,
              padding: '8px 16px',
            }}
          >
            + AI Upgrade: {aiPrice}
          </div>
        </div>

        {/* Primary CTA — MQL5 Buy Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <MQL5Buttons slug={slug} variant="primary" size="lg" />
        </div>

        {/* Secondary CTA — Trial */}
        <div style={{ marginTop: 18 }}>
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
