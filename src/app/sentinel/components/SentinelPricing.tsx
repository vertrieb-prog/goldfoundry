'use client'

const products = [
  {
    name: "News Shield",
    price: "$39",
    period: " once",
    tagline: "News protection",
    type: "standalone" as const,
    features: [
      "Auto-close before high-impact news",
      "Tighten SL or pause EAs",
      "Impact level filter",
      "Customizable buffer",
      "No internet needed",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Trail Pro",
    price: "$49",
    period: " once",
    tagline: "Smart trailing stop",
    type: "standalone" as const,
    features: [
      "4-step ATR trailing",
      "Break Even with buffer",
      "Partial profit taking",
      "Min SL distance",
      "No internet needed",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Guardian",
    price: "$49",
    period: " once",
    tagline: "Prop firm compliance",
    type: "standalone" as const,
    features: [
      "Daily loss + drawdown limits",
      "Anti-tilt protection",
      "FTMO / MFF / E8 presets",
      "Weekend close + hours filter",
      "No internet needed",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Airbag",
    price: "$99",
    period: " once",
    tagline: "AI trade filter",
    type: "ai" as const,
    featured: true,
    features: [
      "41 AI checks in <500ms",
      "Haiku Brain decisions",
      "Works with ANY EA",
      "Daily loss protection",
      "FTMO ready",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Trader DSS",
    price: "$199",
    period: " once",
    tagline: "Autonomous AI trader",
    type: "ai" as const,
    features: [
      "13 strategies + Haiku Brain",
      "Auto / Semi / Manual modes",
      "Multi-symbol support",
      "Kelly Criterion sizing",
      "Lifetime updates",
    ],
    cta: "Start Free Trial",
  },
];

export default function SentinelPricing() {
  return (
    <section
      id="pricing"
      style={{
        background: "#0a0a0a",
        padding: "100px 24px",
        position: "relative",
      }}
    >
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, #222222 30%, #222222 70%, transparent)",
          maxWidth: 1200,
          margin: "0 auto 80px",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
            Launch Pricing · One-Time Payment
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
            Early adopters win.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              color: "#888888",
              maxWidth: 540,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            All products are one-time purchases with lifetime updates. 14-day free trial on everything. No subscriptions.
          </p>
        </div>

        {/* 5-column pricing grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 16,
            alignItems: "start",
          }}
          className="sentinel-pricing-grid"
        >
          {products.map((plan) => {
            const isAI = plan.type === "ai";
            const isFeatured = (plan as any).featured;
            return (
              <div
                key={plan.name}
                style={{
                  background: "#111111",
                  border: `1px solid ${isFeatured ? "#d4af37" : isAI ? "rgba(212,175,55,0.2)" : "#222222"}`,
                  borderRadius: 18,
                  padding: "28px 20px",
                  position: "relative",
                  transition: "transform 0.3s, box-shadow 0.3s, border-color 0.3s",
                  boxShadow: isFeatured
                    ? "0 0 80px rgba(212,175,55,0.08), inset 0 0 40px rgba(212,175,55,0.02)"
                    : "none",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = isFeatured
                    ? "0 16px 80px rgba(212,175,55,0.15)"
                    : "0 16px 60px rgba(0,0,0,0.4)";
                  el.style.borderColor = "rgba(212,175,55,0.4)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = isFeatured
                    ? "0 0 80px rgba(212,175,55,0.08), inset 0 0 40px rgba(212,175,55,0.02)"
                    : "none";
                  el.style.borderColor = isFeatured ? "#d4af37" : isAI ? "rgba(212,175,55,0.2)" : "#222222";
                }}
              >
                {/* Featured badge */}
                {isFeatured && (
                  <div
                    style={{
                      position: "absolute",
                      top: -11,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#d4af37",
                      color: "#0a0a0a",
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "2px",
                      padding: "3px 14px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}

                {/* Type label */}
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 9,
                    fontWeight: 600,
                    color: isAI ? "#d4af37" : "#44ff88",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  {isAI ? "AI-Powered" : "Standalone"}
                </div>

                {/* Plan name */}
                <div
                  style={{
                    fontFamily: "var(--font-fraunces), serif",
                    fontWeight: 900,
                    fontSize: 18,
                    color: "#f5f5f5",
                    letterSpacing: "-0.02em",
                    marginBottom: 4,
                  }}
                >
                  {plan.name}
                </div>

                {/* Tagline */}
                <div
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: 12,
                    color: "#666666",
                    marginBottom: 16,
                  }}
                >
                  {plan.tagline}
                </div>

                {/* Price */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-fraunces), serif",
                        fontWeight: 900,
                        fontSize: 40,
                        color: "#f5f5f5",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {plan.price}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains), monospace",
                        fontSize: 12,
                        color: "#888888",
                      }}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: isFeatured ? "rgba(212,175,55,0.15)" : "#222222",
                    margin: "16px 0",
                  }}
                />

                {/* Features */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    flex: 1,
                  }}
                >
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 12,
                        color: "#f5f5f5",
                        fontFamily: "var(--font-inter), sans-serif",
                        lineHeight: 1.4,
                      }}
                    >
                      <span
                        style={{
                          color: isAI ? "#d4af37" : "#44ff88",
                          fontSize: 10,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="#trial"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 0",
                    background: isFeatured ? "#d4af37" : "transparent",
                    border: isFeatured ? "none" : "1px solid rgba(255,255,255,0.12)",
                    color: isFeatured ? "#0a0a0a" : "#f5f5f5",
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: "var(--font-jetbrains), monospace",
                    borderRadius: 10,
                    textDecoration: "none",
                    textAlign: "center",
                    transition: "all 0.25s",
                    boxSizing: "border-box",
                    letterSpacing: "0.01em",
                    marginTop: "auto",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    if (isFeatured) {
                      el.style.background = "#f4cf47";
                      el.style.boxShadow = "0 8px 30px rgba(212,175,55,0.3)";
                    } else {
                      el.style.borderColor = "rgba(212,175,55,0.3)";
                      el.style.color = "#d4af37";
                      el.style.background = "rgba(212,175,55,0.06)";
                    }
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = isFeatured ? "#d4af37" : "transparent";
                    el.style.borderColor = isFeatured ? "none" : "rgba(255,255,255,0.12)";
                    el.style.color = isFeatured ? "#0a0a0a" : "#f5f5f5";
                    el.style.boxShadow = "none";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  {plan.cta}
                </a>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div
          style={{
            textAlign: "center",
            marginTop: 40,
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 12,
            color: "#444444",
            letterSpacing: "0.03em",
          }}
        >
          // All prices are one-time. 14-day free trial. No credit card required. Prices increase after first 10 sales.
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .sentinel-pricing-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 750px) {
          .sentinel-pricing-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 500px) {
          .sentinel-pricing-grid {
            grid-template-columns: 1fr !important;
            max-width: 400px;
            margin: 0 auto;
          }
        }
      `}</style>
    </section>
  );
}
