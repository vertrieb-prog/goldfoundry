---
name: supabase-db
description: Create or modify Supabase database tables, migrations, indexes, RLS policies, queries, or seed data for Gold Foundry. Use when working on supabase/migrations/, writing complex queries, or debugging database issues.
---

# Supabase Database

## Connection
Backend: `import { supabaseAdmin } from "@/lib/supabase-admin"` (service key)
Frontend: `import { createClient } from "@/lib/supabase/client"` (anon key, auth)

## All Tables (30+ total)
**Core:** profiles, user_data, accounts, trades
**CRM:** crm_leads, crm_activities, crm_campaigns, crm_email_queue
**Affiliate:** affiliate_links, affiliate_clicks, affiliate_payouts
**Trading:** collected_trades, collected_signals, market_sentiment
**Telegram:** telegram_channels, telegram_signals
**SEO:** seo_pages
**Support:** support_tickets, ticket_messages
**Config:** symbol_mapping
**Finance:** profit_settlements

## Migration Convention
File: `supabase/migrations/NNN_description.sql`
Always: `CREATE TABLE IF NOT EXISTS`, indexes, `ON DELETE SET NULL|CASCADE`
New migration = next number (currently at 005)

## Common Queries
```typescript
// Get user with profile
const { data: user } = await supabaseAdmin
  .from("profiles").select("*").eq("id", userId).single();

// Get trades with pagination
const { data, count } = await supabaseAdmin
  .from("trades").select("*", { count: "exact" })
  .eq("account_id", accountId)
  .order("open_time", { ascending: false })
  .range(0, 49);

// Upsert SEO page
await supabaseAdmin.from("seo_pages").upsert({
  slug, type, title, content, locale: "de", updated_at: new Date().toISOString()
}, { onConflict: "slug,locale" });

// Intelligence (system data)
const { data } = await supabaseAdmin.from("user_data")
  .select("data").eq("user_id", "00000000-0000-0000-0000-000000000000")
  .eq("category", "gold_intelligence").single();
```
