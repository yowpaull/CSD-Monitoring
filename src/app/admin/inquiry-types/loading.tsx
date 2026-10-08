import { Skeleton } from '@/components/Skeleton';

export default function Loading() {
    return (
        <div
            role="status"
            aria-label="Loading inquiry types"
            className="p-6"
        >
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-56" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <Skeleton className="h-9 w-44" />
                </div>

                {Array.from({ length: 2 }).map((_, index) => (
                    <div
                        key={index}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-56" />
                                <Skeleton className="h-3 w-72" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-8 w-32" />
                            </div>
                        </div>

                        {Array.from({ length: 2 }).map((_, rowIndex) => (
                            <div
                                key={rowIndex}
                                className="flex items-center justify-between border-b border-gray-100 px-6 py-4 last:border-b-0"
                            >
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-52" />
                                    <Skeleton className="h-3 w-64" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
