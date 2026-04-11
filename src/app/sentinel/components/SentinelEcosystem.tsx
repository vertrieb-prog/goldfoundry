'use client'

const standaloneItems = [
  { name: "News Shield", desc: "Closes trades before news events" },
  { name: "Trail Pro", desc: "Intelligent ATR trailing stop" },
  { name: "Guardian", desc: "Prop firm risk enforcement" },
];

const aiItems = [
  { name: "Airbag", desc: "AI filter for any EA" },
  { name: "Trader DSS", desc: "Autonomous AI trader" },
];

export default function SentinelEcosystem() {
  return (
    <section
      style={{
        background: "#111111",
        padding: "100px 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
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
            Modular by Design
          </div>
          <h2
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontWeight: 900,
              fontSize: "clamp(28px, 4vw, 52px)",
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              margin: "0 0 20px",
              lineHeight: 1.1,
            }}
          >
            All tools. One ecosystem.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 16,
              color: "#888888",
              maxWidth: 620,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Start with any single product and add more as you need them. Every PHANTOM tool runs independently on your MT5 terminal. The AI products share the same brain. The standalone tools need nothing but your chart.
          </p>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
          className="sentinel-ecosystem-grid"
        >
          {/* Standalone column */}
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid #222222",
              borderRadius: 16,
              padding: "32px 28px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#44ff88",
                marginBottom: 8,
              }}
            >
              Standalone Tools
            </div>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 13,
                color: "#666666",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              No internet. No API. No dependencies. Install on MT5, configure once, done.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {standaloneItems.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: "rgba(68,255,136,0.03)",
                    border: "1px solid rgba(68,255,136,0.08)",
                    borderRadius: 10,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#44ff88",
                      flexShrink: 0,
                      boxShadow: "0 0 6px rgba(68,255,136,0.4)",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-fraunces), serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#f5f5f5",
                        marginBottom: 2,
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: 12,
                        color: "#666666",
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI column */}
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: 16,
              padding: "32px 28px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#d4af37",
                marginBottom: 8,
              }}
            >
              AI-Powered
            </div>
            <p
              style={{
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: 13,
                color: "#666666",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Same Haiku Brain. Same 41 checks. Airbag filters your EA's trades. DSS generates its own.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {aiItems.map((item) => (
                <div
                  key={item.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: "rgba(212,175,55,0.03)",
                    border: "1px solid rgba(212,175,55,0.08)",
                    borderRadius: 10,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#d4af37",
                      flexShrink: 0,
                      boxShadow: "0 0 6px rgba(212,175,55,0.4)",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-fraunces), serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#f5f5f5",
                        marginBottom: 2,
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: 12,
                        color: "#666666",
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shared brain note */}
            <div
              style={{
                marginTop: 20,
                padding: "10px 14px",
                background: "rgba(212,175,55,0.04)",
                border: "1px solid rgba(212,175,55,0.1)",
                borderRadius: 8,
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 11,
                color: "#8a7020",
                letterSpacing: "0.02em",
              }}
            >
              // Shared intelligence: Airbag + DSS use the same PHANTOM brain
            </div>
          </div>
        </div>

        {/* Bottom message */}
        <div
          style={{
            textAlign: "center",
            marginTop: 48,
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: 15,
            color: "#888888",
            lineHeight: 1.7,
            maxWidth: 560,
            margin: "48px auto 0",
          }}
        >
          Mix and match. Run Guardian + Trail Pro for prop firm safety. Add Airbag when you want AI filtering. Upgrade to DSS when you want the AI to trade for you.
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .sentinel-ecosystem-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
