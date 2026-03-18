---
name: frontend-design
description: Build or modify customer-facing pages, dashboard views, landing pages, or any React/TSX UI component for Gold Foundry. Ensures brand compliance, correct naming, risk disclaimers, and proper server/client separation. Use when working in src/app/, src/components/, or any .tsx file.
---

# Frontend Design System

## Colors (Tailwind Custom)
```css
--bg: #060503;     --gold: #d4a537;    --gold-dark: #b8941f;
--text: #e0d4b8;   --text-dim: #c8b898; --text-dark: #8a7a5a;
--green: #22c55e;  --red: #ef4444;
--border: rgba(212,165,55,0.08);
```

## Typography
- Numbers/Data: `font-family: 'JetBrains Mono', monospace`
- Body/Headers: `font-family: 'Outfit', sans-serif`
- H1: 32-48px bold | H2: 24-28px semibold | Body: 14-16px

## Component Pattern
```tsx
// Server Component (default in App Router)
export default async function TradingPage() {
  const { data } = await supabaseAdmin.from("...").select("*");
  return <div>...</div>;
}

// Client Component (für Interaktivität)
"use client";
import { useState } from "react";
// NIEMALS importieren: @anthropic-ai/sdk, metaapi, telegram, supabase-admin
```

## Risikohinweis Footer (JEDE Seite)
```tsx
<footer className="mt-8 p-4 rounded-lg" style={{
  background: "#0a0906", border: "1px solid rgba(212,165,55,0.06)",
  fontSize: 10, color: "#8a7a5a", lineHeight: 1.6
}}>
  <strong style={{ color: "#c8b898" }}>Risikohinweis:</strong>{" "}
  Vergangene Performance ist kein verlässlicher Indikator für zukünftige
  Ergebnisse. Trading birgt erhebliche Verlustrisiken.
</footer>
```

## Naming in UI (KRITISCH)
Suche-und-Ersetze bei jedem UI-Text:
- "AI Copier" → "Smart Copier"
- "FORGE AI" → "FORGE Mentor"
- "AI Agent" → "FORGE Agent"  
- "GRATIS" → "80% Rabatt"
- "30% Provision" → "Bis zu 50% Provision"
- "$29" → "€29"

## Pricing Display
```tsx
<div>
  <span className="text-3xl font-bold" style={{color:"#d4a537"}}>€29</span>
  <span className="text-sm" style={{color:"#8a7a5a"}}>/Monat</span>
  <div className="text-xs" style={{color:"#22c55e"}}>
    80% Rabatt im 1. Monat — nur €6
  </div>
</div>
```
