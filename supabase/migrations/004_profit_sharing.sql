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
