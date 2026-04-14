import type { Metadata } from "next";

const title = "Phantom News Shield — News Filter EA | MT4+MT5";
const description =
  "News Shield reads the MT4/MT5 economic calendar and automatically protects your trades before high-impact events. Close positions, tighten stops, or pause your EAs — hands-free.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sentinel/news-shield" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/sentinel/news-shield",
    images: ["/sentinel/news-shield/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/sentinel/news-shield/og.png"],
  },
};

export default function NewsShieldLayout({ children }: { children: React.ReactNode }) {
  return children;
}