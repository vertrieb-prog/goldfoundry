import type { Metadata } from "next";

const title = "Phantom Airbag — AI Trade Filter | MT4+MT5";
const description =
  "Airbag intercepts every MT4/MT5 trade before execution and runs 41 AI-powered checks in under 500ms. Spread, session, news, volume, correlation — bad context, no trade.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sentinel/airbag" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/sentinel/airbag",
    images: ["/sentinel/airbag/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/sentinel/airbag/og.png"],
  },
};

export default function AirbagLayout({ children }: { children: React.ReactNode }) {
  return children;
}