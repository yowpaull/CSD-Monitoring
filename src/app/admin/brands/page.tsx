import { createClient } from '@/lib/supabase/server';
import BrandsClient from './BrandsClient';

export default async function BrandsPage() {
    const supabase = await createClient();

    const { data: brands, error } = await supabase
        .from('brands')
        .select(`
            id,
            name,
            is_active,
            created_at,
            updated_at
        `)
        .order('name', { ascending: true });

    if (error) {
        console.error(error);

        return (
            <div className="p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    Failed to load brands.
                </div>
            </div>
        );
    }

    return (
        <BrandsClient
            brands={brands ?? []}
        />
    );
}