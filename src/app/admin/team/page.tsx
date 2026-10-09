'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import AddMember from "./components/AddMember";
import MemberActions from "./components/MemberActions";
import { createClient } from "@/lib/supabase/client";
import { TeamSkeleton } from "@/components/Skeleton";

interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
    created_at: string;
    is_active: boolean;
}

const PAGE_SIZE = 10;

export default function Team() {

    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    // The admin's own id, used to keep the Deactivate button disabled on
    // their row — nobody should be able to lock themselves out.
    const [selfId, setSelfId] = useState<string | null>(null);
    // Bumped every time a member is added so the table re-fetches
    // and always shows every member in the database.
    const [membersVersion, setMembersVersion] = useState(0);

    const [search, setSearch] = useState('');
    const [nameSort, setNameSort] = useState<'none' | 'asc' | 'desc'>(
        'none'
    );
    const [page, setPage] = useState(1);

    // Reuse one browser client instead of constructing a new one per fetch.
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        let cancelled = false;

        async function fetchUsers() {
            try {
                // Select only the columns the table renders so listing
                // all members transfers less data and resolves faster.
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, role, created_at, is_active')
                    .order('created_at', { ascending: false });

                // Resolved alongside the list so the self-row guard does
                // not need a second effect (or a second round trip).
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (cancelled) return;
                setSelfId(user?.id ?? null);

                if (error) {
                    console.error('Error fetching team members:', error);
                    return;
                }

                setMembers(data ?? []);

            } catch (error) {
                if (!cancelled) console.error('Unexpected error:', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchUsers();

        return () => {
            cancelled = true;
        };
    }, [supabase, membersVersion]);

    const refreshMembers = useCallback(() => {
        setLoading(true);
        setMembersVersion((v) => v + 1);
    }, []);

    // Stable callbacks so the modal's Escape-key effect doesn't
    // re-subscribe on every parent render.
    const openAddMember = useCallback(() => setIsAddMemberOpen(true), []);
    const closeAddMember = useCallback(() => setIsAddMemberOpen(false), []);

    const filteredMembers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return members;

        return members.filter(
            (member) =>
                (member.full_name ?? '').toLowerCase().includes(query) ||
                (member.email ?? '').toLowerCase().includes(query)
        );
    }, [members, search]);

    const sortedMembers = useMemo(() => {
        if (nameSort === 'none') return filteredMembers;

        const sign = nameSort === 'asc' ? 1 : -1;
        return [...filteredMembers].sort(
            (a, b) =>
                (a.full_name ?? 'Unnamed User').localeCompare(
                    b.full_name ?? 'Unnamed User'
                ) * sign
        );
    }, [filteredMembers, nameSort]);

    const pageCount = Math.max(
        1,
        Math.ceil(sortedMembers.length / PAGE_SIZE)
    );
    const currentPage = Math.min(page, pageCount);
    const visibleMembers = sortedMembers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    if (loading) {
        return (
            <div className="p-6">
                {isAddMemberOpen && (
                    <AddMember
                        isOpen={isAddMemberOpen}
                        onClose={closeAddMember}
                        onMemberAdded={refreshMembers}
                    />
                )}

                <TeamSkeleton />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Mount the modal only when open so its server-action
                state, listeners, and overlay cost nothing while closed.
                It sits at this exact slot in both the loading and loaded
                trees so a refetch never unmounts it mid-success-flow. */}
            {isAddMemberOpen && (
                <AddMember
                    isOpen={isAddMemberOpen}
                    onClose={closeAddMember}
                    onMemberAdded={refreshMembers}
                />
            )}

            <div className="mx-auto max-w-6xl">

                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            My Team
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage your members.
                            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                {members.length} {members.length === 1 ? 'member' : 'members'}
                            </span>
                        </p>
                    </div>

                    <div>
                        <button
                            onClick={openAddMember}
                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Add Member
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            aria-label="Search members"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm text-gray-600">

                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th
                                        scope="col"
                                        aria-sort={
                                            nameSort === 'asc'
                                                ? 'ascending'
                                                : nameSort === 'desc'
                                                  ? 'descending'
                                                  : 'none'
                                        }
                                        className="px-6 py-4 font-semibold"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setNameSort(
                                                    nameSort === 'none'
                                                        ? 'asc'
                                                        : nameSort === 'asc'
                                                          ? 'desc'
                                                          : 'none'
                                                )
                                            }
                                            title="Sort by name"
                                            className="inline-flex items-center gap-1 transition-colors hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Name
                                            {nameSort === 'asc' ? (
                                                <ArrowUp size={14} />
                                            ) : nameSort === 'desc' ? (
                                                <ArrowDown size={14} />
                                            ) : (
                                                <ArrowUpDown size={14} />
                                            )}
                                        </button>
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Email
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Role
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Date Joined
                                    </th>

                                    <th className="px-6 py-4 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {sortedMembers.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            No team members found.
                                        </td>
                                    </tr>

                                ) : (

                                    visibleMembers.map((member) => (

                                        <tr
                                            key={member.id}
                                            className="transition-colors hover:bg-gray-50"
                                        >

                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {member.full_name ?? 'Unnamed User'}
                                            </td>

                                            <td className="px-6 py-4">
                                                {member.email ?? 'No email'}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        member.role === 'admin'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}
                                                >
                                                    <span className="capitalize">{member.role ?? 'user'}</span>
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                {/* Deactivated members stay
                                                    listed so their historical
                                                    logs keep a recognizable
                                                    name in the team view. */}
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        member.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}
                                                >
                                                    {member.is_active ? 'Active' : 'Deactivated'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(member.created_at).toLocaleDateString("en-US", {
                                                        month: "long",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <MemberActions
                                                    member={member}
                                                    isSelf={member.id === selfId}
                                                    onMemberUpdated={refreshMembers}
                                                />
                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                    {sortedMembers.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-3">
                            <p className="text-sm text-gray-500">
                                Showing {(currentPage - 1) * PAGE_SIZE + 1}
                                –{Math.min(currentPage * PAGE_SIZE, sortedMembers.length)} of {sortedMembers.length}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    aria-label="Previous page"
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-500">
                                    Page {currentPage} of {pageCount}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setPage(currentPage + 1)}
                                    disabled={currentPage >= pageCount}
                                    aria-label="Next page"
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}