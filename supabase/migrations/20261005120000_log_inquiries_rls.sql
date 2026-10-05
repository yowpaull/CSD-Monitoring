-- Row Level Security + indexes for public.log_inquiries
--
-- The table previously had RLS disabled, which meant any authenticated
-- user could read every representative's logs. Policies below scope
-- reads/writes to the owner, while public.is_admin() keeps the admin
-- area fully functional.

ALTER TABLE public.log_inquiries ENABLE ROW LEVEL SECURITY;

-- Admins see every log; everyone else sees only their own.
CREATE POLICY "Users can view own logs, admins can view all"
ON public.log_inquiries
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR representative_id = auth.uid()
    );

-- A representative may only file a log against their own id.
-- The `log` server action already sends user.id here.
CREATE POLICY "Users can insert own logs"
ON public.log_inquiries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        representative_id = auth.uid()
    );

CREATE POLICY "Users can update own logs, admins can update all"
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

CREATE POLICY "Admins can delete logs"
ON public.log_inquiries
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin()
    );

-- Indexes backing the inquiry log list: default ordering, the
-- per-representative scope, and each filter dropdown. Without these
-- every filtered page would fall back to a sequential scan.
CREATE INDEX idx_log_inquiries_created_at
    ON public.log_inquiries (created_at DESC);

CREATE INDEX idx_log_inquiries_representative_id
    ON public.log_inquiries (representative_id);

-- Covers the most common scope + sort: one rep's logs, newest first.
CREATE INDEX idx_log_inquiries_representative_created_at
    ON public.log_inquiries (representative_id, created_at DESC);

CREATE INDEX idx_log_inquiries_brand_id
    ON public.log_inquiries (brand_id);

CREATE INDEX idx_log_inquiries_platform_id
    ON public.log_inquiries (platform_id);

CREATE INDEX idx_log_inquiries_sub_category_id
    ON public.log_inquiries (inquiry_sub_category_id);

CREATE INDEX idx_log_inquiries_status
    ON public.log_inquiries (status);
