import { ProfileSkeleton } from '@/components/Skeleton';

export default function Loading() {
    return (
        <div role="status" aria-label="Loading profile">
            <ProfileSkeleton />
        </div>
    );
}
