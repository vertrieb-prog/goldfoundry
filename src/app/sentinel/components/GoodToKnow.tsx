'use client'

interface GoodToKnowProps {
  items: string[]
}

export default function GoodToKnow({ items }: GoodToKnowProps) {
  return (
    <section
      style={{
        padding: '80px 24px',
        background: '#0a0a0a',
        borderTop: '1px solid #222222',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#888888',
            marginBottom: 12,
          }}
        >
          GOOD TO KNOW
        </div>
        <h2
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(24px, 3vw, 32px)',
            color: '#f5f5f5',
            margin: '0 0 32px',
            letterSpacing: '-0.02em',
          }}
        >
          Transparency builds trust
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '16px 20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1a1a1a',
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: '#d4af37',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                →
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 15,
                  color: '#888888',
                  lineHeight: 1.6,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
