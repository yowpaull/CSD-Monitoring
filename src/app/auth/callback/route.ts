import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    PASSWORD_RESET_COOKIE,
    passwordResetCookieOptions,
} from '@/lib/password-reset';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/reset-password';

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const response = NextResponse.redirect(`${origin}${next}`);
            const userId = data.user?.id ?? data.session?.user.id;

            // A recovery link grants a session *and* a short-lived marker
            // bound to that user. The reset action requires both, so a
            // plain session cannot change a password on its own.
            if (next.startsWith('/reset-password') && userId) {
                response.cookies.set(
                    PASSWORD_RESET_COOKIE,
                    userId,
                    passwordResetCookieOptions
                );
            }

            return response;
        }
    }

    return NextResponse.redirect(`${origin}/?error=Invalid+or+expired+link`);
}
