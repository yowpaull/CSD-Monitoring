import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/**
 * Next.js middleware — runs on every non-static request.
 * Delegates to updateSession which handles both session refresh
 * and auth-based route protection.
 */
export async function proxy(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
        * Match all request paths except:
        * - _next/static  (Next.js build output)
        * - _next/image   (image optimisation)
        * - favicon.ico
        * - Common static asset extensions
        */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}