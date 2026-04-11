import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PHANTOM — The Complete EA Suite for MT5 Traders",
  description: "PHANTOM is the only EA suite you need for MT5. 5 tools that work together to make every trade safer. Base versions work offline. Add AI power when you are ready.",
  keywords: "phantom trading, mt5 ea suite, trading ai, airbag ea, prop firm, xauusd, forex protection, metatrader filter, ea suite",
};

export default function SentinelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#0a0a0a",
        color: "#f5f5f5",
        minHeight: "100vh",
        WebkitFontSmoothing: "antialiased",
        lineHeight: "1.6",
      }}
    >
      {children}
    </div>
  );
}
