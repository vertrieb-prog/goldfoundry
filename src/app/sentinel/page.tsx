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
