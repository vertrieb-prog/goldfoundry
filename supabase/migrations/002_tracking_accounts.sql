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
