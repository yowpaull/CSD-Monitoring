import { createClient } from '@/lib/supabase/server';
import PlatformsClient from './PlatformsClient';

export default async function PlatformsPage() {
    const supabase = await createClient();

    const { data: platforms, error } = await supabase
        .from('platforms')
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
                    Failed to load platforms.
                </div>
            </div>
        );
    }

    return (
        <PlatformsClient
            platforms={platforms ?? []}
        />
    );
}