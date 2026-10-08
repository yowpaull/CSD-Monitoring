'use client';

import { memo, useActionState, useEffect, useRef } from 'react';

import {
    updateMemberFullName,
    type ActionResult,
} from '@/lib/actions/auth';
import { useActionToast } from '@/lib/hooks/useActionToast';

interface EditMemberProps {
    member: {
        id: string;
        full_name: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
    onMemberUpdated?: () => void;
}

// Stable initial state — a fresh `{}` per render would give
// useActionState a new reference every time.
const initialState: ActionResult = {};

const inputClassName =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Modal for the team table's Edit button. Full name only — role, email
 * and status are deliberately not editable here, so the form cannot
 * carry anything the updateMemberFullName action would ignore anyway.
 *
 * Structured after AddMember: uncontrolled input (defaultValue only),
 * Escape closes, success message shown briefly before the modal closes
 * and the table refetches.
 */
function EditMember({ member, isOpen, onClose, onMemberUpdated }: EditMemberProps) {
    const [state, formAction, isPending] = useActionState(
        updateMemberFullName,
        initialState
    );
    const formRef = useRef<HTMLFormElement>(null);

    useActionToast(
        state,
        'Unable to update the member name. Please try again.'
    );

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        // Prevent background scroll jank while the modal is open.
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    // `updateMemberFullName` returns `message` only on success — refresh
    // the table and close shortly after so the new name appears.
    const succeeded = Boolean(state?.message);
    useEffect(() => {
        if (!succeeded) return;
        onMemberUpdated?.();
        const t = setTimeout(onClose, 900);
        return () => clearTimeout(t);
    }, [succeeded, onClose, onMemberUpdated]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-6"
            onClick={onClose}
        >
            <div
                className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Edit member"
            >
                {/* Header */}
                <div className="border-b border-slate-200 px-6 py-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                                Edit Member
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Update this member&apos;s full name.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <form ref={formRef} action={formAction} className="px-6 py-6">
                    {state?.error && (
                        <p role="alert" className="mb-4 text-xs text-red-600">
                            {state.error}
                        </p>
                    )}

                    {state?.message && (
                        <p role="status" className="mb-4 text-xs text-green-600">
                            {state.message}
                        </p>
                    )}

                    {/* The row id travels as a hidden field; the action
                        still re-checks the caller's admin role. */}
                    <input
                        type="hidden"
                        name="member_id"
                        value={member.id}
                    />

                    <div className="mb-5">
                        <label htmlFor="member_full_name" className="mb-2 block text-sm font-medium text-slate-700">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="member_full_name"
                            name="full_name"
                            placeholder="John Doe"
                            autoComplete="name"
                            defaultValue={
                                state.enteredValues?.full_name ??
                                member.full_name ??
                                ''
                            }
                            disabled={isPending}
                            className={inputClassName}
                            required
                        />
                        {state.fieldErrors?.full_name && (
                            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.full_name[0]}</p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-500/10 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isPending}
                            aria-disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isPending && (
                                <span
                                    aria-hidden="true"
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                />
                            )}
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default memo(EditMember);
