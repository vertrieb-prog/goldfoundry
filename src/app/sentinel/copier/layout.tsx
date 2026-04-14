import type { Metadata } from "next";

const title = "Phantom Copier — Smart Trade Copier | MT4+MT5";
const description =
  "Copy trades from any MT4/MT5 account to any other — same broker, different broker, even different continent. Master-Follower setup with smart lot scaling and under 2 second latency.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sentinel/copier" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/sentinel/copier",
    images: ["/sentinel/copier/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/sentinel/copier/og.png"],
  },
};

export default function CopierLayout({ children }: { children: React.ReactNode }) {
  return children;
}