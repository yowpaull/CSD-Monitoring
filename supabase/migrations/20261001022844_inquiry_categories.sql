Create Table public.inquiry_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
)

Create Table public.inquiriy_main_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid not null
        references public.inquiry_categories(id) 
        on delete cascade,
    name text NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
)

Create Table public.inquiry_sub_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    main_category_id uuid not null
        references public.inquiriy_main_categories(id) 
        on delete cascade,
    name text NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
)