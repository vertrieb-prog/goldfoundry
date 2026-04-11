import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

export const metadata: Metadata = {
  title: "PHANTOM — AI Trading Intelligence for MT5",
  description: "PHANTOM is the AI safety net for MT5 traders. 41 intelligent checks plus Haiku Brain validation on every trade. Protecting capital daily.",
  keywords: "phantom trading, mt5 ea, trading ai, airbag ea, prop firm, xauusd, forex protection, metatrader filter",
};

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "900"],
  variable: "--font-fraunces",
  axes: ["opsz"],
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
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#d4af37" />
      </head>
      <body
        style={{
          fontFamily: "var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif",
          background: "#0a0a0a",
          color: "#f5f5f5",
          margin: 0,
          padding: 0,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          lineHeight: "1.6",
          scrollBehavior: "smooth",
        }}
      >
        {children}
      </body>
    </html>
  );
}
