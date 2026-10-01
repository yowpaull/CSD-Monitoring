export default function InquiryLogs() {
    return (
        <div>
            <div className="mx-auto max-w-full">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Customer Inquiry Logs
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage and monitor customer inquiry logs.
                        </p>
                    </div>

                    <button
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Add Inquiry Log
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[2200px] text-left text-sm text-gray-600">

                            {/* TABLE HEADER */}
                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                <tr>

                                    <th className="px-6 py-4 font-semibold">
                                        Inquiry Date & Time
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Platform
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Brand
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Representative
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Inquiry Type
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Start Attended
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        End Attended
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Total Minutes
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Customer Name
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Thread Number
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Quantity
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Order Number
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Item
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Customer Concern / Complaint
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Action / Response
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Remarks
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Created At
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Updated At
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Actions
                                    </th>

                                </tr>
                            </thead>

                            {/* TABLE BODY */}
                            <tbody className="divide-y divide-gray-100">

                                {/* Dummy Data */}
                                <tr className="transition-colors hover:bg-gray-50">

                                    {/* Inquiry Date & Time */}
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">
                                            October 1, 2026
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            9:30 AM
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Saturday
                                        </div>
                                    </td>

                                    {/* Platform */}
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                            Facebook
                                        </span>
                                    </td>

                                    {/* Brand */}
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900">
                                            Sebago
                                        </span>
                                    </td>

                                    {/* Representative */}
                                    <td className="px-6 py-4">
                                        John Doe
                                    </td>

                                    {/* Inquiry Type */}
                                    <td className="px-6 py-4">
                                        Product Inquiry
                                    </td>

                                    {/* Start Attended */}
                                    <td className="px-6 py-4">
                                        9:35 AM
                                    </td>

                                    {/* End Attended */}
                                    <td className="px-6 py-4">
                                        9:50 AM
                                    </td>

                                    {/* Total Minutes */}
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900">
                                            15 minutes
                                        </span>
                                    </td>

                                    {/* Customer Name */}
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900">
                                            Maria Santos
                                        </span>
                                    </td>

                                    {/* Thread Number */}
                                    <td className="px-6 py-4">
                                        4
                                    </td>

                                    {/* Quantity */}
                                    <td className="px-6 py-4">
                                        1
                                    </td>

                                    {/* Order Number */}
                                    <td className="px-6 py-4">
                                        1061219852569762
                                    </td>

                                    {/* Item */}
                                    <td className="px-6 py-4">
                                        Sebago Men&apos;s Shoes Classic Dan
                                    </td>

                                    {/* Customer Concern */}
                                    <td className="max-w-xs px-6 py-4">
                                        <p className="line-clamp-3">
                                            Customer asked about the product
                                            specifications and compatibility
                                            with their device.
                                        </p>
                                    </td>

                                    {/* Action Response */}
                                    <td className="max-w-xs px-6 py-4">
                                        <p className="line-clamp-3">
                                            Representative provided product
                                            specifications and confirmed
                                            compatibility.
                                        </p>
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                            Closed
                                        </span>
                                    </td>

                                    {/* Remarks */}
                                    <td className="max-w-xs px-6 py-4">
                                        Customer was satisfied with the
                                        response.
                                    </td>

                                    {/* Created At */}
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900">
                                            October 1, 2026
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            9:55 AM
                                        </div>
                                    </td>

                                    {/* Updated At */}
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900">
                                            October 1, 2026
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            9:55 AM
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">

                                            <button
                                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                View
                                            </button>

                                            <button
                                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                                            >
                                                Remove
                                            </button>

                                        </div>
                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>
                </div>

            </div>
        </div>
    );
}