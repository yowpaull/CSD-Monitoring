'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const PAGE_PATH = '/admin/brands';

export type ActionResult = {
    success?: boolean;
    message?: string;
    error?: string;
};

export async function createBrand(
    name: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const trimmedName = name.trim();

    if (!trimmedName) {
        return {
            error: 'Brand name is required.',
        };
    }

    const { data: existingBrand, error: existingError } = await supabase
        .from('brands')
        .select('id')
        .ilike('name', trimmedName)
        .maybeSingle();

    if (existingError) {
        console.error(existingError);

        return {
            error: 'Failed to check existing brands.',
        };
    }

    if (existingBrand) {
        return {
            error: 'This brand already exists.',
        };
    }

    const { error } = await supabase
        .from('brands')
        .insert({
            name: trimmedName,
            is_active: true,
        });

    if (error) {
        console.error(error);

        return {
            error: error.message,
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Brand created successfully.',
    };
}

export async function updateBrand(
    id: string,
    name: string,
    is_active: boolean
): Promise<ActionResult> {
    const supabase = await createClient();

    const trimmedName = name.trim();

    if (!id) {
        return {
            error: 'Brand ID is required.',
        };
    }

    if (!trimmedName) {
        return {
            error: 'Brand name is required.',
        };
    }

    const { data: existingBrand, error: existingError } = await supabase
        .from('brands')
        .select('id')
        .ilike('name', trimmedName)
        .neq('id', id)
        .maybeSingle();

    if (existingError) {
        console.error(existingError);

        return {
            error: 'Failed to check existing brands.',
        };
    }

    if (existingBrand) {
        return {
            error: 'Another brand with this name already exists.',
        };
    }

    const { error } = await supabase
        .from('brands')
        .update({
            name: trimmedName,
            is_active,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error(error);

        return {
            error: error.message,
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Brand updated successfully.',
    };
}

export async function deleteBrand(
    id: string
): Promise<ActionResult> {
    const supabase = await createClient();

    if (!id) {
        return {
            error: 'Brand ID is required.',
        };
    }

    const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(error);

        return {
            error: error.message,
        };
    }

    revalidatePath(PAGE_PATH);

    return {
        success: true,
        message: 'Brand deleted successfully.',
    };
}