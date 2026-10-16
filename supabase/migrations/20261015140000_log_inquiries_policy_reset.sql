-- Reset public.log_inquiries policies.
--
-- Two probes against the same row, in the same authenticated `role = 'user'`
-- session:
--
--   SELECT  another representative's Closed log  -> returned the row
--   UPDATE  that same row (no-op patch)          -> matched zero rows
--
-- Writes enforced, reads not, on the same table. RLS itself is demonstrably
-- active (the `anon` role sees zero rows), so the only way this asymmetry
-- arises is an extra SELECT policy -- with a name that no migration in this
-- repo drops -- OR-ing itself into every read. Since every drop in the repo
-- is name-specific, the repair is to drop *every* policy on the table and
-- rebuild the four the application expects.
--
-- The leading DO block prints each policy (and its expression) before
-- removing it, so the notices identify whatever was permissive. Re-running
-- this script is safe: drops happen before the creates.

DO $$
DECLARE
    pol      record;
    names    text[];
    pol_name text;
BEGIN
    FOR pol IN
        SELECT cmd, policyname, qual
          FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'log_inquiries'
         ORDER BY cmd, policyname
    LOOP
        RAISE NOTICE 'existing [%] % :: %', pol.cmd, pol.policyname, pol.qual;
    END LOOP;

    SELECT coalesce(array_agg(policyname), '{}'::text[])
      INTO names
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'log_inquiries';

    FOREACH pol_name IN ARRAY names LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.log_inquiries',
            pol_name
        );
    END LOOP;

    RAISE NOTICE 'dropped % log_inquiries policy/policies; rebuilding', array_length(names, 1);
END;
$$;

ALTER TABLE public.log_inquiries ENABLE ROW LEVEL SECURITY;

-- SELECT: your own logs, plus any Open/Pending log from a colleague;
-- admins see everything.
CREATE POLICY "Users can view own logs, open/pending logs, admins can view all"
ON public.log_inquiries
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR representative_id = auth.uid()
        OR status IN ('Open', 'Pending')
    );

-- INSERT: a representative may only file a log against their own id.
CREATE POLICY "Users can insert own logs"
ON public.log_inquiries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        representative_id = auth.uid()
    );

-- UPDATE: touch your own logs or a colleague's Open/Pending log; admins all.
-- USING gates the existing row, WITH CHECK permits the resulting status,
-- including the `Closed` written by the close confirmation.
CREATE POLICY "Users can update own logs, open/pending logs, admins can update all"
ON public.log_inquiries
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR representative_id = auth.uid()
        OR status IN ('Open', 'Pending')
    )
    WITH CHECK (
        public.is_admin()
        OR representative_id = auth.uid()
        OR status IN ('Open', 'Pending', 'Closed')
    );

-- DELETE: your own logs; admins can delete any.
CREATE POLICY "Users can delete own logs, admins can delete all"
ON public.log_inquiries
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin()
        OR representative_id = auth.uid()
    );
