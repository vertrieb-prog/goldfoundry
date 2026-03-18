-- === FILE: supabase/migrations/001_initial_schema.sql ===
-- ============================================================
-- GOLD FOUNDRY — Complete Database Schema
-- Run: npx supabase db push  OR  paste in Supabase SQL Editor
-- ============================================================

-- ── EXTENSIONS ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES (extends Supabase Auth) ──────────────────────────
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
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

-- ── MASTER ACCOUNTS (eure Trading-Bots) ───────────────────────
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

-- ── SLAVE ACCOUNTS (User MT-Konten) ──────────────────────────
CREATE TABLE public.slave_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  metaapi_account_id TEXT NOT NULL UNIQUE,
  firm_profile TEXT NOT NULL CHECK (firm_profile IN ('tegas_24x','tag_12x')),
  broker_server TEXT NOT NULL,
  mt_login TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('mt4','mt5')),
  initial_balance DECIMAL NOT NULL,
  current_equity DECIMAL NOT NULL,
  equity_high DECIMAL NOT NULL,
  dd_limit DECIMAL NOT NULL,
  dd_type TEXT NOT NULL CHECK (dd_type IN ('trailing','fixed')),
  dd_buffer_pct DECIMAL GENERATED ALWAYS AS (
    CASE WHEN current_equity > 0 THEN
      ((current_equity - dd_limit) / current_equity * 100)
    ELSE 0 END
  ) STORED,
  phase INTEGER DEFAULT 1,
  copier_active BOOLEAN DEFAULT true,
  copier_paused_reason TEXT,
  master_account_id UUID REFERENCES public.master_accounts(id),
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── TRADES ────────────────────────────────────────────────────
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
  session TEXT, -- 'asian','london','ny','overlap'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── DAILY SNAPSHOTS ───────────────────────────────────────────
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

-- ── EQUITY SNAPSHOTS (high-frequency for trailing DD) ─────────
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

-- ── COPIER LOG ────────────────────────────────────────────────
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

-- ── MARKET INTEL ──────────────────────────────────────────────
CREATE TABLE public.market_intel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('GREEN','YELLOW','ORANGE','RED','BLACK')),
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  regime TEXT NOT NULL,
  vix_level DECIMAL,
  dxy_trend TEXT,
  geopolitical_risk TEXT DEFAULT 'LOW',
  geopolitical_alerts TEXT[] DEFAULT '{}',
  xauusd_atr DECIMAL,
  xauusd_atr_ratio DECIMAL,
  xauusd_bias TEXT,
  us500_atr DECIMAL,
  us500_atr_ratio DECIMAL,
  us500_bias TEXT,
  forecast_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── ECONOMIC CALENDAR ─────────────────────────────────────────
CREATE TABLE public.economic_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_time TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  currency TEXT NOT NULL,
  impact TEXT NOT NULL CHECK (impact IN ('LOW','MEDIUM','HIGH')),
  tier INTEGER NOT NULL CHECK (tier BETWEEN 0 AND 3),
  forecast TEXT,
  previous TEXT,
  actual TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── CHAT MESSAGES ─────────────────────────────────────────────
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── MLM / REFERRALS ───────────────────────────────────────────
CREATE TABLE public.referral_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  earner_id UUID NOT NULL REFERENCES public.profiles(id),
  source_user_id UUID NOT NULL REFERENCES public.profiles(id),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── STRATEGY UPLOADS ──────────────────────────────────────────
CREATE TABLE public.strategy_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('mql4','mql5','backtest_csv','backtest_html','myfxbook')),
  filename TEXT NOT NULL,
  file_url TEXT,
  code_content TEXT,
  ai_analysis JSONB,
  ai_optimized_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','analyzing','complete','failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── INDEXES ───────────────────────────────────────────────────
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

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slave_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copier_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_uploads ENABLE ROW LEVEL SECURITY;

-- Profiles: Users see own profile
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Slave accounts: Users see own
CREATE POLICY "Users see own accounts" ON public.slave_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own accounts" ON public.slave_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own accounts" ON public.slave_accounts FOR UPDATE USING (auth.uid() = user_id);

-- Trades: Users see own
CREATE POLICY "Users see own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service inserts trades" ON public.trades FOR INSERT WITH CHECK (true);

-- Daily snapshots: Via account ownership
CREATE POLICY "Users see own snapshots" ON public.daily_snapshots FOR SELECT
  USING (account_id IN (SELECT id FROM public.slave_accounts WHERE user_id = auth.uid()));

-- Equity snapshots: Via account ownership
CREATE POLICY "Users see own equity" ON public.equity_snapshots FOR SELECT
  USING (account_id IN (SELECT id FROM public.slave_accounts WHERE user_id = auth.uid()));

-- Copier log: Via account ownership
CREATE POLICY "Users see own copier log" ON public.copier_log FOR SELECT
  USING (slave_account_id IN (SELECT id FROM public.slave_accounts WHERE user_id = auth.uid()));

-- Chat: Users see own messages
CREATE POLICY "Users see own chat" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own chat" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals: Users see own earnings
CREATE POLICY "Users see own earnings" ON public.referral_earnings FOR SELECT USING (auth.uid() = earner_id);

-- Strategy uploads: Users see own
CREATE POLICY "Users see own uploads" ON public.strategy_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert uploads" ON public.strategy_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Market intel + calendar: Public read
ALTER TABLE public.market_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads intel" ON public.market_intel FOR SELECT USING (true);
CREATE POLICY "Anyone reads calendar" ON public.economic_calendar FOR SELECT USING (true);

-- Master accounts: Public read
ALTER TABLE public.master_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads masters" ON public.master_accounts FOR SELECT USING (true);

-- ── GEOPOLITICAL LOG (referenced by market-intel.ts) ──────────
CREATE TABLE public.geopolitical_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_level TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  triggers TEXT[] NOT NULL DEFAULT '{}',
  headlines JSONB,
  ai_analysis TEXT,
  copier_action TEXT NOT NULL DEFAULT 'NONE',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_geo_log ON public.geopolitical_log(created_at DESC);
ALTER TABLE public.geopolitical_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads geo log" ON public.geopolitical_log FOR SELECT USING (true);

-- ── CRYPTO PAYMENTS ───────────────────────────────────────────
CREATE TABLE public.crypto_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  amount_usd DECIMAL NOT NULL,
  crypto_currency TEXT NOT NULL,
  crypto_amount TEXT,
  wallet_address TEXT,
  tx_hash TEXT,
  payment_url TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('coingate','cryptomus','manual','stripe')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','awaiting_payment','confirming','completed','expired','cancelled','refunded'
  )),
  metadata JSONB DEFAULT '{}',
  confirmed_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crypto_user ON public.crypto_payments(user_id, created_at DESC);
CREATE INDEX idx_crypto_order ON public.crypto_payments(order_id);
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own crypto" ON public.crypto_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin all crypto" ON public.crypto_payments FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- ── USER MICRO DATABASE (individuelle Daten pro Kunde) ────────
CREATE TABLE public.user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'memory',        -- Persönliche Erinnerungen (AI Mentor)
    'preferences',   -- UI/Trading-Präferenzen
    'goals',         -- Monatsziele, Prop-Firm-Ziele
    'journal',       -- Trading-Tagebuch Einträge
    'strategies',    -- Individuelle Strategie-Notizen
    'notes',         -- AI-Notizen über den User
    'milestones',    -- Erreichte Meilensteine
    'alerts'         -- Individuelle Alert-Konfigurationen
  )),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category, key)
);

CREATE INDEX idx_userdata_user ON public.user_data(user_id, category);
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own data" ON public.user_data FOR ALL USING (auth.uid() = user_id);

-- === FILE: supabase/migrations/002_crm_schema.sql ===
-- ============================================================
-- GOLD FOUNDRY CRM — Supabase Migration
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ── CONTACTS (erweitert profiles um CRM-Daten) ───────────────
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Kann auch externe Kontakte ohne Account sein:
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  country TEXT,
  language TEXT DEFAULT 'de',
  source TEXT CHECK (source IN ('organic','referral','social','ads','manual','import')),
  source_detail TEXT,                    -- z.B. "Instagram Ad March 2025"
  
  -- Status Pipeline
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN (
    'lead',          -- Frisch reingekommen
    'contacted',     -- Erste Mail/Nachricht gesendet
    'interested',    -- Hat geantwortet / Interesse gezeigt
    'trial',         -- Testet das Portal
    'active',        -- Zahlendes Abo
    'churned',       -- Abo gekündigt
    'win_back',      -- Rückgewinnungs-Kandidat
    'blocked'        -- Gesperrt (Betrug, Nicht-Zahlung)
  )),
  
  -- Scoring
  lead_score INTEGER DEFAULT 0,          -- 0-100, automatisch berechnet
  lifetime_value DECIMAL DEFAULT 0,      -- Gesamtumsatz bisher
  
  -- Trading-spezifisch
  trading_experience TEXT CHECK (trading_experience IN ('beginner','intermediate','advanced','professional')),
  instruments TEXT[] DEFAULT '{}',       -- Was tradet er? '{XAUUSD,US500}'
  broker TEXT,
  has_prop_firm BOOLEAN DEFAULT false,
  prop_firm_name TEXT,
  
  -- MLM
  referred_by_contact UUID REFERENCES public.crm_contacts(id),
  referral_code TEXT,
  mlm_level INTEGER DEFAULT 0,          -- 0=direkt, 1=L2, 2=L3
  
  -- Tags für Segmentierung
  tags TEXT[] DEFAULT '{}',              -- z.B. '{vip,prop-trader,tegas,high-value}'
  
  -- Assignee (wer betreut diesen Kontakt)
  assigned_to UUID REFERENCES public.profiles(id),
  
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── KOMMUNIKATIONS-LOG (jede Interaktion) ─────────────────────
CREATE TABLE public.crm_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  
  -- Typ der Kommunikation
  channel TEXT NOT NULL CHECK (channel IN (
    'email_outbound',    -- Wir haben geschrieben
    'email_inbound',     -- Kontakt hat geschrieben
    'email_auto',        -- Automatische Mail (Welcome, Alert, etc.)
    'chat',              -- FORGE AI Chat-Nachricht
    'note',              -- Interne Notiz (nur für uns sichtbar)
    'call',              -- Telefon-Notiz
    'whatsapp',          -- WhatsApp / Telegram
    'social_dm',         -- Instagram/X DM
    'system'             -- System-Event (Abo gestartet, Payout, etc.)
  )),
  
  -- Inhalt
  subject TEXT,                          -- E-Mail Betreff oder Titel
  body TEXT NOT NULL,
  
  -- E-Mail spezifisch
  email_from TEXT,
  email_to TEXT,
  email_status TEXT CHECK (email_status IN ('sent','delivered','opened','clicked','bounced','failed')),
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',           -- Zusätzliche Daten (Template-ID, Campaign, etc.)
  is_internal BOOLEAN DEFAULT false,     -- Interne Notiz? Nicht dem Kontakt sichtbar
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── AKTIVITÄTS-LOG (automatisches Tracking) ───────────────────
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'signup',            -- Account erstellt
    'login',             -- Eingeloggt
    'subscription_start',-- Abo gestartet
    'subscription_cancel',-- Abo gekündigt
    'subscription_upgrade',
    'subscription_downgrade',
    'payment_success',
    'payment_failed',
    'copier_connected',  -- MT-Konto verbunden
    'copier_disconnected',
    'copier_paused',
    'copier_resumed',
    'trade_copied',      -- Trade kopiert
    'dd_warning',        -- DD-Warnung ausgelöst
    'dd_emergency',      -- DD-Emergency
    'payout_requested',
    'payout_completed',
    'referral_signup',   -- Jemand hat sich über seinen Link angemeldet
    'referral_converted',-- Referral wurde zahlendes Mitglied
    'strategy_uploaded', -- MQL4/Backtest hochgeladen
    'chat_message',      -- Im FORGE AI Chat geschrieben
    'email_opened',
    'email_clicked',
    'profile_updated',
    'custom'
  )),
  
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── E-MAIL TEMPLATES ──────────────────────────────────────────
CREATE TABLE public.crm_email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  category TEXT CHECK (category IN ('welcome','onboarding','alert','report','marketing','retention','dunning','custom')),
  variables TEXT[] DEFAULT '{}',         -- z.B. '{name,balance,pnl}'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── E-MAIL CAMPAIGNS (Massen-Mails) ──────────────────────────
CREATE TABLE public.crm_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.crm_email_templates(id),
  target_filter JSONB NOT NULL DEFAULT '{}',  -- z.B. {"status":"lead","tags":["prop-trader"]}
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"sent":0,"delivered":0,"opened":0,"clicked":0,"bounced":0}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── PIPELINE DEALS (für Sales-Tracking) ───────────────────────
CREATE TABLE public.crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                   -- z.B. "Upgrade auf Pro Tier"
  value DECIMAL DEFAULT 0,              -- Erwarteter Monatsumsatz
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN (
    'new','contacted','demo','negotiation','won','lost'
  )),
  lost_reason TEXT,
  expected_close DATE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX idx_crm_contacts_status ON public.crm_contacts(status);
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX idx_crm_contacts_tags ON public.crm_contacts USING gin(tags);
CREATE INDEX idx_crm_contacts_referred ON public.crm_contacts(referred_by_contact);
CREATE INDEX idx_crm_comms_contact ON public.crm_communications(contact_id, created_at DESC);
CREATE INDEX idx_crm_comms_channel ON public.crm_communications(channel, created_at DESC);
CREATE INDEX idx_crm_activities_contact ON public.crm_activities(contact_id, created_at DESC);
CREATE INDEX idx_crm_activities_type ON public.crm_activities(activity_type, created_at DESC);
CREATE INDEX idx_crm_deals_contact ON public.crm_deals(contact_id);
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(stage);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

-- Admin sieht alles
CREATE POLICY "Admins see all contacts" ON public.crm_contacts FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins see all comms" ON public.crm_communications FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins see all activities" ON public.crm_activities FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins manage templates" ON public.crm_email_templates FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins manage campaigns" ON public.crm_campaigns FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Admins manage deals" ON public.crm_deals FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Trader sehen ihre eigene Referral-Struktur
CREATE POLICY "Traders see own referrals" ON public.crm_contacts FOR SELECT
  USING (referred_by_contact IN (
    SELECT id FROM public.crm_contacts WHERE profile_id = auth.uid()
  ) OR profile_id = auth.uid());

-- Trader sehen Kommunikation mit ihren Referrals
CREATE POLICY "Traders see referral comms" ON public.crm_communications FOR SELECT
  USING (contact_id IN (
    SELECT id FROM public.crm_contacts WHERE referred_by_contact IN (
      SELECT id FROM public.crm_contacts WHERE profile_id = auth.uid()
    ) OR profile_id = auth.uid()
  ));

-- Trader sehen Aktivitäten ihrer Referrals
CREATE POLICY "Traders see referral activities" ON public.crm_activities FOR SELECT
  USING (contact_id IN (
    SELECT id FROM public.crm_contacts WHERE referred_by_contact IN (
      SELECT id FROM public.crm_contacts WHERE profile_id = auth.uid()
    ) OR profile_id = auth.uid()
  ));

-- ── AUTO-SCORING FUNCTION ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calculate_lead_score(contact_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  contact RECORD;
  activity_count INTEGER;
  comm_count INTEGER;
  last_login TIMESTAMPTZ;
BEGIN
  SELECT * INTO contact FROM public.crm_contacts WHERE id = contact_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Basis-Score nach Status
  score := CASE contact.status
    WHEN 'active' THEN 40
    WHEN 'trial' THEN 30
    WHEN 'interested' THEN 20
    WHEN 'contacted' THEN 10
    WHEN 'lead' THEN 5
    ELSE 0
  END;

  -- +10 wenn Prop-Firm Trader
  IF contact.has_prop_firm THEN score := score + 10; END IF;

  -- +10 wenn Trading-Erfahrung advanced/professional
  IF contact.trading_experience IN ('advanced','professional') THEN score := score + 10; END IF;

  -- +5 pro Aktivität (max 20)
  SELECT COUNT(*) INTO activity_count FROM public.crm_activities
    WHERE crm_activities.contact_id = calculate_lead_score.contact_id
    AND created_at > now() - INTERVAL '30 days';
  score := score + LEAST(activity_count * 5, 20);

  -- +5 wenn kürzlich E-Mail geöffnet
  SELECT COUNT(*) INTO comm_count FROM public.crm_communications
    WHERE crm_communications.contact_id = calculate_lead_score.contact_id
    AND email_status = 'opened'
    AND created_at > now() - INTERVAL '7 days';
  IF comm_count > 0 THEN score := score + 5; END IF;

  -- +15 wenn Referrals hat
  IF (SELECT COUNT(*) FROM public.crm_contacts WHERE referred_by_contact = calculate_lead_score.contact_id) > 0 THEN
    score := score + 15;
  END IF;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === FILE: supabase/migrations/002_tracking_accounts.sql ===
-- ============================================================
-- 002 — Tracking Accounts (MyFXBook-style)
-- Erweitert slave_accounts für allgemeines Account-Tracking
-- ============================================================

-- 1. firm_profile CHECK erweitern: 'tracking' hinzufügen
ALTER TABLE public.slave_accounts DROP CONSTRAINT IF EXISTS slave_accounts_firm_profile_check;
ALTER TABLE public.slave_accounts ADD CONSTRAINT slave_accounts_firm_profile_check
  CHECK (firm_profile IN ('tegas_24x','tag_12x','tracking'));

-- 2. account_type Spalte hinzufügen (copier vs tracking)
ALTER TABLE public.slave_accounts ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'copier'
  CHECK (account_type IN ('copier','tracking'));

-- 3. account_name für Display
ALTER TABLE public.slave_accounts ADD COLUMN IF NOT EXISTS account_name TEXT;

-- 4. Tracking-spezifische Felder
ALTER TABLE public.slave_accounts ADD COLUMN IF NOT EXISTS broker_name TEXT;
ALTER TABLE public.slave_accounts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.slave_accounts ADD COLUMN IF NOT EXISTS leverage INTEGER;
ALTER TABLE public.slave_accounts ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0;
ALTER TABLE public.slave_accounts ADD COLUMN IF NOT EXISTS total_profit DECIMAL DEFAULT 0;
ALTER TABLE public.slave_accounts ADD COLUMN IF NOT EXISTS win_rate DECIMAL DEFAULT 0;

-- 5. dd_limit, dd_type nullable machen für Tracking-Accounts
-- (Die columns existieren schon mit NOT NULL — wir setzen Default-Werte beim Insert)

-- 6. Index für account_type
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.slave_accounts(user_id, account_type);

-- === FILE: supabase/migrations/003_affiliate_schema.sql ===
-- ============================================================
-- GOLD FOUNDRY AFFILIATE — Complete MLM/Affiliate System
-- Run AFTER 001 + 002 migrations
-- ============================================================

-- ── AFFILIATE PROFILES (extends profiles) ─────────────────────
CREATE TABLE public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Affiliate Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',       -- Bewerbung eingereicht
    'approved',      -- Freigeschalten
    'suspended',     -- Temporär gesperrt
    'banned'         -- Permanent gesperrt
  )),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),

  -- Affiliate Type
  partner_type TEXT NOT NULL DEFAULT 'affiliate' CHECK (partner_type IN (
    'affiliate',     -- Bringt User → bekommt Recurring
    'trader',        -- Bringt Follower → bekommt Profit-Share
    'agency'         -- Managed mehrere Trader (höhere Raten)
  )),

  -- Tier (automatisch basierend auf Performance)
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN (
    'bronze',        -- Start: Standard-Raten
    'silver',        -- 50+ aktive Referrals oder $500+ Provision/Monat
    'gold',          -- 200+ aktive Referrals oder $2,000+/Monat
    'platinum',      -- 500+ aktive Referrals oder $5,000+/Monat
    'diamond'        -- 1000+ aktive oder $10,000+/Monat — Custom Deal
  )),

  -- Commission Overrides (NULL = Standard-Raten)
  custom_l1_rate DECIMAL,       -- z.B. 0.35 statt 0.30
  custom_l2_rate DECIMAL,
  custom_l3_rate DECIMAL,

  -- Branding
  custom_slug TEXT UNIQUE,      -- goldfoundry.de/r/trader-mike
  landing_page_title TEXT,
  landing_page_description TEXT,
  landing_page_image_url TEXT,
  social_links JSONB DEFAULT '{}',  -- {"twitter":"@...", "instagram":"@..."}

  -- Payment
  payout_method TEXT CHECK (payout_method IN ('bank','paypal','usdt','btc')),
  payout_details JSONB DEFAULT '{}',   -- {"iban":"DE...", "bic":"..."} oder {"wallet":"0x..."}
  minimum_payout DECIMAL DEFAULT 50,

  -- Stats (denormalisiert für Performance)
  total_clicks INTEGER DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,     -- Zu zahlendem Abo
  total_earned DECIMAL DEFAULT 0,
  total_paid DECIMAL DEFAULT 0,
  current_balance DECIMAL DEFAULT 0,       -- total_earned - total_paid
  active_referrals INTEGER DEFAULT 0,      -- Aktuell zahlende

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── CLICK TRACKING ────────────────────────────────────────────
CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id),
  referral_code TEXT NOT NULL,

  -- Tracking
  ip_address TEXT,
  user_agent TEXT,
  referer_url TEXT,              -- Woher kam der Klick
  landing_url TEXT,              -- Welche Seite wurde besucht
  country TEXT,
  device TEXT,                   -- 'desktop', 'mobile', 'tablet'

  -- Conversion
  converted BOOLEAN DEFAULT false,
  converted_user_id UUID REFERENCES public.profiles(id),
  converted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── CONVERSION EVENTS ─────────────────────────────────────────
CREATE TABLE public.affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id),
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id),
  click_id UUID REFERENCES public.affiliate_clicks(id),

  -- Type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'signup',            -- Account erstellt (kein Revenue)
    'trial_start',       -- Trial gestartet
    'first_payment',     -- Erste Zahlung → Affiliate bekommt First-Month Bonus
    'recurring_payment', -- Monatliche Zahlung → Recurring Commission
    'upgrade',           -- User hat Abo upgraded → höhere Commission
    'downgrade',         -- User hat downgraded
    'churn'              -- User hat gekündigt → Commission stoppt
  )),

  -- Revenue
  subscription_tier TEXT,
  payment_amount DECIMAL DEFAULT 0,
  commission_amount DECIMAL DEFAULT 0,
  commission_level INTEGER NOT NULL DEFAULT 1,   -- 1=direkt, 2=L2, 3=L3
  commission_rate DECIMAL NOT NULL,              -- Angewandter Satz

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── PAYOUT REQUESTS ───────────────────────────────────────────
CREATE TABLE public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id),

  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  method TEXT NOT NULL CHECK (method IN ('bank','paypal','usdt','btc')),
  payout_details JSONB NOT NULL,          -- Kopie der Payment-Details zum Zeitpunkt

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',       -- Angefragt
    'processing',    -- Wird bearbeitet
    'completed',     -- Ausgezahlt
    'rejected',      -- Abgelehnt (mit Grund)
    'cancelled'      -- Vom Affiliate storniert
  )),
  rejection_reason TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMPTZ,
  transaction_id TEXT,           -- Externe TX-ID (Bank, Crypto Hash, etc.)

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── AFFILIATE LINKS (Kurzlinks mit Tracking-Parametern) ──────
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliate_profiles(id),

  slug TEXT NOT NULL,             -- Der Teil nach /r/ → goldfoundry.de/r/[slug]
  destination_url TEXT NOT NULL DEFAULT '/',   -- Wohin redirected
  campaign_name TEXT,             -- z.B. "Instagram Bio", "YouTube Description"
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug)
);

-- ── TIER THRESHOLDS ───────────────────────────────────────────
CREATE TABLE public.affiliate_tiers (
  tier TEXT PRIMARY KEY,
  min_active_referrals INTEGER NOT NULL,
  min_monthly_revenue DECIMAL NOT NULL,
  l1_rate_trader DECIMAL NOT NULL,
  l2_rate_trader DECIMAL NOT NULL,
  l3_rate_trader DECIMAL NOT NULL,
  l1_rate_affiliate DECIMAL NOT NULL,
  l2_rate_affiliate DECIMAL NOT NULL,
  l3_rate_affiliate DECIMAL NOT NULL,
  first_month_bonus DECIMAL NOT NULL,
  perks TEXT[] DEFAULT '{}'
);

INSERT INTO public.affiliate_tiers VALUES
  ('bronze',   0,    0,    0.30, 0.10, 0.05, 0.15, 0.05, 0.025, 0.25, '{}'),
  ('silver',   50,   500,  0.32, 0.12, 0.06, 0.18, 0.06, 0.03,  0.25, '{priority_support}'),
  ('gold',     200,  2000, 0.35, 0.15, 0.07, 0.20, 0.08, 0.04,  0.30, '{priority_support,custom_landing}'),
  ('platinum', 500,  5000, 0.38, 0.18, 0.08, 0.23, 0.10, 0.05,  0.35, '{priority_support,custom_landing,dedicated_manager}'),
  ('diamond',  1000, 10000,0.40, 0.20, 0.10, 0.25, 0.12, 0.06,  0.40, '{priority_support,custom_landing,dedicated_manager,custom_deal}');

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX idx_aff_profile_user ON public.affiliate_profiles(user_id);
CREATE INDEX idx_aff_clicks_affiliate ON public.affiliate_clicks(affiliate_id, created_at DESC);
CREATE INDEX idx_aff_clicks_code ON public.affiliate_clicks(referral_code);
CREATE INDEX idx_aff_conversions_aff ON public.affiliate_conversions(affiliate_id, created_at DESC);
CREATE INDEX idx_aff_conversions_user ON public.affiliate_conversions(referred_user_id);
CREATE INDEX idx_aff_payouts_aff ON public.affiliate_payouts(affiliate_id, created_at DESC);
CREATE INDEX idx_aff_links_slug ON public.affiliate_links(slug);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_tiers ENABLE ROW LEVEL SECURITY;

-- Jeder sieht sein eigenes Affiliate-Profil
CREATE POLICY "Own affiliate profile" ON public.affiliate_profiles
  FOR ALL USING (user_id = auth.uid());

-- Jeder sieht seine eigenen Klicks
CREATE POLICY "Own clicks" ON public.affiliate_clicks
  FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid()));

-- Jeder sieht seine eigenen Conversions
CREATE POLICY "Own conversions" ON public.affiliate_conversions
  FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid()));

-- Jeder sieht seine eigenen Payouts
CREATE POLICY "Own payouts" ON public.affiliate_payouts
  FOR ALL USING (affiliate_id IN (SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid()));

-- Jeder sieht seine eigenen Links
CREATE POLICY "Own links" ON public.affiliate_links
  FOR ALL USING (affiliate_id IN (SELECT id FROM public.affiliate_profiles WHERE user_id = auth.uid()));

-- Tiers sind public
CREATE POLICY "Anyone reads tiers" ON public.affiliate_tiers FOR SELECT USING (true);

-- Admin sieht alles
CREATE POLICY "Admin all aff profiles" ON public.affiliate_profiles FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Admin all clicks" ON public.affiliate_clicks FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Admin all conversions" ON public.affiliate_conversions FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Admin all payouts" ON public.affiliate_payouts FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Admin all links" ON public.affiliate_links FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- === FILE: supabase/migrations/004_profit_sharing.sql ===
-- ============================================================
-- GOLD FOUNDRY — Profit Sharing System
-- 40% Platform Fee auf Copier-Gewinne
-- Run AFTER migrations 001, 002, 003
-- ============================================================

-- ── PROFIT SHARING AGREEMENTS ─────────────────────────────────
CREATE TABLE public.profit_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Wer folgt wem
  follower_account_id UUID NOT NULL REFERENCES public.slave_accounts(id),
  master_account_id UUID NOT NULL REFERENCES public.master_accounts(id),
  trader_user_id UUID NOT NULL REFERENCES public.profiles(id),  -- Der Signal-Provider
  follower_user_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Split-Konfiguration
  platform_cut_pct DECIMAL NOT NULL DEFAULT 40,   -- Gold Foundry bekommt 40%
  trader_cut_pct DECIMAL NOT NULL DEFAULT 60,     -- Trader bekommt 60%
  -- (Follower behält den Rest des Profits nach Fees)
  
  -- High Water Mark (HWM) — Trader verdient NUR bei neuem Gewinn
  hwm_equity DECIMAL NOT NULL,            -- Letzte Abrechnungs-Equity
  hwm_set_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  active BOOLEAN DEFAULT true,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly','biweekly','monthly')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_account_id, master_account_id)
);

-- ── MONATLICHE ABRECHNUNGEN ───────────────────────────────────
CREATE TABLE public.profit_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profit_sharing_id UUID NOT NULL REFERENCES public.profit_sharing(id),
  
  -- Zeitraum
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Equity-Daten
  equity_start DECIMAL NOT NULL,          -- Equity am Periodenanfang (= vorheriger HWM)
  equity_end DECIMAL NOT NULL,            -- Equity am Periodenende
  gross_profit DECIMAL NOT NULL,          -- equity_end - equity_start (nur wenn positiv)
  
  -- Aufteilung
  platform_fee DECIMAL NOT NULL,          -- 40% von gross_profit
  trader_payout DECIMAL NOT NULL,         -- 60% von gross_profit
  
  -- Der Follower "zahlt" die Performance Fee durch Abzug
  -- (wird vom Copier-Profit abgezogen, nicht extra berechnet)
  follower_net_profit DECIMAL NOT NULL,   -- gross_profit - platform_fee - trader_payout = 0
  -- HINWEIS: Follower behält SEINEN Brutto-Profit, die Fee
  -- wird als separater Posten abgerechnet, nicht vom Konto abgezogen
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',       -- Berechnet, wartet auf Review
    'approved',      -- Admin hat bestätigt
    'trader_paid',   -- Trader wurde ausgezahlt
    'completed',     -- Alles abgeschlossen
    'disputed'       -- Streitfall
  )),
  
  -- HWM Update
  new_hwm DECIMAL NOT NULL,              -- Neuer High Water Mark nach Settlement
  
  -- Zahlung
  trader_paid_at TIMESTAMPTZ,
  trader_payout_method TEXT,
  transaction_id TEXT,
  
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── TRADER EARNINGS OVERVIEW ──────────────────────────────────
CREATE TABLE public.trader_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_user_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Aggregierte Stats
  total_followers INTEGER DEFAULT 0,
  active_followers INTEGER DEFAULT 0,
  total_aum DECIMAL DEFAULT 0,           -- Assets Under Management (Follower Equity)
  
  -- Lifetime Earnings
  lifetime_gross_profit DECIMAL DEFAULT 0,
  lifetime_trader_payout DECIMAL DEFAULT 0,
  lifetime_platform_fee DECIMAL DEFAULT 0,
  
  -- Aktueller Zyklus
  current_period_profit DECIMAL DEFAULT 0,
  current_period_estimated_payout DECIMAL DEFAULT 0,
  
  -- Auszahlbar
  pending_balance DECIMAL DEFAULT 0,     -- Ausstehende Auszahlung
  total_paid DECIMAL DEFAULT 0,
  
  -- Payout Config
  payout_method TEXT CHECK (payout_method IN ('bank','paypal','usdt','btc')),
  payout_details JSONB DEFAULT '{}',
  minimum_payout DECIMAL DEFAULT 100,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX idx_ps_follower ON public.profit_sharing(follower_account_id);
CREATE INDEX idx_ps_master ON public.profit_sharing(master_account_id);
CREATE INDEX idx_ps_trader ON public.profit_sharing(trader_user_id);
CREATE INDEX idx_settlements_ps ON public.profit_settlements(profit_sharing_id, period_end DESC);
CREATE INDEX idx_settlements_status ON public.profit_settlements(status);
CREATE INDEX idx_trader_earnings ON public.trader_earnings(trader_user_id);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.profit_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_earnings ENABLE ROW LEVEL SECURITY;

-- Trader sieht seine Agreements + Settlements
CREATE POLICY "Trader sees own agreements" ON public.profit_sharing
  FOR SELECT USING (trader_user_id = auth.uid() OR follower_user_id = auth.uid());

CREATE POLICY "Trader sees own settlements" ON public.profit_settlements
  FOR SELECT USING (profit_sharing_id IN (
    SELECT id FROM public.profit_sharing WHERE trader_user_id = auth.uid() OR follower_user_id = auth.uid()
  ));

CREATE POLICY "Trader sees own earnings" ON public.trader_earnings
  FOR SELECT USING (trader_user_id = auth.uid());

-- Admin sieht alles
CREATE POLICY "Admin all ps" ON public.profit_sharing FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Admin all settlements" ON public.profit_settlements FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Admin all trader_earnings" ON public.trader_earnings FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- === FILE: supabase/migrations/005-session-additions.sql ===
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

-- === FILE: supabase/migrations/005_complete_system.sql ===
-- ═══════════════════════════════════════════════════════════════
-- 005_complete_system.sql — Gold Foundry Complete System
-- 31 Tables with UUID PKs and created_at
-- ═══════════════════════════════════════════════════════════════

-- Challenge Tracker
CREATE TABLE IF NOT EXISTS challenge_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  account_id TEXT NOT NULL,
  broker TEXT,
  phase TEXT DEFAULT 'challenge',
  target_profit NUMERIC DEFAULT 0,
  current_profit NUMERIC DEFAULT 0,
  max_drawdown NUMERIC DEFAULT 0,
  current_drawdown NUMERIC DEFAULT 0,
  days_total INT DEFAULT 0,
  days_traded INT DEFAULT 0,
  status TEXT DEFAULT 'on_track',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, account_id)
);

-- Journal
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  symbol TEXT,
  direction TEXT,
  profit NUMERIC DEFAULT 0,
  r_multiple NUMERIC DEFAULT 0,
  duration_minutes INT DEFAULT 0,
  session TEXT,
  ai_comment TEXT,
  tags JSONB DEFAULT '[]',
  emotion TEXT DEFAULT 'neutral',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FORGE Points
CREATE TABLE IF NOT EXISTS forge_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance NUMERIC DEFAULT 0,
  locked NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  level INT DEFAULT 1,
  streak INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  vested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fp_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS fp_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount_fp NUMERIC NOT NULL,
  amount_eur NUMERIC NOT NULL,
  method TEXT NOT NULL,
  wallet TEXT,
  status TEXT DEFAULT 'pending',
  tx_hash TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Network (Closure Table)
CREATE TABLE IF NOT EXISTS network_tree (
  ancestor_id UUID NOT NULL REFERENCES auth.users(id),
  descendant_id UUID NOT NULL REFERENCES auth.users(id),
  depth INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ancestor_id, descendant_id)
);

-- Builder Packs
CREATE TABLE IF NOT EXISTS builder_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  pack_type TEXT NOT NULL,
  quantity INT NOT NULL,
  price NUMERIC NOT NULL,
  codes JSONB DEFAULT '[]',
  redeemed_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invite Codes
CREATE TABLE IF NOT EXISTS invite_codes (
  code TEXT PRIMARY KEY,
  sponsor_id UUID NOT NULL REFERENCES auth.users(id),
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rank History
CREATE TABLE IF NOT EXISTS rank_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  old_rank TEXT,
  new_rank TEXT NOT NULL,
  bonus_fp NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Commission & Matching Logs
CREATE TABLE IF NOT EXISTS commission_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  from_user_id UUID REFERENCES auth.users(id),
  level INT DEFAULT 1,
  amount NUMERIC NOT NULL,
  percentage NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'unilevel',
  month TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matching_bonus_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  matched_partner_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  percentage NUMERIC DEFAULT 0,
  generation INT DEFAULT 1,
  month TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Pool
CREATE TABLE IF NOT EXISTS performance_pool (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  total_revenue NUMERIC DEFAULT 0,
  pool_amount NUMERIC DEFAULT 0,
  pool_fp NUMERIC DEFAULT 0,
  distributed_fp NUMERIC DEFAULT 0,
  qualified_partners INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pool_payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID REFERENCES performance_pool(id),
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  amount_fp NUMERIC NOT NULL,
  month TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Pages
CREATE TABLE IF NOT EXISTS partner_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  slug TEXT UNIQUE NOT NULL,
  headline TEXT,
  bio TEXT,
  photo TEXT,
  video TEXT,
  selected_traders JSONB DEFAULT '[]',
  contacts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partner KYC
CREATE TABLE IF NOT EXISTS partner_kyc (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'none',
  id_front TEXT,
  id_back TEXT,
  selfie TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Milestones
CREATE TABLE IF NOT EXISTS partner_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  milestone TEXT NOT NULL,
  reached_at TIMESTAMPTZ DEFAULT now()
);

-- Referral Tracking
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  source TEXT,
  converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS share_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  platform TEXT,
  content_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hot Leads
CREATE TABLE IF NOT EXISTS hot_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  visitor_hash TEXT NOT NULL,
  visit_count INT DEFAULT 1,
  pages_viewed JSONB DEFAULT '[]',
  converted BOOLEAN DEFAULT false,
  last_visit TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Tasks
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  tasks JSONB DEFAULT '[]',
  completed INT DEFAULT 0,
  total INT DEFAULT 5,
  streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Training
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  level INT DEFAULT 1,
  videos_watched INT DEFAULT 0,
  quizzes_passed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Community
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- A/B Tests
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  element TEXT NOT NULL,
  variant_a TEXT,
  variant_b TEXT,
  visits_a INT DEFAULT 0,
  visits_b INT DEFAULT 0,
  conversions_a INT DEFAULT 0,
  conversions_b INT DEFAULT 0,
  winner TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly Challenges
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_type TEXT,
  target_value NUMERIC DEFAULT 0,
  prize_fp NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weekly_challenge_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES weekly_challenges(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  progress NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Preferences
CREATE TABLE IF NOT EXISTS partner_report_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  daily BOOLEAN DEFAULT true,
  weekly BOOLEAN DEFAULT true,
  monthly BOOLEAN DEFAULT true,
  email BOOLEAN DEFAULT true,
  telegram BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  new_referral BOOLEAN DEFAULT true,
  commission_earned BOOLEAN DEFAULT true,
  rank_change BOOLEAN DEFAULT true,
  payout_status BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Contests
CREATE TABLE IF NOT EXISTS partner_contests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'referrals',
  prize_fp NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Generational Bonus Log
CREATE TABLE IF NOT EXISTS generational_bonus_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  source_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  generation INT DEFAULT 1,
  month TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- First to Rank
CREATE TABLE IF NOT EXISTS first_to_rank (
  rank TEXT PRIMARY KEY,
  achieved_by UUID REFERENCES auth.users(id),
  achieved_at TIMESTAMPTZ DEFAULT now()
);

-- ═══ INDEXES ═══════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_fp_transactions_user ON fp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_transactions_type ON fp_transactions(type);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_network_ancestor ON network_tree(ancestor_id);
CREATE INDEX IF NOT EXISTS idx_network_descendant ON network_tree(descendant_id);
CREATE INDEX IF NOT EXISTS idx_network_depth ON network_tree(depth);
CREATE INDEX IF NOT EXISTS idx_commission_partner ON commission_log(partner_id);
CREATE INDEX IF NOT EXISTS idx_commission_month ON commission_log(month);
CREATE INDEX IF NOT EXISTS idx_matching_partner ON matching_bonus_log(partner_id);
CREATE INDEX IF NOT EXISTS idx_invite_sponsor ON invite_codes(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_hot_leads_partner ON hot_leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_partner ON referral_clicks(partner_id);
CREATE INDEX IF NOT EXISTS idx_challenge_user ON challenge_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_fp_payouts_status ON fp_payouts(status);
CREATE INDEX IF NOT EXISTS idx_partner_kyc_status ON partner_kyc(status);

