import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Gold Foundry — Trading Terminal",
  description: "Autonomes Trading-Ökosystem. Copier, Strategy Lab, Market Intel. Der neue Branchenstandard.",
  keywords: "gold trading, smart copier, prop firm, xauusd, forex ai, metatrader, trading bot, gold foundry",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FAEF70" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
