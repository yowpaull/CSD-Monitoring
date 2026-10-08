'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const PAGE_PATH = '/admin/platforms';

export type ActionResult = {
    success?: boolean;
    message?: string;
    error?: string;
};

export async function createPlatform(
    name: string
): Promise<ActionResult> {
    const supabase = await createClient();

    const trimmedName = name.trim();

    if (!trimmedName) {
        return {
            error: 'Platform name is required.',
        };
    }

    // Check duplicate platform
    const { data: existingPlatform, error: existingError } =
        await supabase
            .from('platforms')
            .select('id')
            .ilike('name', trimmedName)
            .maybeSingle();

    if (existingError) {
        console.error(existingError);

        return {
            error: 'Failed to check existing platforms.',
        };
    }

    if (existingPlatform) {
        return {
            error: 'This platform already exists.',
        };
    }

    const { error } = await supabase
        .from('platforms')
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
        message: 'Platform created successfully.',
    };
}

export async function updatePlatform(
    id: string,
    name: string,
    is_active: boolean
): Promise<ActionResult> {
    const supabase = await createClient();

    const trimmedName = name.trim();

    if (!id) {
        return {
            error: 'Platform ID is required.',
        };
    }

    if (!trimmedName) {
        return {
            error: 'Platform name is required.',
        };
    }

    // Check duplicate platform excluding current record
    const { data: existingPlatform, error: existingError } =
        await supabase
            .from('platforms')
            .select('id')
            .ilike('name', trimmedName)
            .neq('id', id)
            .maybeSingle();

    if (existingError) {
        console.error(existingError);

        return {
            error: 'Failed to check existing platforms.',
        };
    }

    if (existingPlatform) {
        return {
            error: 'Another platform with this name already exists.',
        };
    }

    const { error } = await supabase
        .from('platforms')
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
        message: 'Platform updated successfully.',
    };
}

export async function deletePlatform(
    id: string
): Promise<ActionResult> {
    const supabase = await createClient();

    if (!id) {
        return {
            error: 'Platform ID is required.',
        };
    }

    const { error } = await supabase
        .from('platforms')
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
        message: 'Platform deleted successfully.',
    };
}