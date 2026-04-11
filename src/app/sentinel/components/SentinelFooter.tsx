'use client'

export default function SentinelFooter() {
  return (
    <footer
      style={{
        background: "#0a0a0a",
        borderTop: "1px solid #222222",
        padding: "48px 24px 32px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: 32,
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 900,
              fontSize: 22,
              color: "#f5f5f5",
              letterSpacing: "-0.02em",
            }}
          >
            PHANTOM<span style={{ color: "#d4af37" }}>.</span>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <a
              href="/agb"
              style={{
                color: "#888888",
                textDecoration: "none",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#d4af37")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#888888")}
            >
              Terms
            </a>
            <a
              href="/datenschutz"
              style={{
                color: "#888888",
                textDecoration: "none",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#d4af37")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#888888")}
            >
              Privacy
            </a>
            <a
              href="mailto:support@goldfoundry.de"
              style={{
                color: "#888888",
                textDecoration: "none",
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#d4af37")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#888888")}
            >
              Contact
            </a>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, #222222 20%, #222222 80%, transparent)",
            marginBottom: 24,
          }}
        />

        {/* Copyright */}
        <div
          style={{
            fontSize: 13,
            color: "#888888",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 16,
          }}
        >
          © 2026 PhoenixOne AI UG (haftungsbeschränkt) · Leipzig, Germany
        </div>

        {/* Risk Disclaimer */}
        <p
          style={{
            fontSize: 11,
            color: "#444444",
            lineHeight: 1.7,
            maxWidth: 800,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Risk Disclaimer: Trading foreign exchange, metals, and other financial instruments involves substantial risk of loss and is not suitable for all investors.
          Past performance is not indicative of future results. PHANTOM is a software tool — it does not guarantee profits or eliminate losses.
          You should carefully consider your financial situation and risk tolerance before trading. PhoenixOne AI UG is a technology provider,
          not a licensed financial advisor or broker. All trading decisions are made by you, the user.
        </p>
      </div>
    </footer>
  );
}
