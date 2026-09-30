'use server'

import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/lib/validations/auth-schema';
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
 * Falls back to the auth metadata role, then to 'user'.
 */
export async function getUserRole(supabase: ServerSupabaseClient): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 'user';

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const metadataRole = (user.user_metadata as { role?: unknown } | null)?.role;

    if (profile?.role) return profile.role;
    if (metadataRole === 'admin') return 'admin';
    return 'user';
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

    redirect('/user/task');
}

export async function signup(_prevState: ActionResult | null,formData: FormData): Promise<ActionResult> {
    
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

    const parsed = signupSchema.safeParse(raw);

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

    console.log("Zod passed:", parsed.data);

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
        data: {
            full_name: parsed.data.full_name,
            role: parsed.data.role,
        },
        },
    });

    console.log("Supabase response:", {
        data,
        error: error
            ? {
                message: error.message,
                code: error.code,
                status: error.status,
            }
            : null,
    });

    if (error) {
        if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
        ) {
        return {
            error: 'Email is already registered!',
            enteredValues: {
                full_name,
                email,
                role,
            },
        };
        }

    return {
            error: error.message,
            enteredValues: {full_name, email, role},
        };
    }

    return {
        message: 'Account created successfully! Please check the email to verify your account.',
    };
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/');
    redirect('/');
}