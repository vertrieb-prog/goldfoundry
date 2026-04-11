'use client'

export interface Step {
  title: string
  description: string
}

export interface TerminalLine {
  text: string
  color: string
  bold?: boolean
}

interface HowItWorksAnimatedProps {
  steps: Step[]
  terminalLines: TerminalLine[]
  terminalTitle?: string
}

export default function HowItWorksAnimated({
  steps,
  terminalLines,
  terminalTitle = 'phantom-sentinel · live',
}: HowItWorksAnimatedProps) {
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
          HOW IT WORKS
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
          Step by step
        </h2>

        <div
          className="hiw-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 48,
            alignItems: 'start',
          }}
        >
          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 20,
                  opacity: 0,
                  animation: 'hiwFadeInUp 0.5s ease-out forwards',
                  animationDelay: `${i * 0.3}s`,
                  padding: '20px 0',
                  borderBottom: i < steps.length - 1 ? '1px solid #1a1a1a' : 'none',
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#d4af37',
                    minWidth: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(212,175,55,0.3)',
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#f5f5f5',
                      marginBottom: 4,
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 14,
                      color: '#888888',
                      lineHeight: 1.6,
                    }}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Terminal visualization */}
          <div className="hiw-terminal">
            <div
              style={{
                background: '#111111',
                border: '1px solid #222222',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 120px rgba(212,175,55,0.03)',
              }}
            >
              {/* Terminal bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid #222222',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbb00' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#44ff88' }} />
                <span
                  style={{
                    marginLeft: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: '#444444',
                  }}
                >
                  {terminalTitle}
                </span>
              </div>

              {/* Terminal content */}
              <div style={{ padding: '24px 20px', minHeight: 240 }}>
                {terminalLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: line.color,
                      fontWeight: line.bold ? 600 : 400,
                      opacity: 0,
                      animation: 'terminalFadeIn 0.3s ease-out forwards',
                      animationDelay: `${0.5 + i * 0.2}s`,
                    }}
                  >
                    {line.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes hiwFadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes terminalFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 900px) {
          .hiw-grid {
            grid-template-columns: 1fr !important;
          }
          .hiw-terminal {
            order: -1;
          }
        }
      `}</style>
    </section>
  )
}
