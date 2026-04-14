import type { Metadata } from "next";

const title = "Phantom Trader DSS — Autonomous AI Trader | MT4+MT5";
const description =
  "DSS analyzes the market continuously with 13 independent strategies, scores setups by AI confidence, and executes on MT4/MT5. Auto, Semi-Auto, or Manual — you choose the control level.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sentinel/dss" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/sentinel/dss",
    images: ["/sentinel/dss/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/sentinel/dss/og.png"],
  },
};

export default function DssLayout({ children }: { children: React.ReactNode }) {
  return children;
}