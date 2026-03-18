-- ═══════════════════════════════════════════════════════════════
-- GOLD FOUNDRY — COMPLETE DATABASE MIGRATION
-- Run this ONCE in Supabase SQL Editor
-- Creates ALL tables for: Data Collection, Intelligence,
-- SEO Engine, CRM, Support, Affiliate Payouts
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. DATA COLLECTION (MQL5, MyFxBook, Telegram, Tracker)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS collected_trades (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,               -- 'mql5', 'myfxbook', 'telegram', 'tracker'
  source_id TEXT NOT NULL,            -- Signal/Account ID
  source_name TEXT,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,            -- 'BUY' or 'SELL'
  open_time TEXT,
  close_time TEXT,
  open_price NUMERIC,
  close_price NUMERIC,
  lots NUMERIC,
  sl NUMERIC,
  tp NUMERIC,
  profit NUMERIC,
  pips NUMERIC,
  commission NUMERIC DEFAULT 0,
  swap NUMERIC DEFAULT 0,
  collected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id, open_time, symbol)
);

CREATE TABLE IF NOT EXISTS collected_signals (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  name TEXT,
  growth NUMERIC,
  reliability NUMERIC,
  subscribers INTEGER,
  price NUMERIC,
  trades_count INTEGER,
  win_rate NUMERIC,
  profit_factor NUMERIC,
  max_dd NUMERIC,
  url TEXT,
  collected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id)
);

CREATE TABLE IF NOT EXISTS market_sentiment (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  symbol TEXT NOT NULL,
  long_pct NUMERIC,
  short_pct NUMERIC,
  long_volume NUMERIC,
  short_volume NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Indexes for data collection
CREATE INDEX IF NOT EXISTS idx_ct_symbol ON collected_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_ct_source ON collected_trades(source);
CREATE INDEX IF NOT EXISTS idx_ct_direction ON collected_trades(direction);
CREATE INDEX IF NOT EXISTS idx_ct_open_time ON collected_trades(open_time);
CREATE INDEX IF NOT EXISTS idx_ct_collected ON collected_trades(collected_at);
CREATE INDEX IF NOT EXISTS idx_ms_symbol ON market_sentiment(symbol);
CREATE INDEX IF NOT EXISTS idx_ms_timestamp ON market_sentiment(timestamp DESC);


-- ─────────────────────────────────────────────────────────────
-- 2. SEO ENGINE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seo_pages (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL,
  type TEXT NOT NULL,                  -- news, blog, strategy, compare, glossary, event, tool, asset, forecast
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[],
  locale TEXT DEFAULT 'de',
  meta_title TEXT,                     -- SEO meta title (if different from title)
  meta_description TEXT,               -- SEO meta description
  og_image TEXT,                       -- Open Graph image URL
  internal_links TEXT[],               -- Auto-generated internal links
  views INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug, locale)
);

CREATE INDEX IF NOT EXISTS idx_seo_type ON seo_pages(type);
CREATE INDEX IF NOT EXISTS idx_seo_locale ON seo_pages(locale);
CREATE INDEX IF NOT EXISTS idx_seo_published ON seo_pages(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_category ON seo_pages(category);
CREATE INDEX IF NOT EXISTS idx_seo_slug ON seo_pages(slug);


-- ─────────────────────────────────────────────────────────────
-- 3. CRM — LEADS & LIFECYCLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT,
  name TEXT,
  status TEXT DEFAULT 'visitor',       -- visitor, registered, trial, active, churned, paused
  plan TEXT,                           -- copier, starter, pro, unlimited, partner, free
  score INTEGER DEFAULT 0,             -- Lead Score 0-100
  source TEXT,                         -- organic, referral, partner, telegram, ad, social
  source_detail TEXT,                  -- Which page, which partner, which campaign
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  tags TEXT[],                         -- ["gold", "prop-firm", "beginner"]
  language TEXT DEFAULT 'de',
  country TEXT,
  broker TEXT,                         -- tag, tegas, standard, none
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  last_action TEXT,
  churn_risk INTEGER DEFAULT 0,        -- 0-100
  lifetime_value NUMERIC DEFAULT 0,    -- Total revenue from this user
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- crm_activities already created in 002_crm_schema.sql (UUID PK)
-- crm_campaigns already created in 002_crm_schema.sql (UUID PK)
-- Adding lead-specific columns if not present
ALTER TABLE crm_campaigns ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE crm_campaigns ADD COLUMN IF NOT EXISTS segment JSONB;
ALTER TABLE crm_campaigns ADD COLUMN IF NOT EXISTS subject_template TEXT;
ALTER TABLE crm_campaigns ADD COLUMN IF NOT EXISTS body_template TEXT;
ALTER TABLE crm_campaigns ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE crm_campaigns ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0;
ALTER TABLE crm_campaigns ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0;
ALTER TABLE crm_campaigns ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE crm_campaigns ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS crm_email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES crm_campaigns(id),
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending',       -- pending, sent, opened, clicked, bounced, failed
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- CRM Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_plan ON crm_leads(plan);
CREATE INDEX IF NOT EXISTS idx_leads_score ON crm_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_churn ON crm_leads(churn_risk DESC);
-- crm_activities indexes already created in 002_crm_schema.sql
CREATE INDEX IF NOT EXISTS idx_email_status ON crm_email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_scheduled ON crm_email_queue(scheduled_at);


-- ─────────────────────────────────────────────────────────────
-- 4. SUPPORT TICKETS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category TEXT,                       -- broker, copier, billing, technical, general, signals
  priority TEXT DEFAULT 'medium',      -- low, medium, high, critical
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',          -- open, in_progress, waiting_user, resolved, closed
  assigned_to TEXT,
  resolution TEXT,
  satisfaction INTEGER,                -- 1-5 stars after resolution
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ       -- For SLA tracking
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,                -- 'user' or 'support' or 'system'
  message TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_ticket_msgs ON ticket_messages(ticket_id);


-- ─────────────────────────────────────────────────────────────
-- 5. AFFILIATE PAYOUTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id BIGSERIAL PRIMARY KEY,
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'EUR',
  period_start DATE,
  period_end DATE,
  trades_count INTEGER DEFAULT 0,      -- How many trades generated this payout
  referrals_count INTEGER DEFAULT 0,   -- How many active referrals
  tier TEXT,                           -- bronze, silber, gold, diamond
  status TEXT DEFAULT 'pending',       -- pending, processing, paid, failed
  payment_method TEXT,                 -- crypto_btc, crypto_usdt, crypto_eth, bank_transfer
  payment_address TEXT,                -- Wallet or IBAN
  payment_ref TEXT,                    -- Transaction hash or reference
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- affiliate_payouts indexes already created in 003_affiliate_schema.sql


-- ─────────────────────────────────────────────────────────────
-- 6. SYMBOL MAPPING (per broker)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS symbol_mapping (
  id BIGSERIAL PRIMARY KEY,
  broker TEXT NOT NULL,                -- 'tag', 'tegas', 'icmarkets', 'pepperstone'
  standard_symbol TEXT NOT NULL,       -- 'XAUUSD'
  broker_symbol TEXT NOT NULL,         -- 'GOLD', 'GOLDm', 'XAUUSDm', 'XAUUSD.a'
  pip_value NUMERIC,
  digits INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(broker, standard_symbol)
);

-- Pre-populate common mappings
INSERT INTO symbol_mapping (broker, standard_symbol, broker_symbol, pip_value, digits) VALUES
  ('tag', 'XAUUSD', 'XAUUSD', 0.1, 2),
  ('tag', 'US500', 'US500', 0.01, 2),
  ('tegas', 'XAUUSD', 'XAUUSD', 0.1, 2),
  ('tegas', 'US500', 'US500.a', 0.01, 2),
  ('icmarkets', 'XAUUSD', 'XAUUSD', 0.1, 2),
  ('icmarkets', 'EURUSD', 'EURUSD', 0.0001, 5),
  ('icmarkets', 'BTCUSD', 'BTCUSD', 0.01, 2),
  ('pepperstone', 'XAUUSD', 'XAUUSD', 0.1, 2),
  ('pepperstone', 'EURUSD', 'EURUSD', 0.0001, 5)
ON CONFLICT (broker, standard_symbol) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 7. TELEGRAM CHANNEL TRACKING
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS telegram_channels (
  id BIGSERIAL PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT,
  status TEXT DEFAULT 'pending',       -- pending, scanning, verified, blocked, watching
  scan_result JSONB,                   -- Channel Scanner output
  total_signals INTEGER DEFAULT 0,
  win_rate NUMERIC,
  profit_factor NUMERIC,
  avg_rr NUMERIC,
  fake_signals_detected INTEGER DEFAULT 0,
  last_signal_at TIMESTAMPTZ,
  added_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telegram_signals (
  id BIGSERIAL PRIMARY KEY,
  channel_id TEXT REFERENCES telegram_channels(channel_id),
  message_id BIGINT,
  raw_message TEXT,
  parsed JSONB,                        -- ParsedSignal JSON
  execution_result JSONB,              -- What happened (orders placed, etc)
  profit NUMERIC,
  status TEXT DEFAULT 'parsed',        -- parsed, executed, modified, closed, blocked, failed
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_channel ON telegram_signals(channel_id);
CREATE INDEX IF NOT EXISTS idx_tg_status ON telegram_signals(status);


-- ─────────────────────────────────────────────────────────────
-- 8. INTELLIGENCE CACHE
-- (Uses existing user_data table with system user)
-- Intelligence stored as:
--   user_id: 'system'
--   category: 'gold_intelligence'
--   data: { ...GoldIntelligence JSON }
-- ─────────────────────────────────────────────────────────────

-- Ensure user_data can handle system data
-- (Already exists from main schema, just adding index)
CREATE INDEX IF NOT EXISTS idx_ud_system ON user_data(user_id, category)
  WHERE user_id = '00000000-0000-0000-0000-000000000000';


-- ─────────────────────────────────────────────────────────────
-- 9. DONE
-- ─────────────────────────────────────────────────────────────
-- Total new tables: 10
-- collected_trades, collected_signals, market_sentiment,
-- seo_pages, crm_leads, crm_activities, crm_campaigns,
-- crm_email_queue, support_tickets, ticket_messages,
-- affiliate_payouts, symbol_mapping, telegram_channels,
-- telegram_signals
-- ─────────────────────────────────────────────────────────────
