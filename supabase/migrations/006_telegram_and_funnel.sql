-- ═══════════════════════════════════════════════════════════════
-- 006_telegram_and_funnel.sql — Telegram Sessions, Channels, Signals + Funnel Leads
-- ═══════════════════════════════════════════════════════════════

-- ── Telegram Sessions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data TEXT NOT NULL,
  phone_number TEXT,
  api_id TEXT,
  api_hash TEXT,
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_telegram_sessions_user ON telegram_sessions(user_id);

-- ── Telegram Active Channels ──────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_active_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
  settings JSONB DEFAULT '{"autoExecute": true, "riskPercent": 1}'::jsonb,
  signals_received INT DEFAULT 0,
  signals_executed INT DEFAULT 0,
  win_rate NUMERIC(5,2),
  last_signal_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_telegram_channels_user ON telegram_active_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_channels_status ON telegram_active_channels(status);

-- ── Telegram Signals ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_id BIGINT,
  raw_message TEXT,
  parsed JSONB,
  status TEXT DEFAULT 'parsed' CHECK (status IN (
    'parsed', 'unparsed', 'executed', 'blocked',
    'low_confidence', 'manual_review', 'risk_blocked',
    'execution_failed'
  )),
  execution_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_signals_channel ON telegram_signals(channel_id);
CREATE INDEX IF NOT EXISTS idx_telegram_signals_user ON telegram_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_signals_status ON telegram_signals(status);
CREATE INDEX IF NOT EXISTS idx_telegram_signals_created ON telegram_signals(created_at DESC);

-- ── Funnel Leads ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funnel_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT,
  email_confirm_token TEXT,
  email_confirmed BOOLEAN DEFAULT false,
  email_confirmed_at TIMESTAMPTZ,
  questionnaire JSONB,
  selected_plan TEXT,
  coupon_code TEXT,
  selected_broker TEXT,
  broker_login TEXT,
  ref_code TEXT,
  status TEXT DEFAULT 'registered' CHECK (status IN (
    'registered', 'email_confirmed', 'questionnaire_completed',
    'plan_selected', 'broker_selected', 'converted', 'churned'
  )),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_leads_email ON funnel_leads(email);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_status ON funnel_leads(status);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_token ON funnel_leads(email_confirm_token);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_created ON funnel_leads(created_at DESC);

-- ── RPC: Increment channel signal count ───────────────────────
CREATE OR REPLACE FUNCTION increment_channel_signals(p_channel_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE telegram_active_channels
  SET signals_received = signals_received + 1,
      last_signal_at = now(),
      updated_at = now()
  WHERE channel_id = p_channel_id;
END;
$$ LANGUAGE plpgsql;

-- ── RLS Policies ──────────────────────────────────────────────
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_active_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_leads ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users see own telegram sessions"
  ON telegram_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only see their own channels
CREATE POLICY "Users see own telegram channels"
  ON telegram_active_channels FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only see their own signals
CREATE POLICY "Users see own telegram signals"
  ON telegram_signals FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access (handled by supabaseAdmin)
