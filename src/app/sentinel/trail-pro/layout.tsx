import type { Metadata } from "next";

const title = "Phantom Trail Pro — Smart Trailing Stop | MT4+MT5";
const description =
  "Trail Pro replaces your basic trailing stop with a 4-step ATR-based system that locks in profit in stages. Partial closes, break-even with buffer, symbol-aware defaults — all automatic.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sentinel/trail-pro" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/sentinel/trail-pro",
    images: ["/sentinel/trail-pro/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/sentinel/trail-pro/og.png"],
  },
};

export default function TrailProLayout({ children }: { children: React.ReactNode }) {
  return children;
}