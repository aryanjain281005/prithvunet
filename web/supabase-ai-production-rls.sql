-- ============================================
-- PrithviNet AI Production RLS Hardening
-- Apply this AFTER:
-- 1. Running supabase-ai-extension.sql
-- 2. Configuring SUPABASE_SERVICE_ROLE_KEY for server routes, or
-- 3. Moving client access to Supabase Auth with JWT role claims
--
-- Expected JWT claims for authenticated access:
-- - app_role: super_admin | regional_officer
-- - region: State/region string for regional scope
-- - app_user_id: app user id (optional; falls back to sub)
-- ============================================

CREATE OR REPLACE FUNCTION public.request_jwt_claims()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    public.request_jwt_claims() ->> 'app_role',
    public.request_jwt_claims() -> 'app_metadata' ->> 'app_role',
    public.request_jwt_claims() -> 'user_metadata' ->> 'app_role',
    'anon'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_app_region()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    public.request_jwt_claims() ->> 'region',
    public.request_jwt_claims() -> 'app_metadata' ->> 'region',
    public.request_jwt_claims() -> 'user_metadata' ->> 'region',
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    public.request_jwt_claims() ->> 'app_user_id',
    public.request_jwt_claims() ->> 'sub',
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_app_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.is_regional_officer()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_app_role() = 'regional_officer';
$$;

CREATE OR REPLACE FUNCTION public.is_ai_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_super_admin() OR public.is_regional_officer();
$$;

CREATE OR REPLACE FUNCTION public.region_matches(target_region text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_super_admin()
    OR (
      public.is_regional_officer()
      AND NULLIF(TRIM(public.current_app_region()), '') IS NOT NULL
      AND LOWER(TRIM(public.current_app_region())) = LOWER(TRIM(COALESCE(target_region, '')))
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_simulation_row(simulation_user_id text, simulation_region text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_super_admin()
    OR (
      public.is_regional_officer()
      AND public.region_matches(simulation_region)
    )
    OR public.current_app_user_id() = COALESCE(simulation_user_id, '');
$$;

ALTER TABLE public_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_triage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_copilot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_simulation_reports ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public_complaints FROM anon, authenticated;
REVOKE ALL ON complaint_triage_events FROM anon, authenticated;
REVOKE ALL ON ai_copilot_logs FROM anon, authenticated;
REVOKE ALL ON ai_simulations FROM anon, authenticated;
REVOKE ALL ON ai_simulation_reports FROM anon, authenticated;

GRANT INSERT ON public_complaints TO anon;
GRANT SELECT, INSERT, UPDATE ON public_complaints TO authenticated;
GRANT SELECT, INSERT, UPDATE ON complaint_triage_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_copilot_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_simulations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_simulation_reports TO authenticated;

DROP POLICY IF EXISTS "Allow read access" ON public_complaints;
DROP POLICY IF EXISTS "Allow insert" ON public_complaints;
DROP POLICY IF EXISTS "Allow update" ON public_complaints;
DROP POLICY IF EXISTS "Allow delete" ON public_complaints;
CREATE POLICY public_complaints_public_insert
ON public_complaints
FOR INSERT
TO anon
WITH CHECK (true);
CREATE POLICY public_complaints_admin_read
ON public_complaints
FOR SELECT
TO authenticated
USING (public.is_ai_admin() AND public.region_matches(state));
CREATE POLICY public_complaints_admin_update
ON public_complaints
FOR UPDATE
TO authenticated
USING (public.is_ai_admin() AND public.region_matches(state))
WITH CHECK (public.is_ai_admin() AND public.region_matches(state));
CREATE POLICY public_complaints_super_admin_delete
ON public_complaints
FOR DELETE
TO authenticated
USING (public.is_super_admin());

DROP POLICY IF EXISTS "Allow read access" ON complaint_triage_events;
DROP POLICY IF EXISTS "Allow insert" ON complaint_triage_events;
DROP POLICY IF EXISTS "Allow update" ON complaint_triage_events;
DROP POLICY IF EXISTS "Allow delete" ON complaint_triage_events;
CREATE POLICY complaint_triage_events_admin_read
ON complaint_triage_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public_complaints c
    WHERE c.id = complaint_ref
      AND public.is_ai_admin()
      AND public.region_matches(c.state)
  )
);
CREATE POLICY complaint_triage_events_admin_insert
ON complaint_triage_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public_complaints c
    WHERE c.id = complaint_ref
      AND public.is_ai_admin()
      AND public.region_matches(c.state)
  )
);
CREATE POLICY complaint_triage_events_admin_update
ON complaint_triage_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public_complaints c
    WHERE c.id = complaint_ref
      AND public.is_ai_admin()
      AND public.region_matches(c.state)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public_complaints c
    WHERE c.id = complaint_ref
      AND public.is_ai_admin()
      AND public.region_matches(c.state)
  )
);
CREATE POLICY complaint_triage_events_super_admin_delete
ON complaint_triage_events
FOR DELETE
TO authenticated
USING (public.is_super_admin());

DROP POLICY IF EXISTS "Allow read access" ON ai_copilot_logs;
DROP POLICY IF EXISTS "Allow insert" ON ai_copilot_logs;
DROP POLICY IF EXISTS "Allow update" ON ai_copilot_logs;
DROP POLICY IF EXISTS "Allow delete" ON ai_copilot_logs;
CREATE POLICY ai_copilot_logs_read
ON ai_copilot_logs
FOR SELECT
TO authenticated
USING (
  public.can_access_simulation_row(user_id, region)
);
CREATE POLICY ai_copilot_logs_insert
ON ai_copilot_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin()
  OR (
    public.current_app_user_id() = user_id
    AND public.is_regional_officer()
    AND public.region_matches(region)
  )
);
CREATE POLICY ai_copilot_logs_update
ON ai_copilot_logs
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin()
  OR public.current_app_user_id() = user_id
)
WITH CHECK (
  public.is_super_admin()
  OR public.current_app_user_id() = user_id
);
CREATE POLICY ai_copilot_logs_delete
ON ai_copilot_logs
FOR DELETE
TO authenticated
USING (public.is_super_admin());

DROP POLICY IF EXISTS "Allow read access" ON ai_simulations;
DROP POLICY IF EXISTS "Allow insert" ON ai_simulations;
DROP POLICY IF EXISTS "Allow update" ON ai_simulations;
DROP POLICY IF EXISTS "Allow delete" ON ai_simulations;
CREATE POLICY ai_simulations_read
ON ai_simulations
FOR SELECT
TO authenticated
USING (public.can_access_simulation_row(user_id, region));
CREATE POLICY ai_simulations_insert
ON ai_simulations
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin()
  OR (
    public.current_app_user_id() = user_id
    AND (
      public.current_app_role() = 'regional_officer'
      AND public.region_matches(region)
    )
  )
);
CREATE POLICY ai_simulations_update
ON ai_simulations
FOR UPDATE
TO authenticated
USING (public.can_access_simulation_row(user_id, region))
WITH CHECK (public.can_access_simulation_row(user_id, region));
CREATE POLICY ai_simulations_delete
ON ai_simulations
FOR DELETE
TO authenticated
USING (
  public.is_super_admin()
  OR public.current_app_user_id() = user_id
);

DROP POLICY IF EXISTS "Allow read access" ON ai_simulation_reports;
DROP POLICY IF EXISTS "Allow insert" ON ai_simulation_reports;
DROP POLICY IF EXISTS "Allow update" ON ai_simulation_reports;
DROP POLICY IF EXISTS "Allow delete" ON ai_simulation_reports;
CREATE POLICY ai_simulation_reports_read
ON ai_simulation_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM ai_simulations s
    WHERE s.id = simulation_ref
      AND public.can_access_simulation_row(s.user_id, s.region)
  )
);
CREATE POLICY ai_simulation_reports_insert
ON ai_simulation_reports
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM ai_simulations s
    WHERE s.id = simulation_ref
      AND public.can_access_simulation_row(s.user_id, s.region)
  )
);
CREATE POLICY ai_simulation_reports_update
ON ai_simulation_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM ai_simulations s
    WHERE s.id = simulation_ref
      AND public.can_access_simulation_row(s.user_id, s.region)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM ai_simulations s
    WHERE s.id = simulation_ref
      AND public.can_access_simulation_row(s.user_id, s.region)
  )
);
CREATE POLICY ai_simulation_reports_delete
ON ai_simulation_reports
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM ai_simulations s
    WHERE s.id = simulation_ref
      AND (
        public.is_super_admin()
        OR public.current_app_user_id() = s.user_id
      )
  )
);
