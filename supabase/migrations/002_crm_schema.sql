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
