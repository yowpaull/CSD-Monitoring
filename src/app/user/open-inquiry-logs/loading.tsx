import { LogsListSkeleton } from '@/components/Skeleton';

export default function Loading() {
    return (
        <div role="status" aria-label="Loading open inquiry logs">
            <LogsListSkeleton />
        </div>
    );
}
