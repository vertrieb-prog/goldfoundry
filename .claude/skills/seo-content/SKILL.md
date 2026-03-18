---
name: seo-content
description: Create or modify SEO pages, blog articles, news, glossary, comparisons, strategy pages, tools, forecasts, or any content page. Also covers sitemap generation, Schema.org structured data, hreflang tags, internal linking, and multi-language translation. Use when working on src/lib/seo/, src/app/(seo)/, or any content generation.
---

# SEO Content Engine

## Page Types & Routes
| Type | Route | Frequency | AI Needed |
|------|-------|-----------|-----------|
| Asset Guide | /trading/[asset] | Once, updated monthly | Yes (Haiku) |
| Daily Price | /kurs/[asset] | Daily | No (Template) |
| Forecast | /prognose/[slug] | Weekly + Monthly | Yes (Haiku) |
| Strategy | /strategie/[slug] | From Intelligence | Yes (Haiku) |
| Comparison | /vergleich/[slug] | Monthly update | Yes (Haiku) |
| Blog | /blog/[slug] | 3×/week | Yes (Haiku) |
| Glossary | /glossar/[slug] | Once | Yes (Haiku) |
| News | /news/[slug] | 3×/day | Yes (Haiku) |
| Tools | /tools/[slug] | Once | No (React) |

## Internal Auto-Linker
Importiere: `import { autoLink } from "@/lib/seo/auto-linker"`
- Max 10 Links pro Seite
- Max 1 Link pro Keyword
- Nicht in H1/H2 linken
- Nicht im Risikohinweis linken
- Höchste Priorität: Produkt-Links (/products/copier)

## Every Page MUST Have
1. `<title>` max 60 chars + `meta description` max 155 chars
2. One H1 tag (unique per page)
3. Schema.org JSON-LD (Article, DefinedTerm, SoftwareApplication)
4. hreflang tags if translations exist
5. Risikohinweis footer
6. ISR: `export const revalidate = 3600` (News: 300)
7. OG Image meta tags

## Content Rules
- NIEMALS Profit versprechen
- IMMER "vergangene Performance ≠ zukünftige Ergebnisse"
- Echte Daten aus Intelligence Engine verwenden
- Keine erfundenen Statistiken
- Quellenangaben wo möglich ("Basierend auf 24.000 analysierten Trades")

## 200 Assets Covered
Forex (33): EURUSD, GBPUSD, USDJPY, ... + Minors + Exotics
Crypto (45): BTC, ETH, SOL, XRP, BNB, ADA, DOGE, + Midcap + Small
Indices (12): US500, US100, US30, DE40, UK100, JP225, ...
Metals (4): XAUUSD, XAGUSD, XPTUSD, XPDUSD
Energy (3): USOIL, UKOIL, NATGAS
Stocks CFDs (30): AAPL, MSFT, NVDA, TSLA, ...

## Multi-Language (40 Sprachen)
Tier 1 (sofort): DE, EN, AR, TR, ES, PT, ID, MS
Tier 2 (Monat 2): FR, RU, HI, ZH, JA, KO, VI, TH, PL, NL
Tier 3+4: IT, SV, DA, NO, FI, EL, RO, BN, UR, FA, SW, TL, ...

## Token Cost Target
~$0.20/Monat für ALLE SEO-Inhalte. Haiku + Caching.
