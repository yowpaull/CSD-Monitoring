'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ActionResult = {
    success?: boolean;
    message?: string;
    error?: string;
};

const PAGE_PATH = '/admin/inquiry-categories';

/* =========================================================
   INQUIRY CATEGORY
========================================================= */

export async function createInquiryCategory(
    name: string,
    description: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            success: false,
            message: 'You must be logged in.',
        };
    }

    const { error } = await supabase
        .from('inquiry_categories')
        .insert({
            name: name.trim(),
            description: description.trim() || null,
        });

    if (error) {
        console.error(error);

        return {
            success: false,
            message: 'Failed to create inquiry category.',
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Inquiry category created successfully.',
    };
}

export async function updateInquiryCategory(
    id: string,
    name: string,
    description: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('inquiry_categories')
        .update({
            name: name.trim(),
            description: description.trim() || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error(error);

        return {
            success: false,
            message: 'Failed to update inquiry category.',
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Inquiry category updated successfully.',
    };
}

export async function deleteInquiryCategory(
    id: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('inquiry_categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(error);

        return {
            success: false,
            message:
                'Unable to delete category. Make sure it does not contain main categories.',
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Inquiry category deleted successfully.',
    };
}


/* =========================================================
   MAIN CATEGORY
========================================================= */

export async function createInquiryMainCategory(
    category_id: string,
    name: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('inquiry_main_categories')
        .insert({
            category_id: category_id,
            name: name.trim(),
        });

    if (error) {
        console.error(error);

        return {
            success: false,
            message: 'Failed to create main category.',
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Main category created successfully.',
    };
}

export async function updateInquiryMainCategory(
    id: string,
    name: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('inquiry_main_categories')
        .update({
            name: name.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error(error);

        return {
            success: false,
            message: 'Failed to update main category.',
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Main category updated successfully.',
    };
}

export async function deleteInquiryMainCategory(
    id: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('inquiry_main_categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(error);

        return {
            success: false,
            message:
                'Unable to delete main category. Make sure it does not contain sub-categories.',
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Main category deleted successfully.',
    };
}


/* =========================================================
   SUB CATEGORY
========================================================= */

export async function createInquirySubCategory(
    main_category_id: string,
    name: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('inquiry_sub_categories')
        .insert({
            main_category_id: main_category_id,
            name: name.trim(),
        });

    if (error) {
        console.error(error);

        return {
            success: false,
            message: 'Failed to create sub-category.',
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Sub-category created successfully.',
    };
}

export async function updateInquirySubCategory(
    id: string,
    name: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('inquiry_sub_categories')
        .update({
            name: name.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error(error);

        return {
            success: false,
            message: 'Failed to update sub-category.',
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Sub-category updated successfully.',
    };
}

export async function deleteInquirySubCategory(
    id: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('inquiry_sub_categories')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(error);

        return {
            success: false,
            message:
                'Unable to delete sub-category. It may already be used in an inquiry log.',
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Sub-category deleted successfully.',
    };
}