import type { Metadata } from "next";

const SITE_URL = "https://goldfoundry.de";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PHANTOM Suite — 28 EAs Live on MQL5 Market | MT4+MT5",
    template: "%s",
  },
  description:
    "PHANTOM is the complete EA suite for MT4 and MT5 traders. 14 products, 28 listings on the MQL5 Market — Guardian, News Shield, Trail Pro, Airbag, DSS, Copier and more.",
  keywords:
    "phantom trading, mt5 ea suite, mt4 ea suite, trading ai, airbag ea, prop firm, xauusd, forex protection, metatrader filter, mql5 market",
  alternates: {
    canonical: "/sentinel",
  },
  openGraph: {
    type: "website",
    siteName: "PHANTOM Suite",
    title: "PHANTOM Suite — 28 EAs Live on MQL5 Market | MT4+MT5",
    description:
      "The complete EA suite for MT4 and MT5 traders. 14 products, 28 listings on the MQL5 Market.",
    images: ["/sentinel/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PHANTOM Suite — 28 EAs Live on MQL5 Market | MT4+MT5",
    description:
      "The complete EA suite for MT4 and MT5 traders. 14 products, 28 listings on the MQL5 Market.",
    images: ["/sentinel/og-default.png"],
  },
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