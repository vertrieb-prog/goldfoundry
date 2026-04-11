'use client'

export default function ProductCTA() {
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
          Start your 14-day free trial
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
          No credit card required. Full access to the base version. Cancel anytime.
        </p>
        <a
          href="/sentinel#trial"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 40px',
            background: '#d4af37',
            color: '#0a0a0a',
            fontWeight: 700,
            fontSize: 15,
            fontFamily: "'JetBrains Mono', monospace",
            borderRadius: 12,
            textDecoration: 'none',
            transition: 'all 0.25s',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = '#f4cf47'
            el.style.transform = 'translateY(-2px)'
            el.style.boxShadow = '0 12px 40px rgba(212,175,55,0.3)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = '#d4af37'
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = 'none'
          }}
        >
          Start 14-Day Free Trial →
        </a>
      </div>
    </section>
  )
}
