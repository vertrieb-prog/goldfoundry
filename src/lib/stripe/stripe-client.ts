// src/lib/stripe/stripe-client.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Abo-Tiers — Stripe Price IDs werden in .env gesetzt
export const PLANS = {
  analyzer: {
    name: "Analyzer",
    price: 9,
    priceId: process.env.STRIPE_PRICE_ANALYZER!,
    features: ["Trade-History Upload + Analyse", "1 MT-Account", "FORGE AI (5/Tag)", "Community Read-Only", "Leaderboard"],
  },
  copier: {
    name: "Copier",
    price: 29,
    priceId: process.env.STRIPE_PRICE_COPIER!,
    features: ["Alles aus Analyzer", "AI Copier (1 Account)", "7-Faktor Risk Engine", "Market Intel Feed", "News Auto-Pause", "FORGE AI (unbegrenzt)", "Affiliate Link"],
    popular: true,
  },
  pro: {
    name: "Pro Trader",
    price: 79,
    priceId: process.env.STRIPE_PRICE_PRO!,
    features: ["Alles aus Copier", "AI Copier (5 Accounts)", "MQL4/MQL5 Upload + AI-Optimierung", "Backtest-Analyse", "Strategy Marketplace", "MLM Trader Partner", "Priority Support"],
  },
  provider: {
    name: "Signal Provider",
    price: 149,
    priceId: process.env.STRIPE_PRICE_PROVIDER!,
    features: ["Alles aus Pro", "Unbegrenzte Follower", "Profit-Abrechnung", "Branded Landing Page", "API Zugang", "Whitelabel-Option", "Dedicated Manager"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
