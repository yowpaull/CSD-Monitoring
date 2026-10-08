'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    useCallback,
    useMemo,
    useRef,
    useState,
    useTransition,
    type ChangeEvent,
    type FormEvent,
    type ReactNode,
} from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    FilterX,
    RefreshCw,
} from 'lucide-react';

import {
    DEFAULT_LOG_PAGE_SIZE,
    LOG_PAGE_SIZES,
    buildLogQueryString,
    formatClockTime,
    formatLocalMonth,
    formatTimestampParts,
    hasActiveLogFilters,
    inquiryMonthRange,
    paginationWindow,
    statusBadgeClass,
    totalMinutesBetween,
} from '@/lib/inquiry-log';

import LogRowModals, {
    type LogFormOptions,
    type LogRowModal,
} from './LogRowModals';

import type {
    InquiryLogFilterOptions,
    InquiryLogFilters,
    InquiryLogRow,
    InquiryLogScope,
} from '@/lib/types/inquiry-log';

type InquiryLogsViewProps = {
    scope: InquiryLogScope;
    title: string;
    description: string;
    rows: InquiryLogRow[];
    totalCount: number;
    page: number;
    pageSize: number;
    filters: InquiryLogFilters;
    options: InquiryLogFilterOptions;
};

const COLUMN_COUNT = 20;

const TH_CLASS =
    'px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-gray-500';

const TD_CLASS = 'px-4 py-3 align-top';

const CONTROL_CLASS =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60';

export default function InquiryLogsView({
    scope,
    title,
    description,
    rows,
    totalCount,
    page,
    pageSize,
    filters,
    options,
}: InquiryLogsViewProps) {
    const router = useRouter();
    const pathname = usePathname();

    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const filtersActive = hasActiveLogFilters(filters);

    const searchParams = useSearchParams();

    /*
     * The export month lives in the URL, not only in component state:
     * the page remounts this view (via its `key`) whenever the filters
     * change, and an un-persisted selection would quietly fall back to
     * the current month and download the wrong rows.
     *
     * `null` = never set, so default to the current month. An empty
     * value = the picker was cleared on purpose, meaning "every month
     * the filters select".
     */
    const monthParam = searchParams.get('export_month');

    const [exportMonth, setExportMonth] = useState(() => {
        if (monthParam === '') return '';
        if (monthParam && inquiryMonthRange(monthParam)) return monthParam;

        return formatLocalMonth(new Date());
    });

    const handleMonthChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const next = event.currentTarget.value;

            setExportMonth(next);

            // Shallow history update: Next wires the native
            // `replaceState` into its router, so `useSearchParams`
            // stays in sync without a server round trip for what is
            // only a picker change.
            const params = new URLSearchParams(searchParams.toString());

            params.set('export_month', next);

            window.history.replaceState(null, '', `?${params.toString()}`);
        },
        [searchParams]
    );

    /*
     * The export runs server-side over every row the filters select, so
     * only the filter half of the query string is forwarded — page and
     * page size are irrelevant to a file. A plain anchor, not a Next
     * Link: the response is an attachment, so there is no navigation to
     * intercept.
     */
    const exportHref = useMemo(() => {
        const params = new URLSearchParams(
            buildLogQueryString(filters, 1, DEFAULT_LOG_PAGE_SIZE)
        );

        // The month owns the export's inquiry-date window, so it
        // overwrites any manual Inquiry Date Range: two competing
        // ranges would quietly produce an empty file.
        const range = inquiryMonthRange(exportMonth);

        if (range) {
            params.set('inquiry_from', range.from);
            params.set('inquiry_to', range.to);
        }

        const query = params.toString();

        return query ? `${pathname}/export?${query}` : `${pathname}/export`;
    }, [exportMonth, filters, pathname]);

    /*
     * The reference data the edit form needs, narrowed from the filter
     * options. Memoised so every row shares one object identity —
     * otherwise each render would hand the memoised modals new props and
     * defeat the comparison.
     */
    const formOptions: LogFormOptions = useMemo(
        () => ({
            platforms: options.platforms,
            brands: options.brands,
            categories: options.categories,
        }),
        [options.platforms, options.brands, options.categories]
    );

    const firstRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const lastRow = Math.min(page * pageSize, totalCount);
    const totalPages = Math.ceil(totalCount / pageSize);

    /*
     * Row modal state lives here, not on `LogRow`, and that placement is
     * load-bearing.
     *
     * A successful delete calls `revalidatePath` server-side and then
     * `router.refresh()`, which removes the row from `rows` — and with it
     * any modal mounted inside that row's `<td>`. The action result would
     * then never reach the component holding `useActionState`, so no
     * success toast could ever fire. Holding the state at table level
     * keeps the modal mounted across the refresh; the cleared
     * `activeRow` lookup below then drops it once the row is gone.
     */
    const [activeModal, setActiveModal] = useState<{
        row: InquiryLogRow;
        modal: LogRowModal;
    } | null>(null);

    const closeModal = useCallback(() => setActiveModal(null), []);

    /*
     * Prefer the row from the latest server payload, so an open edit form
     * does not keep showing values that were just changed elsewhere. Falls
     * back to the captured row while it is still present (and during the
     * window where a deleted row has left `rows` but the modal is closing).
     */
    const activeRow = useMemo(() => {
        if (!activeModal) return null;

        return (
            rows.find((row) => row.id === activeModal.row.id) ??
            activeModal.row
        );
    }, [activeModal, rows]);

    const pageHref = useCallback(
        (target: number) => {
            const query = buildLogQueryString(
                filters,
                target,
                pageSize
            );

            return query ? `${pathname}?${query}` : pathname;
        },
        [filters, pageSize, pathname]
    );

    /**
     * Every filter change rewinds to page 1 — page 7 of the previous
     * result set is meaningless once the result set changes.
     */
    const applyFilters = useCallback(
        (form: HTMLFormElement) => {
            const data = new FormData(form);

            const value = (key: keyof InquiryLogFilters) =>
                String(data.get(key) ?? '').trim();

            const nextFilters: InquiryLogFilters = {
                brand_id: value('brand_id'),
                platform_id: value('platform_id'),
                representative_id:
                    value('representative_id'),
                inquiry_sub_category_id:
                    value('inquiry_sub_category_id'),
                status: value('status'),
                created_date: value('created_date'),
                inquiry_from: value('inquiry_from'),
                inquiry_to: value('inquiry_to'),
            };

            const parsedSize = Number.parseInt(
                String(data.get('page_size') ?? ''),
                10
            );

            const nextSize = (
                LOG_PAGE_SIZES as readonly number[]
            ).includes(parsedSize)
                ? parsedSize
                : pageSize;

            const query = buildLogQueryString(
                nextFilters,
                1,
                nextSize
            );

            startTransition(() => {
                router.push(
                    query ? `${pathname}?${query}` : pathname,
                    { scroll: false }
                );
            });
        },
        [pageSize, pathname, router]
    );

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            applyFilters(event.currentTarget);
        },
        [applyFilters]
    );

    const handleAutoApply = useCallback(
        (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
            const form = event.currentTarget.form;

            if (form) applyFilters(form);
        },
        [applyFilters]
    );

    const handleClear = useCallback(() => {
        const form = formRef.current;

        // `form.reset()` would restore the *current* filter values, not
        // empty ones, so blank the controls directly. The page-size
        // select is not a filter and keeps its value.
        if (form) {
            for (const element of form.elements) {
                if (
                    element instanceof HTMLSelectElement ||
                    element instanceof HTMLInputElement
                ) {
                    element.value =
                        element.name === 'page_size'
                            ? String(pageSize)
                            : '';
                }
            }
        }

        startTransition(() => {
            router.push(pathname, { scroll: false });
        });
    }, [pageSize, pathname, router]);

    return (
        <div className="p-6">
            <div className="mx-auto max-w-full">

                {/* HEADER */}

                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {title}
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            {description}
                        </p>
                    </div>

                    <div className="flex items-end gap-3">
                        <div>
                            <label
                                htmlFor="export_month"
                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600"
                            >
                                Export month
                            </label>

                            <input
                                type="month"
                                id="export_month"
                                value={exportMonth}
                                onChange={handleMonthChange}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <a
                            href={exportHref}
                            aria-disabled={totalCount === 0}
                            className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 ${
                                totalCount === 0
                                    ? 'pointer-events-none opacity-50'
                                    : ''
                            }`}
                        >
                            <Download size={14} />
                            Export to Excel
                        </a>
                    </div>
                </div>


                {/* FILTERS */}

                <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    aria-label="Filter inquiry logs"
                    className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <FilterField label="Brand" htmlFor="brand_id">
                            <select
                                id="brand_id"
                                name="brand_id"
                                defaultValue={filters.brand_id}
                                onChange={handleAutoApply}
                                className={CONTROL_CLASS}
                            >
                                <option value="">All brands</option>

                                {options.brands.map((brand) => (
                                    <option
                                        key={brand.id}
                                        value={brand.id}
                                    >
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </FilterField>

                        <FilterField label="Platform" htmlFor="platform_id">
                            <select
                                id="platform_id"
                                name="platform_id"
                                defaultValue={filters.platform_id}
                                onChange={handleAutoApply}
                                className={CONTROL_CLASS}
                            >
                                <option value="">All platforms</option>

                                {options.platforms.map((platform) => (
                                    <option
                                        key={platform.id}
                                        value={platform.id}
                                    >
                                        {platform.name}
                                    </option>
                                ))}
                            </select>
                        </FilterField>

                        {/* Pinned to the signed-in representative in
                            `own` scope, so the dropdown is redundant. */}
                        {scope === 'admin' && (
                            <FilterField
                                label="Representative"
                                htmlFor="representative_id"
                            >
                                <select
                                    id="representative_id"
                                    name="representative_id"
                                    defaultValue={filters.representative_id}
                                    onChange={handleAutoApply}
                                    className={CONTROL_CLASS}
                                >
                                    <option value="">
                                        All representatives
                                    </option>

                                    {options.representatives.map((person) => (
                                        <option
                                            key={person.id}
                                            value={person.id}
                                        >
                                            {person.full_name ||
                                                person.email ||
                                                'Unnamed user'}
                                        </option>
                                    ))}
                                </select>
                            </FilterField>
                        )}

                        <FilterField
                            label="Inquiry Type"
                            htmlFor="inquiry_sub_category_id"
                        >
                            <select
                                id="inquiry_sub_category_id"
                                name="inquiry_sub_category_id"
                                defaultValue={
                                    filters.inquiry_sub_category_id
                                }
                                onChange={handleAutoApply}
                                className={CONTROL_CLASS}
                            >
                                <option value="">All inquiry types</option>

                                {options.categories.map((category) => (
                                    <optgroup
                                        key={category.id}
                                        label={category.name}
                                    >
                                        {category.inquiry_main_categories.map(
                                            (mainCategory) =>
                                                mainCategory.inquiry_sub_categories.map(
                                                    (subCategory) => (
                                                        <option
                                                            key={subCategory.id}
                                                            value={
                                                                subCategory.id
                                                            }
                                                        >
                                                            {mainCategory.name}{' '}
                                                            -{' '}
                                                            {subCategory.name}
                                                        </option>
                                                    )
                                                )
                                        )}
                                    </optgroup>
                                ))}
                            </select>
                        </FilterField>

                        <FilterField label="Status" htmlFor="status">
                            <select
                                id="status"
                                name="status"
                                defaultValue={filters.status}
                                onChange={handleAutoApply}
                                className={CONTROL_CLASS}
                            >
                                <option value="">All statuses</option>

                                {options.statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </FilterField>

                        <FilterField
                            label="Created Date"
                            htmlFor="created_date"
                        >
                            <input
                                type="date"
                                id="created_date"
                                name="created_date"
                                defaultValue={filters.created_date}
                                onChange={handleAutoApply}
                                className={CONTROL_CLASS}
                            />
                        </FilterField>

                        <FilterField
                            label="Inquiry Date Range — from"
                            htmlFor="inquiry_from"
                        >
                            <input
                                type="date"
                                id="inquiry_from"
                                name="inquiry_from"
                                defaultValue={filters.inquiry_from}
                                onChange={handleAutoApply}
                                className={CONTROL_CLASS}
                            />
                        </FilterField>

                        <FilterField
                            label="Inquiry Date Range — to"
                            htmlFor="inquiry_to"
                        >
                            <input
                                type="date"
                                id="inquiry_to"
                                name="inquiry_to"
                                defaultValue={filters.inquiry_to}
                                onChange={handleAutoApply}
                                className={CONTROL_CLASS}
                            />
                        </FilterField>

                        <FilterField label="Rows per page" htmlFor="page_size">
                            <select
                                id="page_size"
                                name="page_size"
                                defaultValue={pageSize}
                                onChange={handleAutoApply}
                                className={CONTROL_CLASS}
                            >
                                {LOG_PAGE_SIZES.map((size) => (
                                    <option key={size} value={size}>
                                        {size} rows
                                    </option>
                                ))}
                            </select>
                        </FilterField>
                    </div>

                    <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isPending ? (
                                <RefreshCw
                                    size={14}
                                    className="animate-spin"
                                />
                            ) : null}
                            Apply Filters
                        </button>

                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={isPending || !filtersActive}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FilterX size={14} />
                            Clear Filters
                        </button>

                        {filtersActive && (
                            <p className="text-xs text-gray-500">
                                Filtering active — results are limited to
                                the current page size.
                            </p>
                        )}
                    </div>
                </form>


                {/* RESULT COUNT */}

                <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
                    <p aria-live="polite">
                        {totalCount === 0
                            ? 'No inquiry logs found.'
                            : `Showing ${firstRow.toLocaleString()}–${lastRow.toLocaleString()} of ${totalCount.toLocaleString()} logs`}
                    </p>

                    {totalPages > 1 && (
                        <p>
                            Page {page.toLocaleString()} of{' '}
                            {totalPages.toLocaleString()}
                        </p>
                    )}
                </div>


                {/* TABLE */}

                <div
                    className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-opacity ${
                        isPending ? 'opacity-60' : 'opacity-100'
                    }`}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[2200px] text-left text-sm text-gray-600">

                            {/* TABLE HEADER */}

                            {/*
                              * `overflow-x-auto` below computes
                              * `overflow-y` to `auto` too, which makes
                              * this element the sticky containing
                              * block — a `sticky` header would never
                              * stick. Left static on purpose.
                              */}
                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className={TH_CLASS}>
                                        Inquiry Date &amp; Time
                                    </th>
                                    <th className={TH_CLASS}>
                                        Platform
                                    </th>
                                    <th className={TH_CLASS}>
                                        Brand
                                    </th>
                                    <th className={TH_CLASS}>
                                        Representative
                                    </th>
                                    <th className={TH_CLASS}>
                                        Inquiry Type
                                    </th>
                                    <th className={TH_CLASS}>
                                        Start Attended
                                    </th>
                                    <th className={TH_CLASS}>
                                        End Attended
                                    </th>
                                    <th className={TH_CLASS}>
                                        Total Minutes
                                    </th>
                                    <th className={TH_CLASS}>
                                        Customer Name
                                    </th>
                                    <th className={TH_CLASS}>
                                        Thread Number
                                    </th>
                                    <th className={TH_CLASS}>
                                        Quantity
                                    </th>
                                    <th className={TH_CLASS}>
                                        Order Number
                                    </th>
                                    <th className={TH_CLASS}>
                                        Item
                                    </th>
                                    <th className={TH_CLASS}>
                                        Customer Concern / Complaint
                                    </th>
                                    <th className={TH_CLASS}>
                                        Action / Response
                                    </th>
                                    <th className={TH_CLASS}>
                                        Status
                                    </th>
                                    <th className={TH_CLASS}>
                                        Remarks
                                    </th>
                                    <th className={TH_CLASS}>
                                        Created At
                                    </th>
                                    <th className={TH_CLASS}>
                                        Updated At
                                    </th>
                                    <th className={TH_CLASS}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            {/* TABLE BODY */}

                            <tbody className="divide-y divide-gray-100">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={COLUMN_COUNT}
                                            className="px-6 py-16 text-center text-gray-500"
                                        >
                                            No inquiry logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <LogRow
                                            key={row.id}
                                            row={row}
                                            onOpenModal={(modal) =>
                                                setActiveModal({
                                                    row,
                                                    modal,
                                                })
                                            }
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ROW MODALS
                    *
                    * Mounted outside the table so a delete does not
                    * unmount the component that owns the action state
                    * before it can report success.
                    */}

                {activeRow && (
                    <LogRowModals
                        row={activeRow}
                        modal={activeModal?.modal ?? null}
                        options={formOptions}
                        onClose={closeModal}
                    />
                )}


                {/* PAGINATION */}

                {totalPages > 1 && (
                    <nav
                        aria-label="Pagination"
                        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                    >
                        <p className="text-sm text-gray-500">
                            {totalCount.toLocaleString()} logs ·{' '}
                            {totalPages.toLocaleString()} pages
                        </p>

                        <div className="flex items-center gap-1">
                            <PageLink
                                href={pageHref(page - 1)}
                                disabled={page <= 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={16} />
                            </PageLink>

                            {paginationWindow(page, totalPages).map(
                                (entry, index) =>
                                    entry === 'gap' ? (
                                        <span
                                            key={`gap-${index}`}
                                            className="px-2 text-sm text-gray-400"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <PageLink
                                            key={entry}
                                            href={pageHref(entry)}
                                            aria-current={
                                                entry === page
                                                    ? 'page'
                                                    : undefined
                                            }
                                            active={entry === page}
                                        >
                                            {entry}
                                        </PageLink>
                                    )
                            )}

                            <PageLink
                                href={pageHref(page + 1)}
                                disabled={page >= totalPages}
                                aria-label="Next page"
                            >
                                <ChevronRight size={16} />
                            </PageLink>
                        </div>
                    </nav>
                )}
            </div>
        </div>
    );
}


/* =========================================================
   FILTER FIELD
   ========================================================= */

function FilterField({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600"
            >
                {label}
            </label>

            {children}
        </div>
    );
}


/* =========================================================
   PAGE LINK
   ========================================================= */

function PageLink({
    href,
    active = false,
    disabled = false,
    children,
    ...rest
}: {
    href: string;
    active?: boolean;
    disabled?: boolean;
    children: ReactNode;
} & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    'href' | 'className'
>) {
    const className = [
        'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition',
        active
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100',
        disabled ? 'pointer-events-none opacity-40' : '',
    ]
        .filter(Boolean)
        .join(' ');

    if (disabled) {
        return (
            <span
                aria-disabled="true"
                className={className}
                {...rest}
            >
                {children}
            </span>
        );
    }

    return (
        <Link
            href={href}
            prefetch={false}
            scroll={false}
            className={className}
            {...rest}
        >
            {children}
        </Link>
    );
}


/* =========================================================
   TABLE ROW
   ========================================================= */

function LogRow({
    row,
    onOpenModal,
}: {
    row: InquiryLogRow;
    onOpenModal: (modal: LogRowModal) => void;
}) {
    const inquiry = formatTimestampParts(row.inquiry_datetime);
    const created = formatTimestampParts(row.created_at);
    const updated = formatTimestampParts(row.updated_at);

    const minutes = totalMinutesBetween(
        row.start_attended,
        row.end_attended
    );

    const mainCategory = row.sub_category?.main_category;

    const concern = row.customer_concern;
    const response = row.action_response;
    const remarks = row.remarks;

    return (
        <tr className="transition-colors hover:bg-gray-50">

            {/* Inquiry Date & Time */}
            <td className={TD_CLASS}>
                <div className="font-medium whitespace-nowrap text-gray-900">
                    {inquiry.date}
                </div>
                <div className="text-xs whitespace-nowrap text-gray-500">
                    {inquiry.time}
                </div>
                <div className="text-xs whitespace-nowrap text-gray-500">
                    {inquiry.weekday}
                </div>
            </td>

            {/* Platform */}
            <td className={TD_CLASS}>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-gray-600">
                    {row.platform?.name ?? '—'}
                </span>
            </td>

            {/* Brand */}
            <td className={TD_CLASS}>
                <span className="font-medium whitespace-nowrap text-gray-900">
                    {row.brand?.name ?? '—'}
                </span>
            </td>

            {/* Representative */}
            <td className={TD_CLASS}>
                <span className="whitespace-nowrap">
                    {row.representative?.full_name ||
                        row.representative?.email ||
                        'Unknown'}
                </span>
            </td>

            {/* Inquiry Type */}
            <td className={TD_CLASS}>
                <p className="font-medium whitespace-nowrap text-gray-900">
                    {row.sub_category?.name ?? '—'}
                </p>
                <p className="text-xs whitespace-nowrap text-gray-400">
                    {mainCategory?.name ?? '—'}
                    {mainCategory?.category
                        ? ` · ${mainCategory.category.name}`
                        : ''}
                </p>
            </td>

            {/* Start / End Attended */}
            <td className={`${TD_CLASS} whitespace-nowrap`}>
                {formatClockTime(row.start_attended)}
            </td>
            <td className={`${TD_CLASS} whitespace-nowrap`}>
                {formatClockTime(row.end_attended)}
            </td>

            {/* Total Minutes */}
            <td className={TD_CLASS}>
                <span className="font-medium whitespace-nowrap text-gray-900">
                    {minutes === null
                        ? '—'
                        : `${minutes.toLocaleString()} min`}
                </span>
            </td>

            {/* Customer Name */}
            <td className={TD_CLASS}>
                <span className="font-medium whitespace-nowrap text-gray-900">
                    {row.customer_name}
                </span>
            </td>

            {/* Thread Number */}
            <td className={`${TD_CLASS} whitespace-nowrap`}>
                {row.thread_number.toLocaleString()}
            </td>

            {/* Quantity */}
            <td className={`${TD_CLASS} whitespace-nowrap`}>
                {row.quantity.toLocaleString()}
            </td>

            {/* Order Number */}
            <td className={TD_CLASS}>
                <span className="whitespace-nowrap">
                    {row.order_number ?? '—'}
                </span>
            </td>

            {/* Item */}
            <td className={TD_CLASS}>
                <p className="max-w-[220px] line-clamp-2">
                    {row.item ?? '—'}
                </p>
            </td>

            {/* Customer Concern */}
            <td className={TD_CLASS}>
                <p className="max-w-[280px] line-clamp-3">
                    {concern ?? '—'}
                </p>
            </td>

            {/* Action Response */}
            <td className={TD_CLASS}>
                <p className="max-w-[280px] line-clamp-3">
                    {response ?? '—'}
                </p>
            </td>

            {/* Status */}
            <td className={TD_CLASS}>
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${statusBadgeClass(row.status)}`}
                >
                    {row.status}
                </span>
            </td>

            {/* Remarks */}
            <td className={TD_CLASS}>
                <p className="max-w-[240px] line-clamp-3">
                    {remarks ?? '—'}
                </p>
            </td>

            {/* Created At */}
            <td className={TD_CLASS}>
                <div className="whitespace-nowrap text-gray-900">
                    {created.date}
                </div>
                <div className="text-xs whitespace-nowrap text-gray-500">
                    {created.time}
                </div>
            </td>

            {/* Updated At */}
            <td className={TD_CLASS}>
                <div className="whitespace-nowrap text-gray-900">
                    {updated.date}
                </div>
                <div className="text-xs whitespace-nowrap text-gray-500">
                    {updated.time}
                </div>
            </td>

            {/* Actions */}
            <td className={TD_CLASS}>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onOpenModal({ kind: 'view' })}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                        View
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenModal({ kind: 'edit' })}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenModal({ kind: 'delete' })}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}
