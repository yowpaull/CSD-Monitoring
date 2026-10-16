-- Update history for inquiry logs.
--
-- "Last Updated By" becomes a trail instead of a single name: every edit
-- a log receives while it is still Open or Pending appends the editor, so
-- the shared pool shows who has handled an inquiry. The moment a log flips
-- to Closed the trail freezes -- the closing edit itself is not recorded,
-- because history only accumulates during the in-flight phase.
--
-- Recording lives in triggers rather than the server actions so no update
-- path (close, admin correction, a future action) can silently skip it.
-- The functions are SECURITY DEFINER only so the trigger may append the
-- row on the caller's behalf; reading stays governed by the RLS policy.

CREATE TABLE public.log_inquiry_updates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id uuid NOT NULL REFERENCES public.log_inquiries (id) ON DELETE CASCADE,
    updated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    status text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.log_inquiry_updates IS
    'Append-only trail of edits made to a log while it was Open or Pending.';

CREATE INDEX idx_log_inquiry_updates_log_id_created_at
    ON public.log_inquiry_updates (log_id, created_at DESC);

ALTER TABLE public.log_inquiry_updates ENABLE ROW LEVEL SECURITY;

-- A trail only means something next to the log it belongs to, so read
-- access mirrors log_inquiries: admins see every trail, everyone else
-- sees the trails of their own logs plus logs still in the shared pool.
-- No INSERT/UPDATE/DELETE policy exists, so the trail is immutable from
-- the client; only the triggers below can append to it.
CREATE POLICY "Users can view updates for logs they can read"
ON public.log_inquiry_updates
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.log_inquiries AS l
            WHERE l.id = log_inquiry_updates.log_id
              AND (
                    l.representative_id = auth.uid()
                    OR l.status IN ('Open', 'Pending')
              )
        )
    );

-- Seed the trail for logs that are already in flight: they predate this
-- migration, so their first entry is whoever the row credits as its last
-- updater (falling back to the representative it was filed under).
INSERT INTO public.log_inquiry_updates (log_id, updated_by, status, created_at)
SELECT l.id,
       COALESCE(l.updated_by, l.representative_id),
       l.status,
       l.updated_at
FROM public.log_inquiries AS l
WHERE l.status IN ('Open', 'Pending')
  AND NOT EXISTS (
        SELECT 1 FROM public.log_inquiry_updates AS u WHERE u.log_id = l.id
  );

CREATE OR REPLACE FUNCTION public.log_inquiry_record_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Freeze at Closed: the update that closes the log, and every edit
    -- after it, leaves the trail untouched.
    IF NEW.status NOT IN ('Open', 'Pending') THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.log_inquiry_updates (log_id, updated_by, status)
    VALUES (NEW.id, auth.uid(), NEW.status);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_inquiry_updates_insert ON public.log_inquiries;
CREATE TRIGGER trg_log_inquiry_updates_insert
    AFTER INSERT ON public.log_inquiries
    FOR EACH ROW
    WHEN (NEW.status IN ('Open', 'Pending'))
    EXECUTE FUNCTION public.log_inquiry_record_update();

DROP TRIGGER IF EXISTS trg_log_inquiry_updates_update ON public.log_inquiries;
CREATE TRIGGER trg_log_inquiry_updates_update
    AFTER UPDATE ON public.log_inquiries
    FOR EACH ROW
    WHEN (NEW.status IN ('Open', 'Pending'))
    EXECUTE FUNCTION public.log_inquiry_record_update();
