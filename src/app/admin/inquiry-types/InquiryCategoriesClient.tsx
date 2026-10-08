'use client';

import { useState } from 'react';
import {
    createInquiryCategory,
    updateInquiryCategory,
    deleteInquiryCategory,
    createInquiryMainCategory,
    updateInquiryMainCategory,
    deleteInquiryMainCategory,
    createInquirySubCategory,
    updateInquirySubCategory,
    deleteInquirySubCategory,
} from '@/lib/actions/inquiry-categories';
import { toast } from 'react-toastify';

type SubCategory = {
    id: string;
    main_category_id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

type MainCategory = {
    id: string;
    category_id: string;
    name: string;
    created_at: string;
    updated_at: string;
    inquiry_sub_categories: SubCategory[];
};

type Category = {
    id: string;
    name: string;
    description: string | null;
    inquiry_main_categories: MainCategory[];
};

type ModalType =
    | 'category'
    | 'main'
    | 'sub';

type ModalMode = 'add' | 'edit';

type ModalState = {
    type: ModalType;
    mode: ModalMode;
    id?: string;
    parentId?: string;
    name?: string;
    description?: string;
} | null;

type Props = {
    categories: Category[];
};

export default function InquiryCategoriesClient({
    categories,
}: Props) {
    const [modal, setModal] =
        useState<ModalState>(null);

    const [expandedCategories, setExpandedCategories] =
        useState<string[]>([]);

    const [expandedMainCategories, setExpandedMainCategories] =
        useState<string[]>([]);

    const [loading, setLoading] =
        useState(false);

    const toggleCategory = (id: string) => {
        setExpandedCategories((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    const toggleMainCategory = (id: string) => {
        setExpandedMainCategories((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    /* =====================================================
       SAVE
    ===================================================== */

    const handleSave = async (
        name: string,
        description: string
    ) => {
        if (!modal) return;

        setLoading(true);

        let result;

        if (modal.type === 'category') {
            if (modal.mode === 'add') {
                result = await createInquiryCategory(
                    name,
                    description
                );
            } else {
                result = await updateInquiryCategory(
                    modal.id!,
                    name,
                    description
                );
            }
        }

        if (modal.type === 'main') {
            if (modal.mode === 'add') {
                result = await createInquiryMainCategory(
                    modal.parentId!,
                    name
                );
            } else {
                result = await updateInquiryMainCategory(
                    modal.id!,
                    name
                );
            }
        }

        if (modal.type === 'sub') {
            if (modal.mode === 'add') {
                result = await createInquirySubCategory(
                    modal.parentId!,
                    name
                );
            } else {
                result = await updateInquirySubCategory(
                    modal.id!,
                    name
                );
            }
        }

        setLoading(false);

        if (result?.success) {
            setModal(null);

            toast.success(
                result.message ?? 'Saved successfully.'
            );
        } else {
            toast.error(
                result?.message ?? 'Something went wrong.'
            );

            alert(result?.message ?? 'Something went wrong.');
        }
    };

    /* =====================================================
       DELETE
    ===================================================== */

    const handleDeleteCategory = async (
        id: string
    ) => {
        if (
            !confirm(
                'Are you sure you want to delete this inquiry category?'
            )
        ) {
            return;
        }

        const result =
            await deleteInquiryCategory(id);

        if (!result.success) {
            toast.error(result.message);
            alert(result.message);
        } else {
            toast.success(result.message);
        }
    };

    const handleDeleteMainCategory = async (
        id: string
    ) => {
        if (
            !confirm(
                'Are you sure you want to delete this main category?'
            )
        ) {
            return;
        }

        const result =
            await deleteInquiryMainCategory(id);

        if (!result.success) {
            toast.error(result.message);
            alert(result.message);
        } else {
            toast.success(result.message);
        }
    };

    const handleDeleteSubCategory = async (
        id: string
    ) => {
        if (
            !confirm(
                'Are you sure you want to delete this sub-category?'
            )
        ) {
            return;
        }

        const result =
            await deleteInquirySubCategory(id);

        if (!result.success) {
            toast.error(result.message);
            alert(result.message);
        } else {
            toast.success(result.message);
        }
    };

    return (
        <div className="p-6">
            <div className="mx-auto max-w-6xl">

                {/* HEADER */}

                <div className="mb-6 flex items-center justify-between">

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Inquiry Categories
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage inquiry categories,
                            main categories, and
                            sub-categories.
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            setModal({
                                type: 'category',
                                mode: 'add',
                            })
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        Add Inquiry Category
                    </button>

                </div>


                {/* EMPTY STATE */}

                {categories.length === 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

                        <h3 className="text-sm font-semibold text-gray-900">
                            No inquiry categories
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Start by creating your first
                            inquiry category.
                        </p>

                        <button
                            onClick={() =>
                                setModal({
                                    type: 'category',
                                    mode: 'add',
                                })
                            }
                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Add Inquiry Category
                        </button>

                    </div>
                )}


                {/* CATEGORIES */}

                <div className="space-y-4">

                    {categories.map((category) => (

                        <div
                            key={category.id}
                            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                        >

                            {/* CATEGORY */}

                            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">

                                <div className="flex items-center gap-3">

                                    <button
                                        onClick={() =>
                                            toggleCategory(
                                                category.id
                                            )
                                        }
                                        className="text-gray-500"
                                    >
                                        {expandedCategories.includes(
                                            category.id
                                        )
                                            ? '▼'
                                            : '▶'}
                                    </button>

                                    <div>

                                        <h2 className="font-semibold text-gray-900">
                                            {category.name}
                                        </h2>

                                        {category.description && (
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {
                                                    category.description
                                                }
                                            </p>
                                        )}

                                    </div>

                                </div>


                                <div className="flex gap-2">

                                    <button
                                        onClick={() =>
                                            setModal({
                                                type: 'main',
                                                mode: 'add',
                                                parentId:
                                                    category.id,
                                            })
                                        }
                                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-100"
                                    >
                                        + Main Category
                                    </button>

                                    <button
                                        onClick={() =>
                                            setModal({
                                                type: 'category',
                                                mode: 'edit',
                                                id: category.id,
                                                name: category.name,
                                                description:
                                                    category.description ??
                                                    '',
                                            })
                                        }
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleDeleteCategory(
                                                category.id
                                            )
                                        }
                                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>


                            {/* MAIN CATEGORIES */}

                            {expandedCategories.includes(
                                category.id
                            ) && (

                                <div className="divide-y divide-gray-100">

                                    {category.inquiry_main_categories
                                        .length === 0 && (

                                        <div className="px-6 py-8 text-center text-sm text-gray-400">
                                            No main categories yet.
                                        </div>

                                    )}


                                    {category.inquiry_main_categories.map(
                                        (mainCategory) => (

                                            <div
                                                key={
                                                    mainCategory.id
                                                }
                                                className="px-6 py-4"
                                            >

                                                <div className="flex items-center justify-between">

                                                    <div className="flex items-center gap-3">

                                                        <button
                                                            onClick={() =>
                                                                toggleMainCategory(
                                                                    mainCategory.id
                                                                )
                                                            }
                                                            className="text-xs text-gray-400"
                                                        >
                                                            {expandedMainCategories.includes(
                                                                mainCategory.id
                                                            )
                                                                ? '▼'
                                                                : '▶'}
                                                        </button>

                                                        <div>

                                                            <p className="text-sm font-semibold text-gray-800">
                                                                {
                                                                    mainCategory.name
                                                                }
                                                            </p>

                                                            <p className="text-xs text-gray-400">
                                                                {
                                                                    mainCategory
                                                                        .inquiry_sub_categories
                                                                        .length
                                                                }{' '}
                                                                sub-categories
                                                            </p>

                                                        </div>

                                                    </div>


                                                    <div className="flex gap-2">

                                                        <button
                                                            onClick={() =>
                                                                setModal({
                                                                    type: 'sub',
                                                                    mode: 'add',
                                                                    parentId:
                                                                        mainCategory.id,
                                                                })
                                                            }
                                                            className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200"
                                                        >
                                                            + Sub Category
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                setModal({
                                                                    type: 'main',
                                                                    mode: 'edit',
                                                                    id: mainCategory.id,
                                                                    name: mainCategory.name,
                                                                })
                                                            }
                                                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                handleDeleteMainCategory(
                                                                    mainCategory.id
                                                                )
                                                            }
                                                            className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </div>


                                                {/* SUB CATEGORIES */}

                                                {expandedMainCategories.includes(
                                                    mainCategory.id
                                                ) && (

                                                    <div className="mt-3 ml-7 space-y-2 border-l-2 border-gray-100 pl-4">

                                                        {mainCategory
                                                            .inquiry_sub_categories
                                                            .length ===
                                                            0 && (

                                                            <p className="py-2 text-xs text-gray-400">
                                                                No
                                                                sub-categories
                                                                yet.
                                                            </p>

                                                        )}


                                                        {mainCategory.inquiry_sub_categories.map(
                                                            (
                                                                subCategory
                                                            ) => (

                                                                <div
                                                                    key={
                                                                        subCategory.id
                                                                    }
                                                                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                                                                >

                                                                    <div className="flex items-center gap-3">

                                                                        <span className="h-2 w-2 rounded-full bg-blue-500" />

                                                                        <span className="text-sm text-gray-700">
                                                                            {
                                                                                subCategory.name
                                                                            }
                                                                        </span>

                                                                    </div>


                                                                    <div className="flex gap-2">

                                                                        <button
                                                                            onClick={() =>
                                                                                setModal({
                                                                                    type: 'sub',
                                                                                    mode: 'edit',
                                                                                    id: subCategory.id,
                                                                                    name: subCategory.name,
                                                                                })
                                                                            }
                                                                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
                                                                        >
                                                                            Edit
                                                                        </button>

                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteSubCategory(
                                                                                    subCategory.id
                                                                                )
                                                                            }
                                                                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                                                                        >
                                                                            Delete
                                                                        </button>

                                                                    </div>

                                                                </div>

                                                            )
                                                        )}

                                                    </div>

                                                )}

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    ))}

                </div>


                {/* MODAL */}

                {modal && (
                    <CategoryModal
                        modal={modal}
                        loading={loading}
                        onClose={() =>
                            setModal(null)
                        }
                        onSave={handleSave}
                    />
                )}

            </div>
        </div>
    );
}


/* =========================================================
   MODAL
========================================================= */

type CategoryModalProps = {
    modal: NonNullable<ModalState>;
    loading: boolean;
    onClose: () => void;
    onSave: (
        name: string,
        description: string
    ) => void;
};

function CategoryModal({
    modal,
    loading,
    onClose,
    onSave,
}: CategoryModalProps) {
    const [name, setName] =
        useState(modal.name ?? '');

    const [description, setDescription] =
        useState(modal.description ?? '');

    const getTitle = () => {
        if (modal.type === 'category') {
            return modal.mode === 'add'
                ? 'Add Inquiry Category'
                : 'Edit Inquiry Category';
        }

        if (modal.type === 'main') {
            return modal.mode === 'add'
                ? 'Add Main Category'
                : 'Edit Main Category';
        }

        return modal.mode === 'add'
            ? 'Add Sub Category'
            : 'Edit Sub Category';
    };

    const handleSubmit = (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        onSave(name, description);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

                <div className="border-b border-gray-200 px-6 py-4">

                    <h2 className="text-lg font-semibold text-gray-900">
                        {getTitle()}
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                        Enter the information below.
                    </p>

                </div>


                <form onSubmit={handleSubmit}>

                    <div className="space-y-5 p-6">

                        <div>

                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                                Name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter name"
                                autoFocus
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />

                        </div>


                        {modal.type ===
                            'category' && (

                            <div>

                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                                    Short Description
                                </label>

                                <textarea
                                    value={
                                        description
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setDescription(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    rows={3}
                                    placeholder="Enter short description"
                                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />

                            </div>

                        )}

                    </div>


                    <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !name.trim()
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? 'Saving...'
                                : modal.mode ===
                                    'add'
                                  ? 'Add'
                                  : 'Save Changes'}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}