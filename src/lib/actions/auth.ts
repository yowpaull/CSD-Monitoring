'use server'

import { createClient, createEphemeralClient } from '@/lib/supabase/server';
import {
    changePasswordSchema,
    createMemberSchema,
    forgotPasswordSchema,
    loginSchema,
    resetPasswordSchema,
    updateProfileSchema,
} from '@/lib/validations/auth-schema';
import { rateLimit } from '@/lib/rate-limit';
import { PASSWORD_RESET_COOKIE } from '@/lib/password-reset';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const PASSWORD_RESET_WINDOW_MS = 15 * 60 * 1000;
// Per-address budget stops one victim being email-bombed; the larger
// per-IP budget lets shared offices work while still capping a single
// source hammering many addresses.
const PASSWORD_RESET_EMAIL_LIMIT = 3;
const PASSWORD_RESET_IP_LIMIT = 30;

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
    const { data, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
    });

    if (error) {
        return { 
            error: 'Invalid Email or Password! Please try again.',
            enteredValues: { email },
        };
    }

    // Deactivated accounts are refused right after authentication: the
    // proxy signs out live sessions too, but without this check the
    // redirect below would bounce straight back to the login page with
    // no explanation.
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .single();

    if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        return {
            error: 'This account has been deactivated. Please contact your administrator.',
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

/**
 * The best-effort caller IP for rate-limit keying. `x-forwarded-for`
 * is preferred because the deployment sits behind a proxy; the leftmost
 * entry is the client. Falls back to `x-real-ip`, then a shared
 * sentinel so a missing header cannot bypass the limit.
 */
async function clientIpAddress(): Promise<string> {
    const headerList = await headers();

    const forwardedFor = headerList.get('x-forwarded-for');
    if (forwardedFor) {
        const first = forwardedFor.split(',')[0]?.trim();
        if (first) return first;
    }

    return headerList.get('x-real-ip')?.trim() || 'unknown';
}

/** Builds the absolute origin the recovery email should redirect back to. */
async function requestOrigin(): Promise<string> {
    const headerList = await headers();

    const host =
        headerList.get('x-forwarded-host')?.split(',')[0]?.trim() ||
        headerList.get('host') ||
        'localhost:3000';
    const proto =
        headerList.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
        (host.startsWith('localhost') ? 'http' : 'https');

    return `${proto}://${host}`;
}

/**
 * Sends the password-reset email after rate limiting by address and by
 * IP. The response is always the same generic success line: it must not
 * reveal whether the address belongs to an account (enumeration) or
 * whether the send failed.
 */
export async function requestPasswordReset(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
    const email = String(formData.get('email') ?? '').trim();

    const parsed = forgotPasswordSchema.safeParse({ email });

    if (!parsed.success) {
        return {
            fieldErrors: parsed.error.flatten().fieldErrors,
            enteredValues: { email },
        };
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    const ip = await clientIpAddress();

    // Counts every attempt, valid address or not, so the limiter cannot
    // be used to infer which emails are registered.
    const emailLimit = rateLimit({
        key: `password-reset:email:${normalizedEmail}`,
        limit: PASSWORD_RESET_EMAIL_LIMIT,
        windowMs: PASSWORD_RESET_WINDOW_MS,
    });
    const ipLimit = rateLimit({
        key: `password-reset:ip:${ip}`,
        limit: PASSWORD_RESET_IP_LIMIT,
        windowMs: PASSWORD_RESET_WINDOW_MS,
    });

    if (!emailLimit.allowed || !ipLimit.allowed) {
        const retryAfter = Math.max(
            emailLimit.retryAfterSeconds,
            ipLimit.retryAfterSeconds
        );

        return {
            error: `Too many reset requests. Please wait ${retryAfter} seconds and try again.`,
            enteredValues: { email },
        };
    }

    const origin = await requestOrigin();

    // Must be the cookie-based client, not createEphemeralClient: the
    // Supabase SSR client runs the PKCE flow, and the code verifier it
    // mints here is persisted to a cookie that /auth/callback reads back
    // when exchanging the code for a session. The anonymous client has no
    // storage and falls back to the implicit flow, whose recovery links
    // carry no `code` — the callback would send the user to the login
    // page. Nothing is signed in on this public page, so writing cookies
    // (the verifier) cannot clobber a session.
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo: `${origin}/auth/callback?next=/reset-password` }
    );

    if (error) {
        // Logged, never surfaced: "no such user" would leak which
        // addresses are registered.
        console.error('Failed to send password reset email:', error);
    }

    return {
        success: true,
        message:
            'If an account exists for that email, a password reset link is on its way.',
        enteredValues: { email },
    };
}

/**
 * Completes a reset using the recovery session created by
 * `/auth/callback`. The httpOnly marker cookie proves the request came
 * from the emailed link, so a normal (or stolen) session cannot rotate
 * the password without mailbox control.
 */
export async function resetPassword(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
    const parsed = resetPasswordSchema.safeParse({
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
    });

    if (!parsed.success) {
        return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const cookieStore = await cookies();
    const marker = cookieStore.get(PASSWORD_RESET_COOKIE)?.value;

    if (!user || !marker || marker !== user.id) {
        return {
            error:
                'This password reset link is invalid or has expired. Please request a new one.',
        };
    }

    const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
    });

    if (error) {
        console.error('Failed to reset password:', error);

        if (
            error.message.toLowerCase().includes('different') ||
            error.message.toLowerCase().includes('same')
        ) {
            return {
                fieldErrors: {
                    password: [
                        'New password must be different from your old password.',
                    ],
                },
            };
        }

        return {
            error:
                'Your password could not be updated. Please request a new reset link.',
        };
    }

    // Consume the marker and end the recovery session: the link is
    // single-use and the user signs back in with the new password.
    cookieStore.delete(PASSWORD_RESET_COOKIE);
    await supabase.auth.signOut();

    return {
        success: true,
        message: 'Your password has been updated. You can now sign in.',
    };
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

/**
 * Admin-only: edits a team member's full name and role. The name moves
 * through `set_profile_full_name` and the role through the admin-gated
 * `set_profile_role` RPC, because RLS only ever permits self-updates on
 * profiles. An admin cannot change their own role — demoting the
 * account you are signed in as would lock the team out of admin.
 */
export async function updateMember(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
    const full_name = String(formData.get('full_name') ?? '').trim();
    const member_id = String(formData.get('member_id') ?? '').trim();
    const role = String(formData.get('role') ?? '').trim();

    const enteredValues = { full_name, role };

    // The same rule as editing your own name: one validation story.
    const parsed = updateProfileSchema.safeParse({ full_name });

    if (!parsed.success) {
        return {
            fieldErrors: parsed.error.flatten().fieldErrors,
            enteredValues,
        };
    }

    if (role !== 'admin' && role !== 'user') {
        return {
            fieldErrors: { role: ['Role must be either admin or user'] },
            enteredValues,
        };
    }

    if (!member_id) {
        return { error: 'Missing member id.' };
    }

    const supabase = await createClient();
    const callerRole = await getUserRole(supabase);

    if (callerRole !== 'admin') {
        return { error: 'You do not have permission to edit members.' };
    }

    // Read the current values so unchanged parts stay untouched and the
    // success message can say what actually moved.
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', member_id)
        .single();

    const nameChanged = profile
        ? profile.full_name !== parsed.data.full_name
        : true;
    const roleChanged = profile ? profile.role !== role : false;

    if (roleChanged) {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user && member_id === user.id) {
            return {
                error: 'You cannot change your own role.',
                enteredValues,
            };
        }
    }

    const { error } = await supabase.rpc('set_profile_full_name', {
        target_id: member_id,
        new_full_name: parsed.data.full_name,
    });

    if (error) {
        console.error('Failed to update member name:', error);
        return {
            error: 'The member name could not be updated. Please try again.',
            enteredValues,
        };
    }

    if (roleChanged) {
        const { error: roleError } = await supabase.rpc('set_profile_role', {
            target_id: member_id,
            new_role: role,
        });

        if (roleError) {
            console.error('Failed to update member role:', roleError);
            return {
                error: 'The member role could not be updated. Please try again.',
                enteredValues,
            };
        }
    }

    if (roleChanged && nameChanged) {
        return { message: 'Member updated successfully!' };
    }

    if (roleChanged) {
        return { message: 'Member role updated successfully!' };
    }

    return { message: 'Member name updated successfully!' };
}

/**
 * Admin-only: flips a member between active and deactivated. The target
 * state is posted explicitly (never "whatever the button clicked"), so
 * replaying a payload can only produce that state. Deactivation is the
 * substitute for deletion — the row stays because inquiry logs
 * reference it — and an admin cannot deactivate themselves, here and
 * again inside the RPC, or nobody could reactivate the team.
 */
export async function setMemberActive(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
    const member_id = String(formData.get('member_id') ?? '').trim();
    const rawActive = String(formData.get('active') ?? '');

    if (!member_id) {
        return { error: 'Missing member id.' };
    }

    // Anything other than an explicit 'true'/'false' is a malformed
    // payload; defaulting missing values would risk deactivating on a
    // lost field.
    if (rawActive !== 'true' && rawActive !== 'false') {
        return { error: 'Missing activation state.' };
    }

    const active = rawActive === 'true';

    const supabase = await createClient();
    const callerRole = await getUserRole(supabase);

    if (callerRole !== 'admin') {
        return { error: 'You do not have permission to manage members.' };
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!active && user && member_id === user.id) {
        return { error: 'You cannot deactivate your own account.' };
    }

    const { error } = await supabase.rpc('set_profile_active', {
        target_id: member_id,
        new_active: active,
    });

    if (error) {
        console.error('Failed to change member status:', error);

        // Surface the RPC's own guard if the action-level one missed it.
        if (error.message.toLowerCase().includes('deactivate your own')) {
            return { error: 'You cannot deactivate your own account.' };
        }

        return {
            error: 'The member status could not be changed. Please try again.',
        };
    }

    return {
        message: active
            ? 'Member activated successfully!'
            : 'Member deactivated successfully!',
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