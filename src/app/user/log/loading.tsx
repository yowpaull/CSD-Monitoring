import { Skeleton } from '@/components/Skeleton';

const SECTIONS: Array<{ titleWidth: string; subtitleWidth: string; fields: number }> = [
    { titleWidth: 'w-44', subtitleWidth: 'w-64', fields: 6 },
    { titleWidth: 'w-56', subtitleWidth: 'w-72', fields: 2 },
    { titleWidth: 'w-48', subtitleWidth: 'w-80', fields: 6 },
    { titleWidth: 'w-48', subtitleWidth: 'w-80', fields: 4 },
];

export default function Loading() {
    return (
        <div role="status" aria-label="Loading inquiry form">
            <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-[#F8FBFD] shadow-sm">
                <div className="rounded-t-2xl border-b border-slate-200 bg-white/60 px-6 py-5">
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="mt-2 h-3 w-96 max-w-full" />
                </div>

                <div className="space-y-8 p-6 md:p-8">
                    {SECTIONS.map((section, sectionIndex) => (
                        <section
                            key={sectionIndex}
                            className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs md:p-6"
                        >
                            <div className="border-b border-slate-100 pb-3">
                                <Skeleton
                                    className={`h-4 ${section.titleWidth}`}
                                />
                                <Skeleton
                                    className={`mt-2 h-3 ${section.subtitleWidth} max-w-full`}
                                />
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {Array.from({ length: section.fields }).map(
                                    (_, fieldIndex) => (
                                        <div
                                            key={fieldIndex}
                                            className="space-y-1.5"
                                        >
                                            <Skeleton className="h-3 w-28" />
                                            <Skeleton className="h-9 w-full" />
                                        </div>
                                    )
                                )}
                            </div>
                        </section>
                    ))}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        </div>
    );
}
