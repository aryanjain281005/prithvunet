-- ============================================
-- PrithviNet AI Extension Schema (Safe Incremental)
-- Run this in Supabase SQL Editor
-- This file adds missing AI and citizen backend tables
-- without dropping existing tables.
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('air', 'water', 'noise', 'industrial_discharge', 'waste_burning', 'other')),
  location_details TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Verified', 'Action Initiated', 'Resolved', 'Rejected')),
  triage_priority TEXT NOT NULL DEFAULT 'Medium' CHECK (triage_priority IN ('Low', 'Medium', 'High', 'Critical')),
  sensor_corroboration_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (sensor_corroboration_score >= 0 AND sensor_corroboration_score <= 1),
  triage_summary TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_triage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_ref UUID NOT NULL REFERENCES public_complaints(id) ON DELETE CASCADE,
  model_version TEXT NOT NULL DEFAULT 'rules-v1',
  sentiment_score NUMERIC(4,2),
  extracted_entities JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision TEXT NOT NULL CHECK (decision IN ('Low', 'Medium', 'High', 'Critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_copilot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  role TEXT NOT NULL DEFAULT 'unknown',
  region TEXT NOT NULL DEFAULT 'Unknown',
  query TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  response TEXT NOT NULL,
  intent TEXT NOT NULL DEFAULT 'general',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_copilot_logs ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'Unknown';

CREATE TABLE IF NOT EXISTS ai_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  region TEXT NOT NULL DEFAULT 'Unknown',
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('policy_what_if', 'shutdown_top_k', 'festival_control', 'traffic_control', 'custom')),
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_before NUMERIC(10,2),
  risk_after NUMERIC(10,2),
  delta NUMERIC(10,2),
  confidence_lower NUMERIC(10,2),
  confidence_upper NUMERIC(10,2),
  horizon_days INT NOT NULL DEFAULT 7,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_simulation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_ref UUID NOT NULL REFERENCES ai_simulations(id) ON DELETE CASCADE,
  report_id TEXT UNIQUE NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('markdown', 'json')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_complaints_created_at ON public_complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_complaints_region ON public_complaints(state, city);
CREATE INDEX IF NOT EXISTS idx_public_complaints_status_priority ON public_complaints(status, triage_priority);
CREATE INDEX IF NOT EXISTS idx_complaint_triage_events_complaint_ref ON complaint_triage_events(complaint_ref);
CREATE INDEX IF NOT EXISTS idx_ai_copilot_logs_created_at ON ai_copilot_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_copilot_logs_user_id ON ai_copilot_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_copilot_logs_region ON ai_copilot_logs(region);
CREATE INDEX IF NOT EXISTS idx_ai_simulations_scenario_id ON ai_simulations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_ai_simulations_user_region ON ai_simulations(user_id, region);
CREATE INDEX IF NOT EXISTS idx_ai_simulations_created_at ON ai_simulations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_simulation_reports_simulation_ref ON ai_simulation_reports(simulation_ref);

DROP TRIGGER IF EXISTS trg_public_complaints_updated_at ON public_complaints;
CREATE TRIGGER trg_public_complaints_updated_at
BEFORE UPDATE ON public_complaints
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_ai_simulations_updated_at ON ai_simulations;
CREATE TRIGGER trg_ai_simulations_updated_at
BEFORE UPDATE ON ai_simulations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE public_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_triage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_copilot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_simulation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access" ON public_complaints;
DROP POLICY IF EXISTS "Allow insert" ON public_complaints;
DROP POLICY IF EXISTS "Allow update" ON public_complaints;
DROP POLICY IF EXISTS "Allow delete" ON public_complaints;
CREATE POLICY "Allow read access" ON public_complaints FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON public_complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON public_complaints FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON public_complaints FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow read access" ON complaint_triage_events;
DROP POLICY IF EXISTS "Allow insert" ON complaint_triage_events;
DROP POLICY IF EXISTS "Allow update" ON complaint_triage_events;
DROP POLICY IF EXISTS "Allow delete" ON complaint_triage_events;
CREATE POLICY "Allow read access" ON complaint_triage_events FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON complaint_triage_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON complaint_triage_events FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON complaint_triage_events FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow read access" ON ai_copilot_logs;
DROP POLICY IF EXISTS "Allow insert" ON ai_copilot_logs;
DROP POLICY IF EXISTS "Allow update" ON ai_copilot_logs;
DROP POLICY IF EXISTS "Allow delete" ON ai_copilot_logs;
CREATE POLICY "Allow read access" ON ai_copilot_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON ai_copilot_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON ai_copilot_logs FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON ai_copilot_logs FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow read access" ON ai_simulations;
DROP POLICY IF EXISTS "Allow insert" ON ai_simulations;
DROP POLICY IF EXISTS "Allow update" ON ai_simulations;
DROP POLICY IF EXISTS "Allow delete" ON ai_simulations;
CREATE POLICY "Allow read access" ON ai_simulations FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON ai_simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON ai_simulations FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON ai_simulations FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow read access" ON ai_simulation_reports;
DROP POLICY IF EXISTS "Allow insert" ON ai_simulation_reports;
DROP POLICY IF EXISTS "Allow update" ON ai_simulation_reports;
DROP POLICY IF EXISTS "Allow delete" ON ai_simulation_reports;
CREATE POLICY "Allow read access" ON ai_simulation_reports FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON ai_simulation_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON ai_simulation_reports FOR UPDATE USING (true);
CREATE POLICY "Allow delete" ON ai_simulation_reports FOR DELETE USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public_complaints,
  complaint_triage_events,
  ai_copilot_logs,
  ai_simulations,
  ai_simulation_reports
TO anon, authenticated, service_role;
