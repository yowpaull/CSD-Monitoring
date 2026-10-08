'use client';

import { useState, type InputHTMLAttributes } from 'react';

import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type'
>;

/**
 * A password field with a show/hide toggle, used everywhere a password
 * is entered — login, add member, and all three profile fields — so the
 * behaviour and the icon are identical in every form.
 *
 * Everything except `type` is passed straight through, which keeps the
 * input uncontrolled: the toggle owns `type`, the form owns the value,
 * and a server-action form never re-renders per keystroke.
 */
export default function PasswordInput({
    className,
    disabled,
    ...rest
}: PasswordInputProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <input
                {...rest}
                disabled={disabled}
                type={visible ? 'text' : 'password'}
                // `pr-10` is a longhand, so it beats the caller's `px-*`
                // / `p-*` shorthand and keeps text clear of the icon.
                className={[className, 'pr-10']
                    .filter(Boolean)
                    .join(' ')}
            />

            {/*
              * A real button, not the icon's own onClick: it stays
              * reachable by keyboard and never submits the form.
              */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:text-slate-600"
            >
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
        </div>
    );
}
