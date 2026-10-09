import { CatalogSkeleton } from '@/components/Skeleton';

export default function Loading() {
    return (
        <div role="status" aria-label="Loading platforms">
            <CatalogSkeleton />
        </div>
    );
}
