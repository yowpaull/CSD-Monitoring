'use client';

import { ActionResult, log } from '@/lib/actions/log';
import { useActionToast } from '@/lib/hooks/useActionToast';
import { useActionState, useEffect } from 'react';

type Platform = {
    id: string;
    name: string;
};

type Brand = {
    id: string;
    name: string;
};

type CurrentUser = {
    id: string;
    full_name: string;
    email: string;
    role: 'admin' | 'user';
};

type SubCategory = {
    id: string;
    name: string;
};

type MainCategory = {
    id: string;
    name: string;
    inquiry_sub_categories: SubCategory[];
};

type InquiryCategory = {
    id: string;
    name: string;
    inquiry_main_categories: MainCategory[];
};

/**
 * Field values as they arrive from a form. Used to seed the form when
 * editing an existing log.
 */
export type LogFormValues = Partial<{
    inquiry_datetime: string;
    platform_id: string;
    brand_id: string;
    inquiry_sub_category_id: string;
    start_attended: string;
    end_attended: string;
    customer_name: string;
    thread_number: string;
    order_number: string;
    item: string;
    customer_concern: string;
    action_response: string;
    status: string;
    remarks: string;
}>;

type LogFormProps = {
    platforms: Platform[];
    brands: Brand[];
    currentUser: CurrentUser | null;
    categories: InquiryCategory[];

    /**
     * Defaults to the create action. Pass `updateLog` to edit an existing
     * row — the signature matches because `useActionState` owns the
     * previous-state argument.
     */
    action?: (
        state: ActionResult | null,
        formData: FormData
    ) => Promise<ActionResult>;

    /**
     * Seeds every control when editing. `state.enteredValues` still wins,
     * so a field the server rejected comes back showing what was typed
     * rather than the value it started from.
     */
    initialValues?: LogFormValues;

    /**
     * Extra hidden inputs rendered inside the form. Edit needs the target
     * row id, and a `<form>` cannot be nested to smuggle it in.
     */
    hiddenFields?: Record<string, string>;

    /**
     * Overrides the read-only representative field. An admin editing
     * somebody else's log is not the representative.
     */
    representativeName?: string;

    title?: string;
    description?: string;
    submitLabel?: string;

    /** Called after a successful submit, before the caller's own close. */
    onSuccess?: () => void;
};

export default function LogForm({
    platforms,
    brands,
    currentUser,
    categories,
    action = log,
    initialValues,
    hiddenFields,
    representativeName,
    title = 'Log Customer Inquiry',
    description = 'Capture and categorize real-time customer conversation details',
    submitLabel = 'Submit Log',
    onSuccess,
}: LogFormProps) {
    const initialState: ActionResult = {};

    const [state, formAction, isPending] = useActionState(action, initialState);

    useActionToast(state, 'Failed to log inquiry. Please try again.');

    /*
     * Fires once per successful result. The create page ignores it; the
     * edit modal uses it to refresh the table and dismiss itself, which
     * keeps the action state owned by the form that owns the submit
     * button rather than by a second `useActionState` elsewhere.
     */
    const succeeded = Boolean(state?.success);

    useEffect(() => {
        if (!succeeded) return;
        onSuccess?.();
    }, [succeeded, onSuccess]);

    const seed = (field: keyof LogFormValues) =>
        state.enteredValues?.[field] ?? initialValues?.[field] ?? '';

    return (
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-[#F8FBFD] shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-slate-200 bg-white/60 px-6 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between rounded-t-2xl">
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        {title}
                    </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                    {description}
                </p>
            </div>
        </div>

        <div className="p-6 md:p-8">

            <form action={formAction} className="space-y-8">

                {hiddenFields &&
                    Object.entries(hiddenFields).map(([name, value]) => (
                        <input key={name} type="hidden" name={name} value={value} />
                    ))}

                {/* GENERAL INFORMATION */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm md:p-6">
                    <div className="mb-5 border-b border-slate-100 pb-3">
                        <h3 className="text-base font-semibold text-slate-900">
                            General Information
                        </h3>
                        <p className="text-xs text-slate-500">
                            Core timestamps and assignment parameters
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Date &amp; Time of Inquiry <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="inquiry_datetime"
                                required
                                defaultValue={seed('inquiry_datetime')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                            {state.fieldErrors?.inquiry_datetime && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.inquiry_datetime[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Platform <span className="text-rose-500">*</span>
                            </label>

                            <select
                                name="platform_id"
                                required
                                defaultValue={seed('platform_id')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="" disabled>
                                    Select platform
                                </option>

                                {platforms.map((platform) => (
                                    <option
                                        key={platform.id}
                                        value={platform.id}
                                    >
                                        {platform.name}
                                    </option>
                                ))}
                            </select>

                            {state.fieldErrors?.platform_id && (
                                <p className="text-red-500 text-xs">
                                    {state.fieldErrors.platform_id[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Brand <span className="text-rose-500">*</span>
                            </label>

                            <select
                                name="brand_id"
                                required
                                defaultValue={seed('brand_id')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="" disabled>
                                    Select brand
                                </option>

                                {brands.map((brand) => (
                                    <option
                                        key={brand.id}
                                        value={brand.id}
                                    >
                                        {brand.name}
                                    </option>
                                ))}
                            </select>

                            {state.fieldErrors?.brand_id && (
                                <p className="text-red-500 text-xs">
                                    {state.fieldErrors.brand_id[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Representative Name
                            </label>

                            <input
                                type="text"
                                value={
                                    representativeName ??
                                    currentUser?.full_name ??
                                    ''
                                }
                                readOnly
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Type of Inquiry <span className="text-rose-500">*</span>
                            </label>

                            <select
                                name="inquiry_sub_category_id"
                                required
                                defaultValue={seed('inquiry_sub_category_id')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="" disabled>
                                    Select inquiry type
                                </option>

                                {categories.map((category) => (
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
                                                            value={subCategory.id}
                                                        >
                                                            {mainCategory.name} -{' '}
                                                            {subCategory.name}
                                                        </option>
                                                    )
                                                )
                                        )}
                                    </optgroup>
                                ))}
                            </select>

                            {state.fieldErrors?.inquiry_sub_category_id && (
                                <p className="text-red-500 text-xs">
                                    {
                                        state.fieldErrors
                                            .inquiry_sub_category_id[0]
                                    }
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* CONVERSATION INFORMATION */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm md:p-6">
                    <div className="mb-5 border-b border-slate-100 pb-3">
                        <h3 className="text-base font-semibold text-slate-900">
                            Conversation Information
                        </h3>
                        <p className="text-xs text-slate-500">
                            Log start and wrap-up timestamps
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Start Attended <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="time"
                                name="start_attended"
                                required
                                defaultValue={seed('start_attended')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                            {state.fieldErrors?.start_attended && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.start_attended[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                End Attended <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="time"
                                name="end_attended"
                                required
                                defaultValue={seed('end_attended')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                            {state.fieldErrors?.end_attended && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.end_attended[0]}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 border border-slate-100">
                        <span className="flex h-2 w-2 rounded-full bg-slate-400" />
                        <p>Total conversation time will be calculated automatically.</p>
                    </div>
                </section>

                {/* CUSTOMER INFORMATION */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm md:p-6">
                    <div className="mb-5 border-b border-slate-100 pb-3">
                        <h3 className="text-base font-semibold text-slate-900">
                            Customer Information
                        </h3>
                        <p className="text-xs text-slate-500">
                            Customer identifiers, order details, and item quantities
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Customer Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="customer_name"
                                required
                                defaultValue={seed('customer_name')}
                                placeholder="Enter customer name"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                            {state.fieldErrors?.customer_name && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.customer_name[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Thread Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="thread_number"
                                min="0"
                                defaultValue={
                                    state.enteredValues?.thread_number ?? initialValues?.thread_number ?? 0
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                            {state.fieldErrors?.thread_number && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.thread_number[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Order Number
                            </label>
                            <input
                                type="text"
                                name="order_number"
                                placeholder="Enter order number"
                                defaultValue={seed('order_number')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                            {state.fieldErrors?.order_number && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.order_number[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Quantity <span className="text-rose-500">*</span>
                            </label>
                            {/*
                                 * Quantity is always exactly 1 for this
                                 * workflow, so it is not an input at all.
                                 * A `readOnly` number input would still be
                                 * mutable via the stepper arrows, and
                                 * `disabled` would drop the field from the
                                 * submission entirely — so the visible
                                 * value is static text and the field that
                                 * actually posts is hidden.
                             */}
                            <input type="hidden" name="quantity" value="1" />

                            <div className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-600">
                                1
                            </div>
                            {state.fieldErrors?.quantity && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.quantity[0]}</p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Item Name / Product 
                            </label>
                            <input
                                type="text"
                                name="item"
                                placeholder="Enter item/product"
                                defaultValue={seed('item')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                            {state.fieldErrors?.item && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.item[0]}</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* CONCERN AND RESPONSE */}
                <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm md:p-6 space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-base font-semibold text-slate-900">
                            Concern and Response
                        </h3>
                        <p className="text-xs text-slate-500">
                            Detailed notes, agent resolution, and lifecycle status
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                            Customer Concern / Complaint
                        </label>
                        <textarea
                            name="customer_concern"
                            rows={4}
                            placeholder="Describe the customer's concern..."
                            defaultValue={seed('customer_concern')}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 leading-relaxed resize-y"
                        />
                        {state.fieldErrors?.customer_concern && (
                            <p className="text-red-500 text-xs">{state.fieldErrors.customer_concern[0]}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                            Action / Response
                        </label>
                        <textarea
                            name="action_response"
                            rows={4}
                            placeholder="Describe the action or response..."
                            defaultValue={seed('action_response')}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 leading-relaxed resize-y"
                        />
                        {state.fieldErrors?.action_response && (
                            <p className="text-red-500 text-xs">{state.fieldErrors.action_response[0]}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Status <span className="text-rose-500">*</span>
                            </label>
                            <select
                                name="status"
                                required
                                defaultValue={seed('status')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="" disabled>
                                    Select status
                                </option>
                                <option value="Open">Open</option>
                                <option value="Pending">Pending</option>
                                <option value="Closed">Closed</option>
                            </select>
                            {state.fieldErrors?.status && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.status[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Remarks
                            </label>
                            <textarea
                                name="remarks"
                                rows={3}
                                placeholder="Additional remarks..."
                                defaultValue={seed('remarks')}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 leading-relaxed resize-y"
                            />
                            {state.fieldErrors?.remarks && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.remarks[0]}</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* SUBMIT */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-slate-800 hover:shadow active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer"
                    >
                        {isPending ? 'Submitting...' : submitLabel}
                    </button>
                </div>
            </form>
        </div>
    </div>
    );
}
