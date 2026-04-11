'use client'

interface ProblemSectionProps {
  problem: string
}

export default function ProblemSection({ problem }: ProblemSectionProps) {
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
            color: '#ff4444',
            marginBottom: 20,
          }}
        >
          THE PROBLEM
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(20px, 3vw, 28px)',
            fontWeight: 600,
            lineHeight: 1.5,
            color: '#f5f5f5',
            margin: 0,
          }}
        >
          {problem}
        </p>
      </div>
    </section>
  )
}
