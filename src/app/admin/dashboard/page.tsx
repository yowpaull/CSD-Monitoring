import { CalendarDays, Inbox, UserCheck } from 'lucide-react';

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
import RecentInquiries from './RecentInquiries';

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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        subtitle={
                            data.statusCounts.some(
                                (entry) => entry.value > 0
                            )
                                ? data.statusCounts
                                      .map(
                                          (entry) =>
                                              `${entry.label} - ${entry.value}`
                                      )
                                      .join(' · ')
                                : 'All inquiries by current status'
                        }
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
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                <RecentInquiries
                    rows={data.recentLogs}
                    totalCount={data.totalCount}
                />
            </div>
        </div>
    );
}
