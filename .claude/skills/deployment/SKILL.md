---
name: deployment
description: Deploy Gold Foundry to Vercel, fix build errors, configure environment variables, manage crons, or troubleshoot deployment issues. Use when running npm run build, debugging TypeScript errors, configuring Vercel, or pushing to production.
---

# Deployment & Build

## Build Command
```bash
npm run build   # MUST pass before every commit
```

## Common Build Errors & Fixes

### "Module not found: Can't resolve 'fs'"
Server-only package imported in client component.
Fix: Move import to src/lib/ or add to next.config.js:
```js
experimental: {
  serverComponentsExternalPackages: ['@anthropic-ai/sdk', 'metaapi.cloud-sdk', 'telegram']
}
```

### TypeScript Errors
Fix properly. Emergency fallback (TEMPORARY):
```js
// next.config.js
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

### Missing Dependencies
```bash
npm install @anthropic-ai/sdk metaapi.cloud-sdk telegram @supabase/supabase-js
```

## Environment Variables (ALL required)
```
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon key (public)
SUPABASE_SERVICE_KEY=             # Supabase service key (secret!)
ANTHROPIC_API_KEY=                # Claude API key
METAAPI_TOKEN=                    # MetaApi token
STRIPE_SECRET_KEY=                # Stripe secret
STRIPE_WEBHOOK_SECRET=            # Stripe webhook
CRYPTOMUS_MERCHANT_ID=            # Cryptomus merchant
CRYPTOMUS_API_KEY=                # Cryptomus key
RESEND_API_KEY=                   # Email via Resend
CRON_SECRET=                      # Auth for cron routes
TELEGRAM_API_ID=                  # Telegram app ID
TELEGRAM_API_HASH=                # Telegram app hash
TELEGRAM_SESSION=                 # GramJS session string
```

NEXT_PUBLIC_ vars MUST be set BEFORE build on Vercel.

## Vercel Config
```json
// vercel.json
{ "crons": [{ "path": "/api/cron/master", "schedule": "0 * * * *" }] }
```
ONE master cron that orchestrates all sub-jobs.

## Deploy Checklist
1. `npm run build` passes locally
2. All env vars in Vercel dashboard
3. vercel.json is valid JSON
4. No server-only imports in client code
5. Node.js 18.x (in package.json engines or Vercel settings)
6. git push → Vercel auto-deploys
