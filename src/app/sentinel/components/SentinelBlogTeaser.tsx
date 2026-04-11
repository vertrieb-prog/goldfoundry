'use client'

const posts = [
  { title: "Why a Trading Suite Beats 10 Individual EAs", path: "/sentinel/blog/why-phantom-suite", tag: "Strategy", readTime: "5 min" },
  { title: "The Prop Firm Survival Guide", path: "/sentinel/blog/prop-firm-survival-guide", tag: "Prop Firms", readTime: "6 min" },
  { title: "How AI Trade Filtering Actually Works", path: "/sentinel/blog/ai-trade-filtering-explained", tag: "Technology", readTime: "5 min" },
]

export default function SentinelBlogTeaser() {
  return (
    <section style={{ padding: "80px 24px" }}>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #222222 30%, #222222 70%, transparent)", maxWidth: 1200, margin: "0 auto 64px" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#d4af37", marginBottom: 8 }}>
              Learn
            </div>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(22px, 3vw, 32px)", color: "#f5f5f5", margin: 0, letterSpacing: "-0.02em" }}>
              Trading knowledge that makes a difference.
            </h2>
          </div>
          <a
            href="/sentinel/blog"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#d4af37", textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
          >
            All articles →
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="sentinel-blog-teaser-grid">
          {posts.map((post) => (
            <a
              key={post.path}
              href={post.path}
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 14,
                padding: "28px 24px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "border-color 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#222222"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#d4af37", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 4, padding: "2px 8px" }}>
                  {post.tag}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#444444" }}>
                  {post.readTime}
                </span>
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15, color: "#f5f5f5", lineHeight: 1.4 }}>
                {post.title}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#d4af37", marginTop: "auto" }}>
                Read →
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sentinel-blog-teaser-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
