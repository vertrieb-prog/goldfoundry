'use client'

const products = [
  {
    label: "FILTER MODE",
    name: "PHANTOM AIRBAG",
    tagline: "Your EA's AI Safety Net",
    description:
      "Runs alongside any EA you already own. Intercepts every trade signal and validates it through 41 intelligent checks plus Haiku Brain reasoning. Bad trades get vetoed. Your capital is protected.",
    features: [
      "Works with ANY MT5 EA",
      "41 AI checks per signal in under 500ms",
      "Haiku Brain explainable decisions",
      "Daily loss limit + overtrading shield",
      "Natural language config",
      "FTMO & prop firm ready",
    ],
    price: "$49",
    period: "/month",
    next: "Next: $69/mo after 10 sales",
    cta: "Try AIRBAG Free",
    featured: false,
  },
  {
    label: "AGENT MODE",
    name: "PHANTOM TRADER DSS",
    tagline: "The AI Decision Support System",
    description:
      "A standalone AI trader. Full PHANTOM v4 engine generates signals, manages positions, adjusts risk. Learns from 100,000+ real trades daily. Auto, Semi-Auto, or Manual modes.",
    features: [
      "13 integrated trading strategies",
      "SMC + Haiku Brain decision making",
      "Auto / Semi-Auto / Manual modes",
      "Integrated SL/DCA/Trail management",
      "Multi-symbol (XAUUSD, US30, NAS100, EURUSD)",
      "Kelly Criterion position sizing",
    ],
    price: "$199",
    period: " once",
    next: "Lifetime license · Next: $299 after 10 sales",
    cta: "Try DSS Free",
    featured: true,
  },
];

export default function SentinelProducts() {
  return (
    <section
      id="products"
      style={{
        background: "#0a0a0a",
        padding: "100px 24px",
        position: "relative",
      }}
    >
      {/* Section divider */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, #222222 30%, #222222 70%, transparent)",
          maxWidth: 1100,
          margin: "0 auto 80px",
        }}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#d4af37",
              marginBottom: 16,
            }}
          >
            Two Products · One Intelligence
          </div>
          <h2
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontWeight: 900,
              fontSize: "clamp(32px, 4vw, 56px)",
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              margin: "0 0 16px",
            }}
          >
            Choose your weapon.
          </h2>
          <p style={{ fontSize: 16, color: "#888888", maxWidth: 540, margin: "0 auto" }}>
            PHANTOM AIRBAG protects your existing EA. PHANTOM TRADER DSS is the autonomous AI
            trader. Same brain, different mission.
          </p>
        </div>

        {/* Product cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
          className="sentinel-products-grid"
        >
          {products.map((product) => (
            <div
              key={product.name}
              style={{
                background: "#111111",
                border: `1px solid ${product.featured ? "rgba(212,175,55,0.3)" : "#222222"}`,
                borderRadius: 20,
                padding: "36px 32px",
                position: "relative",
                transition: "border-color 0.3s, transform 0.3s, box-shadow 0.3s",
                boxShadow: product.featured
                  ? "0 0 60px rgba(212,175,55,0.06)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(212,175,55,0.4)";
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 16px 60px rgba(212,175,55,0.08)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = product.featured
                  ? "rgba(212,175,55,0.3)"
                  : "#222222";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = product.featured
                  ? "0 0 60px rgba(212,175,55,0.06)"
                  : "none";
              }}
            >
              {/* Label */}
              <div
                style={{
                  display: "inline-block",
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#d4af37",
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.15)",
                  borderRadius: 6,
                  padding: "3px 10px",
                  marginBottom: 20,
                }}
              >
                {product.label}
              </div>

              {/* Name */}
              <h3
                style={{
                  fontFamily: "var(--font-fraunces), serif",
                  fontWeight: 900,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  color: "#f5f5f5",
                  margin: "0 0 4px",
                }}
              >
                {product.name}
              </h3>

              {/* Tagline */}
              <p
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 13,
                  color: "#888888",
                  margin: "0 0 20px",
                }}
              >
                {product.tagline}
              </p>

              {/* Description */}
              <p
                style={{
                  fontSize: 15,
                  color: "#888888",
                  lineHeight: 1.7,
                  margin: "0 0 28px",
                }}
              >
                {product.description}
              </p>

              {/* Feature list */}
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: "#f5f5f5",
                      fontFamily: "var(--font-inter), sans-serif",
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "rgba(68,255,136,0.1)",
                        border: "1px solid rgba(68,255,136,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 9,
                        color: "#44ff88",
                      }}
                    >
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: "#222222",
                  margin: "0 0 24px",
                }}
              />

              {/* Price */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-fraunces), serif",
                      fontWeight: 900,
                      fontSize: 48,
                      color: "#f5f5f5",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {product.price}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 14,
                      color: "#888888",
                    }}
                  >
                    {product.period}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 11,
                    color: "#8a7020",
                    marginTop: 4,
                  }}
                >
                  {product.next}
                </div>
              </div>

              {/* CTA */}
              <a
                href="#trial"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "14px 0",
                  background: "#d4af37",
                  color: "#0a0a0a",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "var(--font-jetbrains), monospace",
                  borderRadius: 12,
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "all 0.25s",
                  letterSpacing: "0.01em",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#f4cf47";
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 8px 30px rgba(212,175,55,0.3)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#d4af37";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                {product.cta}
              </a>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .sentinel-products-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
