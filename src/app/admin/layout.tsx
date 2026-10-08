'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    SquareCheckBig,
    ScrollText,
    SportShoe,
    UsersRound,
    LogOut,
    Sparkles,
    ChevronRight,
    User,
    Store,
} from 'lucide-react';

import { logout } from '@/lib/actions/auth';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NavigationLink {
    icon: React.ReactNode;
    name: string;
    href: string;
}

interface Profile {
    full_name: string | null;
    email: string | null;
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const NavigationLinks: NavigationLink[] = [
        {
            icon: <LayoutDashboard size={18} />,
            name: 'Dashboard',
            href: '/admin/dashboard',
        },
        {
            icon: <ScrollText size={18} />,
            name: 'Customer Inquiry Logs',
            href: '/admin/inquiry-logs',
        },
        {
            icon: <SportShoe size={18} />,
            name: 'Brands',
            href: '/admin/brands',
        },
        {
            icon: <Store size={18} />,
            name: 'Platforms',
            href: '/admin/platforms',
        },
        {
            icon: <SquareCheckBig size={18} />,
            name: 'Inquiry Types',
            href: '/admin/inquiry-types',
        },
        {
            icon: <UsersRound size={18} />,
            name: 'Team',
            href: '/admin/team',
        },
        {
            icon: <User size={18} />,
            name: 'Profile',
            href: '/admin/profile',
        },
    ];

    useEffect(() => {
        async function fetchUserProfile() {
            try {
                const supabase = createClient();

                // Get currently authenticated user
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

                // Fetch profile using authenticated user's ID
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

    // Display name
    const displayName =
        profile?.full_name ||
        profile?.email?.split('@')[0] ||
        'User';

    // Initial for avatar
    const avatarInitial = displayName.charAt(0).toUpperCase();

    return (
        <div className="flex h-screen overflow-hidden bg-white">

            {/* Sidebar */}
            <aside className="flex w-64 shrink-0 flex-col bg-[#0F1117] text-white">

                {/* Brand */}
                <div className="flex h-16 items-center border-b border-white/[0.06] px-5">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
                            <Sparkles size={17} />
                        </div>

                        <div>
                            <p className="text-sm font-semibold tracking-tight">
                                CSD Monitoring
                            </p>

                            <p className="text-[11px] text-white/40">
                                2026
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6">
                    <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                        Workspace
                    </p>

                    <ul className="space-y-1">
                        {NavigationLinks.map((link) => {
                            const isActive = pathname === link.href;

                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={`
                                            group flex items-center justify-between
                                            rounded-xl px-3 py-2.5
                                            text-sm font-medium
                                            transition-all duration-150
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

                                            {link.name}
                                        </div>

                                        {isActive && (
                                            <ChevronRight
                                                size={15}
                                                className="text-white/30"
                                            />
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Bottom */}
                <div className="border-t border-white/[0.06] p-3">

                    {/* Logout */}
                    <form action={logout}>
                        <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                            <LogOut size={18} />
                            Sign out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main */}
            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-white">

                {/* Header */}
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">

                    <div>
                        <h1 className="text-sm font-semibold text-slate-900">
                            Admin Dashboard
                        </h1>

                        <p className="text-xs text-slate-400">
                            Manage your workspace
                        </p>
                    </div>

                    {/* User */}
                    <Link
                        href="/admin/profile"
                        className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
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