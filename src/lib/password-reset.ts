/**
 * Shared bits of the password-reset handshake.
 *
 * `/auth/callback` exchanges the emailed recovery code for a session and
 * then stamps a short-lived, httpOnly marker cookie holding the user id.
 * The `/reset-password` page and action require that marker, so a
 * normal session (including a stolen one) cannot change a password
 * without first proving control of the mailbox via the recovery link.
 */
export const PASSWORD_RESET_COOKIE = 'csd-password-reset';

/**
 * How long a recovery session stays confined to the reset page. The
 * proxy keeps re-sending authenticated users to /reset-password while
 * the marker is present, so a reset link can't hand out app access.
 * It roughly matches Supabase's own recovery-link lifetime; once it
 * lapses the session is out of supabase-js's control anyway.
 */
export const PASSWORD_RESET_COOKIE_MAX_AGE = 60 * 60;

export const passwordResetCookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PASSWORD_RESET_COOKIE_MAX_AGE,
};
