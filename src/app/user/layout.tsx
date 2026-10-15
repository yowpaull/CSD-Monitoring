'use client';

import {
    SquareCheckBig,
    ScrollText,
    FolderOpen,
    User,
} from 'lucide-react';

import AppShell, { NavigationLink } from '@/components/layout/AppShell';

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const NavigationLinks: NavigationLink[] = [
        {
            icon: <SquareCheckBig size={18} />,
            name: 'Log',
            href: '/user/log',
        },
        {
            icon: <ScrollText size={18} />,
            name: 'My Logs',
            href: '/user/logs',
        },
        {
            icon: <FolderOpen size={18} />,
            name: 'Open Logs',
            href: '/user/open-inquiry-logs',
        },
        {
            icon: <User size={18} />,
            name: 'Profile',
            href: '/user/profile',
        },
    ];

    return (
        <AppShell
            links={NavigationLinks}
            sectionLabel="Menu"
            brandHref="/user/log"
            headerTitle="My Workspace"
            headerSubtitle="Manage your logs"
            profileHref="/user/profile"
        >
            {children}
        </AppShell>
    );
}
