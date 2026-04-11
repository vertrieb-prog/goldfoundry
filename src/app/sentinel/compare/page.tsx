'use client';

export default function ComparePage() {
  const comparisonRows = [
    {
      problem: 'News protection',
      mql5Solution: 'Standalone news filter EA',
      mql5Cost: '$50-150',
      phantomSolution: 'News Shield (included)',
      phantomCost: '$39',
    },
    {
      problem: 'Trailing stop',
      mql5Solution: 'SL manager EA',
      mql5Cost: '$50-200',
      phantomSolution: 'Trail Pro (included)',
      phantomCost: '$49',
    },
    {
      problem: 'Risk management',
      mql5Solution: 'Risk EA + manual rules',
      mql5Cost: '$100-300',
      phantomSolution: 'Guardian (FTMO presets)',
      phantomCost: '$49',
    },
    {
      problem: 'Trade filtering',
      mql5Solution: 'Nothing / manual review',
      mql5Cost: 'N/A',
      phantomSolution: 'Airbag (41 checks)',
      phantomCost: '$99',
    },
    {
      problem: 'Auto-trading',
      mql5Solution: '$500-1500 gold EA',
      mql5Cost: '$500-1500',
      phantomSolution: 'DSS (13 strategies)',
      phantomCost: '$199',
    },
    {
      problem: 'Trade copying',
      mql5Solution: 'Trade copier subscription',
      mql5Cost: '$50-200/mo',
      phantomSolution: 'Copier (one-time)',
      phantomCost: '$79',
    },
  ];

  const advantages = [
    {
      label: 'One developer, one ecosystem',
      text: 'All tools designed to work together. Same UI logic, same settings structure, shared data layer. Guardian knows about News Shield\'s schedule. Trail Pro respects Guardian\'s risk limits. No conflicts, no overlap.',
    },
    {
      label: 'Transparent decisions',
      text: 'Every trade decision is logged with full reasoning. You can read exactly why a trade was filtered, modified, or closed. Competitors are black boxes that say "trust me."',
    },
    {
      label: 'Base + upgrade path',
      text: 'Start with offline base versions that work without any server connection. Add the intelligence layer when you\'re ready. No forced subscriptions, no vendor lock-in.',
    },
    {
      label: 'Prop firm first',
      text: 'Every single tool has FTMO, MFF, and E8 compliance built in. Daily loss limits, max drawdown protection, lot size caps, news avoidance. Not an afterthought -- the core design principle.',
    },
    {
      label: 'Real pricing',
      text: 'One-time purchases. Not $99/month subscriptions that quietly drain your trading account while you\'re trying to pass a challenge. Buy once, use forever.',
    },
  ];

  const testimonials = [
    {
      text: '"Switched from 5 separate EAs to PHANTOM Suite. Saved $180/month in subscriptions and my EAs finally stopped fighting each other."',
      author: 'Verified PHANTOM user',
    },
    {
      text: '"Passed my FTMO challenge on the second attempt after adding Guardian + News Shield. The daily loss protection alone is worth it."',
      author: 'Verified PHANTOM user',
    },
    {
      text: '"The fact that I can see WHY every trade was filtered or closed makes all the difference. No more guessing what my EA is doing."',
      author: 'Verified PHANTOM user',
    },
  ];

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      {/* Nav bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid #222222',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <a
          href="/sentinel"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: 15,
            color: '#f5f5f5',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}
        >
          PHANTOM<span style={{ color: '#d4af37' }}>.</span>
        </a>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a
            href="/sentinel/blog"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: '#888888',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#f5f5f5'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#888888'; }}
          >
            Blog
          </a>
          <a
            href="/sentinel#trial"
            style={{
              padding: '7px 16px',
              background: '#d4af37',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: 999,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#f4cf47';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#d4af37';
            }}
          >
            Start Free Trial
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '100px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 999,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#d4af37',
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
              marginBottom: 24,
            }}
          >
            Comparison
          </div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(32px, 5vw, 52px)',
              lineHeight: 1.1,
              color: '#f5f5f5',
              letterSpacing: '-0.03em',
              marginBottom: 20,
            }}
          >
            Stop buying 10 EAs that don&apos;t<br />
            <span style={{ color: '#d4af37' }}>talk to each other.</span>
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 17,
              color: '#888888',
              maxWidth: 600,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Most traders have 3-7 EAs that overlap, conflict, and don&apos;t share data.
            They spend $2,000-5,000 on individual tools that don&apos;t work together.
            There&apos;s a better way.
          </p>
        </div>

        {/* Comparison Table */}
        <div
          style={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 80,
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.5fr 0.7fr 1.5fr 0.7fr',
              gap: 0,
              padding: '16px 24px',
              background: 'rgba(212,175,55,0.05)',
              borderBottom: '1px solid #222222',
            }}
          >
            {['Problem', 'Typical MQL5', 'Cost', 'PHANTOM Suite', 'Cost'].map((h) => (
              <div
                key={h}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: '#d4af37',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {comparisonRows.map((row, i) => (
            <div
              key={row.problem}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.5fr 0.7fr 1.5fr 0.7fr',
                gap: 0,
                padding: '14px 24px',
                borderBottom: i < comparisonRows.length - 1 ? '1px solid rgba(34,34,34,0.5)' : 'none',
                alignItems: 'center',
              }}
            >
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#f5f5f5', fontWeight: 600 }}>
                {row.problem}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#888888' }}>
                {row.mql5Solution}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#ff6b6b' }}>
                {row.mql5Cost}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#cccccc' }}>
                {row.phantomSolution}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
                {row.phantomCost}
              </div>
            </div>
          ))}

          {/* Total row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.5fr 0.7fr 1.5fr 0.7fr',
              gap: 0,
              padding: '18px 24px',
              background: 'rgba(212,175,55,0.05)',
              borderTop: '2px solid #d4af37',
            }}
          >
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#f5f5f5', fontWeight: 800 }}>
              Total
            </div>
            <div />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#ff6b6b', fontWeight: 700 }}>
              $750-2350
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#d4af37', fontWeight: 700 }}>
              Full PHANTOM Suite
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: '#4ade80', fontWeight: 800 }}>
              $515 once
            </div>
          </div>
        </div>

        {/* Mobile table note */}
        <style>{`
          @media (max-width: 700px) {
            [data-comparison-table] {
              overflow-x: auto;
            }
          }
        `}</style>

        {/* Advantages */}
        <div style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(24px, 4vw, 36px)',
              color: '#f5f5f5',
              letterSpacing: '-0.02em',
              marginBottom: 40,
              textAlign: 'center',
            }}
          >
            Why a suite wins
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {advantages.map((adv, i) => (
              <div
                key={adv.label}
                style={{
                  display: 'flex',
                  gap: 20,
                  padding: '24px',
                  background: '#111111',
                  border: '1px solid #222222',
                  borderRadius: 10,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: '#d4af37',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: '#f5f5f5',
                      marginBottom: 6,
                    }}
                  >
                    {adv.label}
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#888888', lineHeight: 1.7 }}>
                    {adv.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div style={{ marginBottom: 80, textAlign: 'center' }}>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: '#d4af37',
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
              marginBottom: 32,
            }}
          >
            Join 500+ traders using PHANTOM
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: '24px',
                  background: '#111111',
                  border: '1px solid #222222',
                  borderRadius: 10,
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    color: '#cccccc',
                    lineHeight: 1.7,
                    marginBottom: 16,
                    fontStyle: 'italic',
                  }}
                >
                  {t.text}
                </p>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: '#888888',
                  }}
                >
                  -- {t.author}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            textAlign: 'center',
            padding: '48px 32px',
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 12,
          }}
        >
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 24,
              color: '#f5f5f5',
              marginBottom: 8,
            }}
          >
            Save $1,000+ and get tools that actually work together.
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: '#888888',
              marginBottom: 28,
            }}
          >
            14-day free trial. No credit card required.
          </p>
          <a
            href="/sentinel#trial"
            style={{
              display: 'inline-block',
              padding: '14px 40px',
              background: '#d4af37',
              color: '#0a0a0a',
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#f4cf47';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(212,175,55,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#d4af37';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </div>
  );
}
