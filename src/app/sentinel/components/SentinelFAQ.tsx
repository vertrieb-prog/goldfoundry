'use client';

import { useState } from "react";

const faqs = [
  {
    q: "Will Airbag work with the paid EA I already bought on MQL5?",
    a: "Yes. Airbag doesn't need your EA's source. It runs as its own Expert Advisor on the same chart and hooks OrderSend via a shared-memory bridge. Any EA that places orders through the standard MT5 trade pool gets intercepted. Magic number filters let you pick which EAs get checked and which pass through.",
  },
  {
    q: "What's the actual difference between Base and AI?",
    a: "Base is a compiled EX5 from the MQL5 Market, one payment, no internet, no keys. Every rule-based feature is in Base — the daily loss cap, the ATR trail, the news-shield logic. AI is a separate monthly subscription that pattern-matches on your own trade log and sends a weekly PDF. You can own Base for a year and never touch AI. Nothing degrades if you don't.",
  },
  {
    q: "Does this actually pass FTMO rules?",
    a: "Guardian has presets for FTMO, MyForexFunds, E8, and FundedNext. It enforces daily loss, max drawdown from peak equity, minimum trading days, and weekend flat. News Shield handles the news-lockout windows where FTMO bans trading. If you want the exact rule mapping, the Guardian page has it documented.",
  },
  {
    q: "How does the 14-day trial work?",
    a: "Email in, license key out. Install the EA, paste the key, done. Full functionality, live accounts allowed, AI features on. No card, no auto-charge. If you don't like it, don't buy the MQL5 listing — the license just stops working on day 15.",
  },
  {
    q: "Do I have to buy all six?",
    a: "No. Most people start with one. FTMO candidates buy Guardian first. Traders running a paid EA they mistrust start with Airbag. Scalpers buy Trail Pro. Everything works standalone.",
  },
  {
    q: "What do you collect?",
    a: "Order metadata: symbol, lot, entry, SL, TP, check results, verdict. No login credentials, no broker passwords, no MT5 investor access. Hosted in Frankfurt. GDPR compliant because it's built in Germany by someone who has to live under those rules.",
  },
  {
    q: "My internet dropped mid-trade. What now?",
    a: "Airbag fails open — if it can't reach the cloud for AI checks, the trade goes through. DSS pauses AI signals and keeps running its 5 local strategies. Guardian and News Shield don't need internet at all. Nothing stays locked because of a dead connection.",
  },
  {
    q: "How many accounts per license?",
    a: "5 activations. Covers demo + live, two brokers, a laptop and a VPS — that kind of setup. Firms and prop teams, email and ask for volume licensing.",
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
              fontFamily: "'JetBrains Mono', monospace",
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
              fontFamily: "'Inter', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(28px, 3.5vw, 48px)",
              letterSpacing: "-0.02em",
              color: "#f5f5f5",
              margin: 0,
            }}
          >
            Things people actually ask.
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
                      fontFamily: "'Inter', sans-serif",
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
                      fontFamily: "'Inter', sans-serif",
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
                      fontFamily: "'Inter', sans-serif",
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
