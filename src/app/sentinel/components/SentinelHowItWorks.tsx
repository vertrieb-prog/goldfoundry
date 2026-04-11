'use client'

const steps = [
  {
    number: "01",
    title: "Signal Arrives",
    description:
      "Your EA fires a signal, or PHANTOM generates one. Every entry attempt passes through the engine — no exceptions.",
  },
  {
    number: "02",
    title: "41 Checks Run",
    description:
      "SMC direction, session analysis, news proximity, spread, correlation, drawdown state — all evaluated in under 500ms.",
  },
  {
    number: "03",
    title: "AI Brain Decides",
    description:
      "The PHANTOM AI reviews the full context snapshot and renders a verdict with natural language reasoning you can read.",
  },
  {
    number: "04",
    title: "Execute or Veto",
    description:
      "ALLOW the trade, SKIP it, or MODIFY parameters. Every decision is logged with the reasoning — your edge compounds.",
  },
];

const checks = [
  "SMC Direction",
  "Order Blocks",
  "Fair Value Gaps",
  "Liquidity Sweeps",
  "Session Filter",
  "News Proximity",
  "Volume Confirm",
  "Spread Check",
  "Correlation",
  "Anti-Tilt",
  "Drawdown Limit",
  "R:R Ratio",
  "ATR Context",
  "RSI Context",
  "Candle Pattern",
  "+ 26 More",
];

export default function SentinelHowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        background: "#111111",
        padding: "100px 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 72 }}>
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
            Under the Hood
          </div>
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(32px, 4vw, 56px)",
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              margin: 0,
            }}
          >
            How PHANTOM thinks.
          </h2>
        </div>

        {/* 4-step flow */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            marginBottom: 72,
          }}
          className="sentinel-steps-grid"
        >
          {steps.map((step, i) => (
            <div
              key={step.number}
              style={{
                background: "#0a0a0a",
                border: "1px solid #222222",
                borderRadius: 16,
                padding: "28px 24px",
                position: "relative",
                transition: "border-color 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(212,175,55,0.3)";
                el.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#222222";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Step number */}
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 900,
                  fontSize: 40,
                  color: "rgba(212,175,55,0.12)",
                  lineHeight: 1,
                  marginBottom: 16,
                  letterSpacing: "-0.03em",
                }}
              >
                {step.number}
              </div>

              {/* Connector line (not on last) */}
              {i < 3 && (
                <div
                  style={{
                    position: "absolute",
                    top: 44,
                    right: -13,
                    width: 24,
                    height: 1,
                    background: "linear-gradient(90deg, #222222, rgba(212,175,55,0.2))",
                    zIndex: 1,
                  }}
                  className="sentinel-step-connector"
                />
              )}

              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: 18,
                  color: "#f5f5f5",
                  margin: "0 0 12px",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "#888888",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Check badges */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "#444444",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            41 Checks Include
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
            }}
          >
            {checks.map((check) => (
              <div
                key={check}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: check === "+ 26 More" ? "#d4af37" : "#888888",
                  background: check === "+ 26 More" ? "rgba(212,175,55,0.06)" : "#0a0a0a",
                  border: `1px solid ${check === "+ 26 More" ? "rgba(212,175,55,0.2)" : "#222222"}`,
                  borderRadius: 8,
                  padding: "6px 14px",
                  transition: "all 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(212,175,55,0.3)";
                  el.style.color = "#d4af37";
                  el.style.background = "rgba(212,175,55,0.04)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = check === "+ 26 More" ? "rgba(212,175,55,0.2)" : "#222222";
                  el.style.color = check === "+ 26 More" ? "#d4af37" : "#888888";
                  el.style.background = check === "+ 26 More" ? "rgba(212,175,55,0.06)" : "#0a0a0a";
                }}
              >
                {check}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .sentinel-steps-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .sentinel-step-connector {
            display: none !important;
          }
        }
        @media (max-width: 600px) {
          .sentinel-steps-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
