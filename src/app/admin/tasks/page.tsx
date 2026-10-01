export default function Tasks() {
    return (
        <div className="p-6">
            <div className="mx-auto max-w-6xl">

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Tasks
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage tasks.
                            {/* {!loading && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                    {members.length} {members.length === 1 ? 'member' : 'members'}
                                </span>
                            )} */}
                        </p>
                    </div>

                    <div>
                        {/* Mount the modal only when open so its server-action
                            state, listeners, and overlay cost nothing while closed. */}
                        {/* {isAddMemberOpen && (
                            <AddMember
                                isOpen={isAddMemberOpen}
                                onClose={closeAddMember}
                                onMemberAdded={refreshMembers}
                            />
                        )} */}

                        <button
                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Add Task
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm text-gray-600">

                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Task
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Category
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Assigned To
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Deadline
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                <tr
                                    className="transition-colors hover:bg-gray-50"
                                >

                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        Task 1
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                            Category 1
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span>
                                            John Doe
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">
                                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                                In Progress
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        September 30, 2026
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">

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
    )
}