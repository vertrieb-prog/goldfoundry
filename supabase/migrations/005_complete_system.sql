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
