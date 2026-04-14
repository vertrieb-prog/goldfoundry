import type { Metadata } from "next";

const title = "Phantom Guardian — Prop Firm Risk Manager | MT4+MT5";
const description =
  "Guardian monitors your MT4/MT5 account in real-time and enforces your risk rules automatically. FTMO, MFF, E8 presets — never blow a prop firm challenge because of one bad moment.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sentinel/guardian" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/sentinel/guardian",
    images: ["/sentinel/guardian/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/sentinel/guardian/og.png"],
  },
};

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  return children;
}