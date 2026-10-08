'use client';

import { useActionState, useEffect, useRef } from 'react';

import PasswordInput from '@/components/PasswordInput';
import {
    changePassword,
    updateProfile,
    type ActionResult,
} from '@/lib/actions/auth';
import { useActionToast } from '@/lib/hooks/useActionToast';
import { formatFullDate, formatTimestampParts } from '@/lib/inquiry-log';
import type { CurrentProfile } from '@/lib/queries/profile';

/*
 * Stable initial state — a fresh `{}` per render would give each
 * useActionState a new reference every time.
 */
const initialState: ActionResult = {};

const inputClassName =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60';

const PASSWORD_RULES =
    'At least 8 characters, including an uppercase letter, a lowercase letter and a number.';

const CARD_CLASS =
    'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';



type ProfileViewProps = {
    profile: CurrentProfile;
    title: string;
    description: string;
};

/**
 * Shared by /user/profile and /admin/profile: both routes show the
 * caller's own account, so there is nothing scope-specific about the
 * content — only the copy differs.
 *
 * Both forms are uncontrolled (`defaultValue` only), so typing never
 * triggers a re-render per keystroke; server results arrive through
 * useActionState and surface as toasts.
 */
export default function ProfileView({
    profile,
    title,
    description,
}: ProfileViewProps) {
    const [profileState, saveProfile, savingProfile] = useActionState(
        updateProfile,
        initialState
    );

    const [passwordState, submitPassword, changingPassword] =
        useActionState(changePassword, initialState);

    useActionToast(
        profileState,
        'Unable to update your profile. Please try again.'
    );

    useActionToast(
        passwordState,
        'Unable to change your password. Please try again.'
    );

    const passwordFormRef = useRef<HTMLFormElement>(null);

    /*
     * `changePassword` returns `message` only on success. Resetting
     * clears the three fields — the passwords should not be left sitting
     * in the DOM once they have been changed.
     */
    const passwordChanged = Boolean(passwordState?.message);

    useEffect(() => {
        if (!passwordChanged) return;

        passwordFormRef.current?.reset();
    }, [passwordChanged]);

    const displayName =
        profile.full_name || profile.email.split('@')[0] || 'User';

    const avatarInitial = displayName.charAt(0).toUpperCase();

    const lastSignIn = profile.last_sign_in_at
        ? formatTimestampParts(profile.last_sign_in_at)
        : null;

    const isAdmin = profile.role === 'admin';

    return (
        <div>
            {/* HEADER */}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

                <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* PROFILE CARD */}

                <section className={CARD_CLASS}>
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-semibold text-white shadow-sm">
                            {avatarInitial}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-900">
                                {displayName}
                            </p>

                            <p className="truncate text-sm text-slate-500">
                                {profile.email}
                            </p>
                        </div>

                        <span
                            className={`ml-auto inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isAdmin
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            {isAdmin ? 'Admin' : 'Member'}
                        </span>
                    </div>

                    <form action={saveProfile}>
                        {profileState?.error && (
                            <p role="alert" className="mb-4 text-xs text-red-600">
                                {profileState.error}
                            </p>
                        )}

                        <label
                            htmlFor="full_name"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Full Name
                        </label>

                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            placeholder="John Doe"
                            autoComplete="name"
                            defaultValue={
                                profileState.enteredValues?.full_name ??
                                profile.full_name
                            }
                            disabled={savingProfile}
                            className={inputClassName}
                            required
                        />

                        {profileState.fieldErrors?.full_name && (
                            <p className="mt-1 text-xs text-red-500">
                                {profileState.fieldErrors.full_name[0]}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={savingProfile}
                            aria-disabled={savingProfile}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {savingProfile && (
                                <span
                                    aria-hidden="true"
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                />
                            )}
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>

                    {/* Read-only details: email changes need Supabase's
                        dual-confirmation email flow, and role is granted
                        by an admin — neither belongs to a self-service
                        form. */}
                    <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
                        <div className="flex items-start justify-between gap-4">
                            <dt className="text-slate-500">Email</dt>
                            <dd className="break-all text-right font-medium text-slate-900">
                                {profile.email}
                            </dd>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500">Role</dt>
                            <dd className="font-medium text-slate-900">
                                {isAdmin ? 'Admin' : 'Member'}
                            </dd>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500">Member since</dt>
                            <dd className="font-medium text-slate-900">
                                {formatFullDate(profile.created_at)}
                            </dd>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-500">Last sign-in</dt>
                            <dd className="font-medium text-slate-900">
                                {lastSignIn
                                    ? `${lastSignIn.date} · ${lastSignIn.time}`
                                    : '—'}
                            </dd>
                        </div>
                    </dl>
                </section>

                {/* PASSWORD CARD */}

                <section className={CARD_CLASS}>
                    <h2 className="text-base font-semibold text-slate-900">
                        Change Password
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {PASSWORD_RULES}
                    </p>

                    <form
                        ref={passwordFormRef}
                        action={submitPassword}
                        className="mt-5"
                    >
                        {passwordState?.error && (
                            <p role="alert" className="mb-4 text-xs text-red-600">
                                {passwordState.error}
                            </p>
                        )}

                        <div className="mb-4">
                            <label
                                htmlFor="current_password"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Current Password
                            </label>

                            <PasswordInput
                                id="current_password"
                                name="current_password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={changingPassword}
                                className={inputClassName}
                                required
                            />

                            {passwordState.fieldErrors?.current_password && (
                                <p className="mt-1 text-xs text-red-500">
                                    {passwordState.fieldErrors.current_password[0]}
                                </p>
                            )}
                            
                        </div>

                        <div className="mb-4">
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                New Password
                            </label>

                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                autoComplete="new-password"
                                disabled={changingPassword}
                                className={inputClassName}
                                required
                            />

                            {passwordState.fieldErrors?.password && (
                                <p className="mt-1 text-xs text-red-500">
                                    {passwordState.fieldErrors.password[0]}
                                </p>
                            )}
                        </div>

                        <div className="mb-5">
                            <label
                                htmlFor="confirm_password"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Confirm New Password
                            </label>

                            <PasswordInput
                                id="confirm_password"
                                name="confirm_password"
                                placeholder="••••••••"
                                autoComplete="new-password"
                                disabled={changingPassword}
                                className={inputClassName}
                                required
                            />

                            {passwordState.fieldErrors?.confirm_password && (
                                <p className="mt-1 text-xs text-red-500">
                                    {passwordState.fieldErrors.confirm_password[0]}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={changingPassword}
                            aria-disabled={changingPassword}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {changingPassword && (
                                <span
                                    aria-hidden="true"
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                />
                            )}
                            {changingPassword
                                ? 'Changing Password...'
                                : 'Change Password'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
