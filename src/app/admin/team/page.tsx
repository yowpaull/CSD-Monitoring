'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import AddMember from "./components/AddMember";
import MemberActions from "./components/MemberActions";
import { createClient } from "@/lib/supabase/client";

interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
    created_at: string;
    is_active: boolean;
}

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

    return (
        <div className="p-6">
            <div className="mx-auto max-w-6xl">

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            My Team
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage your members.
                            {!loading && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                    {members.length} {members.length === 1 ? 'member' : 'members'}
                                </span>
                            )}
                        </p>
                    </div>

                    <div>
                        {/* Mount the modal only when open so its server-action
                            state, listeners, and overlay cost nothing while closed. */}
                        {isAddMemberOpen && (
                            <AddMember
                                isOpen={isAddMemberOpen}
                                onClose={closeAddMember}
                                onMemberAdded={refreshMembers}
                            />
                        )}

                        <button
                            onClick={openAddMember}
                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Add Member
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm text-gray-600">

                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Name
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

                                {loading ? (

                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            Loading team members...
                                        </td>
                                    </tr>

                                ) : members.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            No team members found.
                                        </td>
                                    </tr>

                                ) : (

                                    members.map((member) => (

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
                </div>

            </div>
        </div>
    );
}