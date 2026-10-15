-- Fast case-insensitive substring search on customer_name.
--
-- The log list (admin and own scope) and the Excel export filter with
-- `customer_name ilike '%term%'`, which a plain b-tree index cannot
-- serve. pg_trgm's GIN index handles contains-matching, and escaping
-- LIKE metacharacters in the app keeps the pattern literal.

create extension if not exists pg_trgm with schema extensions;

create index if not exists idx_log_inquiries_customer_name_trgm
    on public.log_inquiries
    using gin (customer_name extensions.gin_trgm_ops);
