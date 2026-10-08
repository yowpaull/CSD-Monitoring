'use client';

import {
    memo,
    useActionState,
    useEffect,
    useRef,
    useState,
} from 'react';

import EditMember from './EditMember';
import { setMemberActive, type ActionResult } from '@/lib/actions/auth';
import { useActionToast } from '@/lib/hooks/useActionToast';

interface MemberActionsProps {
    member: {
        id: string;
        full_name: string | null;
        is_active: boolean;
    };
    isSelf: boolean;
    onMemberUpdated: () => void;
}

// Stable initial state — a fresh `{}` per render would give
// useActionState a new reference every time.
const initialState: ActionResult = {};

/**
 * The Actions cell of the team table: Edit opens the rename modal, and
 * Remove is a Deactivate ⇄ Activate toggle rather than a delete — the
 * profile row is referenced by inquiry_log.representative_id, so
 * deactivation is what "removing" a member means here.
 *
 * Each row owns its own action state, so one member's pending toggle
 * never disables another row's buttons.
 */
function MemberActions({
    member,
    isSelf,
    onMemberUpdated,
}: MemberActionsProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [statusState, toggleStatus, statusPending] = useActionState(
        setMemberActive,
        initialState
    );

    useActionToast(
        statusState,
        'Unable to update the member status. Please try again.'
    );

    // Refresh the table once per distinct result (same guard as
    // useActionToast) — a plain `Boolean(state?.message)` would stay
    // true after the first toggle and skip later refreshes, because
    // deps would not change when the state object is the same.
    const lastHandled = useRef<ActionResult | null>(null);
    useEffect(() => {
        if (!statusState?.message) return;
        if (lastHandled.current === statusState) return;

        lastHandled.current = statusState;
        onMemberUpdated();
    }, [statusState, onMemberUpdated]);

    const deactivateBlocked = isSelf && member.is_active;

    return (
        <div className="flex justify-end gap-2">
            {editOpen && (
                <EditMember
                    member={member}
                    isOpen={editOpen}
                    onClose={() => setEditOpen(false)}
                    onMemberUpdated={onMemberUpdated}
                />
            )}

            <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Edit
            </button>

            <form action={toggleStatus}>
                {/* Explicit target state, not "flip whatever is there":
                    replaying the payload can only produce this state. */}
                <input
                    type="hidden"
                    name="member_id"
                    value={member.id}
                />
                <input
                    type="hidden"
                    name="active"
                    value={String(!member.is_active)}
                />

                <button
                    type="submit"
                    disabled={statusPending || deactivateBlocked}
                    aria-disabled={statusPending || deactivateBlocked}
                    title={
                        deactivateBlocked
                            ? 'You cannot deactivate your own account'
                            : undefined
                    }
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                        member.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-500'
                    }`}
                >
                    {statusPending && (
                        <span
                            aria-hidden="true"
                            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-current"
                        />
                    )}
                    {statusPending
                        ? 'Saving...'
                        : member.is_active
                          ? 'Deactivate'
                          : 'Activate'}
                </button>
            </form>
        </div>
    );
}

export default memo(MemberActions);
