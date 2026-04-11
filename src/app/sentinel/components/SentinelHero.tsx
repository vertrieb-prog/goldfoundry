'use client'

export default function SentinelHero() {
  const terminalLines = [
    { text: "[PHANTOM] Signal detected", color: "#d4af37" },
    { text: "XAUUSD BUY @ 2847.30", color: "#f5f5f5" },
    { text: "Running 41 checks...", color: "#888888" },
    { text: "✓ SMC direction match", color: "#44ff88" },
    { text: "✓ Volume confirmation", color: "#44ff88" },
    { text: "✓ News clear (next: 4h)", color: "#44ff88" },
    { text: "✗ Session hour: 42% WR", color: "#ff4444" },
    { text: "✗ Spread: 4.2 (max 3.5)", color: "#ff4444" },
    { text: "[PHANTOM AI] Low confidence setup", color: "#d4af37" },
    { text: "DECISION: SKIP", color: "#ff4444", bold: true },
    { text: "Protected: $340 saved", color: "#44ff88", bold: true },
  ];

  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
        paddingTop: 100,
        paddingBottom: 80,
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />
      {/* Glow orb */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "30%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
        className="sentinel-hero-grid"
      >
        {/* Left: Text */}
        <div>
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#d4af37",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#d4af37",
                boxShadow: "0 0 8px rgba(212,175,55,0.8)",
                display: "inline-block",
              }}
            />
            The Complete EA Suite for MT5
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontWeight: 900,
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              margin: "0 0 24px",
            }}
          >
            5 tools. One suite.{" "}
            <br />
            Every trade{" "}
            <em
              style={{
                color: "#d4af37",
                fontStyle: "italic",
              }}
            >
              protected.
            </em>
          </h1>

          {/* Lede */}
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: "#888888",
              marginBottom: 40,
              maxWidth: 520,
            }}
          >
            Stop buying 10 different EAs. PHANTOM is the complete suite that makes every other EA better
            and every trade safer. Each tool is powerful alone. Together, they are unstoppable.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 48 }}>
            <a
              href="#trial"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 32px",
                background: "#d4af37",
                color: "#0a0a0a",
                fontWeight: 700,
                fontSize: 14,
                fontFamily: "var(--font-jetbrains), monospace",
                borderRadius: 12,
                textDecoration: "none",
                transition: "all 0.25s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#f4cf47";
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = "0 12px 40px rgba(212,175,55,0.3)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#d4af37";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              Try the Full Suite Free
            </a>
            <a
              href="#products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 32px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#f5f5f5",
                fontWeight: 600,
                fontSize: 14,
                fontFamily: "var(--font-jetbrains), monospace",
                borderRadius: 12,
                textDecoration: "none",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(212,175,55,0.4)";
                el.style.color = "#d4af37";
                el.style.background = "rgba(212,175,55,0.06)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(255,255,255,0.12)";
                el.style.color = "#f5f5f5";
                el.style.background = "transparent";
              }}
            >
              See All 5 Products
            </a>
          </div>

          {/* Trust stats */}
          <div
            style={{
              display: "flex",
              gap: 32,
              flexWrap: "wrap",
            }}
          >
            {[
              "5 Products, 1 Suite",
              "Base + AI Upgrade Model",
              "14-Day Free Trial",
            ].map((stat) => (
              <div
                key={stat}
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 11,
                  color: "#888888",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#d4af37",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {stat}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Terminal */}
        <div className="sentinel-hero-terminal">
          <div
            style={{
              background: "#111111",
              border: "1px solid #222222",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 120px rgba(212,175,55,0.03)",
            }}
          >
            {/* Terminal bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 16px",
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid #222222",
              }}
            >
              <div
                style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff4444" }}
              />
              <div
                style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbb00" }}
              />
              <div
                style={{ width: 10, height: 10, borderRadius: "50%", background: "#44ff88" }}
              />
              <span
                style={{
                  marginLeft: 8,
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 11,
                  color: "#444444",
                }}
              >
                phantom-suite · live
              </span>
            </div>

            {/* Terminal content */}
            <div style={{ padding: "24px 20px", minHeight: 280 }}>
              {terminalLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: line.color,
                    fontWeight: line.bold ? 600 : 400,
                    opacity: 0,
                    animation: `terminalFadeIn 0.3s ease-out forwards`,
                    animationDelay: `${0.3 + i * 0.2}s`,
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
          </div>

          {/* Glow under terminal */}
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: "10%",
              right: "10%",
              height: 80,
              background: "radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)",
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes terminalFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 900px) {
          .sentinel-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .sentinel-hero-terminal {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
