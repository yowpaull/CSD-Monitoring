import { createClient } from '@/lib/supabase/server';

/**
 * The signed-in account as the profile pages show it.
 *
 * Everything except `last_sign_in_at` comes from `profiles`, which is
 * also what the layouts, the Team list and the inquiry log's
 * Representative column read — so editing the name here updates every
 * place it appears.
 */
export type CurrentProfile = {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    /** From the auth user; there is no matching column on `profiles`. */
    last_sign_in_at: string | null;
};

/**
 * The caller's own profile row, or null when there is no session — or
 * no row. The signup trigger creates `auth.users` and `profiles`
 * together, so the latter only happens for an account created outside
 * the normal flow.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .eq('id', user.id)
        .single();

    if (!profile) return null;

    return {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        created_at: profile.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
    };
}
