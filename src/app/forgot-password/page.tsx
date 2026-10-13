'use client';

import Link from 'next/link';

import { Sparkles } from 'lucide-react';

import { ActionResult, requestPasswordReset } from '@/lib/actions/auth';
import { useActionToast } from '@/lib/hooks/useActionToast';
import { useActionState } from 'react';

const INPUT_CLASS =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export default function ForgotPassword() {
    const initialState: ActionResult = {};
    const [state, formAction, isPending] = useActionState(
        requestPasswordReset,
        initialState
    );

    useActionToast(state, 'Unable to send the reset link. Please try again.');

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 sm:p-6">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="mb-6 flex flex-col items-center justify-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                        <Sparkles size={19} />
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-semibold tracking-tight text-slate-900">
                            CSD Monitoring
                        </p>
                        <p className="text-xs text-slate-500">2026</p>
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {state.success ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-2xl font-bold text-slate-900">
                                    Check your email
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {state.message}
                                </p>
                            </div>

                            <Link
                                href="/"
                                className="text-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Back to login
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8 flex flex-col gap-2">
                                <h1 className="text-2xl font-bold text-slate-900">
                                    Forgot Password
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Enter your email and we&apos;ll send you a
                                    reset link.
                                </p>
                            </div>

                            <form
                                action={formAction}
                                className="flex w-full flex-col gap-4"
                            >
                                {state?.error && (
                                    <p className="text-xs text-red-600">
                                        {state.error}
                                    </p>
                                )}

                                <div className="flex w-full flex-col gap-2">
                                    <label
                                        htmlFor="email"
                                        className="text-sm font-medium text-slate-700"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        defaultValue={state.enteredValues?.email}
                                        placeholder="Enter your email"
                                        required
                                        className={INPUT_CLASS}
                                    />
                                    {state.fieldErrors?.email && (
                                        <p className="text-xs text-red-500">
                                            {state.fieldErrors.email[0]}
                                        </p>
                                    )}
                                </div>

                                <button
                                    disabled={isPending}
                                    type="submit"
                                    className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isPending
                                        ? 'Sending link...'
                                        : 'Send reset link'}
                                </button>

                                <Link
                                    href="/"
                                    className="text-center text-sm font-medium text-slate-500 hover:text-slate-700"
                                >
                                    Back to login
                                </Link>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
