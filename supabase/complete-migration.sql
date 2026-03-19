-- ============================================================
-- GOLD FOUNDRY — COMPLETE DATABASE (Clean Install)
-- Paste this ENTIRE file into Supabase SQL Editor and click Run
-- ============================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════
-- CORE TABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','trader','admin')),
  referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  referred_by UUID REFERENCES public.profiles(id),
  stripe_customer_id TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','analyzer','copier','pro','provider')),
  subscription_active BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  phone TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  trading_experience TEXT,
  trading_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.master_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metaapi_account_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  instruments TEXT[] NOT NULL DEFAULT '{XAUUSD,US500}',
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.slave_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  metaapi_account_id TEXT NOT NULL UNIQUE,
  firm_profile TEXT NOT NULL CHECK (firm_profile IN ('tegas_24x','tag_12x','tracking')),
  broker_server TEXT NOT NULL,
  mt_login TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('mt4','mt5')),
  initial_balance DECIMAL NOT NULL,
  current_equity DECIMAL NOT NULL,
  equity_high DECIMAL NOT NULL,
  dd_limit DECIMAL NOT NULL,
  dd_type TEXT NOT NULL CHECK (dd_type IN ('trailing','fixed')),
  dd_buffer_pct DECIMAL GENERATED ALWAYS AS (
    CASE WHEN current_equity > 0 THEN ((current_equity - dd_limit) / current_equity * 100) ELSE 0 END
  ) STORED,
  phase INTEGER DEFAULT 1,
  copier_active BOOLEAN DEFAULT true,
  copier_paused_reason TEXT,
  master_account_id UUID REFERENCES public.master_accounts(id),
  account_type TEXT NOT NULL DEFAULT 'copier' CHECK (account_type IN ('copier','tracking')),
  account_name TEXT,
  broker_name TEXT,
  currency TEXT DEFAULT 'USD',
  leverage INTEGER,
  total_trades INTEGER DEFAULT 0,
  total_profit DECIMAL DEFAULT 0,
  win_rate DECIMAL DEFAULT 0,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.slave_accounts(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  volume DECIMAL NOT NULL,
  open_price DECIMAL NOT NULL,
  close_price DECIMAL,
  profit DECIMAL DEFAULT 0,
  swap DECIMAL DEFAULT 0,
  commission DECIMAL DEFAULT 0,
  net_profit DECIMAL GENERATED ALWAYS AS (profit + swap + commission) STORED,
  open_time TIMESTAMPTZ NOT NULL,
  close_time TIMESTAMPTZ,
  magic INTEGER DEFAULT 0,
  comment TEXT DEFAULT '',
  is_open BOOLEAN DEFAULT true,
  session TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.daily_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.slave_accounts(id) ON DELETE CASCADE,
  balance DECIMAL NOT NULL,
  equity DECIMAL NOT NULL,
  floating_pnl DECIMAL DEFAULT 0,
  closed_pnl DECIMAL DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  equity_high DECIMAL NOT NULL,
  dd_current_pct DECIMAL NOT NULL,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, snapshot_date)
);

CREATE TABLE public.equity_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.slave_accounts(id) ON DELETE CASCADE,
  equity DECIMAL NOT NULL,
  balance DECIMAL NOT NULL,
  floating_pnl DECIMAL NOT NULL,
  equity_high DECIMAL NOT NULL,
  dd_buffer_pct DECIMAL NOT NULL,
  risk_multiplier DECIMAL,
  open_positions INTEGER DEFAULT 0,
  snapshot_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.copier_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_position_id TEXT NOT NULL,
  slave_account_id UUID NOT NULL REFERENCES public.slave_accounts(id),
  firm_profile TEXT NOT NULL,
  instrument TEXT NOT NULL,
  direction TEXT NOT NULL,
  master_lots DECIMAL NOT NULL,
  calculated_lots DECIMAL,
  action TEXT NOT NULL CHECK (action IN ('COPIED','SKIPPED','REDUCED','CLOSED','SL_TP_UPDATED','FAILED')),
  skip_reason TEXT,
  risk_assessment JSONB NOT NULL DEFAULT '{}',
  dd_buffer_pct DECIMAL NOT NULL,
  equity_at_copy DECIMAL NOT NULL,
  phase_at_copy INTEGER,
  execution_time_ms INTEGER,
  slave_order_id TEXT,
  pnl_result DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.market_intel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('GREEN','YELLOW','ORANGE','RED','BLACK')),
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  regime TEXT NOT NULL,
  vix_level DECIMAL,
  dxy_trend TEXT,
  geopolitical_risk TEXT DEFAULT 'LOW',
  geopolitical_alerts TEXT[] DEFAULT '{}',
  xauusd_atr DECIMAL, xauusd_atr_ratio DECIMAL, xauusd_bias TEXT,
  us500_atr DECIMAL, us500_atr_ratio DECIMAL, us500_bias TEXT,
  forecast_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.economic_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_time TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  currency TEXT NOT NULL,
  impact TEXT NOT NULL CHECK (impact IN ('LOW','MEDIUM','HIGH')),
  tier INTEGER NOT NULL CHECK (tier BETWEEN 0 AND 3),
  forecast TEXT, previous TEXT, actual TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  earner_id UUID NOT NULL REFERENCES public.profiles(id),
  source_user_id UUID NOT NULL REFERENCES public.profiles(id),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  period_start DATE NOT NULL, period_end DATE NOT NULL,
  paid BOOLEAN DEFAULT false, paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.strategy_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('mql4','mql5','backtest_csv','backtest_html','myfxbook')),
  filename TEXT NOT NULL, file_url TEXT, code_content TEXT,
  ai_analysis JSONB, ai_optimized_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','analyzing','complete','failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.geopolitical_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_level TEXT NOT NULL, risk_score INTEGER NOT NULL,
  triggers TEXT[] NOT NULL DEFAULT '{}', headlines JSONB, ai_analysis TEXT,
  copier_action TEXT NOT NULL DEFAULT 'NONE',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crypto_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE, plan TEXT NOT NULL,
  amount_usd DECIMAL NOT NULL, crypto_currency TEXT NOT NULL,
  crypto_amount TEXT, wallet_address TEXT, tx_hash TEXT, payment_url TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('coingate','cryptomus','manual','stripe')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','awaiting_payment','confirming','completed','expired','cancelled','refunded')),
  metadata JSONB DEFAULT '{}',
  confirmed_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('memory','preferences','goals','journal','strategies','notes','milestones','alerts')),
  key TEXT NOT NULL, value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category, key)
);

-- ══════════════════════════════════════════════════════════════
-- CRM TABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL, full_name TEXT, phone TEXT, country TEXT, language TEXT DEFAULT 'de',
  source TEXT CHECK (source IN ('organic','referral','social','ads','manual','import')),
  source_detail TEXT,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead','contacted','interested','trial','active','churned','win_back','blocked')),
  lead_score INTEGER DEFAULT 0, lifetime_value DECIMAL DEFAULT 0,
  trading_experience TEXT CHECK (trading_experience IN ('beginner','intermediate','advanced','professional')),
  instruments TEXT[] DEFAULT '{}', broker TEXT, has_prop_firm BOOLEAN DEFAULT false, prop_firm_name TEXT,
  referred_by_contact UUID REFERENCES public.crm_contacts(id), referral_code TEXT, mlm_level INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  assigned_to UUID REFERENCES public.profiles(id),
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crm_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email_outbound','email_inbound','email_auto','chat','note','call','whatsapp','social_dm','system')),
  subject TEXT, body TEXT NOT NULL,
  email_from TEXT, email_to TEXT,
  email_status TEXT CHECK (email_status IN ('sent','delivered','opened','clicked','bounced','failed')),
  email_opened_at TIMESTAMPTZ, email_clicked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', is_internal BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('signup','login','subscription_start','subscription_cancel','subscription_upgrade','subscription_downgrade','payment_success','payment_failed','copier_connected','copier_disconnected','copier_paused','copier_resumed','trade_copied','dd_warning','dd_emergency','payout_requested','payout_completed','referral_signup','referral_converted','strategy_uploaded','chat_message','email_opened','email_clicked','profile_updated','custom')),
  description TEXT NOT NULL, metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crm_email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, subject TEXT NOT NULL, body_html TEXT NOT NULL, body_text TEXT,
  category TEXT CHECK (category IN ('welcome','onboarding','alert','report','marketing','retention','dunning','custom')),
  variables TEXT[] DEFAULT '{}', active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crm_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.crm_email_templates(id),
  target_filter JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','cancelled')),
  scheduled_at TIMESTAMPTZ, sent_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"sent":0,"delivered":0,"opened":0,"clicked":0,"bounced":0}',
  type TEXT, segment JSONB, subject_template TEXT, body_template TEXT,
  active BOOLEAN DEFAULT true,
  sent_count INTEGER DEFAULT 0, open_count INTEGER DEFAULT 0, click_count INTEGER DEFAULT 0, conversion_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL, value DECIMAL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','demo','negotiation','won','lost')),
  lost_reason TEXT, expected_close DATE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crm_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT, name TEXT,
  status TEXT DEFAULT 'visitor', plan TEXT, score INTEGER DEFAULT 0,
  source TEXT, source_detail TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  tags TEXT[], language TEXT DEFAULT 'de', country TEXT, broker TEXT,
  first_seen TIMESTAMPTZ DEFAULT now(), last_seen TIMESTAMPTZ DEFAULT now(),
  last_action TEXT, churn_risk INTEGER DEFAULT 0, lifetime_value NUMERIC DEFAULT 0, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.crm_email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.crm_campaigns(id),
  email TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ, sent_at TIMESTAMPTZ, opened_at TIMESTAMPTZ, clicked_at TIMESTAMPTZ
);

-- ══════════════════════════════════════════════════════════════
-- AFFILIATE TABLES
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','suspended','banned')),
  approved_at TIMESTAMPTZ, approved_by UUID REFERENCES public.profiles(id),
  partner_type TEXT NOT NULL DEFAULT 'affiliate' CHECK (partner_type IN ('affiliate','trader','agency')),
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum','diamond')),
  custom_l1_rate DECIMAL, custom_l2_rate DECIMAL, custom_l3_rate DECIMAL,
  custom_slug TEXT UNIQUE, landing_page_title TEXT, landing_page_description TEXT, landing_page_image_url TEXT,
  social_links JSONB DEFAULT '{}',
  payout_method TEXT CHECK (payout_method IN ('bank','paypal','usdt','btc')),
  payout_details JSONB DEFAULT '{}', minimum_payout DECIMAL DEFAULT 50,
  total_clicks INTEGER DEFAULT 0, total_signups INTEGER DEFAULT 0, total_conversions INTEGER DEFAULT 0,
  total_earned DECIMAL DEFAULT 0, total_paid DECIMAL DEFAULT 0, current_balance DECIMAL DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id),
  referral_code TEXT NOT NULL,
  ip_address TEXT, user_agent TEXT, referer_url TEXT, landing_url TEXT, country TEXT, device TEXT,
  converted BOOLEAN DEFAULT false, converted_user_id UUID REFERENCES public.profiles(id), converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id),
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id),
  click_id UUID REFERENCES public.affiliate_clicks(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('signup','trial_start','first_payment','recurring_payment','upgrade','downgrade','churn')),
  subscription_tier TEXT, payment_amount DECIMAL DEFAULT 0,
  commission_amount DECIMAL DEFAULT 0, commission_level INTEGER NOT NULL DEFAULT 1, commission_rate DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES public.affiliate_profiles(id),
  partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL NOT NULL, currency TEXT DEFAULT 'USD',
  method TEXT CHECK (method IN ('bank','paypal','usdt','btc','crypto_btc','crypto_usdt','crypto_eth','bank_transfer')),
  payout_details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected','cancelled','paid','failed')),
  rejection_reason TEXT, processed_by UUID REFERENCES public.profiles(id), processed_at TIMESTAMPTZ,
  transaction_id TEXT, payment_method TEXT, payment_address TEXT, payment_ref TEXT,
  period_start DATE, period_end DATE,
  trades_count INTEGER DEFAULT 0, referrals_count INTEGER DEFAULT 0, tier TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id),
  slug TEXT NOT NULL UNIQUE, destination_url TEXT NOT NULL DEFAULT '/',
  campaign_name TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  clicks INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.affiliate_tiers (
  tier TEXT PRIMARY KEY,
  min_active_referrals INTEGER NOT NULL, min_monthly_revenue DECIMAL NOT NULL,
  l1_rate_trader DECIMAL NOT NULL, l2_rate_trader DECIMAL NOT NULL, l3_rate_trader DECIMAL NOT NULL,
  l1_rate_affiliate DECIMAL NOT NULL, l2_rate_affiliate DECIMAL NOT NULL, l3_rate_affiliate DECIMAL NOT NULL,
  first_month_bonus DECIMAL NOT NULL, perks TEXT[] DEFAULT '{}'
);

INSERT INTO public.affiliate_tiers VALUES
  ('bronze',0,0,0.30,0.10,0.05,0.15,0.05,0.025,0.25,'{}'),
  ('silver',50,500,0.32,0.12,0.06,0.18,0.06,0.03,0.25,'{priority_support}'),
  ('gold',200,2000,0.35,0.15,0.07,0.20,0.08,0.04,0.30,'{priority_support,custom_landing}'),
  ('platinum',500,5000,0.38,0.18,0.08,0.23,0.10,0.05,0.35,'{priority_support,custom_landing,dedicated_manager}'),
  ('diamond',1000,10000,0.40,0.20,0.10,0.25,0.12,0.06,0.40,'{priority_support,custom_landing,dedicated_manager,custom_deal}');

-- ══════════════════════════════════════════════════════════════
-- PROFIT SHARING
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.profit_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_account_id UUID NOT NULL REFERENCES public.slave_accounts(id),
  master_account_id UUID NOT NULL REFERENCES public.master_accounts(id),
  trader_user_id UUID NOT NULL REFERENCES public.profiles(id),
  follower_user_id UUID NOT NULL REFERENCES public.profiles(id),
  platform_cut_pct DECIMAL NOT NULL DEFAULT 40, trader_cut_pct DECIMAL NOT NULL DEFAULT 60,
  hwm_equity DECIMAL NOT NULL, hwm_set_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly','biweekly','monthly')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_account_id, master_account_id)
);

CREATE TABLE public.profit_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profit_sharing_id UUID NOT NULL REFERENCES public.profit_sharing(id),
  period_start DATE NOT NULL, period_end DATE NOT NULL,
  equity_start DECIMAL NOT NULL, equity_end DECIMAL NOT NULL, gross_profit DECIMAL NOT NULL,
  platform_fee DECIMAL NOT NULL, trader_payout DECIMAL NOT NULL, follower_net_profit DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','trader_paid','completed','disputed')),
  new_hwm DECIMAL NOT NULL,
  trader_paid_at TIMESTAMPTZ, trader_payout_method TEXT, transaction_id TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.trader_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_user_id UUID NOT NULL REFERENCES public.profiles(id),
  total_followers INTEGER DEFAULT 0, active_followers INTEGER DEFAULT 0, total_aum DECIMAL DEFAULT 0,
  lifetime_gross_profit DECIMAL DEFAULT 0, lifetime_trader_payout DECIMAL DEFAULT 0, lifetime_platform_fee DECIMAL DEFAULT 0,
  current_period_profit DECIMAL DEFAULT 0, current_period_estimated_payout DECIMAL DEFAULT 0,
  pending_balance DECIMAL DEFAULT 0, total_paid DECIMAL DEFAULT 0,
  payout_method TEXT CHECK (payout_method IN ('bank','paypal','usdt','btc')),
  payout_details JSONB DEFAULT '{}', minimum_payout DECIMAL DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- DATA COLLECTION & INTELLIGENCE
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.collected_trades (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL, source_id TEXT NOT NULL, source_name TEXT,
  symbol TEXT NOT NULL, direction TEXT NOT NULL,
  open_time TEXT, close_time TEXT, open_price NUMERIC, close_price NUMERIC,
  lots NUMERIC, sl NUMERIC, tp NUMERIC, profit NUMERIC, pips NUMERIC,
  commission NUMERIC DEFAULT 0, swap NUMERIC DEFAULT 0,
  collected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id, open_time, symbol)
);

CREATE TABLE public.collected_signals (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL, source_id TEXT NOT NULL, name TEXT,
  growth NUMERIC, reliability NUMERIC, subscribers INTEGER, price NUMERIC,
  trades_count INTEGER, win_rate NUMERIC, profit_factor NUMERIC, max_dd NUMERIC, url TEXT,
  collected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_id)
);

CREATE TABLE public.market_sentiment (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL, symbol TEXT NOT NULL,
  long_pct NUMERIC, short_pct NUMERIC, long_volume NUMERIC, short_volume NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- SEO ENGINE
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.seo_pages (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, excerpt TEXT, content TEXT,
  category TEXT, tags TEXT[], locale TEXT DEFAULT 'de',
  meta_title TEXT, meta_description TEXT, og_image TEXT, internal_links TEXT[],
  views INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug, locale)
);

-- ══════════════════════════════════════════════════════════════
-- SUPPORT
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT, priority TEXT DEFAULT 'medium', subject TEXT NOT NULL, description TEXT,
  status TEXT DEFAULT 'open', assigned_to TEXT, resolution TEXT, satisfaction INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ, first_response_at TIMESTAMPTZ
);

CREATE TABLE public.ticket_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, message TEXT NOT NULL, attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- SYMBOL MAPPING
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.symbol_mapping (
  id BIGSERIAL PRIMARY KEY,
  broker TEXT NOT NULL, standard_symbol TEXT NOT NULL, broker_symbol TEXT NOT NULL,
  pip_value NUMERIC, digits INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(broker, standard_symbol)
);

INSERT INTO public.symbol_mapping (broker, standard_symbol, broker_symbol, pip_value, digits) VALUES
  ('tag','XAUUSD','XAUUSD',0.1,2),('tag','US500','US500',0.01,2),
  ('tegas','XAUUSD','XAUUSD',0.1,2),('tegas','US500','US500.a',0.01,2),
  ('icmarkets','XAUUSD','XAUUSD',0.1,2),('icmarkets','EURUSD','EURUSD',0.0001,5),
  ('pepperstone','XAUUSD','XAUUSD',0.1,2),('pepperstone','EURUSD','EURUSD',0.0001,5)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- TELEGRAM
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.telegram_channels (
  id BIGSERIAL PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE, channel_name TEXT,
  status TEXT DEFAULT 'pending', scan_result JSONB,
  total_signals INTEGER DEFAULT 0, win_rate NUMERIC, profit_factor NUMERIC, avg_rr NUMERIC,
  fake_signals_detected INTEGER DEFAULT 0, last_signal_at TIMESTAMPTZ,
  added_by UUID, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.telegram_signals (
  id BIGSERIAL PRIMARY KEY,
  channel_id TEXT REFERENCES public.telegram_channels(channel_id),
  message_id BIGINT, raw_message TEXT, parsed JSONB, execution_result JSONB,
  profit NUMERIC, status TEXT DEFAULT 'parsed',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.telegram_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_number TEXT, phone_code_hash TEXT, session_string TEXT,
  status TEXT DEFAULT 'pending', connected_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE public.telegram_active_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL, channel_name TEXT, status TEXT DEFAULT 'active',
  settings JSONB DEFAULT '{"autoExecute":true,"riskPercent":1}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

-- ══════════════════════════════════════════════════════════════
-- PARTNER / MLM / FORGE POINTS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE public.challenge_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  account_id TEXT NOT NULL, broker TEXT, phase TEXT DEFAULT 'challenge',
  target_profit NUMERIC DEFAULT 0, current_profit NUMERIC DEFAULT 0,
  max_drawdown NUMERIC DEFAULT 0, current_drawdown NUMERIC DEFAULT 0,
  days_total INT DEFAULT 0, days_traded INT DEFAULT 0, status TEXT DEFAULT 'on_track',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, account_id)
);

CREATE TABLE public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id TEXT, user_id UUID NOT NULL REFERENCES auth.users(id),
  symbol TEXT, direction TEXT, profit NUMERIC DEFAULT 0, r_multiple NUMERIC DEFAULT 0,
  duration_minutes INT DEFAULT 0, session TEXT, ai_comment TEXT,
  tags JSONB DEFAULT '[]', emotion TEXT DEFAULT 'neutral',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.forge_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance NUMERIC DEFAULT 0, locked NUMERIC DEFAULT 0, total_earned NUMERIC DEFAULT 0,
  level INT DEFAULT 1, streak INT DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.fp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC NOT NULL, type TEXT NOT NULL, description TEXT, vested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.fp_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_id TEXT NOT NULL, earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE public.fp_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount_fp NUMERIC NOT NULL, amount_eur NUMERIC NOT NULL, method TEXT NOT NULL,
  wallet TEXT, status TEXT DEFAULT 'pending', tx_hash TEXT, processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.network_tree (
  ancestor_id UUID NOT NULL REFERENCES auth.users(id),
  descendant_id UUID NOT NULL REFERENCES auth.users(id),
  depth INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ancestor_id, descendant_id)
);

CREATE TABLE public.builder_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  pack_type TEXT NOT NULL, quantity INT NOT NULL, price NUMERIC NOT NULL,
  codes JSONB DEFAULT '[]', redeemed_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.invite_codes (
  code TEXT PRIMARY KEY,
  sponsor_id UUID NOT NULL REFERENCES auth.users(id),
  redeemed_by UUID REFERENCES auth.users(id), redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.rank_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  old_rank TEXT, new_rank TEXT NOT NULL, bonus_fp NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.commission_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  from_user_id UUID REFERENCES auth.users(id),
  level INT DEFAULT 1, amount NUMERIC NOT NULL, percentage NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'unilevel', month TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.matching_bonus_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  matched_partner_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL, percentage NUMERIC DEFAULT 0, generation INT DEFAULT 1,
  month TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.performance_pool (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL, total_revenue NUMERIC DEFAULT 0, pool_amount NUMERIC DEFAULT 0,
  pool_fp NUMERIC DEFAULT 0, distributed_fp NUMERIC DEFAULT 0, qualified_partners INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.pool_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID REFERENCES public.performance_pool(id),
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  amount_fp NUMERIC NOT NULL, month TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.partner_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  slug TEXT UNIQUE NOT NULL, headline TEXT, bio TEXT, photo TEXT, video TEXT,
  selected_traders JSONB DEFAULT '[]', contacts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.partner_kyc (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'none', id_front TEXT, id_back TEXT, selfie TEXT,
  submitted_at TIMESTAMPTZ, approved_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.partner_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  milestone TEXT NOT NULL, reached_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.referral_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  source TEXT, converted BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.share_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  platform TEXT, content_type TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.hot_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  visitor_hash TEXT NOT NULL, visit_count INT DEFAULT 1, pages_viewed JSONB DEFAULT '[]',
  converted BOOLEAN DEFAULT false, last_visit TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL, tasks JSONB DEFAULT '[]', completed INT DEFAULT 0, total INT DEFAULT 5,
  streak INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE public.training_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  level INT DEFAULT 1, videos_watched INT DEFAULT 0, quizzes_passed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL, likes INT DEFAULT 0, pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  element TEXT NOT NULL, variant_a TEXT, variant_b TEXT,
  visits_a INT DEFAULT 0, visits_b INT DEFAULT 0, conversions_a INT DEFAULT 0, conversions_b INT DEFAULT 0,
  winner TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.weekly_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, description TEXT, target_type TEXT, target_value NUMERIC DEFAULT 0,
  prize_fp NUMERIC DEFAULT 0, start_date DATE, end_date DATE, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.weekly_challenge_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  progress NUMERIC DEFAULT 0, completed BOOLEAN DEFAULT false, completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.partner_report_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  daily BOOLEAN DEFAULT true, weekly BOOLEAN DEFAULT true, monthly BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT true, telegram BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.partner_notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  new_referral BOOLEAN DEFAULT true, commission_earned BOOLEAN DEFAULT true,
  rank_change BOOLEAN DEFAULT true, payout_status BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.partner_contests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, type TEXT DEFAULT 'referrals', prize_fp NUMERIC DEFAULT 0,
  start_date DATE, end_date DATE, winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.generational_bonus_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  source_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL, generation INT DEFAULT 1, month TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.first_to_rank (
  rank TEXT PRIMARY KEY,
  achieved_by UUID REFERENCES auth.users(id),
  achieved_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════
-- ALL INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX idx_trades_user ON public.trades(user_id, close_time DESC);
CREATE INDEX idx_trades_account ON public.trades(account_id, close_time DESC);
CREATE INDEX idx_trades_symbol ON public.trades(symbol, close_time DESC);
CREATE INDEX idx_copier_log_slave ON public.copier_log(slave_account_id, created_at DESC);
CREATE INDEX idx_copier_log_master ON public.copier_log(master_position_id);
CREATE INDEX idx_equity_snap ON public.equity_snapshots(account_id, snapshot_at DESC);
CREATE INDEX idx_daily_snap ON public.daily_snapshots(account_id, snapshot_date DESC);
CREATE INDEX idx_chat_user ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX idx_market_intel ON public.market_intel(created_at DESC);
CREATE INDEX idx_calendar ON public.economic_calendar(event_time);
CREATE INDEX idx_referral_earner ON public.referral_earnings(earner_id, created_at DESC);
CREATE INDEX idx_userdata_user ON public.user_data(user_id, category);
CREATE INDEX idx_geo_log ON public.geopolitical_log(created_at DESC);
CREATE INDEX idx_crypto_user ON public.crypto_payments(user_id, created_at DESC);
CREATE INDEX idx_crypto_order ON public.crypto_payments(order_id);
CREATE INDEX idx_accounts_type ON public.slave_accounts(user_id, account_type);
CREATE INDEX idx_crm_contacts_status ON public.crm_contacts(status);
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX idx_crm_contacts_tags ON public.crm_contacts USING gin(tags);
CREATE INDEX idx_crm_comms_contact ON public.crm_communications(contact_id, created_at DESC);
CREATE INDEX idx_crm_activities_contact ON public.crm_activities(contact_id, created_at DESC);
CREATE INDEX idx_crm_deals_contact ON public.crm_deals(contact_id);
CREATE INDEX idx_leads_status ON public.crm_leads(status);
CREATE INDEX idx_leads_score ON public.crm_leads(score DESC);
CREATE INDEX idx_email_status ON public.crm_email_queue(status);
CREATE INDEX idx_aff_profile_user ON public.affiliate_profiles(user_id);
CREATE INDEX idx_aff_clicks_affiliate ON public.affiliate_clicks(affiliate_id, created_at DESC);
CREATE INDEX idx_aff_conversions_aff ON public.affiliate_conversions(affiliate_id, created_at DESC);
CREATE INDEX idx_aff_links_slug ON public.affiliate_links(slug);
CREATE INDEX idx_ps_follower ON public.profit_sharing(follower_account_id);
CREATE INDEX idx_ps_trader ON public.profit_sharing(trader_user_id);
CREATE INDEX idx_settlements_ps ON public.profit_settlements(profit_sharing_id, period_end DESC);
CREATE INDEX idx_trader_earnings ON public.trader_earnings(trader_user_id);
CREATE INDEX idx_ct_symbol ON public.collected_trades(symbol);
CREATE INDEX idx_ct_source ON public.collected_trades(source);
CREATE INDEX idx_ms_symbol ON public.market_sentiment(symbol);
CREATE INDEX idx_seo_type ON public.seo_pages(type);
CREATE INDEX idx_seo_slug ON public.seo_pages(slug);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_tg_channel ON public.telegram_signals(channel_id);
CREATE INDEX idx_fp_transactions_user ON public.fp_transactions(user_id);
CREATE INDEX idx_journal_user ON public.journal_entries(user_id);
CREATE INDEX idx_network_ancestor ON public.network_tree(ancestor_id);
CREATE INDEX idx_network_descendant ON public.network_tree(descendant_id);
CREATE INDEX idx_commission_partner ON public.commission_log(partner_id);
CREATE INDEX idx_hot_leads_partner ON public.hot_leads(partner_id);
CREATE INDEX idx_daily_tasks_user_date ON public.daily_tasks(user_id, date);
CREATE INDEX idx_challenge_user ON public.challenge_configs(user_id);

-- ══════════════════════════════════════════════════════════════
-- RLS — OPEN FOR ALL (simplified, secure later)
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "allow_all_%s" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════
-- SEED: Admin Account
-- ══════════════════════════════════════════════════════════════

INSERT INTO public.profiles (id, email, full_name, role, subscription_tier, subscription_active)
VALUES ('0da80a9f-2652-46b1-8e1c-edfe1d057d18', 'vertrieb@phoenixone.ai', 'Gold Foundry Admin', 'admin', 'provider', true)
ON CONFLICT (id) DO UPDATE SET role = 'admin', subscription_tier = 'provider', subscription_active = true, full_name = 'Gold Foundry Admin';
