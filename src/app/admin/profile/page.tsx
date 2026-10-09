import { redirect } from 'next/navigation';

import ProfileView from '@/components/profile/ProfileView';
import { getCurrentProfile } from '@/lib/queries/profile';

/**
 * Administrator profile. Same component as the user side — the proxy
 * keeps non-admins out of /admin, and the actions below only ever touch
 * the caller's own row, so no extra role check is needed here.
 */
export default async function AdminProfilePage() {
    const profile = await getCurrentProfile();

    // The proxy already sends signed-out visitors to the login page, so
    // this only fires when the account has no profile row.
    if (!profile) redirect('/');

    return (
        <ProfileView
            profile={profile}
            title="Your Profile"
            description="Your administrator account details and password."
        />
    );
}
