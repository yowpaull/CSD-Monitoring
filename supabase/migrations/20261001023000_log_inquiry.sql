create table public.log_inquiries (
    id uuid primary key default gen_random_uuid(),

    inquiry_datetime timestamptz not null,

    platform_id uuid not null
        references public.platforms(id)
        on delete restrict,

    brand_id uuid not null
        references public.brands(id)
        on delete restrict,

    representative_id uuid not null
        references public.profiles(id)
        on delete restrict,

    inquiry_sub_category_id uuid not null
        references public.inquiry_sub_categories(id)
        on delete restrict,

    start_attended timestamptz not null,

    end_attended timestamptz not null,

    customer_name varchar(150) not null,

    thread_number integer not null,

    quantity integer not null default 1
        check (quantity > 0),

    order_number varchar(100),

    item varchar(255),

    customer_concern text,

    action_response text,

    status varchar(50) not null default 'Open'
        check (
            status in (
                'Open',
                'Pending',
                'Closed'
            )
        ),

    remarks text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint logs_valid_attended_time
        check (end_attended >= start_attended)
);