-- Admins need to change a member's role after that member already exists.
-- The "Users can update own profile" RLS policy only permits rows where
-- id = auth.uid(), so an admin cannot promote someone else with a plain
-- UPDATE. This SECURITY DEFINER function bypasses RLS, which makes the
-- explicit is_admin() check below the only authorization gate.

CREATE OR REPLACE FUNCTION public.set_profile_role(
    target_id UUID,
    new_role TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    updated_profile public.profiles;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can change profile roles'
            USING ERRCODE = '42501';
    END IF;

    -- Guard against the caller bypassing the profiles.role CHECK constraint
    -- with a value the table would otherwise reject with an opaque error.
    IF new_role IS NULL OR new_role NOT IN ('admin', 'user') THEN
        RAISE EXCEPTION 'Invalid role %, expected ''admin'' or ''user''', new_role
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.profiles
    SET role = new_role
    WHERE id = target_id
    RETURNING * INTO updated_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No profile found for user %', target_id
            USING ERRCODE = 'P0002';
    END IF;

    RETURN updated_profile;
END;
$$;

-- Functions default to EXECUTE for PUBLIC, so revoke before granting the
-- narrow role the action needs.
REVOKE ALL ON FUNCTION public.set_profile_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_role(UUID, TEXT) TO authenticated;