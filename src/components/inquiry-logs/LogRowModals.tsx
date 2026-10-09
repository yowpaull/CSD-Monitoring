'use client';

import LogForm, { type LogFormValues } from '@/app/user/log/LogForm';
import {
    ActionResult,
    deleteLog,
    updateLog,
} from '@/lib/actions/log';
import {
    formatClockTime,
    formatTimestampParts,
    statusBadgeClass,
    totalMinutesBetween,
} from '@/lib/inquiry-log';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import {
    memo,
    useActionState,
    useCallback,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from 'react';

import type {
    InquiryLogCategory,
    InquiryLogNamedOption,
    InquiryLogRow,
} from '@/lib/types/inquiry-log';

/**
 * Reference data the edit form needs. Same shape the list page already
 * loaded for its filter dropdowns, so no extra request is introduced.
 */
export type LogFormOptions = {
    platforms: InquiryLogNamedOption[];
    brands: InquiryLogNamedOption[];
    categories: InquiryLogCategory[];
};

// Stable initial state — a fresh `{}` per render would give
// useActionState a new reference every time.
const initialState: ActionResult = {};

/**
 * `inquiry_datetime` and the `time` columns are stored as naive
 * wall-clock strings (`yyyy-mm-ddThh:mm` / `hh:mm:ss`), but the form
 * controls are `datetime-local` / `time`, which require no offset and no
 * seconds. Trimming rather than round-tripping through `Date` avoids the
 * timezone shift that already bit these columns once.
 */
function toDateTimeLocal(value: string): string {
    return value.slice(0, 16);
}

function toTimeInput(value: string): string {
    return value.slice(0, 5);
}

/** Seeds every control from the stored row. */
function toFormValues(row: InquiryLogRow): LogFormValues {
    return {
        inquiry_datetime: toDateTimeLocal(row.inquiry_datetime),
        platform_id: row.platform_id,
        brand_id: row.brand_id,
        inquiry_sub_category_id: row.inquiry_sub_category_id,
        start_attended: toTimeInput(row.start_attended),
        end_attended: toTimeInput(row.end_attended),
        customer_name: row.customer_name,
        thread_number: String(row.thread_number),
        order_number: row.order_number ?? '',
        item: row.item ?? '',
        customer_concern: row.customer_concern ?? '',
        action_response: row.action_response ?? '',
        status: row.status,
        remarks: row.remarks ?? '',
    };
}

/* =========================================================
   MODAL SHELL
   ========================================================= */

type ModalShellProps = {
    onClose: () => void;
    title: string;
    subtitle: string;
    ariaLabel: string;
    children: ReactNode;
    /** Edit renders a full form and needs more room than the detail view. */
    wide?: boolean;
};

function ModalShell({
    onClose,
    title,
    subtitle,
    ariaLabel,
    children,
    wide = false,
}: ModalShellProps) {
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    /*
     * `false` during SSR and on the hydration render, `true` afterwards.
     * `useSyncExternalStore` is used rather than a `useState` flag set from
     * an effect: the effect approach triggers a cascading second render
     * (and trips react-hooks/set-state-in-effect), whereas this resolves
     * the mounted state without one.
     */
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    if (!mounted) return null;

    /*
     * Portalled to <body> deliberately. These overlays are triggered from
     * a button inside a table cell, so in the DOM they would land inside
     * `overflow-x-auto` and `overflow-hidden` ancestors — and any ancestor
     * that establishes a containing block (or simply clips) would either
     * trap a `position: fixed` overlay or paint it behind the table.
     * Rendering at the root sidesteps the whole question.
     */
    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-8"
            onClick={onClose}
        >
            <div
                className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
                    wide ? 'max-w-5xl' : 'max-w-3xl'
                }`}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
            >
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                            {title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {subtitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                {children}
            </div>
        </div>,
        document.body
    );
}

/* =========================================================
   DETAIL VIEW
   ========================================================= */

const SECTION_CLASS =
    'rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs';

const DETAIL_LABEL_CLASS =
    'block text-xs font-semibold uppercase tracking-wider text-slate-500';

const DETAIL_VALUE_CLASS =
    'mt-1.5 whitespace-pre-wrap break-words text-sm text-slate-900';

function DetailItem({
    label,
    value,
    className = '',
}: {
    label: string;
    value: ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            <dt className={DETAIL_LABEL_CLASS}>{label}</dt>
            <dd className={DETAIL_VALUE_CLASS}>{value}</dd>
        </div>
    );
}

export function LogDetailsModal({
    row,
    onClose,
}: {
    row: InquiryLogRow;
    onClose: () => void;
}) {
    const inquiry = formatTimestampParts(row.inquiry_datetime);
    const created = formatTimestampParts(row.created_at);
    const updated = formatTimestampParts(row.updated_at);

    const mainCategory = row.sub_category?.main_category;

    const minutes = totalMinutesBetween(
        row.start_attended,
        row.end_attended
    );

    const orDash = (value: string | null | undefined) =>
        value && value.trim().length > 0 ? value : '—';

    return (
        <ModalShell
            onClose={onClose}
            ariaLabel="Inquiry log details"
            title="Inquiry Log Details"
            subtitle="Full record as currently stored."
        >
            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
                {/* GENERAL */}
                <div className={SECTION_CLASS}>
                    <h3 className="mb-4 border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
                        General Information
                    </h3>

                    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                            label="Date & Time of Inquiry"
                            value={`${inquiry.date} · ${inquiry.time}`}
                        />
                        <DetailItem
                            label="Type of Inquiry"
                            value={
                                <span>
                                    {orDash(row.sub_category?.name)}
                                    {mainCategory ? (
                                        <span className="block text-xs text-slate-500">
                                            {mainCategory.name}
                                            {mainCategory.category
                                                ? ` · ${mainCategory.category.name}`
                                                : ''}
                                        </span>
                                    ) : null}
                                </span>
                            }
                        />
                        <DetailItem
                            label="Platform"
                            value={orDash(row.platform?.name)}
                        />
                        <DetailItem
                            label="Brand"
                            value={orDash(row.brand?.name)}
                        />
                        <DetailItem
                            label="Representative"
                            value={orDash(
                                row.representative?.full_name ??
                                    row.representative?.email
                            )}
                        />
                    </dl>
                </div>

                {/* CONVERSATION */}
                <div className={SECTION_CLASS}>
                    <h3 className="mb-4 border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
                        Conversation Information
                    </h3>

                    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                            label="Start Attended"
                            value={formatClockTime(row.start_attended)}
                        />
                        <DetailItem
                            label="End Attended"
                            value={formatClockTime(row.end_attended)}
                        />
                        <DetailItem
                            label="Total Minutes"
                            value={
                                minutes === null
                                    ? '—'
                                    : `${minutes.toLocaleString()} min`
                            }
                        />
                        <DetailItem
                            label="Customer Name"
                            value={orDash(row.customer_name)}
                        />
                        <DetailItem
                            label="Thread Number"
                            value={row.thread_number.toLocaleString()}
                        />
                        <DetailItem
                            label="Quantity"
                            value={row.quantity.toLocaleString()}
                        />
                        <DetailItem
                            label="Order Number"
                            value={orDash(row.order_number)}
                        />
                        <DetailItem
                            label="Status"
                            value={
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                                >
                                    {row.status}
                                </span>
                            }
                        />
                    </dl>

                    <dl className="mt-5 space-y-5">
                        <DetailItem label="Item" value={orDash(row.item)} />
                        <DetailItem
                            label="Customer Concern / Complaint"
                            value={orDash(row.customer_concern)}
                        />
                        <DetailItem
                            label="Action / Response"
                            value={orDash(row.action_response)}
                        />
                        <DetailItem
                            label="Remarks"
                            value={orDash(row.remarks)}
                        />
                    </dl>
                </div>

                {/* AUDIT */}
                <div className={SECTION_CLASS}>
                    <h3 className="mb-4 border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
                        Record Information
                    </h3>

                    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <DetailItem
                            label="Created At"
                            value={`${created.date} · ${created.time}`}
                        />
                        <DetailItem
                            label="Updated At"
                            value={`${updated.date} · ${updated.time}`}
                        />
                    </dl>
                </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 px-6 py-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-500/20"
                >
                    Close
                </button>
            </div>
        </ModalShell>
    );
}

/* =========================================================
   EDIT
   ========================================================= */

export function LogEditModal({
    row,
    options,
    onClose,
}: {
    row: InquiryLogRow;
    options: LogFormOptions;
    onClose: () => void;
}) {
    const router = useRouter();

    /*
     * Form values are derived once per row: the form is uncontrolled, and
     * `state.enteredValues` takes precedence inside `LogForm` when the
     * server rejects a field.
     *
     * `LogForm` owns the action state and the toast for the edit, so this
     * modal only listens for success to refresh the table and dismiss
     * itself rather than duplicating the state here.
     */
    const [initialValues] = useState(() => toFormValues(row));

    const handleSuccess = useCallback(() => {
        router.refresh();
        setTimeout(onClose, 900);
    }, [router, onClose]);

    return (
        <ModalShell
            wide
            onClose={onClose}
            ariaLabel="Edit inquiry log"
            title="Edit Inquiry Log"
            subtitle="Changes apply to this log only. The representative cannot be reassigned."
        >
            {/* `LogForm` renders its own card chrome; strip the outer
                padding so it sits flush inside the modal body. */}
            <div className="max-h-[75vh] overflow-y-auto p-6 [&>div]:max-w-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:shadow-none">
                <LogForm
                    action={updateLog}
                    platforms={options.platforms}
                    brands={options.brands}
                    categories={options.categories}
                    currentUser={null}
                    representativeName={
                        row.representative?.full_name ??
                        row.representative?.email ??
                        'Unknown'
                    }
                    initialValues={initialValues}
                    hiddenFields={{ id: row.id }}
                    title="Edit Log Details"
                    description="Update the fields below and save your changes."
                    submitLabel="Save Changes"
                    onSuccess={handleSuccess}
                />
            </div>
        </ModalShell>
    );
}

/* =========================================================
   DELETE
   ========================================================= */

export function LogDeleteModal({
    row,
    onClose,
}: {
    row: InquiryLogRow;
    onClose: () => void;
}) {
    const router = useRouter();

    const [state, formAction, isPending] = useActionState(
        deleteLog,
        initialState
    );

    /*
     * Toasts are fired here rather than through `useActionToast` so the
     * confirmation is not dependent on the hook's precedence chain (a
     * `fieldErrors` payload would otherwise swallow the success message).
     * `lastHandled` mirrors the hook's guard against duplicate fires.
     */
    const lastHandled = useRef<ActionResult | null>(null);

    const succeeded = Boolean(state?.success);

    useEffect(() => {
        if (!state) return;
        if (lastHandled.current === state) return;
        if (!state.error && !state.success) return;

        lastHandled.current = state;

        if (state.error) {
            toast.error(state.error);
            return;
        }

        toast.success(state.message ?? 'Inquiry log deleted.');
    }, [state]);

    const handleSuccess = useCallback(() => {
        router.refresh();
        setTimeout(onClose, 900);
    }, [router, onClose]);

    useEffect(() => {
        if (!succeeded) return;
        handleSuccess();
    }, [succeeded, handleSuccess]);

    const customer = row.customer_name?.trim() || 'this inquiry log';
    const thread = row.thread_number
        ? ` (thread #${row.thread_number.toLocaleString()})`
        : '';

    return (
        <ModalShell
            onClose={onClose}
            ariaLabel="Delete inquiry log"
            title="Delete Inquiry Log"
            subtitle="This cannot be undone."
        >
            <form action={formAction}>
                <input type="hidden" name="id" value={row.id} />

                <div className="p-6">
                    <p className="text-sm text-slate-700">
                        You are about to permanently delete{' '}
                        <span className="font-semibold text-slate-900">
                            {customer}
                            {thread}
                        </span>
                        . Continue?
                    </p>

                    {state?.error && (
                        <p role="alert" className="mt-4 text-xs text-red-600">
                            {state.error}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={isPending}
                        aria-disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isPending && (
                            <span
                                aria-hidden="true"
                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                            />
                        )}
                        {isPending ? 'Deleting...' : 'Delete Log'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

/**
 * Renders exactly one of the three row modals, or nothing.
 *
 * Only the active modal is mounted so the others' `useActionState`
 * instances are not kept alive with a stale previous result — reopening
 * "Edit" after a failed attempt must start from the stored values again.
 */
export type LogRowModal =
    | { kind: 'view' }
    | { kind: 'edit' }
    | { kind: 'delete' };

const LogRowModals = memo(function LogRowModals({
    row,
    modal,
    options,
    onClose,
}: {
    row: InquiryLogRow;
    modal: LogRowModal | null;
    options: LogFormOptions;
    onClose: () => void;
}) {
    if (!modal) return null;

    if (modal.kind === 'view') {
        return <LogDetailsModal row={row} onClose={onClose} />;
    }

    if (modal.kind === 'edit') {
        return (
            <LogEditModal
                row={row}
                options={options}
                onClose={onClose}
            />
        );
    }

    return (
        <LogDeleteModal row={row} onClose={onClose} />
    );
});

export default LogRowModals;