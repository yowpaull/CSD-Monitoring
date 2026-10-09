import { LogsListSkeleton } from '@/components/Skeleton';

export default function Loading() {
    return (
        <div role="status" aria-label="Loading inquiry logs">
            <LogsListSkeleton />
        </div>
    );
}
