type SkeletonProps = {
    className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            aria-hidden
            className={`animate-pulse rounded-md bg-slate-200 ${className}`}
        />
    );
}

export function SkeletonCard({
    className = '',
    children,
}: SkeletonProps & { children?: React.ReactNode }) {
    return (
        <div
            className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
        >
            {children}
        </div>
    );
}

function SkeletonField() {
    return (
        <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
        </div>
    );
}

function SkeletonTableHeader() {
    return (
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <div className="flex items-center gap-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="ml-auto h-3 w-20" />
            </div>
        </div>
    );
}

export function CatalogSkeleton() {
    return (
        <div className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-9 w-32" />
            </div>

            <div className="mb-4 max-w-sm">
                <Skeleton className="h-9 w-full" />
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <SkeletonTableHeader />
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-6 border-b border-gray-100 px-5 py-4 last:border-b-0"
                    >
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function LogsListSkeleton() {
    return (
        <div className="p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-56" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="flex items-end gap-3">
                    <div className="space-y-1.5">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-9 w-36" />
                    </div>
                    <Skeleton className="h-9 w-36" />
                </div>
            </div>

            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <SkeletonField key={index} />
                    ))}
                </div>
                <div className="mt-4 flex justify-end gap-3">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="ml-auto h-3 w-20" />
                    </div>
                </div>
                {Array.from({ length: 8 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-6 border-b border-gray-100 px-4 py-4 last:border-b-0"
                    >
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <Skeleton className="h-4 w-52" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div>
            <div className="mb-6 space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-80" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-4">
                        <div
                            aria-hidden
                            className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-slate-200"
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-56" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                    </div>

                    <div className="space-y-4">
                        <SkeletonField />
                        <SkeletonField />
                    </div>

                    <Skeleton className="mt-6 h-10 w-36" />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <Skeleton className="mb-6 h-5 w-48" />

                    <div className="space-y-4">
                        <SkeletonField />
                        <SkeletonField />
                        <SkeletonField />
                    </div>

                    <Skeleton className="mt-6 h-10 w-44" />
                </div>
            </div>
        </div>
    );
}

export function TeamSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading team"
            className="mx-auto max-w-6xl"
        >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-36" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-9 w-32" />
            </div>

            <Skeleton className="mb-4 h-10 w-80" />

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="ml-auto h-3 w-20" />
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-6 px-6 py-4"
                        >
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="ml-auto h-8 w-24" />
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                </div>
            </div>
        </div>
    );
}
