---
name: new-page
description: Create a new SEO page for Gold Foundry. Types: asset-guide, blog, glossary, comparison, news, strategy. Automatically adds Schema.org, auto-links, risk disclaimer, and hreflang.
---
Erstelle eine neue SEO-Seite. Nutze den seo-content Skill für die Regeln.

Parameter: /new-page [typ] [thema]
Beispiele:
  /new-page asset-guide bitcoin
  /new-page blog "Copy Trading Steuer Deutschland"
  /new-page glossary "Trailing Stop"
  /new-page comparison "Bitcoin vs Ethereum"

Schritte:
1. Generiere den Content mit cachedCall + PROMPTS.seoContent
2. Wende autoLink() an
3. Füge Schema.org JSON-LD hinzu
4. Füge Risikohinweis hinzu
5. Speichere in Supabase seo_pages Tabelle
6. Aktualisiere die Sitemap
7. Zeige die fertige Seite URL
