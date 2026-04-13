'use client';

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function SentinelTrialForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [licenseKey, setLicenseKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || state === "loading") return;

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/sentinel/trial/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product: "PHANTOM_SUITE" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Something went wrong. Please try again.");
      }

      setLicenseKey(data.licenseKey || data.license_key || "");
      setState("success");
    } catch (err: unknown) {
      setState("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  function reset() {
    setState("idle");
    setErrorMsg("");
  }

  return (
    <section
      id="trial"
      style={{
        background: "#0a0a0a",
        padding: "100px 24px",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Eyebrow */}
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
          14 Days Free · Full Suite · No Credit Card
        </div>

        {/* H2 */}
        <h2
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(28px, 4vw, 52px)",
            letterSpacing: "-0.02em",
            color: "#f5f5f5",
            margin: "0 0 16px",
            lineHeight: 1.1,
          }}
        >
          Try the full PHANTOM suite free for 14 days.
        </h2>

        {/* Subtext */}
        <p
          style={{
            fontSize: 16,
            color: "#888888",
            lineHeight: 1.7,
            marginBottom: 48,
          }}
        >
          All 5 products. All AI upgrades. Full functionality. Live trading. Real decisions. Your data stays yours.
        </p>

        {/* Form card */}
        <div
          style={{
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: 20,
            padding: "40px 36px",
          }}
        >
          {state === "success" ? (
            <div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(68,255,136,0.1)",
                  border: "1px solid rgba(68,255,136,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: 24,
                  color: "#44ff88",
                }}
              >
                ✓
              </div>
              <h3
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  color: "#f5f5f5",
                  margin: "0 0 12px",
                }}
              >
                License activated!
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "#888888",
                  marginBottom: 20,
                }}
              >
                Check your email for your license key and setup instructions.
              </p>
              {licenseKey && (
                <div
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid rgba(68,255,136,0.2)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    color: "#44ff88",
                    letterSpacing: "0.1em",
                    marginBottom: 16,
                    wordBreak: "break-all",
                  }}
                >
                  {licenseKey}
                </div>
              )}
              <div
                style={{
                  padding: "14px 0",
                  background: "#44ff88",
                  color: "#0a0a0a",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  borderRadius: 12,
                  letterSpacing: "0.01em",
                }}
              >
                ✓ Check your email!
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} className="sentinel-form-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    flex: 1,
                    minWidth: 200,
                    padding: "14px 16px",
                    background: "#0a0a0a",
                    border: "1px solid #222222",
                    borderRadius: 12,
                    color: "#f5f5f5",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 15,
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#d4af37";
                    e.target.style.boxShadow = "0 0 0 3px rgba(212,175,55,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#222222";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  style={{
                    padding: "14px 28px",
                    background: state === "loading" ? "rgba(212,175,55,0.5)" : "#d4af37",
                    color: "#0a0a0a",
                    fontWeight: 700,
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    border: "none",
                    borderRadius: 12,
                    cursor: state === "loading" ? "not-allowed" : "pointer",
                    transition: "all 0.25s",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    if (state !== "loading") {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "#f4cf47";
                      el.style.transform = "translateY(-2px)";
                      el.style.boxShadow = "0 8px 30px rgba(212,175,55,0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = state === "loading" ? "rgba(212,175,55,0.5)" : "#d4af37";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}
                >
                  {state === "loading" ? "Activating..." : "Get My License Key"}
                </button>
              </div>

              {state === "error" && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "10px 14px",
                    background: "rgba(255,68,68,0.08)",
                    border: "1px solid rgba(255,68,68,0.2)",
                    borderRadius: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: "#ff4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span>{errorMsg}</span>
                  <button
                    type="button"
                    onClick={reset}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ff4444",
                      cursor: "pointer",
                      fontSize: 16,
                      lineHeight: 1,
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              <div
                style={{
                  marginTop: 16,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "#444444",
                  letterSpacing: "0.03em",
                }}
              >
                // No credit card · Instant activation · All 5 products · 14 days
              </div>
            </form>
          )}
        </div>

        {/* MQL5 Marketplace alternative */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "#666666",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Prefer one-click purchase?
          </div>
          <a
            href="https://www.mql5.com/en/users/goldfoundry/seller"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 28px",
              background: "#d4af37",
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: 12,
              textDecoration: "none",
              transition: "all 0.25s",
              letterSpacing: "0.01em",
              boxShadow: "0 4px 20px rgba(212,175,55,0.15)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#f4cf47";
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = "0 12px 40px rgba(212,175,55,0.35)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#d4af37";
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "0 4px 20px rgba(212,175,55,0.15)";
            }}
          >
            <span style={{ fontSize: 10, opacity: 0.6 }}>MQL5</span>
            Browse all 14 EAs on MQL5 Market →
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .sentinel-form-row {
            flex-direction: column !important;
          }
          .sentinel-form-row input,
          .sentinel-form-row button {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
