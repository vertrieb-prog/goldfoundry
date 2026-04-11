'use client';

import { useState } from "react";

const faqs = [
  {
    q: "Does PHANTOM Airbag work with my existing EA?",
    a: "Yes. PHANTOM Airbag is broker- and EA-agnostic. It runs as a separate Expert Advisor on the same chart and intercepts signals via a shared memory bridge. No source code access required. If your EA fires signals on MT5, Airbag catches them.",
  },
  {
    q: "What is the difference between the base version and the AI upgrade?",
    a: "The base version of every product is a one-time purchase that works completely offline — no internet, no API, no dependencies. It includes all core features and rule-based protection. The AI upgrade is a monthly subscription that adds intelligent analysis, learning from 100,000+ trades, explainable decisions, and natural language configuration. You need the base before you can add the AI upgrade.",
  },
  {
    q: "Is this compatible with prop firms like FTMO?",
    a: "Yes. PHANTOM includes a dedicated Prop Firm mode that enforces challenge rules automatically — daily loss limits, max drawdown, news lockouts. It was built with FTMO, MyForexFunds, and E8 Funding rules in mind. Guardian has one-click presets for all major prop firms.",
  },
  {
    q: "How does the 14-day trial work?",
    a: "Sign up with your email, receive your license key instantly. Install the EA on your MT5 terminal, enter the key, and PHANTOM activates. Full functionality — live trading, all features, AI enabled. No credit card. No commitment. Cancel by simply not activating after the trial.",
  },
  {
    q: "Do I need to buy all 5 products?",
    a: "No. Every product works independently. Start with what you need — most traders begin with Airbag or Guardian. You can add more products at any time, and each one has its own base + AI upgrade path. They are designed to work together, but none requires another.",
  },
  {
    q: "What data do you collect?",
    a: "Only trade metadata: entry/exit prices, timestamps, check results, and AI verdicts. Never account credentials, never your broker login. All data is anonymized and used solely to improve the AI models. Fully GDPR compliant. Data stored on EU servers.",
  },
  {
    q: "What happens if I lose internet while using an AI upgrade?",
    a: "PHANTOM fails safe. If the connection drops, Airbag lets trades through rather than blocking them. DSS will pause AI signals but your base strategies keep running. Your trades are never stuck or locked because of a connection issue.",
  },
  {
    q: "Can I run this on multiple accounts?",
    a: "Up to 5 activations per license. This covers demo + live, multiple brokers, or multiple MT5 installations. If you need more activations for a trading firm or team setup, contact us — we offer volume licensing.",
  },
];

export default function SentinelFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{
        background: "#111111",
        padding: "100px 24px",
      }}
    >
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, #222222 30%, #222222 70%, transparent)",
          maxWidth: 800,
          margin: "0 auto 80px",
        }}
      />

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
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
            Questions
          </div>
          <h2
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontWeight: 900,
              fontSize: "clamp(28px, 3.5vw, 48px)",
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              margin: 0,
            }}
          >
            Frequently asked.
          </h2>
        </div>

        {/* FAQ items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                style={{
                  background: isOpen ? "#0a0a0a" : "transparent",
                  border: `1px solid ${isOpen ? "rgba(212,175,55,0.2)" : "#222222"}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 24px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-fraunces), serif",
                      fontWeight: 600,
                      fontSize: 16,
                      color: isOpen ? "#f5f5f5" : "#f5f5f5",
                      lineHeight: 1.4,
                    }}
                  >
                    {faq.q}
                  </span>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: `1px solid ${isOpen ? "rgba(212,175,55,0.4)" : "#222222"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: isOpen ? "#d4af37" : "#888888",
                      fontSize: 16,
                      fontWeight: 300,
                      transition: "all 0.2s",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      fontFamily: "var(--font-inter), sans-serif",
                    }}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: "0 24px 24px",
                      fontSize: 15,
                      color: "#888888",
                      lineHeight: 1.75,
                      fontFamily: "var(--font-inter), sans-serif",
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
