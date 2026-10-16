-- Who closed an inquiry log.
--
-- The update trail deliberately freezes at Closed, so the closing edit is
-- not part of it -- which means nothing in the trail identifies the closer.
-- A dedicated pair records that moment instead: `closed_by` / `closed_at`
-- are written by a BEFORE trigger on the Open/Pending -> Closed transition,
-- so every close path records them and a later edit cannot overwrite the
-- attribution the way `updated_by` (which simply tracks the last writer)
-- would. Reopening clears both, so an in-flight log never claims to be
-- closed.

ALTER TABLE public.log_inquiries
    ADD COLUMN closed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
    ADD COLUMN closed_at timestamptz;

CREATE OR REPLACE FUNCTION public.log_inquiries_set_closed_by()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Filed as Closed straight away (no transition): attribute it to whoever
    -- filed it, falling back to the representative when there is no session.
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'Closed' THEN
            NEW.closed_by := COALESCE(auth.uid(), NEW.representative_id);
            NEW.closed_at := now();
        END IF;

        RETURN NEW;
    END IF;

    -- Entered the Closed state.
    IF NEW.status = 'Closed' AND OLD.status IS DISTINCT FROM 'Closed' THEN
        NEW.closed_by := auth.uid();
        NEW.closed_at := now();

    -- Reopened: the attribution would be a lie, so clear it.
    ELSIF NEW.status IS DISTINCT FROM 'Closed' AND OLD.status = 'Closed' THEN
        NEW.closed_by := NULL;
        NEW.closed_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_inquiries_set_closed_by ON public.log_inquiries;

CREATE TRIGGER trg_log_inquiries_set_closed_by
    BEFORE INSERT OR UPDATE ON public.log_inquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.log_inquiries_set_closed_by();

-- Attribute the logs that are already closed. `updated_by` is the last
-- writer on those rows, which for a closed log is overwhelmingly the closer,
-- and the column this pair mirrors already displays it. Logs whose status
-- later moves again will have it cleared or rewritten by the trigger above.
UPDATE public.log_inquiries AS l
SET closed_by = COALESCE(l.updated_by, l.representative_id),
    closed_at = COALESCE(l.updated_at, l.created_at)
WHERE l.status = 'Closed'
  AND l.closed_at IS NULL;
