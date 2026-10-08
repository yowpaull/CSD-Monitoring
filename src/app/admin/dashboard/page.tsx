import Link from 'next/link';
import { CalendarDays, Inbox, UserCheck } from 'lucide-react';

import {
    formatTimestampParts,
    statusBadgeClass,
} from '@/lib/inquiry-log';
import {
    CATEGORY_TOP_N,
    getAdminDashboardData,
} from '@/lib/queries/admin-dashboard';

import {
    CountBarChart,
    StatusDoughnut,
    WeeklyTrendLine,
} from './DashboardCharts';
import MonthFilter from './MonthFilter';

const CARD_CLASS = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm';

function StatCard({
    icon,
    label,
    value,
    hint,
    accentClass,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    hint?: string;
    accentClass: string;
}) {
    return (
        <div className={CARD_CLASS}>
            <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${accentClass}`}>
                    {icon}
                </div>

                <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="text-2xl font-semibold text-slate-900">
                        {value.toLocaleString()}
                    </p>
                    {hint && (
                        <p className="text-xs text-slate-400">{hint}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function ChartCard({
    title,
    subtitle,
    children,
    className = '',
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`${CARD_CLASS} ${className}`}>
            <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-900">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-0.5 text-xs text-slate-500">
                        {subtitle}
                    </p>
                )}
            </div>

            {children}
        </section>
    );
}

/**
 * Admin dashboard. Server-rendered: every number is aggregated in
 * `getAdminDashboardData` and only finished label/count pairs cross
 * the wire, while the Chart.js widgets themselves are client
 * components (`DashboardCharts.tsx`) because a canvas needs a DOM.
 *
 * `?month=` scopes the weekly/platform/brand/category charts only —
 * the KPIs, status doughnut and recent list stay all-time.
 */
export default async function Dashboard({
    searchParams,
}: {
    searchParams: Promise<{ month?: string | string[] | undefined }>;
}) {
    const { month } = await searchParams;

    const data = await getAdminDashboardData(
        typeof month === 'string' ? month : undefined
    );

    const todayLabel = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const periodLabel = data.selectedMonth
        ? new Date(
              Number(data.selectedMonth.slice(0, 4)),
              Number(data.selectedMonth.slice(5, 7)) - 1,
              1
          ).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
          })
        : null;

    return (
        <div className="p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            An overview of inquiry activity across the team.
                        </p>
                    </div>

                    <MonthFilter months={data.availableMonths} />
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard
                        icon={<Inbox className="h-6 w-6" />}
                        label="Total Inquiries"
                        value={data.totalCount}
                        hint="All time"
                        accentClass="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        icon={<CalendarDays className="h-6 w-6" />}
                        label="Today's Logs"
                        value={data.todayCount}
                        hint={todayLabel}
                        accentClass="bg-green-50 text-green-600"
                    />
                    <StatCard
                        icon={<UserCheck className="h-6 w-6" />}
                        label="Active Representatives"
                        value={data.activeMemberCount}
                        hint="Members able to log inquiries"
                        accentClass="bg-amber-50 text-amber-600"
                    />
                </div>

                {/* Charts: status + weekly trend */}
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <ChartCard
                        title="Status"
                        subtitle="All inquiries by current status"
                    >
                        <StatusDoughnut data={data.statusCounts} />
                    </ChartCard>

                    <ChartCard
                        title="Inquiries per Week"
                        subtitle={periodLabel ?? 'Last 8 weeks'}
                        className="lg:col-span-2"
                    >
                        <WeeklyTrendLine data={data.weeklyCounts} />
                    </ChartCard>
                </div>

                {/* Charts: dimensions */}
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <ChartCard
                        title="By Platform"
                        subtitle="Every platform"
                    >
                        <CountBarChart
                            data={data.platformCounts}
                            color="#6366f1"
                        />
                    </ChartCard>

                    <ChartCard
                        title="By Brand"
                        subtitle="Every brand"
                    >
                        <CountBarChart
                            data={data.brandCounts}
                            color="#8b5cf6"
                        />
                    </ChartCard>

                    <ChartCard
                        title="By Category"
                        subtitle={`Top ${CATEGORY_TOP_N} categories`}
                    >
                        <CountBarChart
                            data={data.categoryCounts}
                            color="#14b8a6"
                        />
                    </ChartCard>
                </div>

                {/* Recent logs */}
                <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Recent Inquiries
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                The {data.recentLogs.length} most recent
                                {data.totalCount > data.recentLogs.length
                                    ? ` of ${data.totalCount.toLocaleString()}`
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
                                    <th className="px-6 py-3 text-right font-semibold">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {data.recentLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-slate-500"
                                        >
                                            No inquiries logged yet.
                                        </td>
                                    </tr>
                                ) : (
                                    data.recentLogs.map((row) => {
                                        const inquiry =
                                            formatTimestampParts(
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
                                                        ?.full_name ??
                                                        '—'}
                                                </td>

                                                <td className="px-6 py-3">
                                                    {row.platform?.name ??
                                                        '—'}
                                                </td>

                                                <td className="px-6 py-3">
                                                    {row.brand?.name ??
                                                        '—'}
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
            </div>
        </div>
    );
}
