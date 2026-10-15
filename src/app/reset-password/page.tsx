import ResetPasswordForm from './ResetPasswordForm';

/**
 * The form is only an entry point; the security gate lives in the
 * `resetPassword` action, which requires both the recovery session and
 * the httpOnly marker cookie set by `/auth/callback`. Signed-out
 * visitors are stopped by the proxy before this renders, and a plain
 * session that reaches it is refused by the action.
 */
export default function ResetPasswordPage() {
    return <ResetPasswordForm />;
}
