Create Table public.platforms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
)

ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view platforms"
ON public.platforms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert platforms"
ON public.platforms
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);

CREATE POLICY "Admins can update platforms"
ON public.platforms
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

CREATE POLICY "Admins can delete platforms"
ON public.platforms
FOR DELETE
TO authenticated
USING (
    public.is_admin()
);