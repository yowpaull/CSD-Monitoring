'use client';

import { useState } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
} from 'lucide-react';
import {
    createBrand,
    updateBrand,
    deleteBrand,
} from '@/lib/actions/brand';

type Brand = {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

type BrandsClientProps = {
    brands: Brand[];
};

export default function BrandsClient({
    brands,
}: BrandsClientProps) {
    const [search, setSearch] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [selectedBrand, setSelectedBrand] =
        useState<Brand | null>(null);

    const [brandName, setBrandName] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const filteredBrands = brands.filter((brand) =>
        brand.name
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    function openAddModal() {
        setBrandName('');
        setIsActive(true);
        setError('');
        setShowAddModal(true);
    }

    function openEditModal(brand: Brand) {
        setSelectedBrand(brand);
        setBrandName(brand.name);
        setIsActive(brand.is_active);
        setError('');
        setShowEditModal(true);
    }

    function openDeleteModal(brand: Brand) {
        setSelectedBrand(brand);
        setError('');
        setShowDeleteModal(true);
    }

    async function handleCreate() {
        setLoading(true);
        setError('');

        const result = await createBrand(brandName);

        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        setShowAddModal(false);
        setBrandName('');
        setLoading(false);

        window.location.reload();
    }

    async function handleUpdate() {
        if (!selectedBrand) return;

        setLoading(true);
        setError('');

        const result = await updateBrand(
            selectedBrand.id,
            brandName,
            isActive
        );

        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        setShowEditModal(false);
        setSelectedBrand(null);
        setLoading(false);

        window.location.reload();
    }

    async function handleDelete() {
        if (!selectedBrand) return;

        setLoading(true);
        setError('');

        const result = await deleteBrand(
            selectedBrand.id
        );

        if (result.error) {
            setError(result.error);
            setLoading(false);
            return;
        }

        setShowDeleteModal(false);
        setSelectedBrand(null);
        setLoading(false);

        window.location.reload();
    }

    return (
        <div className="p-6">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Brands
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage brands used in customer inquiry logs.
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    <Plus size={16} />
                    Add Brand
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-sm">
                    <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search brands..."
                        className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-400"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-300 bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left font-medium text-gray-600">
                                    Brand
                                </th>

                                <th className="px-5 py-3 text-left font-medium text-gray-600">
                                    Status
                                </th>

                                <th className="px-5 py-3 text-left font-medium text-gray-600">
                                    Date Created
                                </th>

                                <th className="px-5 py-3 text-right font-medium text-gray-600">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredBrands.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-5 py-10 text-center text-gray-500"
                                    >
                                        No brands found.
                                    </td>
                                </tr>
                            ) : (
                                filteredBrands.map((brand) => (
                                    <tr
                                        key={brand.id}
                                        className=" hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4 font-medium text-gray-900">
                                            {brand.name}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    brand.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}
                                            >
                                                {brand.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-gray-500">
                                            {new Date(
                                                brand.created_at
                                            ).toLocaleDateString()}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() =>
                                                        openEditModal(
                                                            brand
                                                        )
                                                    }
                                                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            brand
                                                        )
                                                    }
                                                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6">
                        <h2 className="text-lg font-semibold">
                            Add Brand
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Add a new brand.
                        </p>

                        {error && (
                            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="mt-5">
                            <label className="mb-2 block text-sm font-medium">
                                Brand Name
                            </label>

                            <input
                                type="text"
                                value={brandName}
                                onChange={(e) =>
                                    setBrandName(e.target.value)
                                }
                                placeholder="Enter brand name"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() =>
                                    setShowAddModal(false)
                                }
                                className="rounded-lg border px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                                {loading
                                    ? 'Adding...'
                                    : 'Add Brand'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedBrand && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6">
                        <h2 className="text-lg font-semibold">
                            Edit Brand
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Update the brand information.
                        </p>

                        {error && (
                            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="mt-5">
                            <label className="mb-2 block text-sm font-medium">
                                Brand Name
                            </label>

                            <input
                                type="text"
                                value={brandName}
                                onChange={(e) =>
                                    setBrandName(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium">
                                Status
                            </label>

                            <select
                                value={
                                    isActive
                                        ? 'active'
                                        : 'inactive'
                                }
                                onChange={(e) =>
                                    setIsActive(
                                        e.target.value === 'active'
                                    )
                                }
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            >
                                <option value="active">
                                    Active
                                </option>
                                <option value="inactive">
                                    Inactive
                                </option>
                            </select>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() =>
                                    setShowEditModal(false)
                                }
                                className="rounded-lg border px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                                {loading
                                    ? 'Saving...'
                                    : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedBrand && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6">
                        <h2 className="text-lg font-semibold">
                            Delete Brand
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Are you sure you want to delete{' '}
                            <span className="font-medium text-gray-900">
                                {selectedBrand.name}
                            </span>
                            ?
                        </p>

                        {error && (
                            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() =>
                                    setShowDeleteModal(false)
                                }
                                className="rounded-lg border px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                                {loading
                                    ? 'Deleting...'
                                    : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}