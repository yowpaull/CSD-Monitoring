import Link from 'next/link';
import { LayoutDashboard, SquareCheckBig, UsersRound } from 'lucide-react';

interface NavigationLink {
    icon: React.ReactNode;
    name: string;
    href: string;
}

export default function AdminLayout({ children, }: { children: React.ReactNode;}) {

    const NavigationLinks: NavigationLink[] = [
        { icon: <LayoutDashboard />, name: "Dashboard", href: "/admin/dashboard" },
        { icon: <SquareCheckBig />, name: "Tasks", href: "/admin/tasks" },
        { icon: <UsersRound />, name: "Team", href: "/admin/team" },
    ];

    return (
        <div className="min-h-screen flex flex-row">
            <aside className="w-64 h-screen bg-gray-800 text-white p-4">
                <nav>
                    <ul>
                        {NavigationLinks.map((link) => (
                            <li key={link.href} className="mb-4 flex items-center">
                                <span className="mr-2">{link.icon}</span>
                                <Link href={link.href}>{link.name}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 p-4">{children}</main>
        </div>
    );
}
