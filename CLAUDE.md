# GOLD FOUNDRY — CLAUDE.md

## Project
Gold Foundry (goldfoundry.de) — THE Trading Portal. Forex + Crypto + Indices + Commodities.
Next.js 14 App Router + Supabase + MetaApi + Anthropic + Cryptomus + Stripe.
All-in-One: Smart Copier, AI Mentor, Risk Shield, Partner MLM, SEO Engine.

## Architecture
- `src/lib/config.ts` — Central config (MODELS, PRICING, TIERS, EXCHANGES, ASSETS)
- `src/lib/supabase-admin.ts` — ONE Supabase admin client (singleton)
- `src/lib/ai/cached-client.ts` — ONE Anthropic client (cached, compressed prompts)
- NEVER create new Anthropic() or createClient() anywhere else

## Rules
- Brand: "Gold Foundry", "FORGE Mentor", "Smart Copier", "Risk Shield"
- NEVER: "AI Copier", "FORGE AI", "AI Agent", "GRATIS", "$" prices
- Prices ALWAYS in € (Euro). Commission: "Bis zu 50%"
- Every customer-facing page MUST have Risikohinweis
- FORGE Points: 1 FP = €0.10. Internal currency for everything.
- Every file < 300 lines. Split if bigger.
- Imports: @/lib/config, @/lib/supabase-admin, @/lib/ai/cached-client

## Build
```bash
npm run build  # Must pass before every commit
```

## Agent Teams
Use orchestrator for complex tasks. Sub-agents work in worktrees.
Backend + Frontend + SEO + Crypto can run in parallel.

## Sub-Agent Routing
- Backend/API/Cron → backend-engineer
- UI/Dashboard/Pages → frontend-engineer  
- SEO/Content/LPs → seo-engineer
- Trading logic → trading-specialist
- MLM/Partner/Points → mlm-engineer
- Crypto/Exchange → crypto-engineer
- Tests/QA → qa-tester
- Deploy → devops-engineer
- Multi-task → orchestrator (dispatches to others)

## Compact Instructions
When context hits 60%: Focus on 1) current task 2) file being edited 3) build status 4) brand rules 5) agent routing. Read MEMORY.md for brand context.

## Key Directories
```
src/lib/          — All backend logic
src/lib/mlm/      — MLM/Partner/Commission engines
src/lib/points/   — FORGE Points system
src/lib/crypto/   — Crypto-specific modules
src/lib/exchanges/— Exchange connectors (Binance, Bybit, etc.)
src/lib/partner/  — Partner experience (coach, shares, screenshots)
src/app/          — Next.js pages + API routes
src/app/admin/    — Admin dashboards (CRM, Payouts, KYC)
src/app/dashboard/partner/ — Partner dashboard (7 tabs)
src/app/crypto/   — Crypto landing pages + tools
src/app/exchange/ — Exchange-specific LPs
src/app/vergleich/— Comparison pages (SEO)
src/app/asset/    — Asset-specific LPs
src/app/trader/   — Trader LPs (with ?ref= support)
src/app/partner/  — Public partner LPs
```
