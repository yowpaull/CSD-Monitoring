-- inquiry_datetime is a wall-clock value, not an instant.
--
-- The form posts `datetime-local`, which has no timezone, but the column
-- was timestamptz. Postgres stored the digits in UTC and stamped the
-- server's current date, so a rep who typed 2026-10-05 9:30 AM kept a
-- value that reads back as 5:30 PM for any browser east of UTC.
--
-- `timestamp without time zone` stores the digits as typed. Nothing else
-- in the table depends on the instant, and the existing date-range filter
-- is a calendar-day comparison, which is exactly a naive-timestamp
-- operation. Same read-back trick as the attended-time migration so rows
-- already stored keep the wall-clock the rep entered.

ALTER TABLE public.log_inquiries
    ALTER COLUMN inquiry_datetime TYPE timestamp
    USING (inquiry_datetime AT TIME ZONE 'UTC')::timestamp;

-- The date-range filter runs gte/lt against this column on every filtered
-- page load, and it had no index.
CREATE INDEX idx_log_inquiries_inquiry_datetime
    ON public.log_inquiries (inquiry_datetime);