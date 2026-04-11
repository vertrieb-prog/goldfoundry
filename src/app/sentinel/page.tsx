import SentinelHero from "./components/SentinelHero";
import SentinelProducts from "./components/SentinelProducts";
import SentinelHowItWorks from "./components/SentinelHowItWorks";
import SentinelPricing from "./components/SentinelPricing";
import SentinelTrialForm from "./components/SentinelTrialForm";
import SentinelFAQ from "./components/SentinelFAQ";
import SentinelFooter from "./components/SentinelFooter";
import SentinelNav from "./components/SentinelNav";

export default function SentinelPage() {
  return (
    <>
      <SentinelNav />
      <main>
        <SentinelHero />
        <SentinelProducts />
        <SentinelHowItWorks />
        <SentinelPricing />
        <SentinelTrialForm />
        <SentinelFAQ />
      </main>
      <SentinelFooter />
    </>
  );
}
