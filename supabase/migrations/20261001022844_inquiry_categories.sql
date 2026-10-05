Create Table public.inquiry_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

Create Table public.inquiry_main_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid not null
        references public.inquiry_categories(id) 
        on delete cascade,
    name text NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

Create Table public.inquiry_sub_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    main_category_id uuid not null
        references public.inquiry_main_categories(id) 
        on delete cascade,
    name text NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inquiry_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_sub_categories ENABLE ROW LEVEL SECURITY;


-- Inquiry Categories
CREATE POLICY "Authenticated users can view inquiry categories"
ON public.inquiry_categories
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Admins can insert inquiry categories"
ON public.inquiry_categories
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


CREATE POLICY "Admins can update inquiry categories"
ON public.inquiry_categories
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


CREATE POLICY "Admins can delete inquiry categories"
ON public.inquiry_categories
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);



-- Inquiry Main Categories
CREATE POLICY "Authenticated users can view inquiry main categories"
ON public.inquiry_main_categories
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Admins can insert inquiry main categories"
ON public.inquiry_main_categories
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


CREATE POLICY "Admins can update inquiry main categories"
ON public.inquiry_main_categories
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


CREATE POLICY "Admins can delete inquiry main categories"
ON public.inquiry_main_categories
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


-- Inquiry Sub Categories
CREATE POLICY "Authenticated users can view inquiry sub categories"
ON public.inquiry_sub_categories
FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "Admins can insert inquiry sub categories"
ON public.inquiry_sub_categories
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


CREATE POLICY "Admins can update inquiry sub categories"
ON public.inquiry_sub_categories
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


CREATE POLICY "Admins can delete inquiry sub categories"
ON public.inquiry_sub_categories
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);