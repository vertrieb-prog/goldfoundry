# GOLD FOUNDRY — CLAUDE.md

## Project
Gold Foundry (goldfoundry.de) — THE Trading Portal. Forex + Crypto + Indices + Commodities.
Tegas FX White-Label Partner. 100% kostenlos fuer User.
Next.js 14 App Router + Supabase + MetaApi + Anthropic + Stripe.
All-in-One: Trade Management Engine, AI Mentor, Risk Shield, Forge Traders.

## Architecture
- `src/lib/config.ts` — Central config (MODELS, PRICING, TIERS, EXCHANGES, ASSETS)
- `src/lib/supabase-admin.ts` — ONE Supabase admin client (singleton)
- `src/lib/ai/cached-client.ts` — ONE Anthropic client (cached, compressed prompts)
- NEVER create new Anthropic() or createClient() anywhere else

## Rules
- Brand: "Gold Foundry", "FORGE Mentor", "Trade Management Engine", "Risk Shield"
- Technologie-Anbieter IMMER, Finanzdienstleister NIEMALS
- NEVER: "AI Copier", "FORGE AI", "AI Agent", "GRATIS", "$" prices
- Prices ALWAYS in EUR (Euro). Commission: "Bis zu 50%"
- Every customer-facing page MUST have Risikohinweis
- FORGE Points: 1 FP = EUR 0.10. Internal currency for everything.
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
- MLM/Partner/Points → mlm-engineer (UI removed, backend active)
- Crypto/Exchange → crypto-engineer (UI removed, backend active)
- Tests/QA → qa-tester
- Deploy → devops-engineer
- Multi-task → orchestrator (dispatches to others)

## Compact Instructions
When context hits 60%: Focus on 1) current task 2) file being edited 3) build status 4) brand rules 5) agent routing. Read MEMORY.md for brand context.

## Key Directories
```
src/lib/          — All backend logic
src/lib/mlm/      — MLM/Partner/Commission engines (backend crons only)
src/lib/points/   — FORGE Points system
src/lib/crypto/   — Crypto-specific modules (backend crons only)
src/lib/exchanges/— Exchange connectors (Binance, Bybit, etc.)
src/lib/partner/  — (removed from UI)
src/app/          — Next.js pages + API routes
src/app/admin/    — Admin dashboards (CRM, Payouts, KYC)
src/app/dashboard/— User dashboard (Trader, Engine, Trades, Chat, etc.)
src/app/api/affiliate/  — (removed from UI)
src/app/api/crypto/     — (removed from UI)
src/app/api/cryptomus/  — (removed from UI)
src/app/api/partner/    — (removed from UI)
src/app/api/profit-sharing/ — (removed from UI)
src/app/api/leaderboard/   — (removed from UI)
src/app/api/sales/      — (removed from UI)
src/app/api/seo/        — (removed from UI)
src/app/api/funnel/     — (removed from UI)
src/app/api/strategy/   — (removed from UI)
```
