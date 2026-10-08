'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, LogOut, Menu, PanelLeft, Sparkles, X } from 'lucide-react';

import { logout } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useSyncExternalStore } from 'react';

export interface NavigationLink {
    icon: React.ReactNode;
    name: string;
    href: string;
}

interface Profile {
    full_name: string | null;
    email: string | null;
}

interface AppShellProps {
    links: NavigationLink[];
    sectionLabel: string;
    brandHref: string;
    headerTitle: string;
    headerSubtitle: string;
    profileHref: string;
    children: React.ReactNode;
}

const COLLAPSED_KEY = 'csd-sidebar-collapsed';

/**
 * The rail preference lives in localStorage, so it is read through
 * `useSyncExternalStore`: the server snapshot is always expanded, and
 * after hydration React picks up the persisted value and re-renders —
 * no hydration mismatch, no setState-in-effect. Writes notify this
 * tab's listeners directly (the native `storage` event only fires in
 * other tabs).
 */
const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(onChange: () => void): () => void {
    collapsedListeners.add(onChange);
    window.addEventListener('storage', onChange);
    return () => {
        collapsedListeners.delete(onChange);
        window.removeEventListener('storage', onChange);
    };
}

function getCollapsedSnapshot(): boolean {
    return window.localStorage.getItem(COLLAPSED_KEY) === '1';
}

function getCollapsedServerSnapshot(): boolean {
    return false;
}

function persistCollapsed(next: boolean): void {
    window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    collapsedListeners.forEach((listener) => listener());
}

/**
 * Shared chrome for the admin and member areas: dark sidebar, sticky
 * header, profile chip, content well.
 *
 * Two responsive behaviours:
 * - Below `lg` the sidebar lives in an off-canvas drawer opened by the
 *   header's menu button (closed on backdrop click, Escape-free route
 *   change, or the drawer's own close button).
 * - At `lg` and up it can collapse to an icon rail; the choice is kept
 *   in localStorage and read through `useSyncExternalStore` so the
 *   server always renders the expanded markup and hydration stays in
 *   sync.
 *
 * When collapsed, labels stay in the DOM as `lg:sr-only` instead of
 * disappearing, so link accessible names never change.
 */
export default function AppShell({
    links,
    sectionLabel,
    brandHref,
    headerTitle,
    headerSubtitle,
    profileHref,
    children,
}: AppShellProps) {
    const pathname = usePathname();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const collapsed = useSyncExternalStore(
        subscribeCollapsed,
        getCollapsedSnapshot,
        getCollapsedServerSnapshot
    );

    // Close the mobile drawer on any navigation (link tap, back
    // button, router push) — adjusted during render per React's
    // "adjust some state when a prop changes" pattern instead of an
    // effect.
    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setDrawerOpen(false);
    }

    useEffect(() => {
        async function fetchUserProfile() {
            try {
                const supabase = createClient();

                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) {
                    console.error('Error getting authenticated user:', userError);
                    return;
                }

                if (!user) {
                    console.error('No authenticated user found');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                    return;
                }

                setProfile(data);
            } catch (error) {
                console.error('Unexpected error:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchUserProfile();
    }, []);

    function toggleCollapsed() {
        persistCollapsed(!collapsed);
    }

    const displayName =
        profile?.full_name ||
        profile?.email?.split('@')[0] ||
        'User';

    const avatarInitial = displayName.charAt(0).toUpperCase();

    return (
        <div className="flex h-screen overflow-hidden bg-white">

            {/* Mobile backdrop */}
            {drawerOpen && (
                <div
                    aria-hidden="true"
                    onClick={() => setDrawerOpen(false)}
                    className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={[
                    'flex w-64 shrink-0 flex-col bg-[#0F1117] text-white',
                    'fixed inset-y-0 left-0 z-40 transition-[transform,width,visibility] duration-200',
                    'lg:static lg:translate-x-0 lg:visible',
                    drawerOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
                    collapsed ? 'lg:w-[4.5rem]' : 'lg:w-64',
                ].join(' ')}
            >

                {/* Brand */}
                <div
                    className={[
                        'flex h-16 shrink-0 items-center border-b border-white/[0.06] px-5',
                        collapsed ? 'lg:px-[18px]' : '',
                    ].join(' ')}
                >
                    <Link
                        href={brandHref}
                        title={collapsed ? headerTitle : undefined}
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
                            <Sparkles size={17} />
                        </div>

                        <div className={collapsed ? 'lg:hidden' : ''}>
                            <p className="whitespace-nowrap text-sm font-semibold tracking-tight">
                                CSD Monitoring
                            </p>

                            <p className="whitespace-nowrap text-[11px] text-white/40">
                                2026
                            </p>
                        </div>
                    </Link>

                    {/* Drawer-only close */}
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Close navigation"
                        className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-6">
                    <p
                        className={[
                            'mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30',
                            collapsed ? 'lg:hidden' : '',
                        ].join(' ')}
                    >
                        {sectionLabel}
                    </p>

                    <ul className="space-y-1">
                        {links.map((link) => {
                            const isActive = pathname === link.href;

                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        title={collapsed ? link.name : undefined}
                                        className={`
                                            group flex items-center
                                            rounded-xl px-3 py-2.5
                                            text-sm font-medium
                                            transition-all duration-150
                                            ${
                                                collapsed
                                                    ? 'lg:justify-center lg:px-0'
                                                    : 'justify-between'
                                            }
                                            ${
                                                isActive
                                                    ? 'bg-white/[0.08] text-white shadow-sm'
                                                    : 'text-white/50 hover:bg-white/[0.05] hover:text-white'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={
                                                    isActive
                                                        ? 'text-indigo-400'
                                                        : 'text-white/40 group-hover:text-white/70'
                                                }
                                            >
                                                {link.icon}
                                            </span>

                                            <span
                                                className={
                                                    collapsed ? 'lg:sr-only' : ''
                                                }
                                            >
                                                {link.name}
                                            </span>
                                        </div>

                                        {isActive && (
                                            <ChevronRight
                                                size={15}
                                                className={`text-white/30 ${
                                                    collapsed ? 'lg:hidden' : ''
                                                }`}
                                            />
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Bottom */}
                <div className="shrink-0 border-t border-white/[0.06] p-3">

                    {/* Logout */}
                    <form action={logout}>
                        <button
                            type="submit"
                            title={collapsed ? 'Sign out' : undefined}
                            className={[
                                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition hover:bg-red-500/10 hover:text-red-400',
                                collapsed ? 'lg:justify-center lg:px-0' : '',
                            ].join(' ')}
                        >
                            <LogOut size={18} className="shrink-0" />
                            <span className={collapsed ? 'lg:sr-only' : ''}>
                                Sign out
                            </span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main */}
            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-white">

                {/* Header */}
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">

                    <div className="flex min-w-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Open navigation"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                        >
                            <Menu size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={toggleCollapsed}
                            aria-label={
                                collapsed ? 'Expand sidebar' : 'Collapse sidebar'
                            }
                            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:flex"
                        >
                            <PanelLeft size={18} />
                        </button>

                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-semibold text-slate-900">
                                {headerTitle}
                            </h1>

                            <p className="truncate text-xs text-slate-400">
                                {headerSubtitle}
                            </p>
                        </div>
                    </div>

                    {/* User */}
                    <Link
                        href={profileHref}
                        className="group flex shrink-0 items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
                    >
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium text-slate-700">
                                {loading ? 'Loading...' : displayName}
                            </p>

                            <p className="text-xs text-slate-400">
                                {loading
                                    ? 'Loading profile'
                                    : profile?.email || 'My account'}
                            </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-sm">
                            {loading ? '...' : avatarInitial}
                        </div>
                    </Link>
                </header>

                {/* White Content Area */}
                <div className="flex-1 bg-white p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
