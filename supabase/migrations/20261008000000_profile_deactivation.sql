-- Members cannot be hard-deleted: inquiry_log.representative_id
-- references profiles(id) ON DELETE RESTRICT, so removing an account
-- with logged inquiries would fail anyway. Deactivation keeps the row —
-- and therefore the name shown on historical logs — while cutting off
-- access.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Admin-gated full-name update, mirroring set_profile_role: the
-- "Users can update own profile" RLS policy only permits self-updates,
-- so an admin needs a SECURITY DEFINER function to touch another
-- member's row. is_admin() is the only authorization gate.

CREATE OR REPLACE FUNCTION public.set_profile_full_name(
    target_id UUID,
    new_full_name TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    updated_profile public.profiles;
    cleaned_name TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can edit member names'
            USING ERRCODE = '42501';
    END IF;

    cleaned_name := TRIM(COALESCE(new_full_name, ''));

    IF LENGTH(cleaned_name) < 2 THEN
        RAISE EXCEPTION 'Full name must be at least 2 characters long'
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.profiles
    SET full_name = cleaned_name
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
REVOKE ALL ON FUNCTION public.set_profile_full_name(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_full_name(UUID, TEXT) TO authenticated;

-- Deactivation toggle. An admin who deactivated themselves would own the
-- only account able to reactivate anyone, so self-deactivation is
-- refused here as well as in the server action (defense in depth).

CREATE OR REPLACE FUNCTION public.set_profile_active(
    target_id UUID,
    new_active BOOLEAN
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    updated_profile public.profiles;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins can activate or deactivate members'
            USING ERRCODE = '42501';
    END IF;

    IF new_active IS NULL THEN
        RAISE EXCEPTION 'new_active must be a boolean'
            USING ERRCODE = '22023';
    END IF;

    IF NOT new_active AND target_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot deactivate your own account'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.profiles
    SET is_active = new_active
    WHERE id = target_id
    RETURNING * INTO updated_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No profile found for user %', target_id
            USING ERRCODE = 'P0002';
    END IF;

    RETURN updated_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_active(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_active(UUID, BOOLEAN) TO authenticated;
