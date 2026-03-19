import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import EmbedWrapper from "@/components/EmbedWrapper";
import SalesFunnel from "@/components/funnel/sales-funnel";

export const metadata: Metadata = {
  title: "Gold Foundry — Dein Trading. Automatisch. Geschützt.",
  description: "Smart Copier + Telegram Signal Copier + FORGE Mentor. Automatisiertes Trading mit 7-Faktor Risk Shield. Ab €2/Monat.",
  keywords: "gold foundry, smart copier, telegram copier, prop firm, xauusd, forex trading, metatrader, trading bot, risk management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d4a537" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <EmbedWrapper />
        {children}
        <SalesFunnel />
        <ChatWidget />
      </body>
    </html>
  );
}
