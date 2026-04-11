'use client'

interface BaseVsAIProps {
  basePrice: string
  aiPrice: string
  baseFeatures: string[]
  aiFeatures: string[]
}

export default function BaseVsAI({ basePrice, aiPrice, baseFeatures, aiFeatures }: BaseVsAIProps) {
  return (
    <section
      style={{
        padding: '80px 24px',
        background: '#0a0a0a',
        borderTop: '1px solid #222222',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#d4af37',
            marginBottom: 12,
          }}
        >
          PRICING
        </div>
        <h2
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: '#f5f5f5',
            margin: '0 0 48px',
            letterSpacing: '-0.02em',
          }}
        >
          Base vs AI Upgrade
        </h2>

        <div
          className="pricing-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
          }}
        >
          {/* Base */}
          <div
            style={{
              background: '#111111',
              border: '1px solid #222222',
              borderRadius: 16,
              padding: '32px 28px',
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#888888',
                marginBottom: 8,
              }}
            >
              BASE
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 36,
                fontWeight: 900,
                color: '#f5f5f5',
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}
            >
              {basePrice}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: '#888888',
                marginBottom: 28,
              }}
            >
              One-time payment
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {baseFeatures.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      color: '#44ff88',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 14,
                      color: '#f5f5f5',
                      lineHeight: 1.5,
                    }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Upgrade */}
          <div
            style={{
              background: 'rgba(212,175,55,0.04)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 16,
              padding: '32px 28px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -1,
                left: 24,
                right: 24,
                height: 2,
                background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
              }}
            />
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: '#d4af37',
                marginBottom: 8,
              }}
            >
              + AI UPGRADE
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 36,
                fontWeight: 900,
                color: '#d4af37',
                marginBottom: 4,
                letterSpacing: '-0.02em',
              }}
            >
              {aiPrice}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: '#888888',
                marginBottom: 28,
              }}
            >
              Monthly subscription
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {aiFeatures.map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      color: '#d4af37',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 14,
                      color: '#f5f5f5',
                      lineHeight: 1.5,
                    }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
