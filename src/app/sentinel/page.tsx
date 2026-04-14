import type { Metadata } from "next";
import SentinelHero from "./components/SentinelHero";
import SentinelProducts from "./components/SentinelProducts";
import SentinelEcosystem from "./components/SentinelEcosystem";
import SentinelProductLinks from "./components/SentinelProductLinks";
import SentinelHowItWorks from "./components/SentinelHowItWorks";
import SentinelPricing from "./components/SentinelPricing";
import SentinelBlogTeaser from "./components/SentinelBlogTeaser";
import SentinelTrialForm from "./components/SentinelTrialForm";
import SentinelFAQ from "./components/SentinelFAQ";
import SentinelFooter from "./components/SentinelFooter";
import SentinelNav from "./components/SentinelNav";
import MQL5TrustStrip from "./components/MQL5TrustStrip";

const title = "PHANTOM Suite — 28 EAs Live on MQL5 Market | MT4+MT5";
const description =
  "The complete EA suite for MT4 and MT5 traders. 14 products, 28 listings live on the MQL5 Market — Guardian, News Shield, Trail Pro, Airbag, DSS, Copier and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sentinel" },
  openGraph: {
    type: "website",
    title,
    description,
    url: "/sentinel",
    images: ["/sentinel/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/sentinel/og-default.png"],
  },
};

export default function SentinelPage() {
  return (
    <>
      <SentinelNav />
      <main>
        <SentinelHero />
        <MQL5TrustStrip />
        <SentinelProducts />
        <SentinelEcosystem />
        <SentinelProductLinks />
        <SentinelHowItWorks />
        <SentinelPricing />
        <SentinelBlogTeaser />
        <SentinelTrialForm />
        <SentinelFAQ />
      </main>
      <SentinelFooter />
    </>
  );
}
