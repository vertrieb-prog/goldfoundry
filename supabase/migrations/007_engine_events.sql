-- ═══════════════════════════════════════════════════════════════
-- 007_engine_events.sql — Engine Events + Copy Events Tables
-- Live Terminal Feed + Trade Copy Monitoring
-- ═══════════════════════════════════════════════════════════════

-- Ensure uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Engine Events (Live Terminal Feed) ───────────────────────────
CREATE TABLE IF NOT EXISTS engine_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id TEXT,
  type TEXT NOT NULL,
  icon TEXT,
  badge TEXT,
  text TEXT NOT NULL,
  detail TEXT,
  color TEXT,
  pnl DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engine_events_user_created
  ON engine_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_engine_events_type_created
  ON engine_events(type, created_at DESC);

-- ── Copy Events (Trade Copy Monitoring) ──────────────────────────
CREATE TABLE IF NOT EXISTS copy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pair_name TEXT NOT NULL,
  signal_account_id TEXT NOT NULL,
  copy_account_id TEXT NOT NULL,
  position_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  volume DECIMAL,
  open_price DECIMAL,
  status TEXT NOT NULL CHECK (status IN ('DETECTED','COPIED','BLOCKED','MISSED','CLOSED','ERROR')),
  block_reason TEXT,
  error_message TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_copy_events_status_created
  ON copy_events(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_copy_events_signal_created
  ON copy_events(signal_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_copy_events_position
  ON copy_events(position_id);

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE engine_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_events ENABLE ROW LEVEL SECURITY;

-- Service role: full access on engine_events
CREATE POLICY "service_role_engine_events_all"
  ON engine_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users: read own engine_events
CREATE POLICY "users_read_own_engine_events"
  ON engine_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role: full access on copy_events
CREATE POLICY "service_role_copy_events_all"
  ON copy_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
