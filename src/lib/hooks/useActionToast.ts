'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

/**
 * Minimal shape shared by every server action result in the app.
 * Each action file declares its own `ActionResult`, but all of them
 * expose the same subset of these fields.
 */
export type ToastableState = {
    error?: string;
    fieldErrors?: Record<string, string[] | undefined>;
    success?: boolean;
    message?: string;
};

/**
 * Surfaces a server action result as a toast.
 *
 * Precedence: `error` -> `fieldErrors` -> `message` (error when
 * `success === false`). Fires once per distinct result object, so a
 * re-render (or StrictMode double-invoke) never duplicates a toast.
 */
export function useActionToast(
    state: ToastableState | null | undefined,
    fallbackMessage = 'Something went wrong.'
) {
    const lastHandled = useRef<ToastableState | null>(null);

    useEffect(() => {
        if (!state) return;
        if (lastHandled.current === state) return;

        lastHandled.current = state;

        if (state.error) {
            toast.error(state.error);
            return;
        }

        if (state.fieldErrors) {
            const messages = Object.values(state.fieldErrors)
                .flatMap((errors) => errors ?? [])
                .filter(Boolean);

            if (messages.length > 0) {
                toast.warn(messages.join(' · '));
            }

            return;
        }

        if (state.message) {
            if (state.success === false) {
                toast.error(state.message);
            } else {
                toast.success(state.message);
            }

            return;
        }

        if (state.success === false) {
            toast.error(fallbackMessage);
        }
    }, [state, fallbackMessage]);
}
