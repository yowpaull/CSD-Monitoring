import { Skeleton, SkeletonCard } from '@/components/Skeleton';

export default function Loading() {
    return (
        <div role="status" aria-label="Loading dashboard" className="p-6">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-44" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-10 w-48" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SkeletonCard key={index}>
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-7 w-20" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                            </div>
                        </SkeletonCard>
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <SkeletonCard>
                        <Skeleton className="mb-4 h-5 w-24" />
                        <Skeleton className="h-52" />
                    </SkeletonCard>
                    <SkeletonCard className="lg:col-span-2">
                        <Skeleton className="mb-4 h-5 w-40" />
                        <Skeleton className="h-52" />
                    </SkeletonCard>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SkeletonCard key={index}>
                            <Skeleton className="mb-4 h-5 w-28" />
                            <Skeleton className="h-44" />
                        </SkeletonCard>
                    ))}
                </div>

                <SkeletonCard className="mt-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                    </div>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-6"
                            >
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-4 flex-1" />
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        ))}
                    </div>
                </SkeletonCard>
            </div>
        </div>
    );
}
