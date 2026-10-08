import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/actions/auth';

import {
    LOG_STATUSES,
    localDayAfterIso,
    localDayStartIso,
    naiveDayAfter,
    naiveDayStart,
} from '@/lib/inquiry-log';

import type {
    InquiryLogFilterOptions,
    InquiryLogFilters,
    InquiryLogRow,
    InquiryLogScope,
} from '@/lib/types/inquiry-log';

/**
 * Relations are embedded rather than joined in JS so Postgres does the
 * work. Aliases keep the payload shaped like `InquiryLogRow`.
 */
const LOG_SELECT = `
    id,
    inquiry_datetime,
    platform_id,
    brand_id,
    representative_id,
    inquiry_sub_category_id,
    start_attended,
    end_attended,
    customer_name,
    thread_number,
    quantity,
    order_number,
    item,
    customer_concern,
    action_response,
    status,
    remarks,
    created_at,
    updated_at,
    platform:platforms ( id, name ),
    brand:brands ( id, name ),
    representative:profiles ( id, full_name, email ),
    sub_category:inquiry_sub_categories (
        id,
        name,
        main_category:inquiry_main_categories (
            id,
            name,
            category:inquiry_categories ( id, name )
        )
    )
`;

const EMPTY_RESULT = {
    rows: [] as InquiryLogRow[],
    totalCount: 0,
    totalPages: 0,
    page: 1,
};

/**
 * Dropdown options for the filter panel.
 *
 * Brands and platforms are fetched unfiltered on purpose: a brand that
 * was deactivated still appears on historical logs, and hiding it would
 * make those rows impossible to filter down to.
 */
export async function getInquiryLogFilterOptions(): Promise<InquiryLogFilterOptions> {
    const supabase = await createClient();

    const [brandsResult, platformsResult, representativesResult, categoriesResult] =
        await Promise.all([
            supabase
                .from('brands')
                .select('id, name')
                .order('name'),

            supabase
                .from('platforms')
                .select('id, name')
                .order('name'),

            supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name'),

            supabase
                .from('inquiry_categories')
                .select(`
                    id,
                    name,
                    inquiry_main_categories (
                        id,
                        name,
                        inquiry_sub_categories (
                            id,
                            name
                        )
                    )
                `)
                .order('name'),
        ]);

    const firstError =
        brandsResult.error ??
        platformsResult.error ??
        representativesResult.error ??
        categoriesResult.error;

    if (firstError) {
        console.error(
            'Failed to load inquiry log filter options:',
            firstError
        );
    }

    return {
        brands: brandsResult.data ?? [],
        platforms: platformsResult.data ?? [],
        representatives: representativesResult.data ?? [],
        categories: categoriesResult.data ?? [],
        statuses: LOG_STATUSES,
    };
}

type LogQueryClient = Awaited<ReturnType<typeof createClient>>;

type LogQueryContext = {
    scope: InquiryLogScope;
    filters: InquiryLogFilters;
    userId: string;
};

/**
 * Scope and filter predicates shared by the paginated list and the
 * Excel export, so an exported file always matches what the table
 * shows for the same URL.
 *
 * Filtering by `representative_id` in `own` scope is backed by RLS as
 * well, so the user cannot widen it from the client. The caller is
 * responsible for the admin role check.
 */
function buildLogQuery(
    supabase: LogQueryClient,
    { scope, filters, userId }: LogQueryContext,
    count: boolean
) {
    let query = supabase
        .from('log_inquiries')
        .select(LOG_SELECT, count ? { count: 'exact' } : {});

    if (scope === 'own') {
        query = query.eq('representative_id', userId);
    }

    if (filters.brand_id) {
        query = query.eq('brand_id', filters.brand_id);
    }

    if (filters.platform_id) {
        query = query.eq('platform_id', filters.platform_id);
    }

    // In `own` scope the representative is already pinned, so applying
    // the dropdown too would only ever produce an empty result.
    if (filters.representative_id && scope === 'admin') {
        query = query.eq(
            'representative_id',
            filters.representative_id
        );
    }

    if (filters.inquiry_sub_category_id) {
        query = query.eq(
            'inquiry_sub_category_id',
            filters.inquiry_sub_category_id
        );
    }

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    // `created_at` is a real instant, so it keeps offset bounds.
    if (filters.created_date) {
        const start = localDayStartIso(filters.created_date);
        const end = localDayAfterIso(filters.created_date);

        if (start && end) {
            query = query
                .gte('created_at', start)
                .lt('created_at', end);
        }
    }

    // `inquiry_datetime` is a wall clock, so the bounds must be naive
    // too -- an offset here would reintroduce the session TimeZone.
    if (filters.inquiry_from) {
        const start = naiveDayStart(filters.inquiry_from);

        if (start) query = query.gte('inquiry_datetime', start);
    }

    if (filters.inquiry_to) {
        const end = naiveDayAfter(filters.inquiry_to);

        if (end) query = query.lt('inquiry_datetime', end);
    }

    return query;
}

type GetInquiryLogsArgs = {
    scope: InquiryLogScope;
    filters: InquiryLogFilters;
    page: number;
    pageSize: number;
};

/**
 * One page of logs, filtered and counted in Postgres.
 *
 * Only `pageSize` rows are ever materialised, which is what keeps the
 * table usable against a 10k+ row table.
 */
export async function getInquiryLogs({
    scope,
    filters,
    page,
    pageSize,
}: GetInquiryLogsArgs) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return EMPTY_RESULT;

    // Belt-and-braces with the /admin proxy guard: never return the
    // full table from this code path unless the caller really is admin.
    if (scope === 'admin' && (await getUserRole(supabase)) !== 'admin') {
        return EMPTY_RESULT;
    }

    const from = (page - 1) * pageSize;

    const query = buildLogQuery(
        supabase,
        { scope, filters, userId: user.id },
        true
    );

    // `id` is a stable tiebreaker so rows never shuffle between pages
    // when several logs share a `created_at` value.
    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + pageSize - 1);

    if (error) {
        console.error('Failed to load inquiry logs:', error);
        return EMPTY_RESULT;
    }

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    let rows = (data ?? []) as unknown as InquiryLogRow[];

    // A hand-edited or stale `?page=` can point past the end. Serve the
    // last real page instead of an empty table with a stale count.
    if (rows.length === 0 && page > totalPages) {
        const clampedFrom = (totalPages - 1) * pageSize;

        const { data: retry, error: retryError } = await query.range(
            clampedFrom,
            clampedFrom + pageSize - 1
        );

        if (retryError) {
            console.error(
                'Failed to load inquiry logs:',
                retryError
            );
        } else {
            rows = (retry ?? []) as unknown as InquiryLogRow[];
        }

        return { rows, totalCount, totalPages, page: totalPages };
    }

    return {
        // Without generated Supabase types the embed shapes come back
        // as loose arrays; the SELECT above is the source of truth.
        rows,
        totalCount,
        totalPages,
        page: Math.min(page, totalPages),
    };
}

/** Rows fetched per request while building an export. */
const EXPORT_BATCH_SIZE = 1000;

/**
 * Hard ceiling on a single export. The table is small today, but a
 * runaway filter must not be able to stream an unbounded workbook into
 * memory; anything past the cap is reported back to the caller.
 */
export const EXPORT_ROW_LIMIT = 10000;

export type InquiryLogExportResult =
    | { ok: true; rows: InquiryLogRow[]; truncated: boolean }
    | { ok: false; reason: 'unauthorized' | 'failed' };

/**
 * Every row matching `filters`, in the same order as the table.
 *
 * The result set is pulled in batches instead of one unbounded request,
 * so a large export cannot trip Postgres statement timeouts. The list
 * query's `pageSize` deliberately does not apply here: an export means
 * "everything the filters select", not "what is on screen".
 */
export async function getInquiryLogsForExport({
    scope,
    filters,
}: {
    scope: InquiryLogScope;
    filters: InquiryLogFilters;
}): Promise<InquiryLogExportResult> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, reason: 'unauthorized' };

    // Belt-and-braces with the /admin proxy guard, same as the list.
    if (scope === 'admin' && (await getUserRole(supabase)) !== 'admin') {
        return { ok: false, reason: 'unauthorized' };
    }

    const query = buildLogQuery(
        supabase,
        { scope, filters, userId: user.id },
        false
    );

    const rows: InquiryLogRow[] = [];

    for (let from = 0; ; from += EXPORT_BATCH_SIZE) {
        // `.range()` mutates the one builder, so the ordering has to be
        // restated on every batch; `id` keeps ties stable across the
        // batch boundary for the same reason it does across pages.
        const { data, error } = await query
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .range(from, from + EXPORT_BATCH_SIZE - 1);

        if (error) {
            console.error('Failed to export inquiry logs:', error);
            return { ok: false, reason: 'failed' };
        }

        const batch = (data ?? []) as unknown as InquiryLogRow[];

        rows.push(...batch);

        // Checked before the short-batch exit so a result set that ends
        // exactly on the cap is not reported as truncated: only a batch
        // that pushes past the limit proves rows were left behind.
        if (rows.length > EXPORT_ROW_LIMIT) {
            return {
                ok: true,
                rows: rows.slice(0, EXPORT_ROW_LIMIT),
                truncated: true,
            };
        }

        if (batch.length < EXPORT_BATCH_SIZE) {
            return { ok: true, rows, truncated: false };
        }
    }
}
