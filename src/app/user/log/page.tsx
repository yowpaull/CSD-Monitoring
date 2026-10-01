'use client';

import { ActionResult, log } from "@/lib/actions/log";
import { useActionState } from "react";

export default function LogPage() {

    const initialState: ActionResult = {}
    const[state, formAction, isPending] = useActionState(log, initialState);

    return (
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-[#F8FBFD] shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-slate-200 bg-white/60 px-6 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between rounded-t-2xl">
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        Log Customer Inquiry
                    </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                    Capture and categorize real-time customer conversation details
                </p>
            </div>
        </div>

        <div className="p-6 md:p-8">

            <form action={formAction} className="space-y-8">

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
                                defaultValue=""
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="" disabled>
                                    Select platform
                                </option>
                            </select>
                            {state.fieldErrors?.platform_id && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.platform_id[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Brand <span className="text-rose-500">*</span>
                            </label>
                            <select
                                name="brand_id"
                                required
                                defaultValue=""
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="" disabled>
                                    Select brand
                                </option>
                            </select>
                            {state.fieldErrors?.brand_id && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.brand_id[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Representative <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="representative_name"
                                required
                                placeholder="Enter representative name"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                            {state.fieldErrors?.representative_id && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.representative_id[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                                Type of Inquiry <span className="text-rose-500">*</span>
                            </label>
                            <select
                                name="inquiry_type_id"
                                required
                                defaultValue=""
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="" disabled>
                                    Select inquiry type
                                </option>
                            </select>
                            {state.fieldErrors?.inquiry_sub_category_id && (
                                <p className="text-red-500 text-xs">{state.fieldErrors.inquiry_sub_category_id[0]}</p>
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
                                placeholder="Enter thread number"
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
                            <input
                                type="number"
                                name="quantity"
                                disabled
                                min="1"
                                defaultValue="1"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
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
                            required
                            rows={4}
                            placeholder="Describe the action or response..."
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
                                defaultValue=""
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-xs transition duration-150 ease-in-out focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                <option value="" disabled>
                                    Select status
                                </option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Escalated">Escalated</option>
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
                        {isPending ? 'Submitting...' : 'Submit Log'}
                    </button>
                </div>
            </form>
        </div>
    </div>
    );
}
