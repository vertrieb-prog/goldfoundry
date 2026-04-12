'use client'

export interface PerformanceData {
  symbol: string
  metrics: { label: string; value: string }[]
  trades?: string
  footer?: string
}

interface PerformanceCardsProps {
  title?: string
  subtitle?: string
  eyebrow?: string
  data: PerformanceData[]
  dateRange?: string
  disclaimer?: string
}

export default function PerformanceCards({
  title = 'Performance Data',
  subtitle,
  eyebrow = 'VALIDATION',
  data,
  dateRange,
  disclaimer = 'Validation data from internal testing. Real-world results depend on broker, market conditions, and configuration. Past performance is not indicative of future results.',
}: PerformanceCardsProps) {
  return (
    <section
      style={{
        padding: '80px 24px',
        background: '#0a0a0a',
        borderTop: '1px solid #222222',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
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
          {eyebrow}
        </div>
        <h2
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(28px, 4vw, 40px)',
            color: '#f5f5f5',
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              color: '#888888',
              margin: '0 0 48px',
            }}
          >
            {subtitle}
          </p>
        )}
        {!subtitle && <div style={{ marginBottom: 48 }} />}

        <div
          className="perf-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
        >
          {data.map((card, i) => (
            <div
              key={i}
              style={{
                background: '#111111',
                border: '1px solid #222222',
                borderRadius: 16,
                padding: '28px 24px',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#222222')}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#d4af37',
                  marginBottom: 20,
                  letterSpacing: '0.05em',
                }}
              >
                {card.symbol}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {card.metrics.map((m, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: '#888888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {m.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#f5f5f5',
                      }}
                    >
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
              {(card.footer || card.trades) && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: '1px solid #1a1a1a',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: '#888888',
                  }}
                >
                  {card.footer ? card.footer : `${card.trades} total trades`}
                </div>
              )}
            </div>
          ))}
        </div>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            color: '#444444',
            marginTop: 32,
            lineHeight: 1.6,
          }}
        >
          {dateRange ? `Based on data from ${dateRange}. ` : ''}{disclaimer}
        </p>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .perf-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
