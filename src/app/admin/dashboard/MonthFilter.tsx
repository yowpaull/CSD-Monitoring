'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

function monthLabel(key: string): string {
    const year = Number(key.slice(0, 4));
    const monthIndex = Number(key.slice(5, 7)) - 1;

    return new Date(year, monthIndex, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
}

/**
 * The dashboard's only filter: a month select that lives in the URL.
 *
 * A change runs through `startTransition`, so the current charts stay
 * on screen while the server re-renders the page with the scoped
 * aggregates — no flash of empty cards between months. The URL is the
 * source of truth for the select's value, which also makes a filtered
 * view shareable.
 */
export default function MonthFilter({ months }: { months: string[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const current = searchParams.get('month') ?? '';

    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const next = event.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (next) {
            params.set('month', next);
        } else {
            params.delete('month');
        }

        const query = params.toString();

        startTransition(() => {
            router.replace(query ? `${pathname}?${query}` : pathname, {
                scroll: false,
            });
        });
    }

    // A valid month with no logs (or a stale link) would otherwise have
    // no matching <option> and the select would render blank.
    const options =
        current && !months.includes(current)
            ? [current, ...months]
            : months;

    return (
        <div className="flex items-center gap-2">
            <label
                htmlFor="dashboard-month-filter"
                className="text-sm text-slate-500"
            >
                Month
            </label>

            <select
                id="dashboard-month-filter"
                value={current}
                onChange={handleChange}
                disabled={isPending}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-wait disabled:opacity-60"
            >
                <option value="">All time</option>
                {options.map((key) => (
                    <option key={key} value={key}>
                        {monthLabel(key)}
                    </option>
                ))}
            </select>
        </div>
    );
}
