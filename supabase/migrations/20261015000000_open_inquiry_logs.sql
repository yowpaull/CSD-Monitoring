-- Open Inquiry Logs: shared pool of Open logs + "Last Updated By".
--
-- Users can now see every Open log (not just their own) so they can
-- continue or close inquiries filed by colleagues. A new `updated_by`
-- column records who last touched a log, surfaced across all lists.

-- 1. Record who last edited a log. NULL means "never edited since it was
--    filed"; the `log` action back-fills it with the creator so the column
--    is always populated.
ALTER TABLE public.log_inquiries
    ADD COLUMN updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

-- 2. Relax profiles SELECT so the shared pool can render each log's
--    Representative name and the new Last Updated By for logs owned by
--    other users. Without this, profiles RLS hides other users' rows and
--    those names would render blank.
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.profiles;

CREATE POLICY "Users and admins can view profiles"
ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. Relax log_inquiries SELECT: everyone sees their own logs plus every
--    Open log from any colleague.
DROP POLICY IF EXISTS "Users can view own logs, admins can view all" ON public.log_inquiries;

CREATE POLICY "Users can view own logs, open logs, admins can view all"
ON public.log_inquiries
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR representative_id = auth.uid()
        OR status = 'Open'
    );

-- 4. Relax log_inquiries UPDATE so any user can continue or close any Open
--    log. USING gates which existing rows are touchable (own, Open, or all
--    for admins); WITH CHECK permits any valid resulting status.
DROP POLICY IF EXISTS "Users can update own logs, admins can update all" ON public.log_inquiries;

CREATE POLICY "Users can update own logs, open logs, admins can update all"
ON public.log_inquiries
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR representative_id = auth.uid()
        OR status = 'Open'
    )
    WITH CHECK (
        public.is_admin()
        OR representative_id = auth.uid()
        OR status IN ('Open', 'Pending', 'Closed')
    );

-- 5. Guard ownership: "continue" lets a colleague edit an Open log, but
--    the log must never be re-assigned to them. The server actions already
--    omit representative_id; this trigger blocks it at the database even
--    for a hand-rolled request.
CREATE OR REPLACE FUNCTION public.log_inquiries_guard_representative()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.representative_id IS DISTINCT FROM OLD.representative_id
        AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'representative_id cannot be changed by a non-admin';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_inquiries_guard_representative ON public.log_inquiries;

CREATE TRIGGER trg_log_inquiries_guard_representative
    BEFORE UPDATE ON public.log_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.log_inquiries_guard_representative();

-- 6. Covers the open listing: status filter + newest-first ordering.
CREATE INDEX IF NOT EXISTS idx_log_inquiries_status_created_at
    ON public.log_inquiries (status, created_at DESC);
