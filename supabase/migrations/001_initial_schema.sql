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
