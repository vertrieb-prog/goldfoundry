'use client'

const products = [
  { name: "News Shield", basePrice: "$39", aiPrice: "$19/mo", tagline: "News protection" },
  { name: "Trail Pro", basePrice: "$49", aiPrice: "$19/mo", tagline: "Smart trailing stop" },
  { name: "Guardian", basePrice: "$49", aiPrice: "$29/mo", tagline: "Prop firm compliance" },
  { name: "Airbag", basePrice: "$99", aiPrice: "$29/mo", tagline: "AI trade filter", featured: true },
  { name: "Trader DSS", basePrice: "$199", aiPrice: "$49/mo", tagline: "Autonomous AI trader" },
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
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#d4af37",
              marginBottom: 16,
            }}
          >
            Transparent Pricing · Base + AI Upgrade
          </div>
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(32px, 4vw, 56px)",
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              margin: "0 0 16px",
            }}
          >
            Start with the base. Add AI when ready.
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              color: "#888888",
              maxWidth: 580,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Every product has a one-time base version that works standalone. The AI upgrade is a monthly add-on that requires the base. 14-day free trial on everything.
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
            const isFeatured = (plan as any).featured;
            return (
              <div
                key={plan.name}
                style={{
                  background: "#111111",
                  border: `1px solid ${isFeatured ? "#d4af37" : "#222222"}`,
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
                  el.style.borderColor = isFeatured ? "#d4af37" : "#222222";
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
                      fontFamily: "'JetBrains Mono', monospace",
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

                {/* Plan name */}
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
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
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 12,
                    color: "#666666",
                    marginBottom: 20,
                  }}
                >
                  {plan.tagline}
                </div>

                {/* Base Price */}
                <div
                  style={{
                    background: "rgba(68,255,136,0.04)",
                    border: "1px solid rgba(68,255,136,0.12)",
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "#44ff88",
                      marginBottom: 6,
                    }}
                  >
                    Base (One-Time)
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 900,
                        fontSize: 32,
                        color: "#f5f5f5",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {plan.basePrice}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "#888888",
                      }}
                    >
                      once
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 11,
                      color: "#666666",
                      marginTop: 4,
                    }}
                  >
                    Works offline, no internet needed
                  </div>
                </div>

                {/* AI Upgrade Price */}
                <div
                  style={{
                    background: "rgba(212,175,55,0.04)",
                    border: "1px solid rgba(212,175,55,0.12)",
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "#d4af37",
                      marginBottom: 6,
                    }}
                  >
                    + AI Upgrade (Monthly)
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 900,
                        fontSize: 24,
                        color: "#d4af37",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {plan.aiPrice}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 11,
                      color: "#666666",
                      marginTop: 4,
                    }}
                  >
                    Requires base. Internet required.
                  </div>
                </div>

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
                    fontFamily: "'JetBrains Mono', monospace",
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
                  Start Free Trial
                </a>
              </div>
            );
          })}
        </div>

        {/* PHANTOM Complete bundle */}
        <div
          style={{
            marginTop: 32,
            background: "#111111",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 18,
            padding: "32px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
            boxShadow: "0 0 80px rgba(212,175,55,0.04)",
          }}
          className="sentinel-bundle"
        >
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#d4af37",
                marginBottom: 8,
              }}
            >
              PHANTOM Complete Bundle
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 900,
                fontSize: 24,
                color: "#f5f5f5",
                letterSpacing: "-0.02em",
                marginBottom: 4,
              }}
            >
              All 5 base products + all AI upgrades
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "#888888",
              }}
            >
              Save 20% vs. buying individually. One license, one dashboard, everything included.
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "center" }}>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 900,
                  fontSize: 40,
                  color: "#d4af37",
                  letterSpacing: "-0.03em",
                }}
              >
                $349
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: "#888888",
                }}
              >
                base
              </span>
              <span style={{ color: "#333333", fontSize: 16 }}>+</span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 900,
                  fontSize: 28,
                  color: "#d4af37",
                  letterSpacing: "-0.03em",
                }}
              >
                $119/mo
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: "#888888",
                }}
              >
                AI
              </span>
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "#666666",
                marginTop: 4,
              }}
            >
              vs. $436 + $146/mo individually
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div
          style={{
            textAlign: "center",
            marginTop: 40,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "#444444",
            letterSpacing: "0.03em",
          }}
        >
          // Base = one-time purchase, yours forever. AI = monthly, cancel anytime. 14-day free trial. No credit card required.
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
          .sentinel-bundle {
            flex-direction: column !important;
            text-align: center !important;
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
