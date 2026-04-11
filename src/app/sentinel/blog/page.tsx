'use client';

const blogPosts = [
  {
    slug: 'why-phantom-suite',
    title: 'Why a Trading Suite Beats 10 Individual EAs',
    excerpt: 'EA fragmentation costs traders thousands. Three EAs fighting over the same position is not a strategy -- it is chaos.',
    readTime: '5 min',
    date: 'Apr 8, 2026',
    tag: 'Strategy',
  },
  {
    slug: 'prop-firm-survival-guide',
    title: 'The Prop Firm Survival Guide -- How to Pass FTMO with Automated Risk Management',
    excerpt: '80-90% of prop firm challenges fail. The number one reason is not bad strategy. It is bad risk management.',
    readTime: '6 min',
    date: 'Apr 4, 2026',
    tag: 'Prop Firms',
  },
  {
    slug: 'ai-trade-filtering-explained',
    title: 'How Trade Filtering Actually Works -- No Black Boxes, No BS',
    excerpt: '90% of "smart EAs" on MQL5 are indicators repackaged with buzzwords. Here is what real filtering looks like.',
    readTime: '5 min',
    date: 'Mar 28, 2026',
    tag: 'Technology',
  },
  {
    slug: 'trailing-stop-science',
    title: 'The Science of Trailing Stops -- Why Stepped ATR Beats Everything Else',
    excerpt: 'Standard trailing stops get stopped out on every retrace. Here is the math behind a better approach.',
    readTime: '4 min',
    date: 'Mar 21, 2026',
    tag: 'Education',
  },
  {
    slug: 'copy-trading-done-right',
    title: 'Copy Trading Done Right -- No $200/Month Subscription Required',
    excerpt: 'Why are you paying $50-200 per month to copy trades? One-time purchase, same features, no recurring drain.',
    readTime: '4 min',
    date: 'Mar 14, 2026',
    tag: 'Products',
  },
  {
    slug: 'news-trading-protection',
    title: 'News Events Destroy Accounts -- Here is How to Protect Yourself Automatically',
    excerpt: 'NFP, FOMC, CPI. Three-letter events that move markets $20-50 in seconds. Here is how to survive them.',
    readTime: '4 min',
    date: 'Mar 7, 2026',
    tag: 'Risk Management',
  },
];

export default function BlogIndexPage() {
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
            href="/sentinel/compare"
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
            Compare
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

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
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
              marginBottom: 20,
            }}
          >
            PHANTOM Blog
          </div>
          <h1
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(28px, 5vw, 42px)',
              color: '#f5f5f5',
              letterSpacing: '-0.03em',
              marginBottom: 12,
            }}
          >
            Trading insights from the PHANTOM team
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              color: '#888888',
              maxWidth: 500,
              lineHeight: 1.7,
            }}
          >
            No fluff. No paid promotions. Just practical knowledge for MT5 traders who want to trade smarter.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {blogPosts.map((post) => (
            <a
              key={post.slug}
              href={`/sentinel/blog/${post.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '28px 24px',
                background: '#111111',
                border: '1px solid #222222',
                borderRadius: 12,
                textDecoration: 'none',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#d4af37';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#222222';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  background: 'rgba(212,175,55,0.08)',
                  borderRadius: 999,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: '#d4af37',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 16,
                  alignSelf: 'flex-start',
                }}
              >
                {post.tag}
              </div>
              <h2
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: '#f5f5f5',
                  lineHeight: 1.35,
                  marginBottom: 12,
                }}
              >
                {post.title}
              </h2>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: '#888888',
                  lineHeight: 1.6,
                  flex: 1,
                  marginBottom: 20,
                }}
              >
                {post.excerpt}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: '#666666',
                }}
              >
                <span>{post.date}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#444444' }} />
                <span>{post.readTime} read</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
