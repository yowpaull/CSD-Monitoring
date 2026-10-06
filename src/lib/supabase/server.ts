import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'


export async function createClient() {
    
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // setAll was called from a Server Component where cookies are
                        // read-only. Safe to ignore — the proxy refreshes the
                        // session on every request.
                    }
                },
            },
        }
    )
}

/**
 * An unauthenticated client with no cookie or token storage of any kind.
 *
 * Use this for auth calls that *create or impersonate* an identity — notably
 * `signUp`. With `enable_confirmations = false`, `signUp` returns a live
 * session, and the server client persists it through `cookies().set()`,
 * overwriting the cookies of whoever invoked the action. An admin adding a
 * member would silently be logged out and swapped into the new account.
 *
 * This client has no storage adapter wired up, so any session handed back by
 * Supabase is discarded instead of written to the response. Callers are
 * responsible for authorizing the request themselves.
 */
export function createEphemeralClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        }
    )
}