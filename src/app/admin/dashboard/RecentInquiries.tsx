'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { formatTimestampParts, statusBadgeClass } from '@/lib/inquiry-log';

import type { InquiryLogRow } from '@/lib/types/inquiry-log';

type SortDirection = 'none' | 'asc' | 'desc';

const NEXT_SORT: Record<SortDirection, SortDirection> = {
    none: 'asc',
    asc: 'desc',
    desc: 'none',
};

export default function RecentInquiries({
    rows,
    totalCount,
}: {
    rows: InquiryLogRow[];
    totalCount: number;
}) {
    const [sortDirection, setSortDirection] =
        useState<SortDirection>('none');

    const sortedRows = useMemo(() => {
        if (sortDirection === 'none') return rows;

        const sign = sortDirection === 'asc' ? 1 : -1;
        return [...rows].sort(
            (a, b) => a.status.localeCompare(b.status) * sign
        );
    }, [rows, sortDirection]);

    const ariaSort =
        sortDirection === 'asc'
            ? 'ascending'
            : sortDirection === 'desc'
              ? 'descending'
              : 'none';

    return (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                        Recent Inquiries
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        The {rows.length} most recent
                        {totalCount > rows.length
                            ? ` of ${totalCount.toLocaleString()}`
                            : ''}{' '}
                        logs
                    </p>
                </div>

                <Link
                    href="/admin/inquiry-logs"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    View All
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="px-6 py-3 font-semibold">
                                Inquiry Date
                            </th>
                            <th className="px-6 py-3 font-semibold">
                                Customer
                            </th>
                            <th className="px-6 py-3 font-semibold">
                                Representative
                            </th>
                            <th className="px-6 py-3 font-semibold">
                                Platform
                            </th>
                            <th className="px-6 py-3 font-semibold">
                                Brand
                            </th>
                            <th
                                scope="col"
                                aria-sort={ariaSort}
                                className="px-6 py-3 text-right font-semibold"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSortDirection(
                                            NEXT_SORT[sortDirection]
                                        )
                                    }
                                    title="Sort by status"
                                    className="inline-flex items-center gap-1 transition-colors hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Status
                                    {sortDirection === 'asc' ? (
                                        <ArrowUp size={14} />
                                    ) : sortDirection === 'desc' ? (
                                        <ArrowDown size={14} />
                                    ) : (
                                        <ArrowUpDown size={14} />
                                    )}
                                </button>
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-10 text-center text-slate-500"
                                >
                                    No inquiries logged yet.
                                </td>
                            </tr>
                        ) : (
                            sortedRows.map((row) => {
                                const inquiry = formatTimestampParts(
                                    row.inquiry_datetime
                                );

                                return (
                                    <tr
                                        key={row.id}
                                        className="transition-colors hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-3">
                                            <div className="text-sm font-medium text-slate-900">
                                                {inquiry.date}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {inquiry.time}
                                            </div>
                                        </td>

                                        <td className="max-w-[12rem] truncate px-6 py-3">
                                            {row.customer_name}
                                        </td>

                                        <td className="px-6 py-3">
                                            {row.representative
                                                ?.full_name ?? '—'}
                                        </td>

                                        <td className="px-6 py-3">
                                            {row.platform?.name ?? '—'}
                                        </td>

                                        <td className="px-6 py-3">
                                            {row.brand?.name ?? '—'}
                                        </td>

                                        <td className="px-6 py-3 text-right">
                                            <span
                                                className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                                            >
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
