import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import EmbedWrapper from "@/components/EmbedWrapper";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "Gold Foundry — Dein Trading. Automatisch. Geschützt.",
  description: "Gold Foundry — KI-gesteuerte Trading-Technologie. 4 Profi-Trader. 100% kostenlos. Reguliert ueber Tegas FX.",
  keywords: "gold foundry, smart copier, telegram copier, prop firm, xauusd, forex trading, metatrader, trading bot, risk management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FAEF70" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <EmbedWrapper />
        {children}
        <ChatWidget />
        <CookieBanner />
      </body>
    </html>
  );
}
