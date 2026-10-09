'use client';

import {
    LayoutDashboard,
    SquareCheckBig,
    ScrollText,
    SportShoe,
    UsersRound,
    User,
    Store,
} from 'lucide-react';

import AppShell, { NavigationLink } from '@/components/layout/AppShell';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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

    return (
        <AppShell
            links={NavigationLinks}
            sectionLabel="Workspace"
            brandHref="/admin/dashboard"
            headerTitle="Admin Dashboard"
            headerSubtitle="Manage your workspace"
            profileHref="/admin/profile"
        >
            {children}
        </AppShell>
    );
}
