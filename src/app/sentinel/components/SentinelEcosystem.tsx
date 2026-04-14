'use client'

const baseFeatures = [
  "One-time payment. Yours forever.",
  "No internet, no API keys, no phone-home",
  "Every core feature included",
  "Works on MT4 and MT5 from the same license",
  "Ships as a compiled EX5/EX4 from MQL5 Market",
];

const aiFeatures = [
  "Monthly. Cancel from the dashboard.",
  "Pattern recognition on your actual trade log",
  "Plain-English reason for every SKIP or MODIFY",
  "Weekly report mailed Sunday 20:00 UTC",
  "You can buy Base and never touch this",
];

const basePrices = [
  { name: "News Shield", price: "$39" },
  { name: "Trail Pro", price: "$49" },
  { name: "Guardian", price: "$49" },
  { name: "Airbag", price: "$99" },
  { name: "Trader DSS", price: "$199" },
];

const aiPrices = [
  { name: "News Shield AI", price: "$19/mo" },
  { name: "Trail Pro AI", price: "$19/mo" },
  { name: "Guardian AI", price: "$29/mo" },
  { name: "Airbag AI", price: "$29/mo" },
  { name: "Trader DSS AI", price: "$49/mo" },
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
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#d4af37",
              marginBottom: 16,
            }}
          >
            The 2-Step Model
          </div>
          <h2
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(28px, 4vw, 52px)",
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              margin: "0 0 20px",
              lineHeight: 1.1,
            }}
          >
            Buy the Base.<br />Skip the AI if you want.
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
              color: "#888888",
              maxWidth: 620,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Same deal on every EA. Base is a one-time MQL5 purchase that runs offline. If you ever want adaptive thresholds and weekly reports, there's a monthly upgrade. If you don't, Base keeps working — no degraded mode, no nag screens.
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
          {/* Step 1: Buy the Base */}
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
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#44ff88",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(68,255,136,0.1)",
                  border: "1px solid rgba(68,255,136,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                1
              </span>
              Step 1: Buy the Base
            </div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: "#666666",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Buy it once on the MQL5 Market. Drop the EX5 on a chart. Configure. That's the install.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {baseFeatures.map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "#f5f5f5",
                    fontFamily: "'Inter', sans-serif",
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
                  {item}
                </div>
              ))}
            </div>

            {/* Base prices */}
            <div
              style={{
                background: "rgba(68,255,136,0.03)",
                border: "1px solid rgba(68,255,136,0.08)",
                borderRadius: 10,
                padding: "14px 16px",
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
                  marginBottom: 10,
                }}
              >
                Base Prices (One-Time)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {basePrices.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#f5f5f5" }}>{item.name}</span>
                    <span style={{ color: "#44ff88", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13 }}>
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Add AI Power */}
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
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#d4af37",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(212,175,55,0.1)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                2
              </span>
              Step 2: Add AI Power
            </div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: "#666666",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Optional. Monthly. Needs internet. Adds pattern recognition from your trade log plus a weekly report. Cancel whenever.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {aiFeatures.map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "#f5f5f5",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <span
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: "50%",
                      background: "rgba(212,175,55,0.08)",
                      border: "1px solid rgba(212,175,55,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 8,
                      color: "#d4af37",
                    }}
                  >
                    ✓
                  </span>
                  {item}
                </div>
              ))}
            </div>

            {/* AI prices */}
            <div
              style={{
                background: "rgba(212,175,55,0.03)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 10,
                padding: "14px 16px",
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
                  marginBottom: 10,
                }}
              >
                AI Upgrade Prices (Monthly)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {aiPrices.map((item) => (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "#f5f5f5" }}>{item.name}</span>
                    <span style={{ color: "#d4af37", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13 }}>
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom message */}
        <div
          style={{
            textAlign: "center",
            marginTop: 48,
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            color: "#888888",
            lineHeight: 1.7,
            maxWidth: 600,
            margin: "48px auto 0",
          }}
        >
          A typical FTMO setup: Guardian (rules) + Trail Pro (exits) + News Shield (NFP). About $137 one-time, nothing monthly. Add Airbag if you're running a paid EA you don't fully trust.
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
