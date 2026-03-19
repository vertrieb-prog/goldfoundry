import type { Metadata } from "next";
import HeroLanding from "@/components/landing/HeroLanding";

export const metadata: Metadata = {
  title: "Gold Foundry — Dein Trading. Automatisch. Geschützt.",
  description: "Smart Copier, FORGE Mentor, 7-Faktor Risk Shield. Automatisiertes Trading mit professionellem Risikomanagement. Ab €2/Monat.",
  keywords: "gold foundry, smart copier, telegram copier, prop firm, xauusd, forex trading, metatrader, trading bot, risk management",
};

export default function HomePage() {
  return <HeroLanding />;
}
