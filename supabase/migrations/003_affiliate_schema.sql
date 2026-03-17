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
