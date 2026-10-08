import { redirect } from 'next/navigation';

import ProfileView from '@/components/profile/ProfileView';
import { getCurrentProfile } from '@/lib/queries/profile';

/**
 * Representative-facing profile. Shares the admin component: both
 * routes show the caller's own account, so only the copy differs.
 */
export default async function MyProfilePage() {
    const profile = await getCurrentProfile();

    // The proxy already sends signed-out visitors to the login page, so
    // this only fires when the account has no profile row.
    if (!profile) redirect('/');

    return (
        <ProfileView
            profile={profile}
            title="Your Profile"
            description="Your account details and password."
        />
    );
}
