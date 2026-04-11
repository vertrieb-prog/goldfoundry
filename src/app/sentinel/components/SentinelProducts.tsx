'use client'

const products = [
  {
    name: "PHANTOM News Shield",
    basePrice: "$39",
    aiPrice: "$19/mo",
    tagline: "Never get caught by news again",
    description:
      "Automatically closes or protects your trades before high-impact news events. Reads MT5's built-in economic calendar. Set it and forget it.",
    whoNeedsIt: "Every MT5 trader who has ever been burned by a news spike.",
    features: [
      "Auto-close before NFP, FOMC, CPI",
      "SL tightening + EA pause during events",
      "High / Medium / Low impact filter",
      "Customizable buffer minutes",
      "Works with any broker",
    ],
    goodToKnow: [
      "Only covers scheduled news events",
      "Works best when calendar data is available",
      "Simple but effective — no complex config",
    ],
    aiAdds: [
      "Post-news analysis",
      "Historical impact scoring",
      "Smart re-entry timing",
      "Weekly news report",
    ],
    badge: "base",
    cta: "Start Free Trial",
  },
  {
    name: "PHANTOM Trail Pro",
    basePrice: "$49",
    aiPrice: "$19/mo",
    tagline: "The SL manager your EA should have built in",
    description:
      "Intelligent trailing stop that gives your trades room to breathe. Stepped ATR trailing, break even with buffer, partial profit taking.",
    whoNeedsIt: "Anyone tired of getting stopped out too early.",
    features: [
      "4-step ATR trailing (not continuous)",
      "Break Even with configurable buffer",
      "Partial closes at profit targets",
      "Minimum SL distance protection",
      "Cooldown between SL changes",
    ],
    goodToKnow: [
      "Most effective in trending markets",
      "Stepped trail moves in jumps, not continuously — by design",
      "Less effective in ranging/choppy conditions",
    ],
    aiAdds: [
      "Context-aware trailing (wider in breakouts)",
      "Exhaustion detection",
      "Optimal TP levels",
      "Performance reports",
    ],
    badge: "base",
    cta: "Start Free Trial",
  },
  {
    name: "PHANTOM Guardian",
    basePrice: "$49",
    aiPrice: "$29/mo",
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
    goodToKnow: [
      "Guardian WILL close your trades when limits are hit — that is the point",
      "Start with Easy Mode to learn the system",
      "Saves your account from emotional decisions",
    ],
    aiAdds: [
      "Pre-tilt detection (catches revenge trading before it happens)",
      "Behavior analysis",
      "Prop firm coaching",
      "Weekly psychology report",
    ],
    badge: "base",
    cta: "Start Free Trial",
  },
  {
    name: "PHANTOM Airbag",
    basePrice: "$99",
    aiPrice: "$29/mo",
    tagline: "Your EA's AI safety net",
    description:
      "Runs alongside ANY EA you already own. Intercepts every trade and validates it through intelligent checks. Bad trades get vetoed before they cost you money.",
    whoNeedsIt: "Anyone running EAs (Quantum, Gold, any trading robot).",
    features: [
      "15+ local checks (spread, session, news, correlation)",
      "Max positions + daily loss protection",
      "Prop firm mode built in",
      "Works with ANY EA on MT5",
      "Fails safe — if connection drops, trades go through",
    ],
    goodToKnow: [
      "Needs internet for AI checks (~500ms per trade)",
      "Fails safe — if connection drops, trades still execute",
      "Works with any EA, no source code access needed",
    ],
    aiAdds: [
      "Full 41-check pipeline with AI validation",
      "SMC deep analysis",
      "Explainable decisions in plain English",
      "Natural language config + community learning",
    ],
    badge: "ai",
    featured: true,
    cta: "Start Free Trial",
  },
  {
    name: "PHANTOM Trader DSS",
    basePrice: "$199",
    aiPrice: "$49/mo",
    tagline: "The AI that trades for you",
    description:
      "Complete standalone AI trader. Generates its own signals, manages positions, learns from 100,000+ real trades. Auto, Semi-Auto, or Manual mode.",
    whoNeedsIt: "Serious traders who want AI-powered autonomous trading.",
    features: [
      "5 local strategies (breakout, trend, scalp, range, mean reversion)",
      "ATR-based entries + position management",
      "Auto / Semi-Auto / Manual modes",
      "Integrated SL / DCA / trail management",
      "FTMO compatible + lifetime updates",
    ],
    goodToKnow: [
      "Needs internet for AI signals",
      "Best results with $2,000+ accounts",
      "Start in Manual Mode for the first week",
    ],
    aiAdds: [
      "Full 13-strategy engine with AI decision making",
      "Live learning from 100K+ trades",
      "Kelly Criterion sizing + Monte Carlo simulation",
      "Daily performance reports",
    ],
    badge: "ai",
    featured: false,
    cta: "Start Free Trial",
  },
];

function ProductCard({ product }: { product: typeof products[0] }) {
  const isAI = product.badge === "ai";

  return (
    <div
      style={{
        background: "#111111",
        border: `1px solid ${isAI ? "rgba(212,175,55,0.25)" : "#222222"}`,
        borderRadius: 20,
        padding: "36px 28px",
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
      {/* Badge row: type + upgrade indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#44ff88",
            background: "rgba(68,255,136,0.06)",
            border: "1px solid rgba(68,255,136,0.15)",
            borderRadius: 6,
            padding: "4px 10px",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#44ff88",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Base — One-Time
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#d4af37",
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 6,
            padding: "4px 10px",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#d4af37",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          + AI Upgrade
        </div>
      </div>

      {/* Name + Price row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
        <h3
          style={{
            fontFamily: "var(--font-fraunces), serif",
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: "-0.02em",
            color: "#f5f5f5",
            margin: 0,
          }}
        >
          {product.name}
        </h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontWeight: 900,
              fontSize: 28,
              color: "#f5f5f5",
              letterSpacing: "-0.03em",
            }}
          >
            {product.basePrice}
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              color: "#888888",
            }}
          >
            base
          </span>
          <span style={{ color: "#333333", fontSize: 14 }}>|</span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 12,
              color: "#d4af37",
              fontWeight: 600,
            }}
          >
            +{product.aiPrice}
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              color: "#888888",
            }}
          >
            AI
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

      {/* What you get */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "#44ff88",
          marginBottom: 10,
        }}
      >
        What You Get
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
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
                background: "rgba(68,255,136,0.08)",
                border: "1px solid rgba(68,255,136,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 8,
                color: "#44ff88",
              }}
            >
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Good to know */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: "#888888",
          marginBottom: 10,
        }}
      >
        Good to Know
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {product.goodToKnow.map((item) => (
          <li
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              color: "#888888",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#888888",
                flexShrink: 0,
                width: 15,
                textAlign: "center",
              }}
            >
              →
            </span>
            {item}
          </li>
        ))}
      </ul>

      {/* AI Upgrade adds */}
      <div
        style={{
          background: "rgba(212,175,55,0.04)",
          border: "1px solid rgba(212,175,55,0.12)",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#d4af37",
            marginBottom: 10,
          }}
        >
          AI Upgrade Adds ({product.aiPrice})
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {product.aiAdds.map((item) => (
            <li
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 12,
                color: "#d4af37",
                fontFamily: "var(--font-inter), sans-serif",
              }}
            >
              <span
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 7,
                  color: "#d4af37",
                }}
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <a
        href="#trial"
        style={{
          display: "block",
          width: "100%",
          padding: "13px 0",
          background: product.featured ? "#d4af37" : "transparent",
          border: product.featured ? "none" : "1px solid rgba(255,255,255,0.12)",
          color: product.featured ? "#0a0a0a" : "#f5f5f5",
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
          if (product.featured) {
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
          el.style.background = product.featured ? "#d4af37" : "transparent";
          el.style.borderColor = product.featured ? "none" : "rgba(255,255,255,0.12)";
          el.style.color = product.featured ? "#0a0a0a" : "#f5f5f5";
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
            One Suite · Everything You Need
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
            Each tool is powerful alone.<br />Together, unstoppable.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              color: "#888888",
              maxWidth: 640,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Every product starts with a one-time base version that works offline. Add the AI upgrade when you are ready for intelligent analysis, learning, and reports.
          </p>
        </div>

        {/* All 5 products in responsive grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
          }}
          className="sentinel-products-grid"
        >
          {products.slice(0, 3).map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>

        {/* Spacer */}
        <div style={{ height: 20 }} />

        {/* AI-heavy products — 2 wider cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
          className="sentinel-products-ai"
        >
          {products.slice(3).map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .sentinel-products-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 700px) {
          .sentinel-products-grid {
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
