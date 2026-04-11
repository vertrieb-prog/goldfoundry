'use client'

const plans = [
  {
    name: "AIRBAG Monthly",
    price: "$49",
    period: "/mo",
    badge: null,
    features: [
      "Works with any MT5 EA",
      "41 AI checks per signal",
      "Haiku Brain decisions",
      "Daily loss limit shield",
      "Natural language config",
      "FTMO & prop firm ready",
      "Email support",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "AIRBAG 12 Months",
    price: "$399",
    period: "/12mo",
    badge: "LAUNCH TIER",
    saving: "Save $189",
    features: [
      "Everything in Monthly",
      "Save $189 vs monthly",
      "Priority support",
      "Early access to v5",
      "Strategy performance reports",
      "1-on-1 onboarding call",
      "Lock in launch pricing",
    ],
    cta: "Get Best Deal",
    featured: true,
  },
  {
    name: "TRADER DSS",
    price: "$199",
    period: " once",
    badge: null,
    subtext: "Lifetime license",
    features: [
      "Standalone AI trader",
      "13 trading strategies",
      "Auto / Semi-Auto / Manual",
      "Multi-symbol support",
      "Integrated SL/DCA/Trail",
      "Kelly Criterion sizing",
      "Lifetime updates",
    ],
    cta: "Get Lifetime License",
    featured: false,
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
            Launch Pricing · Limited
          </div>
          <h2
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontWeight: 900,
              fontSize: "clamp(32px, 4vw, 56px)",
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              margin: 0,
            }}
          >
            Early adopters win.
          </h2>
        </div>

        {/* Pricing grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 24,
            alignItems: "start",
          }}
          className="sentinel-pricing-grid"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: "#111111",
                border: `1px solid ${plan.featured ? "#d4af37" : "#222222"}`,
                borderRadius: 20,
                padding: "36px 28px",
                position: "relative",
                transition: "transform 0.3s, box-shadow 0.3s",
                boxShadow: plan.featured
                  ? "0 0 80px rgba(212,175,55,0.1), inset 0 0 40px rgba(212,175,55,0.02)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = plan.featured
                  ? "0 16px 80px rgba(212,175,55,0.15)"
                  : "0 16px 60px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = plan.featured
                  ? "0 0 80px rgba(212,175,55,0.1), inset 0 0 40px rgba(212,175,55,0.02)"
                  : "none";
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#d4af37",
                    color: "#0a0a0a",
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "2px",
                    padding: "4px 16px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  color: plan.featured ? "#d4af37" : "#888888",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              >
                {plan.name}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-fraunces), serif",
                      fontWeight: 900,
                      fontSize: 52,
                      color: "#f5f5f5",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 14,
                      color: "#888888",
                    }}
                  >
                    {plan.period}
                  </span>
                </div>
                {plan.saving && (
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 12,
                      color: "#44ff88",
                      marginTop: 4,
                    }}
                  >
                    {plan.saving}
                  </div>
                )}
                {plan.subtext && (
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 12,
                      color: "#8a7020",
                      marginTop: 4,
                    }}
                  >
                    {plan.subtext}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: plan.featured
                    ? "rgba(212,175,55,0.15)"
                    : "#222222",
                  margin: "24px 0",
                }}
              />

              {/* Features */}
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 14,
                      color: "#f5f5f5",
                    }}
                  >
                    <span
                      style={{
                        color: plan.featured ? "#d4af37" : "#44ff88",
                        fontSize: 12,
                        flexShrink: 0,
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
                  padding: "14px 0",
                  background: plan.featured ? "#d4af37" : "transparent",
                  border: plan.featured
                    ? "none"
                    : "1px solid rgba(255,255,255,0.12)",
                  color: plan.featured ? "#0a0a0a" : "#f5f5f5",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "var(--font-jetbrains), monospace",
                  borderRadius: 12,
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "all 0.25s",
                  boxSizing: "border-box",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (plan.featured) {
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
                  el.style.background = plan.featured ? "#d4af37" : "transparent";
                  el.style.borderColor = plan.featured ? "none" : "rgba(255,255,255,0.12)";
                  el.style.color = plan.featured ? "#0a0a0a" : "#f5f5f5";
                  el.style.boxShadow = "none";
                  el.style.transform = "translateY(0)";
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .sentinel-pricing-grid {
            grid-template-columns: 1fr !important;
            max-width: 480px;
            margin: 0 auto;
          }
        }
      `}</style>
    </section>
  );
}
