'use client'

const products = [
  { name: "Guardian", path: "/sentinel/guardian", tagline: "Prop Firm Risk Manager", price: "$49", badge: "Standalone" },
  { name: "News Shield", path: "/sentinel/news-shield", tagline: "Automatic News Filter", price: "$39", badge: "Standalone" },
  { name: "Trail Pro", path: "/sentinel/trail-pro", tagline: "Smart Trailing Stop", price: "$49", badge: "Standalone" },
  { name: "Airbag", path: "/sentinel/airbag", tagline: "AI Trade Filter", price: "$99", badge: "AI-Powered" },
  { name: "Trader DSS", path: "/sentinel/dss", tagline: "Autonomous AI Trader", price: "$199", badge: "AI-Powered" },
  { name: "Copier", path: "/sentinel/copier", tagline: "Smart Trade Copier", price: "$79", badge: "Cloud" },
]

export default function SentinelProductLinks() {
  return (
    <section style={{ padding: "80px 24px", position: "relative" }}>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #222222 30%, #222222 70%, transparent)", maxWidth: 1200, margin: "0 auto 64px" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#d4af37", marginBottom: 16 }}>
            Deep Dive
          </div>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(24px, 3vw, 40px)", color: "#f5f5f5", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Explore each product in detail.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#888888", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            Animations, performance data, feature breakdowns, and honest limitations for every tool.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="sentinel-product-links-grid">
          {products.map((p) => (
            <a
              key={p.name}
              href={p.path}
              style={{
                background: "#111111",
                border: "1px solid #222222",
                borderRadius: 14,
                padding: "24px 20px",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "border-color 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#222222"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: p.badge === "AI-Powered" ? "#d4af37" : p.badge === "Cloud" ? "#3b82f6" : "#44ff88" }}>
                  {p.badge}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 18, color: "#f5f5f5" }}>
                  {p.price}
                </span>
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, color: "#f5f5f5" }}>
                PHANTOM {p.name}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#888888" }}>
                {p.tagline}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#d4af37", marginTop: 4 }}>
                View details →
              </div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a
            href="/sentinel/compare"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#d4af37", textDecoration: "none", letterSpacing: "0.05em" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
          >
            Compare PHANTOM vs. individual MQL5 EAs →
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sentinel-product-links-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 500px) {
          .sentinel-product-links-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
