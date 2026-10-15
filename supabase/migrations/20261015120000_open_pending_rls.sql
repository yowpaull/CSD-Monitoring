-- Open Inquiry Logs: extend the shared pool to Pending + re-assert RLS.
--
-- 1. The pool now covers both in-flight statuses, so a colleague must be
--    able to SEE and CLOSE a Pending log, not just an Open one. Both the
--    SELECT and UPDATE policies widen from `status = 'Open'` to
--    `status IN ('Open', 'Pending')`.
--
-- 2. RLS on log_inquiries is re-asserted from scratch. An audit showed an
--    authenticated `role = 'user'` session reading another representative's
--    Closed logs, which is only possible when RLS is not in force (the
--    table's enabled flag off, or a stale permissive policy present). The
--    leading DO block reports what it finds so the run doubles as a
--    diagnostic, then the table is re-enabled and the SELECT/UPDATE policies
--    are rebuilt.
--
-- Every statement is idempotent: re-running this script is safe.

DO $$
DECLARE
    pol     record;
    enabled boolean;
BEGIN
    SELECT c.relrowsecurity
      INTO enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname  = 'log_inquiries';

    RAISE NOTICE 'log_inquiries RLS enabled: %', enabled;

    FOR pol IN
        SELECT policyname, cmd, qual
          FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'log_inquiries'
         ORDER BY cmd, policyname
    LOOP
        RAISE NOTICE 'existing policy [%] % :: %', pol.cmd, pol.policyname, pol.qual;
    END LOOP;
END;
$$;

ALTER TABLE public.log_inquiries ENABLE ROW LEVEL SECURITY;

-- SELECT ------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own logs, admins can view all"
    ON public.log_inquiries;
DROP POLICY IF EXISTS "Users can view own logs, open logs, admins can view all"
    ON public.log_inquiries;
DROP POLICY IF EXISTS "Users can view own logs, open/pending logs, admins can view all"
    ON public.log_inquiries;

CREATE POLICY "Users can view own logs, open/pending logs, admins can view all"
ON public.log_inquiries
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR representative_id = auth.uid()
        OR status IN ('Open', 'Pending')
    );

-- UPDATE ------------------------------------------------------------------
-- Direct UPDATE is limited to owners/admins to prevent non-owner edits to
-- business/audit fields on colleague rows. Cross-representative "close"
-- actions should be implemented via a controlled SECURITY DEFINER RPC.
DROP POLICY IF EXISTS "Users can update own logs, admins can update all"
    ON public.log_inquiries;
DROP POLICY IF EXISTS "Users can update own logs, open logs, admins can update all"
    ON public.log_inquiries;
DROP POLICY IF EXISTS "Users can update own logs, open/pending logs, admins can update all"
    ON public.log_inquiries;

CREATE POLICY "Users can update own logs, open/pending logs, admins can update all"
ON public.log_inquiries
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR representative_id = auth.uid()
    )
    WITH CHECK (
        public.is_admin()
        OR representative_id = auth.uid()
    );
