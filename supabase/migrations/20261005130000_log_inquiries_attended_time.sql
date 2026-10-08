-- Attendee times are wall-clock, not instants.
--
-- The form posts bare 'HH:mm' from <input type="time">, but the columns
-- were timestamptz. Postgres coerced that to the database TimeZone (UTC)
-- and stamped it with the epoch date, so a rep who typed 9:30 AM stored
-- 1970-01-01T09:30:00Z. Anything then reading it back through a timezone
-- conversion shifted it by the browser offset (5:30 PM in PHT).
--
-- `time` is the correct type: a wall-clock meeting time has no timezone.
-- The cast reads the existing UTC wall-clock back out unchanged, so rows
-- already in the table keep the value the rep actually typed.

-- Dropped and re-added rather than converted in place: the check depends
-- on both columns, and `time >= time` has to be revalidated against the
-- new types.
ALTER TABLE public.log_inquiries
    DROP CONSTRAINT logs_valid_attended_time;

ALTER TABLE public.log_inquiries
    ALTER COLUMN start_attended TYPE time
    USING (start_attended AT TIME ZONE 'UTC')::time;

ALTER TABLE public.log_inquiries
    ALTER COLUMN end_attended TYPE time
    USING (end_attended AT TIME ZONE 'UTC')::time;

-- Still valid, and now more meaningful: a pure wall-clock comparison
-- with no timezone to disagree about.
ALTER TABLE public.log_inquiries
    ADD CONSTRAINT logs_valid_attended_time
    CHECK (end_attended >= start_attended);