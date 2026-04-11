'use client';

import { useRouter } from 'next/navigation';

interface RelatedArticle {
  title: string;
  slug: string;
  readTime: string;
}

interface BlogPostLayoutProps {
  title: string;
  date: string;
  readTime: string;
  children: React.ReactNode;
  relatedArticles: RelatedArticle[];
}

export default function BlogPostLayout({
  title,
  date,
  readTime,
  children,
  relatedArticles,
}: BlogPostLayoutProps) {
  const router = useRouter();

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      {/* Top bar */}
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
        <button
          onClick={() => router.push('/sentinel/blog')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            color: '#888888',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#d4af37';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#888888';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Blog
        </button>
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
      </div>

      {/* Article */}
      <article
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '100px 24px 64px',
        }}
      >
        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: '#888888',
          }}
        >
          <span>{date}</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d4af37' }} />
          <span>{readTime} read</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(28px, 5vw, 42px)',
            lineHeight: 1.15,
            color: '#f5f5f5',
            letterSpacing: '-0.03em',
            marginBottom: 48,
          }}
        >
          {title}
        </h1>

        {/* Body */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            lineHeight: 1.8,
            color: '#cccccc',
          }}
        >
          {children}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 64,
            padding: '40px 32px',
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: '#f5f5f5',
              marginBottom: 8,
            }}
          >
            Ready to try PHANTOM?
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: '#888888',
              marginBottom: 24,
            }}
          >
            Start your 14-day free trial. No credit card required.
          </p>
          <a
            href="/sentinel#trial"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
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

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <h3
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: '#f5f5f5',
                marginBottom: 24,
              }}
            >
              Related Articles
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {relatedArticles.map((article) => (
                <a
                  key={article.slug}
                  href={`/sentinel/blog/${article.slug}`}
                  style={{
                    display: 'block',
                    padding: '20px',
                    background: '#111111',
                    border: '1px solid #222222',
                    borderRadius: 10,
                    textDecoration: 'none',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#d4af37';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#222222';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#f5f5f5',
                      lineHeight: 1.4,
                      marginBottom: 8,
                    }}
                  >
                    {article.title}
                  </p>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: '#888888',
                    }}
                  >
                    {article.readTime} read
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
