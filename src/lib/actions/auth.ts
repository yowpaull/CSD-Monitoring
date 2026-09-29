'use server'

import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations/auth-schema';
import { redirect } from 'next/navigation';

export type ActionResult = {
    error? : string;
    fieldErrors? : Record<string, string[] | undefined>;
    enteredValues?: {
        full_name?: string;
        email?: string;
        phone?: string;
    };
    success? : boolean;
    message? : string;
    redirectTo? : string;
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

    redirect('/user/task');
}