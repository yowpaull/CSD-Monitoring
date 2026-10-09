import { getUserRole } from '@/lib/actions/auth';
import {
    EMPTY_LOG_FILTERS,
    LOG_STATUSES,
    inquiryMonthRange,
    naiveDayAfter,
} from '@/lib/inquiry-log';
import { getInquiryLogs } from '@/lib/queries/inquiry-logs';
import { createClient } from '@/lib/supabase/server';

import type { InquiryLogRow } from '@/lib/types/inquiry-log';

/** Rows shown in the dashboard's "Recent Inquiries" card. */
export const RECENT_LOG_COUNT = 10;

/** Weeks plotted by the trend line when no month is selected; the
 * current week is the last point. */
const WEEK_WINDOW = 8;

/**
 * Values kept by the category chart. The platform and brand charts show
 * everything — the request was explicit — while categories can pile up
 * behind a long tail that would flatten the rest of the bars.
 */
export const CATEGORY_TOP_N = 10;

/** A single label/count pair ready to hand to Chart.js. */
export type DashboardCount = {
    label: string;
    value: number;
};

/** Local-midnight bounds of the selected month, end exclusive. */
type MonthScope = {
    start: Date;
    end: Date;
    /** `yyyy-mm`, kept for filter state and bucket labels. */
    key: string;
};

export type AdminDashboardData = {
    totalCount: number;
    todayCount: number;
    activeMemberCount: number;
    statusCounts: DashboardCount[];
    weeklyCounts: DashboardCount[];
    platformCounts: DashboardCount[];
    brandCounts: DashboardCount[];
    categoryCounts: DashboardCount[];
    recentLogs: InquiryLogRow[];
    /** `yyyy-mm` keys with at least one log, newest first — the
     * monthly filter's option list. */
    availableMonths: string[];
    /** The filter's current selection, or null for "All time". */
    selectedMonth: string | null;
};

const EMPTY_DATA: AdminDashboardData = {
    totalCount: 0,
    todayCount: 0,
    activeMemberCount: 0,
    statusCounts: [],
    weeklyCounts: [],
    platformCounts: [],
    brandCounts: [],
    categoryCounts: [],
    recentLogs: [],
    availableMonths: [],
    selectedMonth: null,
};

/**
 * Only what the aggregates need. Names arrive through PostgREST embeds,
 * so ids never leave the database and the client only ever receives
 * finished label/count pairs.
 */
const CHART_SELECT = `
    status,
    inquiry_datetime,
    platform:platforms ( name ),
    brand:brands ( name ),
    sub_category:inquiry_sub_categories (
        main_category:inquiry_main_categories (
            category:inquiry_categories ( name )
        )
    )
`;

type ChartRow = {
    status: string;
    inquiry_datetime: string;
    platform: { name: string } | null;
    brand: { name: string } | null;
    sub_category: {
        main_category: {
            category: { name: string } | null;
        } | null;
    } | null;
};

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

function parseRowTime(value: string): number | null {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
}

/** Local midnight of the Monday that starts `value`'s week. */
export function mondayStart(value: Date): Date {
    const day = new Date(value);
    day.setHours(0, 0, 0, 0);

    // getDay() runs Sunday-first; shift the 6-day week back to Monday.
    const sinceMonday = (day.getDay() + 6) % 7;
    day.setDate(day.getDate() - sinceMonday);

    return day;
}

function monthKeyOf(date: Date): string {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

/**
 * A `yyyy-mm` month becomes concrete local bounds, or null for anything
 * that is not a real month — a hand-edited `?month=` in the URL simply
 * falls back to "All time" instead of erroring.
 */
export function resolveMonth(month: string | null | undefined): MonthScope | null {
    if (!month) return null;

    const range = inquiryMonthRange(month);
    if (!range) return null;

    const start = new Date(`${range.from}T00:00:00`);
    const nextMonth = naiveDayAfter(range.to);
    const end = nextMonth ? new Date(nextMonth) : null;

    if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
    }

    return { start, end, key: month };
}

function inMonth(row: ChartRow, scope: MonthScope): boolean {
    const time = parseRowTime(row.inquiry_datetime);
    if (time === null) return false;

    return time >= scope.start.getTime() && time < scope.end.getTime();
}

export function countToday(rows: ChartRow[]): number {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    let total = 0;

    for (const row of rows) {
        const time = parseRowTime(row.inquiry_datetime);
        if (time !== null && time >= start.getTime() && time < end.getTime()) {
            total += 1;
        }
    }

    return total;
}

export function countStatuses(rows: ChartRow[]): DashboardCount[] {
    const totals = new Map<string, number>(
        LOG_STATUSES.map((status) => [status, 0])
    );

    for (const row of rows) {
        if (totals.has(row.status)) {
            totals.set(row.status, (totals.get(row.status) ?? 0) + 1);
        }
    }

    return [...totals].map(([label, value]) => ({ label, value }));
}

/**
 * The dates a bucket actually covers, spelled the way the user asked:
 * "August 1 - 7" inside one month, "September 28 - October 4" when the
 * range crosses a boundary, and a bare "February 29" for a single day.
 */
function rangeLabel(start: Date, end: Date): string {
    const monthName = (date: Date) =>
        date.toLocaleDateString('en-US', { month: 'long' });

    const sameMonth =
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear();

    if (sameMonth) {
        if (start.getDate() === end.getDate()) {
            return `${monthName(start)} ${start.getDate()}`;
        }

        return `${monthName(start)} ${start.getDate()} - ${end.getDate()}`;
    }

    return `${monthName(start)} ${start.getDate()} - ${monthName(end)} ${end.getDate()}`;
}

/**
 * All-time view: the last `WEEK_WINDOW` Monday-to-Sunday weeks,
 * labelled with their real date range (bucketing is unchanged from
 * the original trend line — only the wording moved).
 */
function countRecentWeeks(rows: ChartRow[]): DashboardCount[] {
    const currentWeek = mondayStart(new Date());

    const weekStarts: Date[] = [];
    for (let offset = WEEK_WINDOW - 1; offset >= 0; offset -= 1) {
        const start = new Date(currentWeek);
        start.setDate(start.getDate() - offset * 7);
        weekStarts.push(start);
    }

    const indexByWeek = new Map<number, number>(
        weekStarts.map((start, index) => [start.getTime(), index])
    );
    const buckets = weekStarts.map(() => 0);

    for (const row of rows) {
        const time = parseRowTime(row.inquiry_datetime);
        if (time === null) continue;

        const index = indexByWeek.get(mondayStart(new Date(time)).getTime());
        if (index !== undefined) buckets[index] += 1;
    }

    return weekStarts.map((start, index) => {
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return { label: rangeLabel(start, end), value: buckets[index] };
    });
}

/**
 * Month-filtered view: the month sliced into 7-day chunks — 1-7,
 * 8-14, 15-21, 22-28, 29-end — so every label is a real in-month date
 * range ("October 1 - 7") and every counted row falls inside the range
 * its bar is named after. Monday-based weeks would straddle the month
 * edges and make the first and last bars lie about their own dates.
 */
function countMonthWeeks(rows: ChartRow[], scope: MonthScope): DashboardCount[] {
    const year = Number(scope.key.slice(0, 4));
    const monthIndex = Number(scope.key.slice(5, 7)) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const buckets: DashboardCount[] = [];
    for (let day = 1; day <= daysInMonth; day += 7) {
        const lastDay = Math.min(day + 6, daysInMonth);

        buckets.push({
            label: rangeLabel(
                new Date(year, monthIndex, day),
                new Date(year, monthIndex, lastDay)
            ),
            value: 0,
        });
    }

    for (const row of rows) {
        const time = parseRowTime(row.inquiry_datetime);
        if (time === null) continue;

        const date = new Date(time);

        // Rows outside the selected month would claim a chunk that is
        // not theirs; the caller filters, this just cannot be tricked.
        if (
            date.getMonth() !== monthIndex ||
            date.getFullYear() !== year
        ) {
            continue;
        }

        const index = Math.floor((date.getDate() - 1) / 7);
        if (index >= 0 && index < buckets.length) buckets[index].value += 1;
    }

    return buckets;
}

/**
 * Counts per week, labelled with the dates each bucket covers:
 * Monday-week ranges when no month is chosen, month chunks ("October
 * 1 - 7") when one is. `rows` are expected to be already scoped to
 * `scope` by the caller.
 */
export function countWeekly(
    rows: ChartRow[],
    scope: MonthScope | null
): DashboardCount[] {
    return scope ? countMonthWeeks(rows, scope) : countRecentWeeks(rows);
}

/**
 * Every name in the dimension table — not just the ones with logs —
 * so a quiet month still draws the full platform/brand list at zero
 * instead of hiding entries. Keys found in the log projection but not
 * in the catalog are folded in defensively: foreign keys should
 * prevent that, but an embed hidden by RLS would otherwise vanish.
 */
export function countDimensions(
    rows: ChartRow[],
    catalog: { name: string }[],
    keyOf: (row: ChartRow) => string
): DashboardCount[] {
    const totals = new Map<string, number>();

    for (const entry of catalog) {
        totals.set(entry.name, 0);
    }

    for (const row of rows) {
        const key = keyOf(row);
        totals.set(key, (totals.get(key) ?? 0) + 1);
    }

    return [...totals]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

/** Descending counts by `keyOf`, optionally trimmed to `limit`. */
export function countByKey(
    rows: ChartRow[],
    keyOf: (row: ChartRow) => string,
    limit?: number
): DashboardCount[] {
    const totals = new Map<string, number>();

    for (const row of rows) {
        const key = keyOf(row);
        totals.set(key, (totals.get(key) ?? 0) + 1);
    }

    const counts = [...totals]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

    return limit === undefined ? counts : counts.slice(0, limit);
}

/** `yyyy-mm` keys present in the rows, newest first. */
export function availableMonths(rows: ChartRow[]): string[] {
    const months = new Set<string>();

    for (const row of rows) {
        const time = parseRowTime(row.inquiry_datetime);
        if (time === null) continue;

        months.add(monthKeyOf(new Date(time)));
    }

    return [...months].sort().reverse();
}

/**
 * Everything the admin dashboard renders, fetched in five round trips:
 *
 * 1. the newest `RECENT_LOG_COUNT` rows plus the exact total (one
 *    query via `getInquiryLogs`),
 * 2. the active-member headcount,
 * 3. the five-column projection every chart aggregates from,
 * 4-5. the platform and brand catalogs that seed those two charts.
 *
 * The optional `month` scopes exactly four outputs — the weekly trend,
 * platform, brand and category charts. KPIs, the status doughnut and
 * the recent list deliberately stay all-time. Aggregation happens
 * here, on the server, so the browser receives a few dozen numbers
 * instead of the whole log table. The admin role is checked
 * explicitly, belt-and-braces with the /admin proxy guard — RLS would
 * scope the numbers to the caller anyway.
 */
export async function getAdminDashboardData(
    month?: string | null
): Promise<AdminDashboardData> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return EMPTY_DATA;

    if ((await getUserRole(supabase)) !== 'admin') return EMPTY_DATA;

    const scope = resolveMonth(month);

    const [recent, members, chartResult, platformsResult, brandsResult] =
        await Promise.all([
            getInquiryLogs({
                scope: 'admin',
                filters: EMPTY_LOG_FILTERS,
                page: 1,
                pageSize: RECENT_LOG_COUNT,
            }),

            supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'user')
                .eq('is_active', true),

            supabase.from('log_inquiries').select(CHART_SELECT),

            // The platform/brand charts draw their axes from these
            // catalogs, not from the logs, so unused entries still
            // appear (at zero) in the chart.
            supabase.from('platforms').select('name').order('name'),
            supabase.from('brands').select('name').order('name'),
        ]);

    if (members.error) {
        console.error(
            'Failed to count active members:',
            members.error
        );
    }

    if (chartResult.error) {
        console.error(
            'Failed to load dashboard aggregates:',
            chartResult.error
        );
    }

    if (platformsResult.error || brandsResult.error) {
        console.error(
            'Failed to load platform/brand catalogs:',
            platformsResult.error ?? brandsResult.error
        );
    }

    const allRows = (chartResult.data ?? []) as unknown as ChartRow[];
    const scopedRows = scope
        ? allRows.filter((row) => inMonth(row, scope))
        : allRows;

    return {
        totalCount: recent.totalCount,
        todayCount: countToday(allRows),
        activeMemberCount: members.count ?? 0,

        // Status is all-time by design — only the four charts below
        // respond to the monthly filter.
        statusCounts: countStatuses(allRows),

        weeklyCounts: countWeekly(scopedRows, scope),
        platformCounts: countDimensions(
            scopedRows,
            (platformsResult.data ?? []) as { name: string }[],
            (row) => row.platform?.name ?? 'Unknown'
        ),
        brandCounts: countDimensions(
            scopedRows,
            (brandsResult.data ?? []) as { name: string }[],
            (row) => row.brand?.name ?? 'Unknown'
        ),
        categoryCounts: countByKey(
            scopedRows,
            (row) =>
                row.sub_category?.main_category?.category?.name ??
                'Uncategorized',
            CATEGORY_TOP_N
        ),

        recentLogs: recent.rows,
        availableMonths: availableMonths(allRows),
        selectedMonth: scope ? scope.key : null,
    };
}
