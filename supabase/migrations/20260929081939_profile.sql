-- 1. Table schema
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trigger function to insert profile upon auth.users creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF new.email IS NULL THEN
        RAISE EXCEPTION 'auth.users.email is NULL; cannot create profiles row without email';
    END IF;

    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
        new.email,
        'user'
    );
    RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable Row Level Security (Mandatory)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    );
$$;

-- 6. Policies

-- Allow users to view their own profile, or admins to view all profiles
CREATE POLICY "Users and admins can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR is_admin()
);

-- Allow users to update their own profile (preventing role escalation)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid() 
    AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR is_admin())
);