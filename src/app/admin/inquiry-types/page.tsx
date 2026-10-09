import { createClient } from '@/lib/supabase/server';
import InquiryCategoriesClient from './InquiryCategoriesClient';

export default async function InquiryCategoriesPage() {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
        .from('inquiry_categories')
        .select(`
            id,
            name,
            description,
            created_at,
            updated_at,
            inquiry_main_categories (
                id,
                category_id,
                name,
                created_at,
                updated_at,
                inquiry_sub_categories (
                    id,
                    main_category_id,
                    name,
                    created_at,
                    updated_at
                )
            )
        `)
        .order('name');

    if (error) {
        console.error(error);

        return (
            <div className="p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    Failed to load inquiry categories.
                </div>
            </div>
        );
    }

    return (
        <InquiryCategoriesClient
            categories={categories ?? []}
        />
    );
}