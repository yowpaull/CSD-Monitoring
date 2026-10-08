'use client';

import PasswordInput from "@/components/PasswordInput";
import { ActionResult, createMember } from "@/lib/actions/auth";
import { useActionToast } from "@/lib/hooks/useActionToast";
import { memo, useActionState, useEffect, useRef } from "react";

interface AddMemberProps {
    isOpen: boolean;
    onClose: () => void;
    onMemberAdded?: () => void;
}

// Stable initial state — a fresh `{}` per render would give
// useActionState a new reference every time.
const initialState: ActionResult = {};

const inputClassName =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60";

function AddMember({ isOpen, onClose, onMemberAdded }: AddMemberProps) {
    const [state, formAction, isPending] = useActionState(createMember, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useActionToast(state, "Unable to add member. Please try again.");

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        // Prevent background scroll jank while the modal is open.
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    // `createMember` returns `message` only on success — reset the form,
    // refresh the table, and close shortly after.
    const succeeded = Boolean(state?.message);
    useEffect(() => {
        if (!succeeded) return;
        formRef.current?.reset();
        onMemberAdded?.();
        const t = setTimeout(onClose, 900);
        return () => clearTimeout(t);
    }, [succeeded, onClose, onMemberAdded]);

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
                aria-label="Add new member"
            >
                {/* Header */}
                <div className="border-b border-slate-200 px-6 py-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                                Add New Member
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Create a new member account and assign their role.
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

                {/* Form — uncontrolled inputs (defaultValue only) so typing
                    never triggers a React re-render per keystroke. */}
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

                    <div className="mb-5">
                        <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-slate-700">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            placeholder="John Doe"
                            autoComplete="name"
                            defaultValue={state.enteredValues?.full_name ?? ""}
                            disabled={isPending}
                            className={inputClassName}
                            required
                        />
                        {state.fieldErrors?.full_name && (
                            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.full_name[0]}</p>
                        )}
                    </div>

                    <div className="mb-5">
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="johndoe@example.com"
                            autoComplete="email"
                            defaultValue={state.enteredValues?.email ?? ""}
                            disabled={isPending}
                            className={inputClassName}
                            required
                        />
                        {state.fieldErrors?.email && (
                            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.email[0]}</p>
                        )}
                    </div>

                    <div className="mb-5">
                        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <PasswordInput
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={isPending}
                            className={inputClassName}
                            required
                        />
                        {state.fieldErrors?.password && (
                            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.password[0]}</p>
                        )}
                    </div>

                    <div className="mb-5">
                        <label htmlFor="confirm_password" className="mb-2 block text-sm font-medium text-slate-700">
                            Confirm Password
                        </label>
                        <PasswordInput
                            id="confirm_password"
                            name="confirm_password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={isPending}
                            className={inputClassName}
                            required
                        />
                        {state.fieldErrors?.confirm_password && (
                            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.confirm_password[0]}</p>
                        )}
                    </div>

                    <div className="mb-6">
                        <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            defaultValue={state.enteredValues?.role ?? ""}
                            disabled={isPending}
                            className={`${inputClassName} appearance-none`}
                            required
                        >
                            <option value="">Select a role</option>
                            {/* Values must match the profiles.role CHECK
                                constraint ('admin', 'user'). */}
                            <option value="admin">Admin</option>
                            <option value="user">Member</option>
                        </select>
                        {state.fieldErrors?.role && (
                            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.role[0]}</p>
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
                            {isPending ? 'Adding Member...' : 'Add Member'}
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
}

export default memo(AddMember);
