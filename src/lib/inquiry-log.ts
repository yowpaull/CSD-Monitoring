/**
 * Isomorphic helpers for the inquiry log list: query-string parsing
 * (server side) and query-string building (client side, for links),
 * plus the display formatters the table uses.
 */

import type { InquiryLogFilters } from '@/lib/types/inquiry-log';

/** Mirrors the `status` check constraint on `log_inquiries`. */
export const LOG_STATUSES = ['Open', 'Pending', 'Closed'] as const;

export const LOG_PAGE_SIZES = [25, 50, 100] as const;

export const DEFAULT_LOG_PAGE_SIZE = 25;

export const EMPTY_LOG_FILTERS: InquiryLogFilters = {
    brand_id: '',
    platform_id: '',
    representative_id: '',
    inquiry_sub_category_id: '',
    status: '',
    created_date: '',
    inquiry_from: '',
    inquiry_to: '',
};

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type RawSearchParams = Record<
    string,
    string | string[] | undefined
>;

function readParam(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
}

/** Rejects malformed ids/dates instead of letting Postgres throw. */
export function parseLogFilters(
    params: RawSearchParams
): InquiryLogFilters {
    const uuid = (key: string) => {
        const raw = readParam(params[key]).trim();
        return UUID_PATTERN.test(raw) ? raw : '';
    };

    const date = (key: string) => {
        const raw = readParam(params[key]).trim();
        return DATE_PATTERN.test(raw) ? raw : '';
    };

    const status = readParam(params.status).trim();

    return {
        brand_id: uuid('brand_id'),
        platform_id: uuid('platform_id'),
        representative_id: uuid('representative_id'),
        inquiry_sub_category_id: uuid('inquiry_sub_category_id'),
        status: (LOG_STATUSES as readonly string[]).includes(status)
            ? status
            : '',
        created_date: date('created_date'),
        inquiry_from: date('inquiry_from'),
        inquiry_to: date('inquiry_to'),
    };
}

export function parseLogPagination(params: RawSearchParams): {
    page: number;
    pageSize: number;
} {
    const parsedPage = Number.parseInt(readParam(params.page), 10);
    const page =
        Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const parsedSize = Number.parseInt(
        readParam(params.page_size),
        10
    );
    const pageSize = (LOG_PAGE_SIZES as readonly number[]).includes(
        parsedSize
    )
        ? parsedSize
        : DEFAULT_LOG_PAGE_SIZE;

    return { page, pageSize };
}

export function hasActiveLogFilters(
    filters: InquiryLogFilters
): boolean {
    return Object.values(filters).some(Boolean);
}

/** Serialises filters + pagination, omitting defaults. */
export function buildLogQueryString(
    filters: InquiryLogFilters,
    page: number,
    pageSize: number
): string {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
    }

    if (page > 1) params.set('page', String(page));
    if (pageSize !== DEFAULT_LOG_PAGE_SIZE) {
        params.set('page_size', String(pageSize));
    }

    return params.toString();
}

/**
 * Day boundaries for a genuine instant column (`created_at`), which is
 * `timestamptz` and therefore needs a real UTC offset.
 */
export function localDayStartIso(date: string): string | null {
    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return null;

    return parsed.toISOString();
}

/** Local midnight of the *next* day — an exclusive upper bound. */
export function localDayAfterIso(date: string): string | null {
    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return null;

    parsed.setDate(parsed.getDate() + 1);

    return parsed.toISOString();
}

/** `yyyy-mm-dd` from a Date's *local* parts, never via toISOString. */
export function formatLocalDay(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/** `yyyy-mm` from a Date's *local* parts, never via toISOString. */
export function formatLocalMonth(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Inclusive first and last day (`yyyy-mm-dd`) of a `yyyy-mm` month —
 * exactly the pair of bounds the inquiry-date filters already accept,
 * so a monthly export needs no new query logic.
 *
 * Returns null for anything that is not a real month. Day 0 of the
 * following month is the last day of this one, which lets `Date`
 * answer the leap-year question (2028-02 → 29) without a lookup table.
 */
export function inquiryMonthRange(month: string): {
    from: string;
    to: string;
} | null {
    if (!MONTH_PATTERN.test(month)) return null;

    const year = Number(month.slice(0, 4));
    const monthIndex = Number(month.slice(5, 7));

    const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();

    return {
        from: `${month}-01`,
        to: `${month}-${String(lastDay).padStart(2, '0')}`,
    };
}

/**
 * Day boundaries for a wall-clock column (`inquiry_datetime`, now
 * `timestamp without time zone`).
 *
 * No `Z` on purpose: appending an offset would make Postgres reinterpret
 * the bound in the session TimeZone, which is the same conversion that
 * made the stored values wrong in the first place.
 */
export function naiveDayStart(date: string): string | null {
    if (!DATE_PATTERN.test(date)) return null;

    return `${date}T00:00:00`;
}

/** Exclusive upper bound: local midnight of the following day. */
export function naiveDayAfter(date: string): string | null {
    if (!DATE_PATTERN.test(date)) return null;

    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;

    parsed.setDate(parsed.getDate() + 1);

    return `${formatLocalDay(parsed)}T00:00:00`;
}

export function formatFullDate(value: string | null): string {
    if (!value) return '—';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';

    return parsed.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

const CLOCK_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;

/**
 * Minutes since midnight for a wall-clock `HH:mm[:ss]` value, which is
 * what PostgREST returns for a `time` column.
 *
 * These must not go through `Date`: `new Date('09:30:00')` is an Invalid
 * Date, and adding a timezone to the value is exactly the bug that made
 * the columns timestamptz in the first place. Returns null for anything
 * that is not a bare clock string so callers can fall back to timestamp
 * parsing.
 */
function clockMinutes(value: string | null): number | null {
    if (!value) return null;

    const match = CLOCK_PATTERN.exec(value.trim());
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours > 23 || minutes > 59) return null;

    return hours * 60 + minutes;
}

export function formatClockTime(value: string | null): string {
    const minutes = clockMinutes(value);

    if (minutes !== null) {
        const hours24 = Math.floor(minutes / 60);
        const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

        return `${hours12}:${String(minutes % 60).padStart(2, '0')} ${
            hours24 < 12 ? 'AM' : 'PM'
        }`;
    }

    // Fallback for full timestamps, so a row still renders if these
    // columns are ever reverted or hold legacy values.
    if (!value) return '—';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';

    return parsed.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

/** Splits a timestamp into the three lines the table stacks. */
export function formatTimestampParts(value: string | null): {
    date: string;
    time: string;
    weekday: string;
} {
    if (!value) {
        return { date: '—', time: '', weekday: '' };
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return { date: '—', time: '', weekday: '' };
    }

    return {
        date: parsed.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }),
        time: parsed.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        }),
        weekday: parsed.toLocaleDateString('en-US', {
            weekday: 'long',
        }),
    };
}

/** Duration between the two attended timestamps, in whole minutes. */
export function totalMinutesBetween(
    start: string | null,
    end: string | null
): number | null {
    if (!start || !end) return null;

    const fromClock = clockMinutes(start);
    const toClock = clockMinutes(end);

    // Wall-clock difference. This is exact rather than approximate
    // because both sides are on the same day by definition.
    if (fromClock !== null && toClock !== null) {
        return toClock - fromClock;
    }

    const from = new Date(start).getTime();
    const to = new Date(end).getTime();

    if (Number.isNaN(from) || Number.isNaN(to)) return null;

    return Math.round((to - from) / 60000);
}

/**
 * Page numbers to render around `current`. Keeps the button strip
 * short even when the total row count needs hundreds of pages.
 */
export function paginationWindow(
    current: number,
    totalPages: number,
    span = 2
): (number | 'gap')[] {
    if (totalPages < 1) return [];

    const pages = new Set<number>([1, totalPages]);

    for (
        let page = current - span;
        page <= current + span;
        page += 1
    ) {
        if (page >= 1 && page <= totalPages) pages.add(page);
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const result: (number | 'gap')[] = [];
    let previous = 0;

    for (const page of sorted) {
        if (previous && page - previous > 1) result.push('gap');
        result.push(page);
        previous = page;
    }

    return result;
}

export function statusBadgeClass(status: string): string {
    switch (status) {
        case 'Closed':
            return 'bg-green-100 text-green-800';
        case 'Pending':
            return 'bg-amber-100 text-amber-800';
        default:
            return 'bg-blue-100 text-blue-800';
    }
}
