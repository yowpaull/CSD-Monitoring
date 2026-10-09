-- Representatives could never delete anything: the policy was admin-only,
-- so the own-scope Delete button was a guaranteed RLS rejection (PostgREST
-- reports it as a successful delete of zero rows, which reads as "done"
-- unless the caller checks the returned row count).
--
-- Widened to mirror the UPDATE policy so a rep can delete their own logs
-- and an admin can delete any. Ownership is not transferable through a
-- delete, so this needs no reassignment handling.

DROP POLICY IF EXISTS "Admins can delete logs" ON public.log_inquiries;

CREATE POLICY "Users can delete own logs, admins can delete all"
ON public.log_inquiries
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin()
        OR representative_id = auth.uid()
    );