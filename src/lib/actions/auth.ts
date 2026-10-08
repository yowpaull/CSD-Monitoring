'use server'

import { createClient, createEphemeralClient } from '@/lib/supabase/server';
import {
    changePasswordSchema,
    createMemberSchema,
    loginSchema,
    updateProfileSchema,
} from '@/lib/validations/auth-schema';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type ActionResult = {
    error? : string;
    fieldErrors? : Record<string, string[] | undefined>;
    enteredValues?: {
        full_name?: string;
        email?: string;
        role?: string;
    };
    success? : boolean;
    message? : string;
    redirectTo? : string;
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Resolves the signed-in user's role from their profile row.
 *
 * `profiles.role` is the single source of truth: the signup trigger always
 * inserts 'user' and promotion happens through the admin-only
 * `set_profile_role` RPC. Never trust `user_metadata.role` here — it is
 * user-writable via `updateUserMetadata`, so falling back to it would let
 * anyone self-promote to admin.
 */
export async function getUserRole(supabase: ServerSupabaseClient): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 'user';

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role ?? 'user';
}

export async function login(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
    const email = String(formData.get('email') ?? '').trim();

    const raw = {
        email: formData.get('email'),
        password: formData.get('password'),
    }

    const parsed = loginSchema.safeParse(raw);

    if (!parsed.success) {
        return { 
            fieldErrors: parsed.error.flatten().fieldErrors,
            enteredValues: { email }, 
        };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
    });

    if (error) {
        return { 
            error: 'Invalid Email or Password! Please try again.',
            enteredValues: { email },
        };
    }

    // Redirect based on role: admins go to the admin dashboard,
    // regular users go to their task page.
    const role = await getUserRole(supabase);

    if (role === 'admin') {
        redirect('/admin/dashboard');
    }

    redirect('/user/log');
}

export async function createMember(_prevState: ActionResult | null,formData: FormData): Promise<ActionResult> {
    
    const full_name = String(formData.get('full_name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const role = String(formData.get('role') ?? 'user').trim();

    const raw = {
        full_name,
        email,
        role,
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
    };

    const parsed = createMemberSchema.safeParse(raw);

    if (!parsed.success) {
        return {
            fieldErrors: parsed.error.flatten().fieldErrors,
            enteredValues: {
                full_name,
                email,
                role,
            },
        };
    }

    const enteredValues = { full_name, email, role };

    // Server actions are public endpoints. Authorize against the caller's
    // session before creating anything — without this check any visitor could
    // mint themselves an account and, via the role field, an admin one.
    const supabase = await createClient();
    const callerRole = await getUserRole(supabase);

    if (callerRole !== 'admin') {
        return { error: 'You do not have permission to add members.' };
    }

    // Create the account on a client with no cookie storage. Calling signUp on
    // the caller's own client would persist the *new member's* session over the
    // admin's cookies (enable_confirmations is false, so signUp returns one),
    // logging the admin out and swapping their browser onto the new account.
    const { data, error } = await createEphemeralClient().auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
            // Role is intentionally omitted: user_metadata is writable by the
            // account holder, so it can never be trusted for authorization.
            // The role is applied below through an admin-gated RPC.
            data: { full_name: parsed.data.full_name },
        },
    });

    if (error) {
        if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
        ) {
        return {
            error: 'Email is already registered!',
            enteredValues,
        };
        }

    return {
            error: error.message,
            enteredValues,
        };
    }

    // With email confirmations enabled Supabase returns no session and no user
    // until the address is verified, so there is nothing to promote yet. The
    // account still exists and an admin can set the role after verification.
    const newUserId = data.user?.id;

    if (!newUserId) {
        return {
            message: 'Account created successfully! Confirm the email to finish setting up the member.',
        };
    }

    // Runs as the admin, so is_admin() passes inside the function and RLS on
    // profiles (which only permits self-updates) is bypassed.
    const { error: roleError } = await supabase.rpc('set_profile_role', {
        target_id: newUserId,
        new_role: parsed.data.role,
    });

    if (roleError) {
        return {
            error: `Member created but the role could not be assigned: ${roleError.message}`,
            enteredValues,
        };
    }

    return {
        message: 'Account created successfully!',
    };
}

export async function updateProfile(_prevState: ActionResult | null,formData: FormData): Promise<ActionResult> {
    const full_name = String(formData.get('full_name') ?? '').trim();

    const parsed = updateProfileSchema.safeParse({ full_name });

    if (!parsed.success) {
        return {
            fieldErrors: parsed.error.flatten().fieldErrors,
            enteredValues: { full_name },
        };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Server actions are public endpoints: the row to update comes from
    // the caller's own session, never from the form, so nobody can edit
    // someone else's profile by tampering with the payload.
    if (!user) {
        return { error: 'Your session has expired. Please sign in again.' };
    }

    // RLS ("Users can update own profile") allows exactly this row and
    // blocks a role change in the same statement, so the UPDATE cannot
    // be used to self-promote.
    const { error } = await supabase
        .from('profiles')
        .update({ full_name: parsed.data.full_name })
        .eq('id', user.id);

    if (error) {
        console.error('Failed to update profile:', error);
        return {
            error: 'Your profile could not be updated. Please try again.',
            enteredValues: { full_name },
        };
    }

    // The profile pages read this row on the server, so both routes are
    // refreshed — whichever one is open picks up the new name.
    revalidatePath('/user/profile');
    revalidatePath('/admin/profile');

    return { message: 'Profile updated successfully!' };
}

export async function changePassword(_prevState: ActionResult | null,formData: FormData): Promise<ActionResult> {
    const raw = {
        current_password: formData.get('current_password'),
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
    };

    const parsed = changePasswordSchema.safeParse(raw);

    if (!parsed.success) {
        return {
            fieldErrors: parsed.error.flatten().fieldErrors,
        };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
        return { error: 'Your session has expired. Please sign in again.' };
    }

    // `updateUser` has no current-password parameter, so the existing
    // password is verified here first: a stolen session must still know
    // the password to change it. This also rotates the session tokens,
    // which is harmless — it is the same account, freshly authenticated.
    const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: parsed.data.current_password,
    });

    if (verifyError) {
        return {
            fieldErrors: {
                current_password: ['Current password is incorrect.'],
            },
        };
    }

    const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
    });

    if (error) {
        console.error('Failed to change password:', error);

        // GoTrue's own "must be different" complaint lands here; the
        // strength rules are already enforced by the schema above.
        if (
            error.message.toLowerCase().includes('different') ||
            error.message.toLowerCase().includes('same')
        ) {
            return {
                fieldErrors: {
                    password: [
                        'New password must be different from your current password.',
                    ],
                },
            };
        }

        return { error: error.message };
    }

    return { message: 'Password changed successfully!' };
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/');
    redirect('/');
}