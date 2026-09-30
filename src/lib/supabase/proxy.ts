import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const LOGIN_PATH = '/'
const ADMIN_HOME = '/admin/dashboard'
const USER_HOME = '/user/task'

function isPublicPath(pathname: string) {
    return (
        pathname === LOGIN_PATH ||
        pathname.startsWith('/auth/')
    )
}

function isAdminPath(pathname: string) {
    return pathname.startsWith('/admin')
}

function isUserPath(pathname: string) {
    return pathname.startsWith('/user')
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
        cookies: {
            getAll() {
            return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
            )
            },
        },
        }
    )

    // Refresh the session — must run on every request so the
    // browser session stays valid. Do not read session data
    // from cookies directly between createServerClient and getUser.
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Unauthenticated visitors can only see public pages (login, auth callback).
    if (!user) {
        if (isPublicPath(pathname)) {
            return supabaseResponse
        }
        const url = request.nextUrl.clone()
        url.pathname = LOGIN_PATH
        return NextResponse.redirect(url)
    }

    // Resolve the role once for the authenticated guards below.
    // RLS lets every user read their own profile row.
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const metadataRole = (user.user_metadata as { role?: unknown } | null)?.role
    const role = profile?.role ?? (metadataRole === 'admin' ? 'admin' : 'user')

    // Logged-in users don't need the login page — send them home by role.
    if (pathname === LOGIN_PATH) {
        const url = request.nextUrl.clone()
        url.pathname = role === 'admin' ? ADMIN_HOME : USER_HOME
        return NextResponse.redirect(url)
    }

    // Only admins may enter the admin area.
    if (isAdminPath(pathname) && role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = USER_HOME
        return NextResponse.redirect(url)
    }

    // Regular users may also use the user area; admins keep access too.
    if (isUserPath(pathname)) {
        return supabaseResponse
    }

    return supabaseResponse
}
