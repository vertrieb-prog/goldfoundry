import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

export const metadata: Metadata = {
  title: "PHANTOM — The Complete EA Suite for MT5 Traders",
  description: "PHANTOM is the only EA suite you need for MT5. 5 tools that work together to make every trade safer. Base versions work offline. Add AI power when you are ready.",
  keywords: "phantom trading, mt5 ea suite, trading ai, airbag ea, prop firm, xauusd, forex protection, metatrader filter, ea suite",
};

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export default function SentinelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      style={{
        fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#0a0a0a",
        color: "#f5f5f5",
        minHeight: "100vh",
        WebkitFontSmoothing: "antialiased",
        lineHeight: "1.6",
        scrollBehavior: "smooth",
      }}
    >
      {children}
    </div>
  );
}
