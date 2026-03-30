import { Metadata } from "next";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import LiveTickerBar from "@/components/landing/LiveTickerBar";
import TradeEngineSection from "@/components/landing/TradeEngineSection";
import LeverageCalculator from "@/components/landing/LeverageCalculator";
import TraderProfiles from "@/components/landing/TraderProfiles";
import ComparisonSection from "@/components/landing/ComparisonSection";
import KostenlosSection from "@/components/landing/KostenlosSection";
import FAQSection from "@/components/landing/FAQSection";

export const metadata: Metadata = {
  title: "Gold Foundry — Dein Trade geht rein. Unsere KI managt ihn.",
  description: "4 Profi-Trader. 13 KI-Strategien. 9 Safety Features. Bis zu 24x Hebel. 100% kostenlos. Reguliert ueber Tegas FX.",
  keywords: "gold foundry, trading, ki trading, copy trading, xauusd, forex, tegas fx, trade management",
};

export default function HomePage() {
  return (
    <main>
      <LandingNavbar />
      <HeroSection />
      <LiveTickerBar />
      <TradeEngineSection />
      <LeverageCalculator />
      <TraderProfiles />
      <ComparisonSection />
      <KostenlosSection />
      <FAQSection />
    </main>
  );
}
