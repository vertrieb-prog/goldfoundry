'use client';

import { useState } from "react";

const faqs = [
  {
    q: "Does AIRBAG work with my existing EA?",
    a: "Yes. PHANTOM AIRBAG is broker- and EA-agnostic. It runs as a separate Expert Advisor on the same chart and intercepts signals via a shared memory bridge. No source code access required. If your EA fires signals on MT5, AIRBAG catches them.",
  },
  {
    q: "Is this compatible with prop firms like FTMO?",
    a: "Yes. PHANTOM includes a dedicated Prop Firm mode that enforces challenge rules automatically — daily loss limits, max drawdown, news lockouts. It was built with FTMO, MyForexFunds, and E8 Funding rules in mind. Full compliance documentation available.",
  },
  {
    q: "How does the 14-day trial work?",
    a: "Sign up with your email, receive your license key instantly. Install the EA on your MT5 terminal, enter the key, and PHANTOM activates. Full functionality — live trading, all 41 checks, Haiku Brain enabled. No credit card. No commitment. Cancel by simply not activating after the trial.",
  },
  {
    q: "What data do you collect?",
    a: "Only trade metadata: entry/exit prices, timestamps, check results, and Haiku verdicts. Never account credentials, never your broker login. All data is anonymized and used solely to improve the learning models. Fully GDPR compliant. Data stored on EU servers.",
  },
  {
    q: "Why is the price going up?",
    a: "Standard MQL5 marketplace launch pricing. We launch low to reward early adopters and build social proof. Once we hit 10 sales, prices increase to $69/mo (AIRBAG) and $299 lifetime (DSS). These are locked-in prices for everyone who signs up before the threshold.",
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
