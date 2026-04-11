'use client'

const standaloneProducts = [
  {
    name: "PHANTOM News Shield",
    price: "$39",
    period: " once",
    tagline: "Never get caught by news again",
    description:
      "Automatically closes or protects your trades before high-impact news events. Reads MT5's built-in economic calendar. Set it and forget it.",
    whoNeedsIt: "Every MT5 trader who has ever been burned by a news spike.",
    features: [
      "Auto-close before NFP, FOMC, CPI",
      "Tighten SL or pause other EAs",
      "High / Medium / Low impact filter",
      "Customizable buffer minutes",
      "Works with any broker",
    ],
    badge: "Standalone — No Internet",
    cta: "Start Free Trial",
  },
  {
    name: "PHANTOM Trail Pro",
    price: "$49",
    period: " once",
    tagline: "The SL manager your EA should have built in",
    description:
      "Intelligent trailing stop that gives your trades room to breathe. Stepped ATR trailing, break even with buffer, partial profit taking.",
    whoNeedsIt: "Anyone tired of getting stopped out too early.",
    features: [
      "4-step ATR trailing (not continuous)",
      "Break Even with configurable buffer",
      "Minimum SL distance protection",
      "Partial closes at profit targets",
      "Cooldown between SL changes",
    ],
    badge: "Standalone — No Internet",
    cta: "Start Free Trial",
  },
  {
    name: "PHANTOM Guardian",
    price: "$49",
    period: " once",
    tagline: "Pass your prop firm challenge",
    description:
      "Enforces risk management rules automatically. One-click FTMO preset. Prevents you from blowing your account or failing your prop firm challenge.",
    whoNeedsIt: "Prop firm traders (FTMO, MFF, E8, FundedNext).",
    features: [
      "Daily loss limit + max drawdown",
      "Anti-tilt: pause after 3 losses",
      "Weekend close + trading hours",
      "One-click FTMO / MFF / E8 presets",
      "Max positions + equity shield",
    ],
    badge: "Standalone — No Internet",
    cta: "Start Free Trial",
  },
];

const aiProducts = [
  {
    name: "PHANTOM Airbag",
    price: "$99",
    period: " once",
    tagline: "Your EA's AI Safety Net",
    description:
      "Runs alongside ANY EA you already own. Intercepts every trade and validates it through 41 AI checks plus Haiku Brain. Bad trades get vetoed before they cost you money.",
    whoNeedsIt: "Anyone running EAs (Quantum, Gold, any trading robot).",
    features: [
      "41 AI checks in under 500ms",
      "Haiku Brain explainable decisions",
      "Works with ANY EA on MT5",
      "Daily loss protection built in",
      "Natural language config + FTMO ready",
    ],
    badge: "AI-Powered — Haiku Brain",
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "PHANTOM Trader DSS",
    price: "$199",
    period: " once",
    tagline: "The AI that trades for you",
    description:
      "Complete standalone AI trader. 13 strategies plus Haiku Brain. Generates its own signals, manages positions, learns from 100,000+ real trades. Auto, Semi-Auto, or Manual mode.",
    whoNeedsIt: "Serious traders who want AI-powered autonomous trading.",
    features: [
      "13 strategies + multi-symbol support",
      "Auto / Semi-Auto / Manual modes",
      "Kelly Criterion position sizing",
      "Integrated SL / DCA / trail management",
      "FTMO compatible + lifetime updates",
    ],
    badge: "AI-Powered — Haiku Brain",
    cta: "Start Free Trial",
    featured: false,
  },
];

function ProductCard({ product, wide = false }: { product: typeof standaloneProducts[0] & { featured?: boolean }; wide?: boolean }) {
  const isAI = product.badge.includes("AI-Powered");

  return (
    <div
      style={{
        background: "#111111",
        border: `1px solid ${isAI ? "rgba(212,175,55,0.25)" : "#222222"}`,
        borderRadius: 20,
        padding: wide ? "40px 36px" : "36px 28px",
        position: "relative",
        transition: "border-color 0.3s, transform 0.3s, box-shadow 0.3s",
        boxShadow: isAI ? "0 0 60px rgba(212,175,55,0.04)" : "none",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(212,175,55,0.4)";
        el.style.transform = "translateY(-4px)";
        el.style.boxShadow = "0 16px 60px rgba(212,175,55,0.08)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = isAI ? "rgba(212,175,55,0.25)" : "#222222";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = isAI ? "0 0 60px rgba(212,175,55,0.04)" : "none";
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          alignSelf: "flex-start",
          gap: 6,
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: isAI ? "#d4af37" : "#44ff88",
          background: isAI ? "rgba(212,175,55,0.08)" : "rgba(68,255,136,0.06)",
          border: `1px solid ${isAI ? "rgba(212,175,55,0.15)" : "rgba(68,255,136,0.15)"}`,
          borderRadius: 6,
          padding: "4px 10px",
          marginBottom: 20,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: isAI ? "#d4af37" : "#44ff88",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        {product.badge}
      </div>

      {/* Name + Price row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
        <h3
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontWeight: 900,
            fontSize: wide ? 26 : 22,
            letterSpacing: "-0.02em",
            color: "#f5f5f5",
            margin: 0,
          }}
        >
          {product.name}
        </h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontWeight: 900,
              fontSize: wide ? 36 : 32,
              color: "#f5f5f5",
              letterSpacing: "-0.03em",
            }}
          >
            {product.price}
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 12,
              color: "#888888",
            }}
          >
            {product.period}
          </span>
        </div>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 15,
          fontStyle: "italic",
          color: "#d4af37",
          margin: "0 0 16px",
          lineHeight: 1.5,
        }}
      >
        {product.tagline}
      </p>

      {/* Description */}
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 14,
          color: "#888888",
          lineHeight: 1.7,
          margin: "0 0 8px",
        }}
      >
        {product.description}
      </p>

      {/* Who needs it */}
      <p
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 11,
          color: "#666666",
          margin: "0 0 24px",
          letterSpacing: "0.02em",
        }}
      >
        {"// " + product.whoNeedsIt}
      </p>

      {/* Feature list */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 28px",
          display: "flex",
          flexDirection: "column",
          gap: 9,
          flex: 1,
        }}
      >
        {product.features.map((feature) => (
          <li
            key={feature}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "#f5f5f5",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            <span
              style={{
                width: 15,
                height: 15,
                borderRadius: "50%",
                background: isAI ? "rgba(212,175,55,0.08)" : "rgba(68,255,136,0.08)",
                border: `1px solid ${isAI ? "rgba(212,175,55,0.25)" : "rgba(68,255,136,0.25)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 8,
                color: isAI ? "#d4af37" : "#44ff88",
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
          padding: "13px 0",
          background: isAI ? "#d4af37" : "transparent",
          border: isAI ? "none" : "1px solid rgba(255,255,255,0.12)",
          color: isAI ? "#0a0a0a" : "#f5f5f5",
          fontWeight: 700,
          fontSize: 13,
          fontFamily: "var(--font-jetbrains), monospace",
          borderRadius: 12,
          textDecoration: "none",
          textAlign: "center",
          transition: "all 0.25s",
          letterSpacing: "0.01em",
          boxSizing: "border-box",
          marginTop: "auto",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          if (isAI) {
            el.style.background = "#f4cf47";
            el.style.boxShadow = "0 8px 30px rgba(212,175,55,0.3)";
          } else {
            el.style.borderColor = "rgba(212,175,55,0.4)";
            el.style.color = "#d4af37";
            el.style.background = "rgba(212,175,55,0.06)";
          }
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = isAI ? "#d4af37" : "transparent";
          el.style.borderColor = isAI ? "none" : "rgba(255,255,255,0.12)";
          el.style.color = isAI ? "#0a0a0a" : "#f5f5f5";
          el.style.boxShadow = "none";
          el.style.transform = "translateY(0)";
        }}
      >
        {product.cta}
      </a>
    </div>
  );
}

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
            5 Products · One Ecosystem
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
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              color: "#888888",
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            From a $39 news filter to a $199 autonomous AI trader. Start with what you need, add more as you grow.
          </p>
        </div>

        {/* Standalone Tools — 3 cards */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#44ff88",
              marginBottom: 20,
              paddingLeft: 4,
            }}
          >
            Standalone Tools — No Internet Required
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 20,
            }}
            className="sentinel-products-standalone"
          >
            {standaloneProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: 40 }} />

        {/* AI-Powered — 2 wider cards */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#d4af37",
              marginBottom: 20,
              paddingLeft: 4,
            }}
          >
            AI-Powered — Haiku Brain Inside
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
            className="sentinel-products-ai"
          >
            {aiProducts.map((product) => (
              <ProductCard key={product.name} product={product} wide />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .sentinel-products-standalone {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 700px) {
          .sentinel-products-standalone {
            grid-template-columns: 1fr !important;
          }
          .sentinel-products-ai {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
